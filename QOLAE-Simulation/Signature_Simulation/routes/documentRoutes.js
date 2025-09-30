import { generateCustomizedTOB } from '/var/www/admin.qolae.com/backend/src/utils/generateCustomizedTOB.js';
import { generateLawyersCustomizedTOB } from '../utils/generateLawyersCustomizedTOB.js';
import path from 'path';
import fs from 'fs-extra';
import { pathToFileURL } from 'url';
import ejs from 'ejs';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool for qolae_lawyers
const lawyersPool = new Pool({
  connectionString: process.env.LAWYERS_DATABASE_URL || process.env.DATABASE_URL,
});

// Configuration for file paths - make them configurable
const config = {
  centralRepository: process.env.CENTRAL_REPOSITORY_PATH || '/var/www/api.qolae.com/central-repository',
  paths: {
    signedTob: 'signed-tob',
    temp: 'temp',
    uploads: 'uploads',
    images: 'images',
    signatures: 'signatures'
  }
};

// Helper function to build file paths
const buildFilePath = (type, fileName) => {
  const subPath = config.paths[type] || 'uploads';
  return path.join(config.centralRepository, subPath, fileName);
};

export default async function (fastify, opts) {
  
  // Generate customized TOB
  fastify.post('/generate-tob', async (request, reply) => {
    try {
      const { pin, lawyerData } = request.body;
      
      if (!pin || !lawyerData) {
        return reply.code(400).send({
          success: false,
          error: 'PIN and lawyer data are required'
        });
      }

      console.log(`🎯 Generating TOB for PIN: ${pin}`);
      console.log(`👤 Lawyer data:`, lawyerData);

      const result = await generateCustomizedTOB(pin, lawyerData);
      
      return reply.send({
        success: true,
        message: 'TOB generated successfully',
        pin: result.pin,
        downloadUrl: result.downloadUrl,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating TOB:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate TOB',
        details: error.message
      });
    }
  });

  // 🎯 NEW: PDF Manipulation endpoint - Load existing PDF and fill Image Placeholders
  fastify.post('/manipulate-pdf-signatures', async (request, reply) => {
    try {
      const { pin, lawyerData, signatureData } = request.body;
      
      if (!pin || !lawyerData || !signatureData) {
        return reply.code(400).send({
          success: false,
          error: 'PIN, lawyer data, and signature data are required'
        });
      }

      console.log(`🎯 PDF Manipulation for PIN: ${pin}`);
      console.log(`👤 Lawyer data:`, lawyerData);
      console.log(`✍️ Signature data:`, signatureData);

      // Import the PDF manipulation function
      const { manipulatePdfForSignatures } = await import('../utils/pdfManipulation.js');
      
      // Call the PDF manipulation function
      const result = await manipulatePdfForSignatures(pin, signatureData);

      if (result.success) {
        // Update database for signed PDF
        try {
          const stats = fs.statSync(result.outputPath);
          const fileName = `TOB_${pin}_Signed.pdf`;
          const filePath = result.outputPath;
          const fileSize = stats.size;
          
          // Start transaction
          await lawyersPool.query('BEGIN');

          try {
            // 1. Insert document record
            await lawyersPool.query(`
              INSERT INTO documents (
                  document_type,
                  file_name,
                  file_path,
                  file_size,
                  uploaded_at,
                  encrypted
              ) VALUES (
                  'signed_tob',
                  $1,                   -- fileName
                  $2,                   -- filePath
                  $3,                   -- fileSize
                  NOW(),
                  TRUE
              )
            `, [fileName, filePath, fileSize]);

            // 2. Update lawyer workflow stage
            await lawyersPool.query(`
              UPDATE lawyers
              SET workflow_stage = 2,           -- TOB completed
                  updated_at = NOW()
              WHERE pin = $1
            `, [pin]);

            // 3. Insert audit log entry
            await lawyersPool.query(`
              INSERT INTO audit_logs (
                  lawyer_id,
                  action,
                  details,
                  ip_address,
                  user_agent
              ) VALUES (
                  (SELECT id FROM lawyers WHERE pin = $1 LIMIT 1),  -- lookup lawyer_id by PIN
                  'TOB_PDF_MANIPULATION_COMPLETED',
                  $2::jsonb,                                       -- JSON details
                  $3,                                              -- request.ip
                  $4                                               -- request.headers['user-agent']
              )
            `, [
              pin,                        // $1
              JSON.stringify({            // $2 - details
                fileName,
                filePath,
                downloadUrl: result.outputPath,
                manipulatedAt: new Date().toISOString(),
                method: 'PDF_MANIPULATION'
              }),
              request.ip,                 // $3
              request.headers['user-agent'] || 'Unknown' // $4
            ]);

            // Commit transaction
            await lawyersPool.query('COMMIT');
            console.log(`✅ Database insertion successful for PIN: ${pin}`);
            
          } catch (dbError) {
            // Rollback on error
            await lawyersPool.query('ROLLBACK');
            throw dbError;
          }
        } catch (dbError) {
          console.error(`❌ Database insertion failed for PIN: ${pin}:`, dbError);
          // Don't fail the entire request if DB insertion fails
        }

        return reply.send({
          success: true,
          message: 'PDF manipulation completed successfully',
          pin: pin,
          downloadUrl: result.outputPath,
          outputPath: result.outputPath,
          fileSize: result.fileSize,
          createdAt: result.createdAt,
          timestamp: new Date().toISOString()
        });
      } else {
        return reply.code(500).send({
          success: false,
          error: result.error || 'Failed to manipulate PDF',
          details: result.details
        });
      }
    } catch (error) {
      console.error('❌ Error manipulating PDF:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to manipulate PDF',
        details: error.message
      });
    }
  });

  // Generate lawyers customized TOB (EJS workflow) - LAWYERS DASHBOARD WORKFLOW
  // This endpoint uses Pandoc + LaTeX for professional PDF generation
  fastify.post('/generate-lawyers-tob', async (request, reply) => {
    try {
      const { pin, lawyerData, signatureData, generateForReview } = request.body;
      
      if (!pin || !lawyerData) {
        return reply.code(400).send({
          success: false,
          error: 'PIN and lawyer data are required'
        });
      }

      console.log(`🎯 Generating Lawyers TOB for PIN: ${pin}`);
      console.log(`👤 Lawyer data:`, lawyerData);
      console.log(`✍️ Signature data:`, signatureData);
      console.log(`📄 Generate for review:`, generateForReview);

      // Import the proper generation function
      const { generateLawyersCustomizedTOB } = await import('../utils/generateLawyersCustomizedTOB.js');
      
      // Call the proper function that handles both review and signed modes
      const result = await generateLawyersCustomizedTOB(pin, signatureData, lawyerData, generateForReview);

      if (result.success) {
        // For signed TOBs, update database
        if (!generateForReview && result.outputPath) {
          try {
            const stats = fs.statSync(result.outputPath);
            const fileName = `TOB_${pin}_SIGNED.pdf`;
            const filePath = result.outputPath;
            const fileSize = stats.size;
            
            // Start transaction
            await lawyersPool.query('BEGIN');

            try {
              // 1. Insert document record
              await lawyersPool.query(`
                INSERT INTO documents (
                    document_type,
                    file_name,
                    file_path,
                    file_size,
                    uploaded_at,
                    encrypted
                ) VALUES (
                    'signed_tob',
                    $1,                   -- fileName
                    $2,                   -- filePath
                    $3,                   -- fileSize
                    NOW(),
                    TRUE
                )
              `, [fileName, filePath, fileSize]);

              // 2. Update lawyer workflow stage
              await lawyersPool.query(`
                UPDATE lawyers
                SET workflow_stage = 2,           -- TOB completed
                    updated_at = NOW()
                WHERE pin = $1
              `, [pin]);

              // 3. Insert audit log entry
              await lawyersPool.query(`
                INSERT INTO audit_logs (
                    lawyer_id,
                    action,
                    details,
                    ip_address,
                    user_agent
                ) VALUES (
                    (SELECT id FROM lawyers WHERE pin = $1 LIMIT 1),  -- lookup lawyer_id by PIN
                    'TOB_SIGNED_PDF_CREATED',
                    $2::jsonb,                                       -- JSON details
                    $3,                                              -- request.ip
                    $4                                               -- request.headers['user-agent']
                )
              `, [
                pin,                        // $1
                JSON.stringify({            // $2 - details
                  fileName,
                  filePath,
                  downloadUrl: result.downloadUrl,
                  generatedAt: new Date().toISOString()
                }),
                request.ip,                 // $3
                request.headers['user-agent'] || 'Unknown' // $4
              ]);

              // Commit transaction
              await lawyersPool.query('COMMIT');
              console.log(`✅ Database insertion successful for PIN: ${pin}`);
              
            } catch (dbError) {
              // Rollback on error
              await lawyersPool.query('ROLLBACK');
              throw dbError;
            }
          } catch (dbError) {
            console.error(`❌ Database insertion failed for PIN: ${pin}:`, dbError);
            // Don't fail the entire request if DB insertion fails
          }
        }

        return reply.send({
          success: true,
          message: generateForReview ? 'Review TOB generated successfully' : 'Signed TOB generated successfully',
          pin: pin,
          downloadUrl: result.downloadUrl,
          outputPath: result.outputPath,
          timestamp: new Date().toISOString()
        });
      } else {
        return reply.code(500).send({
          success: false,
          error: result.error || 'Failed to generate Lawyers TOB',
          details: result.details
        });
      }
    } catch (error) {
      console.error('Error generating Lawyers TOB:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate Lawyers TOB',
        details: error.message
      });
    }
  });

  // Document upload endpoint (secure POST)
  fastify.post('/upload', async (request, reply) => {
    try {
      const { pin, documentType, fileData } = request.body;
      
      if (!pin || !documentType || !fileData) {
        return reply.code(400).send({
          success: false,
          error: 'PIN, document type, and file data are required'
        });
      }

      console.log(`📤 Document upload for PIN: ${pin}, Type: ${documentType}`);

      // Validate document type
      const allowedTypes = ['signed_tob', 'review_tob', 'consent_form', 'medical_record'];
      if (!allowedTypes.includes(documentType)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid document type. Allowed types: ' + allowedTypes.join(', ')
        });
      }

      // Generate file path based on type
      let filePath;
      let fileName;
      
      if (documentType === 'signed_tob') {
        fileName = `TOB_${pin}_SIGNED.pdf`;
        filePath = buildFilePath('signedTob', fileName);
      } else if (documentType === 'review_tob') {
        fileName = `TOB_${pin}.pdf`;
        filePath = buildFilePath('temp', fileName);
      } else {
        fileName = `${documentType}_${pin}.pdf`;
        filePath = buildFilePath('uploads', fileName);
      }

      // Save file (assuming base64 encoded data)
      const fileBuffer = Buffer.from(fileData, 'base64');
      fs.writeFileSync(filePath, fileBuffer);
      
      const fileSize = fileBuffer.length;
      console.log(`✅ Document saved: ${fileName} (${fileSize} bytes)`);

      // Insert into database
      try {
        await lawyersPool.query(`
          INSERT INTO documents (
              document_type,
              file_name,
              file_path,
              file_size,
              uploaded_at,
              encrypted
          ) VALUES (
              $1,                   -- documentType
              $2,                   -- fileName
              $3,                   -- filePath
              $4,                   -- fileSize
              NOW(),
              TRUE
          )
        `, [documentType, fileName, filePath, fileSize]);

        console.log(`✅ Document record inserted for PIN: ${pin}`);
      } catch (dbError) {
        console.error(`❌ Database insertion failed:`, dbError);
        // Don't fail the upload if DB insertion fails
      }

      return reply.send({
        success: true,
        message: 'Document uploaded successfully',
        pin: pin,
        fileName: fileName,
        filePath: filePath,
        fileSize: fileSize,
        downloadUrl: `/documents/${pin}/${documentType}`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to upload document',
        details: error.message
      });
    }
  });

  // Save lawyer signature endpoint (GDPR-compliant)
  fastify.post('/save-signature', async (request, reply) => {
    try {
      const { pin, signatureData, lawyerData, signatureType } = request.body;

      if (!pin || !signatureData) {
        return reply.code(400).send({
          success: false,
          error: 'PIN and signature data are required'
        });
      }

      console.log(`📝 Saving signature for PIN: ${pin}, Type: ${signatureType || 'professional'}`);

      // Start transaction for atomic operation
      await lawyersPool.query('BEGIN');

      try {
        // 1. First, deactivate any existing active signatures of the same type
        await lawyersPool.query(`
          UPDATE lawyer_signatures
          SET is_active = FALSE, updated_at = NOW()
          WHERE pin = $1 AND signature_type = $2 AND is_active = TRUE
        `, [pin, signatureType || 'professional']);

        // 2. Get lawyer_id for foreign key
        const lawyerResult = await lawyersPool.query('SELECT id FROM lawyers WHERE pin = $1', [pin]);

        if (lawyerResult.rows.length === 0) {
          throw new Error('Lawyer not found for PIN');
        }

        const lawyerId = lawyerResult.rows[0].id;

        // 3. Insert new signature record
        const signatureResult = await lawyersPool.query(`
          INSERT INTO lawyer_signatures (
            lawyer_id,
            pin,
            signature_data,
            signature_type,
            is_active,
            consent_given,
            retention_until,
            encrypted,
            created_at
          ) VALUES (
            $1, $2, $3, $4, TRUE, TRUE,
            CURRENT_DATE + INTERVAL '7 years', -- GDPR retention period
            TRUE, NOW()
          ) RETURNING id, created_at
        `, [lawyerId, pin, signatureData, signatureType || 'professional']);

        const newSignatureId = signatureResult.rows[0].id;

        // 4. Add audit log entry
        await lawyersPool.query(`
          INSERT INTO audit_logs (
            lawyer_id,
            action,
            details,
            ip_address,
            user_agent
          ) VALUES (
            $1, 'SIGNATURE_SAVED',
            $2::jsonb,
            $3,
            $4
          )
        `, [
          lawyerId,
          JSON.stringify({
            signatureId: newSignatureId,
            signatureType: signatureType || 'professional',
            gdprCompliant: true,
            encrypted: true,
            retentionUntil: '7 years from creation'
          }),
          request.ip,
          request.headers['user-agent'] || 'Unknown'
        ]);

        // Commit transaction
        await lawyersPool.query('COMMIT');

        console.log(`✅ Signature saved successfully for PIN: ${pin}, ID: ${newSignatureId}`);

        return reply.send({
          success: true,
          message: 'Signature saved successfully',
          signatureId: newSignatureId,
          pin: pin,
          signatureType: signatureType || 'professional',
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

  // Retrieve lawyer signature endpoint
  fastify.get('/get-signature/:pin', async (request, reply) => {
    try {
      const { pin } = request.params;
      const { signatureType = 'professional' } = request.query;

      console.log(`📖 Retrieving signature for PIN: ${pin}, Type: ${signatureType}`);

      // Get active signature for lawyer
      const result = await lawyersPool.query(`
        SELECT
          id,
          signature_data,
          signature_type,
          created_at,
          last_used_at,
          usage_count
        FROM lawyer_signatures
        WHERE pin = $1 AND signature_type = $2 AND is_active = TRUE
        ORDER BY created_at DESC
        LIMIT 1
      `, [pin, signatureType]);

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'No active signature found',
          pin: pin,
          signatureType: signatureType
        });
      }

      const signature = result.rows[0];

      // Update usage tracking
      await lawyersPool.query(`
        UPDATE lawyer_signatures
        SET last_used_at = NOW(), usage_count = usage_count + 1
        WHERE id = $1
      `, [signature.id]);

      // Add audit log entry
      await lawyersPool.query(`
        INSERT INTO audit_logs (
          lawyer_id,
          action,
          details,
          ip_address,
          user_agent
        ) VALUES (
          (SELECT id FROM lawyers WHERE pin = $1),
          'SIGNATURE_RETRIEVED',
          $2::jsonb,
          $3,
          $4
        )
      `, [
        pin,
        JSON.stringify({
          signatureId: signature.id,
          signatureType: signatureType,
          usageCount: signature.usage_count + 1
        }),
        request.ip,
        request.headers['user-agent'] || 'Unknown'
      ]);

      console.log(`✅ Signature retrieved for PIN: ${pin}`);

      return reply.send({
        success: true,
        signatureData: signature.signature_data,
        signatureId: signature.id,
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

  // Document download endpoint (secure GET)
  fastify.get('/:pin/:type', async (request, reply) => {
    try {
      const { pin, type } = request.params;
      
      console.log(`📥 Document download request - PIN: ${pin}, Type: ${type}`);

      // Determine file path based on type
      let filePath;
      let fileName;
      
      if (type === 'signed') {
        fileName = `TOB_${pin}_SIGNED.pdf`;
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
          'Access-Control-Allow-Origin': 'https://lawyers.qolae.com',
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

}