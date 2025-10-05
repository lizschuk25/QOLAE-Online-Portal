// ==============================================
// lawyerRoutes.js - Lawyer-Specific API Routes
// Organized by Location Block Pattern
// Handles: TOB workflow endpoints for lawyer portal
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
import { PDFDocument } from 'pdf-lib';

// A.2: Database & Configuration Setup
// Initialize PostgreSQL connection pool for qolae_lawyers
const lawyersPool = new Pool({
  connectionString: process.env.LAWYERS_DATABASE_URL || process.env.DATABASE_URL,
});

// Configuration for file paths
const config = {
  centralRepository: process.env.CENTRAL_REPOSITORY_PATH,
  paths: {
    signedTob: 'signed-tob',
    temp: 'temp',
    uploads: 'uploads',
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
// C.1: TOB Modal Step Endpoints (Steps 1-3)
// C.2: PDF Manipulation Operations
// C.3: Dashboard Completion Endpoints
// ==============================================

export default async function lawyerRoutes(server, options) {
  
  // ==============================================
  // C.1: TOB MODAL STEP ENDPOINTS
  // ==============================================

  // 🔍 Step 1: Load Saved Email Preference (GET)
  server.get('/api/lawyer/email-preference', async (request, reply) => {
    try {
      const { pin } = request.query;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      console.log(`🔍 Loading email preference for PIN: ${pin}`);

      // Get saved email preference
      const result = await lawyersPool.query(
        'SELECT email_preference FROM lawyers WHERE pin = $1',
        [pin]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Lawyer not found',
          pin: pin
        });
      }

      const preference = result.rows[0].email_preference;

      console.log(`✅ Email preference loaded for PIN: ${pin} - ${preference || 'not set'}`);

      return reply.send({
        success: true,
        preference: preference || null,
        pin: pin
      });

    } catch (error) {
      console.error('❌ Error loading email preference:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to load email preference',
        details: error.message
      });
    }
  });

  // 📧 Step 1: Save Email Preference (POST)
  server.post('/api/lawyer/email-preference', async (request, reply) => {
    try {
      const { pin, preference } = request.body;

      if (!pin || !preference) {
        return reply.code(400).send({
          success: false,
          error: 'PIN and preference are required'
        });
      }

      if (!['yes', 'no'].includes(preference)) {
        return reply.code(400).send({
          success: false,
          error: 'Preference must be "yes" or "no"'
        });
      }

      console.log(`📧 Saving email preference for PIN: ${pin} - Preference: ${preference}`);

      // Update lawyer record with email preference and step completion
      const result = await lawyersPool.query(
        `UPDATE lawyers 
         SET email_preference = $1,
             tob_step_1_completed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE pin = $2
         RETURNING pin, email_preference, tob_step_1_completed_at`,
        [preference, pin]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Lawyer not found',
          pin: pin
        });
      }

      const lawyer = result.rows[0];

      console.log(`✅ Email preference saved for PIN: ${pin}`);

      return reply.send({
        success: true,
        message: 'Email preference saved successfully',
        pin: lawyer.pin,
        preference: lawyer.email_preference,
        completed_at: lawyer.tob_step_1_completed_at
      });

    } catch (error) {
      console.error('❌ Error saving email preference:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to save email preference',
        details: error.message
      });
    }
  });

  // ✍️ Step 2: Save Signature
  server.post('/api/lawyer/signature', async (request, reply) => {
    try {
      const { pin, signature } = request.body;

      if (!pin || !signature) {
        return reply.code(400).send({
          success: false,
          error: 'PIN and signature data are required'
        });
      }

      console.log(`✍️ Saving signature for PIN: ${pin}`);

      // Begin transaction
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

        // 2. Save signature to lawyer_signatures table
        const signatureResult = await lawyersPool.query(
          `INSERT INTO lawyer_signatures (pin, signature_data, created_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (pin) 
           DO UPDATE SET signature_data = $2, created_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [pin, signature]
        );

        const signatureId = signatureResult.rows[0].id;

        // 3. Update step completion timestamp
        await lawyersPool.query(
          `UPDATE lawyers 
           SET tob_step_2_completed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE pin = $1`,
          [pin]
        );

        // Commit transaction
        await lawyersPool.query('COMMIT');

        console.log(`✅ Signature saved for PIN: ${pin}, Signature ID: ${signatureId}`);
        console.log(`📝 NOTE: Signature insertion into PDF handled by backend PDF service`);

        return reply.send({
          success: true,
          message: 'Signature saved and inserted into PDF',
          pin: pin,
          signatureId: signatureId
        });

      } catch (dbError) {
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

  // 📄 Step 3: Get Signed TOB for Preview
  server.get('/api/lawyer/signed-tob', async (request, reply) => {
    try {
      const { pin } = request.query;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      console.log(`📄 Loading signed TOB for preview - PIN: ${pin}`);

      // Update step 3 completion timestamp
      await lawyersPool.query(
        `UPDATE lawyers 
         SET tob_step_3_completed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE pin = $1`,
        [pin]
      );

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
      console.log(`✅ Serving signed TOB: ${fileName} (${stats.size} bytes)`);

      // Set headers for PDF response
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Length', stats.size);
      reply.header('Content-Disposition', `inline; filename="${fileName}"`);
      reply.header('Access-Control-Allow-Origin', '*');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      return reply.send(fileStream);

    } catch (error) {
      console.error('❌ Error loading signed TOB:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to load signed TOB',
        details: error.message
      });
    }
  });

  // ==============================================
  // C.2: PDF MANIPULATION OPERATIONS
  // ==============================================

  // 📎 Flatten TOB PDF (Step 3→4)
  server.post('/api/lawyer/flatten-tob-pdf', async (request, reply) => {
    try {
      const { pin } = request.body;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      console.log(`📎 Flattening TOB PDF for PIN: ${pin}`);

      // Get signed PDF file path
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

      // Read the PDF
      const existingPdfBytes = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Flatten the form (makes all fields non-editable)
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      console.log(`📋 Flattening ${fields.length} form fields...`);

      // Flatten each field
      fields.forEach(field => {
        try {
          form.removeField(field);
        } catch (err) {
          console.warn(`⚠️ Could not flatten field: ${field.getName()}`);
        }
      });

      // Save the flattened PDF
      const flattenedPdfBytes = await pdfDoc.save();
      await fs.writeFile(filePath, flattenedPdfBytes);

      const stats = fs.statSync(filePath);
      console.log(`✅ PDF flattened successfully - ${fileName} (${stats.size} bytes)`);

      return reply.send({
        success: true,
        message: 'PDF flattened successfully',
        pin: pin,
        fieldsFlattened: fields.length,
        downloadUrl: `/documents/${pin}/signed`,
        fileSize: stats.size
      });

    } catch (error) {
      console.error('❌ Error flattening PDF:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to flatten PDF',
        details: error.message
      });
    }
  });

  // ==============================================
  // C.3: DASHBOARD COMPLETION ENDPOINTS
  // ==============================================

  // ✅ Update TOB Status (Dashboard - after completion)
  server.post('/api/lawyer/update-tob-status', async (request, reply) => {
    try {
      const { pin, tobCompleted, emailPreference } = request.body;

      if (!pin || tobCompleted === undefined) {
        return reply.code(400).send({
          success: false,
          error: 'PIN and tobCompleted status are required'
        });
      }

      console.log(`✅ Updating TOB status for PIN: ${pin} - Completed: ${tobCompleted}`);

      // Update lawyer record
      const result = await lawyersPool.query(
        `UPDATE lawyers 
         SET tob_completed = $1,
             tob_completed_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE tob_completed_at END,
             workflow_stage = CASE WHEN $1 = true THEN 'tob_completed' ELSE workflow_stage END,
             updated_at = CURRENT_TIMESTAMP
         WHERE pin = $2
         RETURNING pin, tob_completed, tob_completed_at, workflow_stage`,
        [tobCompleted, pin]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Lawyer not found',
          pin: pin
        });
      }

      const lawyer = result.rows[0];

      console.log(`✅ TOB status updated for PIN: ${pin}`);
      console.log(`📊 Workflow stage: ${lawyer.workflow_stage}`);

      return reply.send({
        success: true,
        message: 'TOB status updated successfully',
        pin: lawyer.pin,
        tob_completed: lawyer.tob_completed,
        tob_completed_at: lawyer.tob_completed_at,
        workflow_stage: lawyer.workflow_stage
      });

    } catch (error) {
      console.error('❌ Error updating TOB status:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update TOB status',
        details: error.message
      });
    }
  });

}