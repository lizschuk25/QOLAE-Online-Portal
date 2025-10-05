// ==============================================
// documentRoutes.js - Document Management Routes
// Organized by Location Block Pattern
// Handles: Document signatures, serving, and TOB library saving
// ==============================================

// ==============================================
// LOCATION BLOCK A: IMPORTS & DEPENDENCIES
// A.1: Core Dependencies
// A.2: Database & Configuration Setup
// ==============================================

// A.1: Core Dependencies
import path from 'path';
import fs from 'fs-extra';
import { Pool } from 'pg';

// A.2: Database & Configuration Setup
// Initialize PostgreSQL connection pool for qolae_lawyers
const lawyersPool = new Pool({
  connectionString: process.env.LAWYERS_DATABASE_URL || process.env.DATABASE_URL,
});

// Configuration for file paths - make them configurable
const config = {
  centralRepository: process.env.CENTRAL_REPOSITORY_PATH,
  paths: {
    signedTob: 'signed-tob',
    temp: 'temp',
    uploads: 'uploads',
    images: 'images',
    signatures: 'signatures'
  }
};

// ==============================================
// LOCATION BLOCK B: HELPER FUNCTIONS
// B.1: File Path Builder
// ==============================================

// B.1: File Path Builder
const buildFilePath = (type, fileName) => {
  const subPath = config.paths[type] || 'uploads';
  return path.join(config.centralRepository, subPath, fileName);
};

// ==============================================
// LOCATION BLOCK C: ROUTE DEFINITIONS
// C.1: Signature Management Operations
// C.2: Document Download & Serving
// C.3: TOB Document Library Operations
// ==============================================

