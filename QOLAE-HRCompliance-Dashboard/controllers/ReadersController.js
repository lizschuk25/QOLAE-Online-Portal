// ==============================================
// READERS REGISTRATION CONTROLLER
// ==============================================
// Purpose: Handle reader registration workflow
// Workflow: Fill Details → Generate PIN → Generate NDA → Preview → Send
// Mirrors Admin workflow with NDA generation
// Date: October 14, 2025
// ==============================================

import { executeQuery } from '../config/database.js';
import { generateCustomizedNDA } from '../utils/generateCustomizedReadersNDA.js';
import sendReaderInvitationEmail from '../utils/sendReaderInvitation.js';

class ReadersController {

  // ==============================================
  // STEP 1: GENERATE READER PIN
  // ==============================================
  static async generateReaderPIN(request, reply) {
    const { readerName } = request.body;

    if (!readerName) {
      return reply.code(400).send({
        success: false,
        error: 'Reader name is required'
      });
    }

    try {
      console.log(`\n=== GENERATING READER PIN ===`);
      console.log(`Reader Name: ${readerName}`);

      // Generate PIN: RDR-{INITIALS}{6-DIGIT-NUMBER}
      const nameParts = readerName.trim().split(' ');
      const initials = nameParts.map(part => part[0]).join('').toUpperCase();
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      let pin = `RDR-${initials}${randomNum}`;

      // Check if PIN already exists (collision check)
      let attempts = 0;
      while (attempts < 3) {
        const existingPin = await executeQuery(
          'SELECT reader_pin FROM readers WHERE reader_pin = $1',
          [pin]
        );

        if (existingPin.rows.length === 0) {
          break; // PIN is unique
        }

        // Regenerate if collision
        const newRandomNum = Math.floor(100000 + Math.random() * 900000);
        pin = `RDR-${initials}${newRandomNum}`;
        attempts++;
      }

      console.log(`✓ PIN generated: ${pin}`);

      return reply.send({
        success: true,
        pin,
        message: 'Reader PIN generated successfully'
      });

    } catch (error) {
      console.error('✗ PIN generation error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate PIN',
        details: error.message
      });
    }
  }

  // ==============================================
  // STEP 2: VERIFY MEDICAL REGISTRATION (MOCK)
  // ==============================================
  static async verifyMedicalRegistration(request, reply) {
    const { registrationBody, registrationNumber } = request.body;

    if (!registrationBody || !registrationNumber) {
      return reply.code(400).send({
        success: false,
        error: 'Registration body and number are required'
      });
    }

    try {
      console.log(`\n=== VERIFYING MEDICAL REGISTRATION ===`);
      console.log(`Body: ${registrationBody}, Number: ${registrationNumber}`);

      // MOCK VERIFICATION - Format validation only
      // Real implementation would call NMC/GMC API

      const nmcPattern = /^[0-9]{2}[A-Z][0-9]{4}[A-Z]$/; // e.g., 12A3456E
      const gmcPattern = /^[0-9]{7}$/; // e.g., 1234567

      let isValid = false;
      let professionalName = 'Registered Professional';

      if (registrationBody === 'NMC' && nmcPattern.test(registrationNumber)) {
        isValid = true;
        professionalName = 'Registered Nurse';
      } else if (registrationBody === 'GMC' && gmcPattern.test(registrationNumber)) {
        isValid = true;
        professionalName = 'Registered Medical Practitioner';
      } else if (registrationBody === 'Other') {
        isValid = true; // Accept other professional bodies
      }

      if (isValid) {
        console.log(`✓ Verification passed: ${professionalName}`);
        return reply.send({
          success: true,
          verified: true,
          name: professionalName,
          registrationBody,
          registrationNumber,
          message: 'Professional registration verified successfully'
        });
      } else {
        console.log(`✗ Verification failed: Invalid format`);
        return reply.send({
          success: false,
          verified: false,
          error: 'Invalid registration number format'
        });
      }

    } catch (error) {
      console.error('✗ Verification error:', error);
      return reply.code(500).send({
        success: false,
        verified: false,
        error: 'Verification service error',
        details: error.message
      });
    }
  }

  // ==============================================
  // STEP 3: GENERATE CUSTOMIZED NDA
  // ==============================================
  static async generateCustomizedNDA(request, reply) {
    const {
      readerPin,
      readerName,
      email,
      phone,
      readerType,
      specialization,
      registrationBody,
      registrationNumber,
      registrationVerified
    } = request.body;

    if (!readerPin || !readerName || !email) {
      return reply.code(400).send({
        success: false,
        error: 'Reader PIN, name, and email are required'
      });
    }

    try {
      console.log(`\n=== GENERATING CUSTOMIZED NDA ===`);
      console.log(`Reader: ${readerName} (${readerPin})`);

      // Determine payment rate
      let paymentRate = 50.00;
      if (readerType === 'second_reader') {
        paymentRate = specialization ? 100.00 : 75.00;
      }

      // Insert or update reader record
      const upsertQuery = `
        INSERT INTO readers (
          reader_pin, reader_name, email, phone, reader_type,
          specialization, registration_body, registration_number, registration_verified,
          payment_rate, status, nda_generated, nda_generated_at, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, NOW(), 'liz', NOW())
        ON CONFLICT (reader_pin) DO UPDATE SET
          reader_name = $2, email = $3, phone = $4, reader_type = $5,
          specialization = $6, registration_body = $7, registration_number = $8,
          registration_verified = $9, payment_rate = $10,
          nda_generated = TRUE, nda_generated_at = NOW(), updated_at = NOW()
        RETURNING id
      `;

      await executeQuery(upsertQuery, [
        readerPin, readerName, email, phone || null, readerType,
        specialization || null, registrationBody || null, registrationNumber || null,
        registrationVerified || false, paymentRate, 'pending_nda'
      ]);

      console.log(`✓ Reader saved to database`);

      // Generate actual NDA PDF from TemplateReadersNDA.pdf
      const ndaResult = await generateCustomizedNDA(readerPin);

      if (!ndaResult.success) {
        console.error('✗ NDA generation failed:', ndaResult.error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to generate NDA',
          details: ndaResult.error
        });
      }

      const ndaPath = ndaResult.outputPath;
      console.log(`✓ NDA generated: ${ndaPath}`);

      return reply.send({
        success: true,
        ndaGenerated: true,
        ndaPath,
        readerPin,
        paymentRate,
        message: 'Customized NDA generated successfully'
      });

    } catch (error) {
      console.error('✗ NDA generation error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate NDA',
        details: error.message
      });
    }
  }

  // ==============================================
  // STEP 4: PREVIEW EMAIL WITH NDA
  // ==============================================
  static async previewEmailWithNDA(request, reply) {
    const { readerPin, readerName, email } = request.body;

    if (!readerPin || !readerName || !email) {
      return reply.code(400).send({
        success: false,
        error: 'Reader PIN, name, and email are required'
      });
    }

    try {
      console.log(`\n=== GENERATING EMAIL PREVIEW ===`);
      console.log(`Reader: ${readerName} (${readerPin})`);

      // Generate hyperlinked PIN URL
      const portalURL = `https://readers.qolae.com?pin=${readerPin}`;

      // Email preview content
      const emailPreview = {
        to: email,
        subject: 'QOLAE Reader Invitation - Confidential',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>QOLAE Reader Invitation</h2>
            <p>Dear ${readerName},</p>

            <p>You have been registered as a reader for <strong>QOLAE (Quality of Life & Excellence Ltd)</strong>.</p>

            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Your Reader PIN:</strong> <code style="font-size: 18px; color: #667eea;">${readerPin}</code></p>
            </div>

            <p><strong>Click here to access the readers portal:</strong></p>
            <a href="${portalURL}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Access Readers Portal</a>

            <p><strong>Before you can access reports, you must:</strong></p>
            <ol>
              <li>Review and sign the Non-Disclosure Agreement (NDA) - <em>attached</em></li>
              <li>Complete your compliance profile</li>
              <li>Wait for approval from HR Compliance team</li>
            </ol>

            <p>The NDA ensures confidentiality of all medical reports you review.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>QOLAE HR Compliance Team</strong></p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">Quality of Life & Excellence Ltd<br>
            Confidential Reader Services</p>
          </div>
        `,
        textBody: `
Dear ${readerName},

You have been registered as a reader for QOLAE (Quality of Life & Excellence Ltd).

Your Reader PIN: ${readerPin}

Please use this PIN to access the readers portal at:
${portalURL}

Before you can access reports, you must:
1. Review and sign the Non-Disclosure Agreement (NDA) - attached
2. Complete your compliance profile
3. Wait for approval from HR Compliance team

The NDA ensures confidentiality of all medical reports you review.

Best regards,
QOLAE HR Compliance Team
        `.trim(),
        attachments: [
          {
            filename: `NDA_${readerPin}.pdf`,
            path: `/central-repository/final-nda/NDA_${readerPin}.pdf`,
            contentType: 'application/pdf'
          }
        ]
      };

      console.log(`✓ Email preview generated`);

      return reply.send({
        success: true,
        emailPreview,
        portalURL,
        message: 'Email preview generated successfully'
      });

    } catch (error) {
      console.error('✗ Email preview error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate email preview',
        details: error.message
      });
    }
  }

  // ==============================================
  // STEP 5: SEND READER INVITATION
  // ==============================================
  static async sendReaderInvitation(request, reply) {
    const { readerPin, readerName, email } = request.body;

    if (!readerPin || !readerName || !email) {
      return reply.code(400).send({
        success: false,
        error: 'Reader PIN, name, and email are required'
      });
    }

    try {
      console.log(`\n=== SENDING READER INVITATION ===`);
      console.log(`Reader: ${readerName} (${readerPin})`);

      // Fetch reader details for email
      const readerResult = await executeQuery(
        `SELECT reader_type, payment_rate FROM readers WHERE reader_pin = $1`,
        [readerPin]
      );

      if (readerResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Reader not found'
        });
      }

      const { reader_type, payment_rate } = readerResult.rows[0];

      // Send actual email with NDA attachment
      const emailResult = await sendReaderInvitationEmail(
        readerPin,
        readerName,
        email,
        reader_type,
        payment_rate
      );

      if (!emailResult.success) {
        console.error('✗ Email send failed:', emailResult.error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to send invitation email',
          details: emailResult.error
        });
      }

      // Update reader status to 'invited'
      await executeQuery(
        `UPDATE readers
         SET status = 'invited', invitation_sent = TRUE, invited_at = NOW(),
             invitation_email_sent = TRUE, updated_at = NOW()
         WHERE reader_pin = $1`,
        [readerPin]
      );

      console.log(`✓ Invitation email sent to ${email}`);
      console.log(`✓ Email ID: ${emailResult.messageId}`);

      return reply.send({
        success: true,
        emailSent: true,
        readerPin,
        portalURL: `https://readers.qolae.com?pin=${readerPin}`,
        message: `Invitation email sent to ${email} successfully`
      });

    } catch (error) {
      console.error('✗ Send invitation error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to send invitation',
        details: error.message
      });
    }
  }

  // ==============================================
  // READER MANAGEMENT ENDPOINTS
  // ==============================================

  static async getPendingReaders(request, reply) {
    try {
      console.log(`\n=== FETCHING PENDING READERS ===`);

      const result = await executeQuery(
        `SELECT reader_pin, reader_name, email, reader_type, status, invited_at, created_at
         FROM readers
         WHERE status IN ('pending_nda', 'invited')
         ORDER BY created_at DESC`
      );

      return reply.send({
        success: true,
        readers: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('✗ Get pending readers error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch pending readers',
        details: error.message
      });
    }
  }

  static async getApprovedReaders(request, reply) {
    try {
      console.log(`\n=== FETCHING APPROVED READERS ===`);

      const result = await executeQuery(
        `SELECT reader_pin, reader_name, email, reader_type, specialization,
                payment_rate, portal_access_granted_at
         FROM readers
         WHERE status = 'approved'
         ORDER BY portal_access_granted_at DESC`
      );

      return reply.send({
        success: true,
        readers: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('✗ Get approved readers error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch approved readers',
        details: error.message
      });
    }
  }

  static async getAllReaders(request, reply) {
    try {
      console.log(`\n=== FETCHING ALL READERS ===`);

      const result = await executeQuery(
        `SELECT reader_pin, reader_name, email, reader_type, status,
                payment_rate, nda_signed, portal_access_granted, created_at
         FROM readers
         ORDER BY created_at DESC`
      );

      return reply.send({
        success: true,
        readers: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('✗ Get all readers error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch readers',
        details: error.message
      });
    }
  }
}

export default ReadersController;
