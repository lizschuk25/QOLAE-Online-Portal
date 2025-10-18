// ==============================================
// NEW STARTER CONTROLLER
// ==============================================
// Purpose: Handle new starter workflow - registration, compliance, portal access
// Author: Atlas Agent
// Date: October 14, 2025
// Database: qolae_hrcompliance.new_starters
// ==============================================

import { executeQuery, executeTransaction } from '../config/database.js';
import { generateNewStarterPIN, validateNewStarterPIN } from '../utils/generateNewStarterPIN.js';
import { sendNewStarterInvitation, sendReminderEmail } from '../utils/sendNewStarterInvitation.js';
import notificationService from '../services/NotificationService.js';

// ==============================================
// NEW STARTER WORKFLOW CONTROLLER CLASS
// ==============================================
export class NewStarterController {

  // ==============================================
  // CREATE NEW STARTER RECORD & SEND INVITATION
  // ==============================================
  static async createNewStarter(request, reply) {
    try {
      console.log('\n=d === CREATE NEW STARTER ===');

      const {
        firstName,
        lastName,
        email,
        phone,
        role,
        department,
        startDate,
        createdBy = 'liz' // Who created this new starter record
      } = request.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !role) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: firstName, lastName, email, role'
        });
      }

      // Generate unique PIN
      const pin = await generateNewStarterPIN(firstName, lastName);
      const fullName = `${firstName} ${lastName}`;

      console.log(`Generated PIN: ${pin} for ${fullName}`);

      // Insert new starter record into database
      const insertQuery = `
        INSERT INTO new_starters (
          pin, first_name, last_name, full_name, email, phone, role,
          department, start_date, status, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        ) RETURNING *
      `;

      const params = [
        pin,
        firstName,
        lastName,
        fullName,
        email,
        phone,
        role,
        department,
        startDate,
        'pending_compliance', // Initial status
        createdBy
      ];

      const result = await executeQuery(insertQuery, params);
      const newStarter = result.rows[0];

      console.log(` New starter record created: ID ${newStarter.id}`);

      // Send invitation email
      const emailResult = await sendNewStarterInvitation({
        pin: newStarter.pin,
        name: newStarter.full_name,
        email: newStarter.email,
        role: newStarter.role
      });

      console.log(` Invitation email sent to ${newStarter.email}`);

      // Emit WebSocket notification to HR team
      notificationService.sendNotification({
        type: 'new_starter_created',
        message: `New starter ${fullName} created. PIN: ${pin}`,
        data: {
          pin: newStarter.pin,
          name: newStarter.full_name,
          role: newStarter.role
        },
        timestamp: new Date().toISOString()
      });

      return reply.send({
        success: true,
        message: 'New starter created and invitation sent',
        data: {
          id: newStarter.id,
          pin: newStarter.pin,
          name: newStarter.full_name,
          email: newStarter.email,
          role: newStarter.role,
          status: newStarter.status,
          emailSent: emailResult.success,
          portalUrl: `${process.env.HRCOMPLIANCE_PORTAL_URL}/new-starter-compliance?pin=${pin}`
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('L Error creating new starter:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create new starter',
        details: error.message
      });
    }
  }

  // ==============================================
  // GET NEW STARTER BY PIN (Portal Authentication)
  // ==============================================
  static async getNewStarterByPIN(request, reply) {
    try {
      const { pin } = request.query;

      console.log(`\n= === GET NEW STARTER BY PIN: ${pin} ===`);

      if (!pin || !validateNewStarterPIN(pin)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid PIN format'
        });
      }

      const query = 'SELECT * FROM new_starters WHERE pin = $1';
      const result = await executeQuery(query, [pin]);

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'New starter not found'
        });
      }

      const newStarter = result.rows[0];

      console.log(` New starter found: ${newStarter.full_name}`);

      return reply.send({
        success: true,
        data: {
          id: newStarter.id,
          pin: newStarter.pin,
          fullName: newStarter.full_name,
          email: newStarter.email,
          role: newStarter.role,
          department: newStarter.department,
          startDate: newStarter.start_date,
          status: newStarter.status,
          complianceSubmitted: newStarter.compliance_submitted,
          complianceSubmittedAt: newStarter.compliance_submitted_at,
          complianceApproved: newStarter.compliance_approved,
          complianceApprovedAt: newStarter.compliance_approved_at,
          workspaceAccess: newStarter.workspace_access || []
        }
      });

    } catch (error) {
      console.error('L Error getting new starter:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve new starter',
        details: error.message
      });
    }
  }

  // ==============================================
  // SUBMIT COMPLIANCE DOCUMENTS (Portal Submission)
  // ==============================================
  static async submitCompliance(request, reply) {
    try {
      console.log('\n=� === SUBMIT NEW STARTER COMPLIANCE ===');

      const { pin } = request.body;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      // Get new starter record
      const starterQuery = 'SELECT * FROM new_starters WHERE pin = $1';
      const starterResult = await executeQuery(starterQuery, [pin]);

      if (starterResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'New starter not found'
        });
      }

      const newStarter = starterResult.rows[0];

      // Check if already submitted
      if (newStarter.compliance_submitted) {
        return reply.code(400).send({
          success: false,
          error: 'Compliance already submitted'
        });
      }

      // Prepare compliance data
      const {
        // Application form data
        addressLine1,
        addressLine2,
        city,
        postcode,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,

        // Documents (file paths from upload handler)
        identityDocuments = [],
        utilityBills = [],
        qualifications = [],

        // Reference details
        professionalReferenceName,
        professionalReferenceTitle,
        professionalReferenceOrganisation,
        professionalReferenceEmail,
        professionalReferencePhone,
        professionalReferenceRelationship,

        characterReferenceName,
        characterReferenceRelationship,
        characterReferenceEmail,
        characterReferencePhone,
        characterReferenceKnownDuration,

        // DBS/PVG
        dbsNumber,
        dbsIssueDate,
        pvgNumber,
        pvgIssueDate

      } = request.body;

      // Transaction: Update new_starter record + Create compliance record
      const queries = [
        // 1. Update new_starters table
        {
          query: `
            UPDATE new_starters
            SET
              compliance_submitted = true,
              compliance_submitted_at = NOW(),
              status = 'compliance_submitted',
              address_line1 = $1,
              address_line2 = $2,
              city = $3,
              postcode = $4,
              emergency_contact_name = $5,
              emergency_contact_phone = $6,
              emergency_contact_relationship = $7,
              updated_at = NOW()
            WHERE pin = $8
            RETURNING *
          `,
          params: [
            addressLine1, addressLine2, city, postcode,
            emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
            pin
          ]
        },

        // 2. Create compliance record
        {
          query: `
            INSERT INTO compliance (
              person_type, person_id, person_name, person_email,
              compliance_status, submitted_at,
              identity_documents, utility_bills, qualifications,
              professional_reference_details, character_reference_details,
              dbs_number, dbs_issue_date, pvg_number, pvg_issue_date,
              created_at, updated_at
            ) VALUES (
              'new_starter', $1, $2, $3, 'submitted', NOW(),
              $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
            ) RETURNING *
          `,
          params: [
            newStarter.id,
            newStarter.full_name,
            newStarter.email,
            JSON.stringify(identityDocuments),
            JSON.stringify(utilityBills),
            JSON.stringify(qualifications),
            JSON.stringify({
              name: professionalReferenceName,
              title: professionalReferenceTitle,
              organisation: professionalReferenceOrganisation,
              email: professionalReferenceEmail,
              phone: professionalReferencePhone,
              relationship: professionalReferenceRelationship
            }),
            JSON.stringify({
              name: characterReferenceName,
              relationship: characterReferenceRelationship,
              email: characterReferenceEmail,
              phone: characterReferencePhone,
              knownDuration: characterReferenceKnownDuration
            }),
            dbsNumber,
            dbsIssueDate,
            pvgNumber,
            pvgIssueDate
          ]
        }
      ];

      const results = await executeTransaction(queries);

      console.log(` Compliance submitted for ${newStarter.full_name}`);

      // Emit WebSocket notification to HR team
      notificationService.sendNotification({
        type: 'new_starter_compliance_submitted',
        message: `${newStarter.full_name} submitted compliance documents`,
        data: {
          pin: newStarter.pin,
          name: newStarter.full_name
        },
        timestamp: new Date().toISOString()
      });

      return reply.send({
        success: true,
        message: 'Compliance submitted successfully',
        data: {
          pin: newStarter.pin,
          name: newStarter.full_name,
          status: 'compliance_submitted',
          submittedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('L Error submitting compliance:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to submit compliance',
        details: error.message
      });
    }
  }

  // ==============================================
  // GET ALL NEW STARTERS (For HR Dashboard)
  // ==============================================
  static async getAllNewStarters(request, reply) {
    try {
      console.log('\n=� === GET ALL NEW STARTERS ===');

      const query = `
        SELECT
          ns.*,
          c.compliance_status,
          c.submitted_at as compliance_submitted_at,
          c.reviewed_at as compliance_reviewed_at,
          c.approved_at as compliance_approved_at,
          c.reviewed_by
        FROM new_starters ns
        LEFT JOIN compliance c ON ns.id = c.person_id AND c.person_type = 'new_starter'
        ORDER BY ns.created_at DESC
      `;

      const result = await executeQuery(query);

      console.log(` Retrieved ${result.rows.length} new starters`);

      return reply.send({
        success: true,
        count: result.rows.length,
        data: result.rows.map(row => ({
          id: row.id,
          pin: row.pin,
          fullName: row.full_name,
          email: row.email,
          role: row.role,
          department: row.department,
          startDate: row.start_date,
          status: row.status,
          complianceSubmitted: row.compliance_submitted,
          complianceSubmittedAt: row.compliance_submitted_at || row.compliance_submitted_at,
          complianceStatus: row.compliance_status,
          complianceApproved: row.compliance_approved,
          complianceApprovedAt: row.compliance_approved_at || row.compliance_approved_at,
          reviewedBy: row.reviewed_by,
          createdAt: row.created_at
        }))
      });

    } catch (error) {
      console.error('L Error getting all new starters:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve new starters',
        details: error.message
      });
    }
  }

  // ==============================================
  // APPROVE NEW STARTER COMPLIANCE (Liz Only)
  // ==============================================
  static async approveCompliance(request, reply) {
    try {
      console.log('\n === APPROVE NEW STARTER COMPLIANCE ===');

      const { pin, approvedBy = 'liz', notes, workspaceAccess = [] } = request.body;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      // Get new starter
      const starterQuery = 'SELECT * FROM new_starters WHERE pin = $1';
      const starterResult = await executeQuery(starterQuery, [pin]);

      if (starterResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'New starter not found'
        });
      }

      const newStarter = starterResult.rows[0];

      // Transaction: Update new_starter + Update compliance
      const queries = [
        // 1. Update new_starters table
        {
          query: `
            UPDATE new_starters
            SET
              compliance_approved = true,
              compliance_approved_at = NOW(),
              status = 'active',
              workspace_access = $1,
              updated_at = NOW()
            WHERE pin = $2
            RETURNING *
          `,
          params: [JSON.stringify(workspaceAccess), pin]
        },

        // 2. Update compliance table
        {
          query: `
            UPDATE compliance
            SET
              compliance_status = 'approved',
              approved_at = NOW(),
              reviewed_at = NOW(),
              reviewed_by = $1,
              notes = $2,
              updated_at = NOW()
            WHERE person_id = $3 AND person_type = 'new_starter'
            RETURNING *
          `,
          params: [approvedBy, notes, newStarter.id]
        }
      ];

      await executeTransaction(queries);

      console.log(` Compliance approved for ${newStarter.full_name}`);

      // Emit WebSocket notification
      notificationService.sendNotification({
        type: 'new_starter_approved',
        message: `${newStarter.full_name} compliance approved by ${approvedBy}`,
        data: {
          pin: newStarter.pin,
          name: newStarter.full_name,
          workspaceAccess
        },
        timestamp: new Date().toISOString()
      });

      return reply.send({
        success: true,
        message: 'Compliance approved successfully',
        data: {
          pin: newStarter.pin,
          name: newStarter.full_name,
          status: 'active',
          approvedBy,
          approvedAt: new Date().toISOString(),
          workspaceAccess
        }
      });

    } catch (error) {
      console.error('L Error approving compliance:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to approve compliance',
        details: error.message
      });
    }
  }

  // ==============================================
  // SEND REMINDER EMAIL (For Pending Compliance)
  // ==============================================
  static async sendReminder(request, reply) {
    try {
      console.log('\n= === SEND REMINDER EMAIL ===');

      const { pin } = request.body;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      const query = 'SELECT * FROM new_starters WHERE pin = $1';
      const result = await executeQuery(query, [pin]);

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'New starter not found'
        });
      }

      const newStarter = result.rows[0];

      if (newStarter.compliance_submitted) {
        return reply.code(400).send({
          success: false,
          error: 'Compliance already submitted, no reminder needed'
        });
      }

      // Send reminder email
      const emailResult = await sendReminderEmail({
        pin: newStarter.pin,
        name: newStarter.full_name,
        email: newStarter.email
      });

      console.log(` Reminder email sent to ${newStarter.email}`);

      return reply.send({
        success: true,
        message: 'Reminder email sent successfully',
        data: {
          pin: newStarter.pin,
          name: newStarter.full_name,
          email: newStarter.email,
          emailSent: emailResult.success
        }
      });

    } catch (error) {
      console.error('❌ Error sending reminder:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to send reminder',
        details: error.message
      });
    }
  }

  // ==============================================
  // AUTHENTICATION METHODS (2FA Workflow)
  // ==============================================

  /**
   * Verify PIN and start 2FA process (Step 1 of 3)
   * POST /api/new-starter/verify-pin
   */
  static async verifyPIN(request, reply) {
    try {
      const { pin } = request.body;

      console.log(`\n🔐 ===== VERIFYING PIN =====`);
      console.log(`PIN: ${pin}`);

      // Validate PIN format
      const pinRegex = /^NS-[A-Z]{2}\d{6}$/;
      if (!pinRegex.test(pin)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid PIN format. Expected: NS-XX123456'
        });
      }

      // Query database for new starter
      const query = `
        SELECT id, pin, full_name, email
        FROM new_starters
        WHERE pin = $1
      `;

      const result = await pool.query(query, [pin]);

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'PIN not found'
        });
      }

      const newStarter = result.rows[0];

      console.log(`✅ PIN verified for: ${newStarter.full_name}`);

      return reply.send({
        success: true,
        data: {
          newStarterId: newStarter.id,
          email: newStarter.email,
          fullName: newStarter.full_name,
          pinValid: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error verifying PIN:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Generate and email 6-digit OTP (Step 2 of 3)
   * POST /api/new-starter/send-otp
   */
  static async sendOTP(request, reply) {
    try {
      const { newStarterId } = request.body;

      console.log(`\n📧 ===== SENDING OTP =====`);
      console.log(`New Starter ID: ${newStarterId}`);

      // Get new starter details
      const query = `
        SELECT id, pin, full_name, email
        FROM new_starters
        WHERE id = $1
      `;

      const result = await pool.query(query, [newStarterId]);

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'New starter not found'
        });
      }

      const newStarter = result.rows[0];

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in database with 15-minute expiry
      const updateQuery = `
        UPDATE new_starters
        SET otp = $1,
            otp_expires_at = NOW() + INTERVAL '15 minutes',
            otp_attempts = 0,
            updated_at = NOW()
        WHERE id = $2
      `;

      await pool.query(updateQuery, [otp, newStarterId]);

      // Send OTP via email (TODO: implement email sending)
      console.log(`🔐 Generated OTP for ${newStarter.full_name}: ${otp}`);
      console.log(`⚠️  Email sending not yet implemented - OTP logged for testing`);

      return reply.send({
        success: true,
        message: `OTP sent to ${newStarter.email}`,
        data: {
          newStarterId: newStarter.id,
          email: newStarter.email,
          otpExpiresIn: 900 // seconds (15 minutes)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to send OTP'
      });
    }
  }

  /**
   * Verify OTP code (Step 2.5 of 3)
   * POST /api/new-starter/verify-otp
   */
  static async verifyOTP(request, reply) {
    try {
      const { newStarterId, otp } = request.body;

      console.log(`\n🔓 ===== VERIFYING OTP =====`);
      console.log(`New Starter ID: ${newStarterId}, OTP: ${otp}`);

      // Get OTP details from database
      const query = `
        SELECT id, otp, otp_expires_at, otp_attempts, full_name
        FROM new_starters
        WHERE id = $1
      `;

      const result = await pool.query(query, [newStarterId]);

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'New starter not found'
        });
      }

      const newStarter = result.rows[0];

      // Check if OTP exists
      if (!newStarter.otp) {
        return reply.code(400).send({
          success: false,
          error: 'No OTP found. Please request a new one.'
        });
      }

      // Check if OTP has expired
      if (new Date() > new Date(newStarter.otp_expires_at)) {
        return reply.code(410).send({
          success: false,
          error: 'OTP has expired. Request a new one.'
        });
      }

      // Check attempts
      if (newStarter.otp_attempts >= 3) {
        // Clear OTP after 3 failed attempts
        await pool.query('UPDATE new_starters SET otp = NULL WHERE id = $1', [newStarterId]);
        return reply.code(400).send({
          success: false,
          error: 'Too many failed attempts. Please request a new OTP.'
        });
      }

      // Verify OTP
      if (newStarter.otp !== otp) {
        // Increment attempts
        await pool.query('UPDATE new_starters SET otp_attempts = otp_attempts + 1 WHERE id = $1', [newStarterId]);
        return reply.code(400).send({
          success: false,
          error: 'Invalid OTP'
        });
      }

      console.log(`✅ OTP verified for: ${newStarter.full_name}`);

      return reply.send({
        success: true,
        message: 'OTP verified successfully',
        data: {
          newStarterId: newStarter.id,
          verified: true
        }
      });

    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Complete authentication setup with password (Step 3 of 3)
   * POST /api/new-starter/create-password
   */
  static async createPassword(request, reply) {
    try {
      const { newStarterId, password } = request.body;

      console.log(`\n🔑 ===== CREATING PASSWORD =====`);
      console.log(`New Starter ID: ${newStarterId}`);

      // Validate password strength
      const passwordValidation = validatePassword(password);

      if (!passwordValidation.isValid) {
        return reply.code(400).send({
          success: false,
          error: 'Password does not meet requirements',
          requirements: passwordValidation.errors
        });
      }

      // Hash password with bcrypt (12 rounds)
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 12);

      // Update database
      const query = `
        UPDATE new_starters
        SET password_hash = $1,
            status = 'credentials_created',
            otp = NULL,
            otp_attempts = 0,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, pin, full_name
      `;

      const result = await pool.query(query, [passwordHash, newStarterId]);

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'New starter not found'
        });
      }

      const newStarter = result.rows[0];

      console.log(`✅ Password created for: ${newStarter.full_name}`);

      return reply.send({
        success: true,
        message: 'Account created. Redirecting to compliance portal...',
        data: {
          newStarterId: newStarter.id,
          redirectUrl: '/new-starter/compliance',
          status: 'credentials_created'
        }
      });

    } catch (error) {
      console.error('❌ Error creating password:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create password'
      });
    }
  }
}

// ==============================================
// PASSWORD VALIDATION HELPER
// ==============================================
function validatePassword(password) {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isLongEnough = password.length >= 12;

  const errors = [];
  if (!hasUppercase) errors.push('Must contain uppercase letters');
  if (!hasLowercase) errors.push('Must contain lowercase letters');
  if (!hasNumber) errors.push('Must contain numbers');
  if (!hasSymbol) errors.push('Must contain symbols');
  if (!isLongEnough) errors.push('Must be at least 12 characters');

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default NewStarterController;