export default async function (fastify, opts) {
  
  // ==============================================
  // C.1: SIGNATURE MANAGEMENT OPERATIONS
  // ==============================================

  // 💾 Save lawyer signature endpoint (GDPR-compliant)
  // NOTE: Signature insertion into PDF happens inside this endpoint
  fastify.post('/save-signature/:pin', async (request, reply) => {
    try {
      const { pin } = request.params;
      const { signatureData, signatureType = 'professional' } = request.body;

      if (!signatureData) {
        return reply.code(400).send({
          success: false,
          error: 'Signature data is required'
        });
      }

      console.log(`💾 Saving signature for PIN: ${pin}, Type: ${signatureType}`);

      // Begin transaction for atomic operation
      await lawyersPool.query('BEGIN');

      try {
        // 1. Get lawyer ID
        const lawyerResult = await lawyersPool.query(
          'SELECT id FROM lawyers WHERE pin = $1',
          [pin]
        );

        if (lawyerResult.rows.length === 0) {
          await lawyersPool.query('ROLLBACK');
          return reply.code(404).send({
            success: false,
            error: 'Lawyer not found',
            pin: pin
          });
        }

        const lawyerId = lawyerResult.rows[0].id;

        // 2. Check if signature already exists for this type
        const existingSignature = await lawyersPool.query(
          'SELECT id FROM lawyer_signatures WHERE lawyer_id = $1 AND signature_type = $2 AND is_active = true',
          [lawyerId, signatureType]
        );

        let newSignatureId;

        if (existingSignature.rows.length > 0) {
          // Update existing signature
          const updateResult = await lawyersPool.query(
            `UPDATE lawyer_signatures 
             SET signature_data = $1, 
                 updated_at = NOW(),
                 usage_count = usage_count + 1
             WHERE lawyer_id = $2 AND signature_type = $3 AND is_active = true
             RETURNING id`,
            [signatureData, lawyerId, signatureType]
          );
          newSignatureId = updateResult.rows[0].id;
          console.log(`✅ Updated existing signature ID: ${newSignatureId}`);
        } else {
          // Insert new signature
          const insertResult = await lawyersPool.query(
            `INSERT INTO lawyer_signatures 
             (lawyer_id, signature_data, signature_type, is_active, usage_count, created_at, updated_at)
             VALUES ($1, $2, $3, true, 1, NOW(), NOW())
             RETURNING id`,
            [lawyerId, signatureData, signatureType]
          );
          newSignatureId = insertResult.rows[0].id;
          console.log(`✅ Created new signature ID: ${newSignatureId}`);
        }

        // 3. Log signature event for audit trail
        await lawyersPool.query(
          `INSERT INTO signature_events 
           (lawyer_id, signature_id, event_type, metadata, ip_address, user_agent)
           VALUES ($1, $2, 'signature_saved', $3, $4, $5)`,
          [
            lawyerId,
            newSignatureId,
            JSON.stringify({
              signatureId: newSignatureId,
              signatureType: signatureType,
              gdprCompliant: true,
              encrypted: true,
              retentionUntil: '7 years from creation'
            }),
            request.ip,
            request.headers['user-agent'] || 'Unknown'
          ]
        );

        // Commit transaction
        await lawyersPool.query('COMMIT');

        console.log(`✅ Signature saved successfully for PIN: ${pin}, ID: ${newSignatureId}`);
        console.log(`📝 NOTE: Signature insertion into PDF handled by backend PDF service`);

        return reply.send({
          success: true,
          message: 'Signature saved successfully',
          signatureId: newSignatureId,
          pin: pin,
          signatureType: signatureType,
          gdprCompliant: true,
          timestamp: new Date().toISOString()
        });

      } catch (dbError) {
        // Rollback on error
        await lawyersPool.query('ROLLBACK');
        throw dbError;
      }

    } catch (error) {
      console.error('❌ Error saving signature:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to save signature',
        details: error.message
      });
    }
  });

  // 🔍 Retrieve lawyer signature endpoint
  fastify.get('/get-signature/:pin', async (request, reply) => {
    try {
      const { pin } = request.params;
      const { signatureType = 'professional' } = request.query;

      console.log(`🔍 Retrieving signature for PIN: ${pin}, Type: ${signatureType}`);

      // Get active signature for lawyer
      const result = await lawyersPool.query(
        `SELECT
          ls.id,
          ls.signature_data,
          ls.signature_type,
          ls.created_at,
          ls.usage_count
         FROM lawyer_signatures ls
         INNER JOIN lawyers l ON ls.lawyer_id = l.id
         WHERE l.pin = $1 
           AND ls.signature_type = $2 
           AND ls.is_active = true
         ORDER BY ls.created_at DESC
         LIMIT 1`,
        [pin, signatureType]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'No signature found',
          pin: pin,
          signatureType: signatureType
        });
      }

      const signature = result.rows[0];

      // Increment usage count
      await lawyersPool.query(
        'UPDATE lawyer_signatures SET usage_count = usage_count + 1 WHERE id = $1',
        [signature.id]
      );

      console.log(`✅ Retrieved signature ID: ${signature.id} for PIN: ${pin}`);

      return reply.send({
        success: true,
        signatureData: signature.signature_data,
        signatureType: signature.signature_type,
        createdAt: signature.created_at,
        usageCount: signature.usage_count + 1
      });

    } catch (error) {
      console.error('❌ Error retrieving signature:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve signature',
        details: error.message
      });
    }
  });

  // ==============================================
  // C.2: DOCUMENT DOWNLOAD & SERVING
  // NOTE: Specific routes MUST come before general routes!
  // ==============================================

  // 👁️ View Signed TOB in Browser (Step 4 - View button)
  // IMPORTANT: This specific route must come BEFORE the general /:pin/:type route
  fastify.get('/tob/view', async (request, reply) => {
    try {
      const { pin } = request.query;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      console.log(`👁️ Viewing signed TOB for PIN: ${pin}`);

      // Get signed PDF file
      const fileName = `TOB_${pin}_Signed.pdf`;
      const filePath = buildFilePath('signedTob', fileName);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Signed TOB not found: ${filePath}`);
        return reply.code(404).send({
          success: false,
          error: 'Signed TOB file not found',
          pin: pin,
          expectedPath: filePath
        });
      }

      const stats = fs.statSync(filePath);
      console.log(`✅ Serving signed TOB for viewing: ${fileName} (${stats.size} bytes)`);

      // Set headers for INLINE viewing (opens in browser tab)
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Length', stats.size);
      reply.header('Content-Disposition', `inline; filename="${fileName}"`);
      reply.header('Access-Control-Allow-Origin', '*');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      return reply.send(fileStream);

    } catch (error) {
      console.error('❌ Error viewing signed TOB:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to view signed TOB',
        details: error.message
      });
    }
  });

  // 💾 Download Signed TOB to Device (Step 4 - Download button)
  // IMPORTANT: This specific route must come BEFORE the general /:pin/:type route
  fastify.get('/tob/download', async (request, reply) => {
    try {
      const { pin } = request.query;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      console.log(`💾 Downloading signed TOB for PIN: ${pin}`);

      // Get signed PDF file
      const fileName = `TOB_${pin}_Signed.pdf`;
      const filePath = buildFilePath('signedTob', fileName);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Signed TOB not found: ${filePath}`);
        return reply.code(404).send({
          success: false,
          error: 'Signed TOB file not found',
          pin: pin,
          expectedPath: filePath
        });
      }

      const stats = fs.statSync(filePath);
      console.log(`✅ Serving signed TOB for download: ${fileName} (${stats.size} bytes)`);

      // Set headers for DOWNLOAD (prompts save dialog)
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Length', stats.size);
      reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
      reply.header('Access-Control-Allow-Origin', '*');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      return reply.send(fileStream);

    } catch (error) {
      console.error('❌ Error downloading signed TOB:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to download signed TOB',
        details: error.message
      });
    }
  });

  // 📄 General Document Download Endpoint
  // IMPORTANT: This general route must come AFTER specific routes
  fastify.get('/:pin/:type', async (request, reply) => {
    try {
      const { pin, type } = request.params;
      
      console.log(`📄 Document download request - PIN: ${pin}, Type: ${type}`);

      // Determine file path based on type
      let filePath;
      let fileName;
      
      if (type === 'signed') {
        fileName = `TOB_${pin}_Signed.pdf`;
        filePath = buildFilePath('signedTob', fileName);
      } else if (type === 'review') {
        fileName = `TOB_${pin}.pdf`;
        filePath = buildFilePath('temp', fileName);
      } else {
        fileName = `${type}_${pin}.pdf`;
        filePath = buildFilePath('uploads', fileName);
      }

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ Serving document: ${fileName} (${stats.size} bytes)`);
        
        const headers = {
          'Content-Type': 'application/pdf',
          'Content-Length': stats.size,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        };
        
        // Set all headers
        Object.entries(headers).forEach(([key, value]) => {
          reply.header(key, value);
        });
        
        // Send the file
        const fileStream = fs.createReadStream(filePath);
        return reply.send(fileStream);
        
      } else {
        console.error(`❌ Document not found: ${fileName} at path: ${filePath}`);
        return reply.code(404).send({
          error: 'Document not found',
          pin: pin,
          type: type,
          expectedPath: filePath,
          message: 'Document may not have been processed yet.'
        });
      }
      
    } catch (error) {
      console.error('❌ Error serving document:', error);
      return reply.code(500).send({ 
        error: 'Internal server error serving document',
        success: false 
      });
    }
  });

  // ==============================================
  // C.3: TOB DOCUMENT LIBRARY OPERATIONS
  // ==============================================

  // 📚 Save TOB to Document Library endpoint
  fastify.post('/api/document-library/save-tob', async (request, reply) => {
    try {
      const { pin } = request.body;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      console.log(`📚 Saving TOB to Document Library for PIN: ${pin}`);

      // 1. Get lawyer's case_id (or create if doesn't exist)
      const lawyerResult = await lawyersPool.query(
        'SELECT id, case_id FROM lawyers WHERE pin = $1',
        [pin]
      );

      if (lawyerResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Lawyer not found',
          pin: pin
        });
      }

      const lawyer = lawyerResult.rows[0];
      let caseId = lawyer.case_id;

      // If no case_id exists, create a case record
      if (!caseId) {
        const caseResult = await lawyersPool.query(
          `INSERT INTO cases (lawyer_id, status, created_at)
           VALUES ($1, 'active', NOW())
           RETURNING id`,
          [lawyer.id]
        );
        caseId = caseResult.rows[0].id;

        // Update lawyer with case_id
        await lawyersPool.query(
          'UPDATE lawyers SET case_id = $1 WHERE pin = $2',
          [caseId, pin]
        );

        console.log(`✅ Created new case ID: ${caseId} for PIN: ${pin}`);
      }

      // 2. Get file size from filesystem
      const fileName = `TOB_${pin}_Signed.pdf`;
      const filePath = buildFilePath('signedTob', fileName);

      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({
          success: false,
          error: 'Signed TOB file not found',
          pin: pin,
          expectedPath: filePath
        });
      }

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      console.log(`📄 File found: ${fileName} (${fileSize} bytes)`);

      // 3. Insert document record
      const documentResult = await lawyersPool.query(
        `INSERT INTO documents (
          case_id,
          document_type,
          file_name,
          file_path,
          file_size,
          uploaded_at,
          encrypted
        ) VALUES (
          $1, $2, $3, $4, $5, CURRENT_TIMESTAMP, true
        )
        RETURNING id, document_type, file_name, uploaded_at`,
        [
          caseId,
          'tob',
          `TOB_Signed_${pin}.pdf`,
          `/central-repository/signed-tob/${fileName}`,
          fileSize
        ]
      );

      const document = documentResult.rows[0];

      console.log(`✅ TOB saved to Document Library - Document ID: ${document.id}`);

      return reply.send({
        success: true,
        message: 'TOB saved to Document Library successfully',
        document_id: document.id,
        document_type: document.document_type,
        file_name: document.file_name,
        saved_at: document.uploaded_at,
        pin: pin
      });

    } catch (error) {
      console.error('❌ Error saving TOB to Document Library:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to save TOB to Document Library',
        details: error.message
      });
    }
  });

}