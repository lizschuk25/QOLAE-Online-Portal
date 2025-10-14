// ==============================================
// READERS COMPLIANCE CONTROLLER
// ==============================================
// Purpose: Handle readers compliance workflow (CV upload to database, references)
// Agent: Iris
// Date: October 14, 2025
// Dependencies: executeQuery (database), NotificationService
// Storage: CVs stored as BYTEA in PostgreSQL (qolae_hrcompliance database)
// ==============================================

import { executeQuery } from '../config/database.js';
import notificationService from '../services/NotificationService.js';

// ==============================================
// READERS COMPLIANCE CONTROLLER CLASS
// ==============================================
class ReadersComplianceController {

  // ==============================================
  // LOCATION BLOCK 1: COMPLIANCE SUBMISSION
  // ==============================================

  /**
   * Submit readers compliance (CV + reference details)
   * POST /api/readers/submit-compliance
   */
  static async submitCompliance(request, reply) {
    try {
      console.log('\n📋 === SUBMITTING READERS COMPLIANCE ===');

      const {
        readerPin,
        readerName,
        readerEmail,
        readerType,
        professionalRefName,
        professionalRefTitle,
        professionalRefOrganisation,
        professionalRefEmail,
        professionalRefPhone,
        professionalRefRelationship,
        characterRefName,
        characterRefRelationship,
        characterRefEmail,
        characterRefPhone,
        characterRefKnownDuration
      } = request.body;

      // Validate required fields
      if (!readerPin || !readerName || !readerEmail) {
        return reply.code(400).send({
          success: false,
          error: 'Reader PIN, name, and email are required'
        });
      }

      // Validate CV file was uploaded
      if (!request.file) {
        return reply.code(400).send({
          success: false,
          error: 'CV file is required'
        });
      }

      console.log(`Reader: ${readerName} (${readerPin})`);
      console.log(`CV uploaded: ${request.file.originalname} (${request.file.size} bytes)`);
      console.log(`CV stored in memory as Buffer, will save to database`);

      // Check if compliance already exists
      const existingCheck = await executeQuery(
        'SELECT id, approved FROM reader_compliance WHERE reader_pin = $1',
        [readerPin]
      );

      if (existingCheck.rows.length > 0 && existingCheck.rows[0].approved) {
        return reply.code(400).send({
          success: false,
          error: 'Compliance already approved for this reader'
        });
      }

      // Insert compliance record with CV binary data
      const insertQuery = `
        INSERT INTO reader_compliance (
          reader_pin, reader_name, reader_type,
          cv_filename, cv_mimetype, cv_data, cv_file_size, cv_uploaded_at,
          prof_ref_name, prof_ref_title, prof_ref_organisation,
          prof_ref_email, prof_ref_phone, prof_ref_relationship,
          char_ref_name, char_ref_relationship, char_ref_email,
          char_ref_phone, char_ref_known_duration,
          submitted_at, submitted_ip, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22
        ) RETURNING id
      `;

      const result = await executeQuery(insertQuery, [
        readerPin,
        readerName,
        readerType || 'first_reader',
        request.file.originalname,
        request.file.mimetype,
        request.file.buffer, // Binary data stored here
        request.file.size,
        new Date(),
        professionalRefName,
        professionalRefTitle,
        professionalRefOrganisation,
        professionalRefEmail,
        professionalRefPhone,
        professionalRefRelationship,
        characterRefName,
        characterRefRelationship,
        characterRefEmail,
        characterRefPhone,
        characterRefKnownDuration,
        new Date(),
        request.ip || null,
        new Date()
      ]);

      const complianceId = result.rows[0].id;

      // Send notification to Liz
      await notificationService.notifyComplianceSubmitted(readerName, 'reader', complianceId);

      console.log(`✅ Compliance submitted successfully (ID: ${complianceId})`);
      console.log(`✅ CV stored in database (${request.file.size} bytes)`);

      return reply.code(200).send({
        success: true,
        message: 'Compliance submitted successfully',
        complianceId: complianceId,
        cvFilename: request.file.originalname,
        cvSize: request.file.size,
        storageType: 'PostgreSQL Database',
        nextSteps: [
          'References will be contacted by case manager',
          'You will be notified when compliance is approved',
          'Portal access will be granted after approval'
        ]
      });

    } catch (error) {
      console.error('❌ Error submitting compliance:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to submit compliance',
        details: error.message
      });
    }
  }

  /**
   * Get reader compliance status
   * GET /api/readers/compliance-status/:readerPin
   */
  static async getComplianceStatus(request, reply) {
    try {
      const { readerPin } = request.params;

      console.log(`\n🔍 === CHECKING COMPLIANCE STATUS ===`);
      console.log(`Reader PIN: ${readerPin}`);

      const result = await executeQuery(
        `SELECT id, reader_name, reader_type, cv_filename, cv_file_size, cv_uploaded_at,
                prof_ref_status, char_ref_status, approved, submitted_at, reviewed_at, approved_at, approval_notes
         FROM reader_compliance
         WHERE reader_pin = $1`,
        [readerPin]
      );

      if (result.rows.length === 0) {
        return reply.code(200).send({
          success: true,
          complianceExists: false,
          message: 'No compliance record found',
          status: 'not_submitted'
        });
      }

      const compliance = result.rows[0];

      return reply.code(200).send({
        success: true,
        complianceExists: true,
        compliance: {
          id: compliance.id,
          readerName: compliance.reader_name,
          cvFilename: compliance.cv_filename,
          cvSize: compliance.cv_file_size,
          cvUploadedAt: compliance.cv_uploaded_at,
          professionalReferenceStatus: compliance.prof_ref_status,
          characterReferenceStatus: compliance.char_ref_status,
          approved: compliance.approved,
          submittedAt: compliance.submitted_at,
          reviewedAt: compliance.reviewed_at,
          approvedAt: compliance.approved_at,
          notes: compliance.approval_notes
        }
      });

    } catch (error) {
      console.error('❌ Error getting compliance status:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get compliance status',
        details: error.message
      });
    }
  }

  /**
   * Update compliance submission (if resubmission needed)
   * PUT /api/readers/update-compliance/:readerPin
   */
  static async updateCompliance(request, reply) {
    try {
      const { readerPin } = request.params;

      console.log(`\n🔄 === UPDATING COMPLIANCE ===`);
      console.log(`Reader PIN: ${readerPin}`);

      // Build update query dynamically based on what's being updated
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      // If new CV uploaded, update CV fields
      if (request.file) {
        updateFields.push(`cv_filename = $${paramIndex++}`);
        updateFields.push(`cv_mimetype = $${paramIndex++}`);
        updateFields.push(`cv_data = $${paramIndex++}`);
        updateFields.push(`cv_file_size = $${paramIndex++}`);
        updateFields.push(`cv_uploaded_at = $${paramIndex++}`);
        updateValues.push(request.file.originalname, request.file.mimetype, request.file.buffer, request.file.size, new Date());
        console.log(`🔄 Updating CV: ${request.file.originalname} (${request.file.size} bytes)`);
      }

      // Update professional reference if provided
      if (request.body.professionalRefName) {
        updateFields.push(`prof_ref_name = $${paramIndex++}`, `prof_ref_title = $${paramIndex++}`,
                         `prof_ref_organisation = $${paramIndex++}`, `prof_ref_email = $${paramIndex++}`,
                         `prof_ref_phone = $${paramIndex++}`, `prof_ref_relationship = $${paramIndex++}`);
        updateValues.push(request.body.professionalRefName, request.body.professionalRefTitle,
                         request.body.professionalRefOrganisation, request.body.professionalRefEmail,
                         request.body.professionalRefPhone, request.body.professionalRefRelationship);
      }

      // Update character reference if provided
      if (request.body.characterRefName) {
        updateFields.push(`char_ref_name = $${paramIndex++}`, `char_ref_relationship = $${paramIndex++}`,
                         `char_ref_email = $${paramIndex++}`, `char_ref_phone = $${paramIndex++}`,
                         `char_ref_known_duration = $${paramIndex++}`);
        updateValues.push(request.body.characterRefName, request.body.characterRefRelationship,
                         request.body.characterRefEmail, request.body.characterRefPhone,
                         request.body.characterRefKnownDuration);
      }

      if (updateFields.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'No fields to update'
        });
      }

      // Add updated_at and reader_pin
      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date(), readerPin);

      const updateQuery = `
        UPDATE reader_compliance
        SET ${updateFields.join(', ')}
        WHERE reader_pin = $${paramIndex}
      `;

      await executeQuery(updateQuery, updateValues);

      console.log(`✅ Compliance updated successfully`);

      return reply.code(200).send({
        success: true,
        message: 'Compliance updated successfully'
      });

    } catch (error) {
      console.error('❌ Error updating compliance:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update compliance',
        details: error.message
      });
    }
  }

  // ==============================================
  // LOCATION BLOCK 2: DOCUMENT ACCESS (DATABASE)
  // ==============================================

  /**
   * Download CV from database (CM/Liz access only)
   * GET /api/compliance/download-cv/:readerPin
   */
  static async downloadCV(request, reply) {
    try {
      const { readerPin } = request.params;

      console.log(`\n📥 === DOWNLOADING CV ===`);
      console.log(`Reader PIN: ${readerPin}`);

      const result = await executeQuery(
        'SELECT cv_data, cv_filename, cv_mimetype FROM reader_compliance WHERE reader_pin = $1',
        [readerPin]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'CV not found'
        });
      }

      const { cv_data, cv_filename, cv_mimetype } = result.rows[0];

      // Log access for GDPR audit
      await executeQuery(
        `INSERT INTO compliance_access_log (reader_pin, accessed_by, access_type, accessed_at, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [readerPin, 'liz', 'download_cv', new Date(), request.ip || null]
      );

      // Send file
      reply.header('Content-Type', cv_mimetype);
      reply.header('Content-Disposition', `attachment; filename="${cv_filename}"`);
      reply.send(cv_data);

      console.log(`✅ CV downloaded: ${cv_filename}`);

    } catch (error) {
      console.error('❌ Error downloading CV:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to download CV',
        details: error.message
      });
    }
  }

  /**
   * View CV in browser from database (CM/Liz access only)
   * GET /api/compliance/view-cv/:readerPin
   */
  static async viewCV(request, reply) {
    try {
      const { readerPin } = request.params;

      console.log(`\n👁️ === VIEWING CV ===`);
      console.log(`Reader PIN: ${readerPin}`);

      const result = await executeQuery(
        'SELECT cv_data, cv_filename, cv_mimetype FROM reader_compliance WHERE reader_pin = $1',
        [readerPin]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'CV not found'
        });
      }

      const { cv_data, cv_filename, cv_mimetype } = result.rows[0];

      // Log access for GDPR audit
      await executeQuery(
        `INSERT INTO compliance_access_log (reader_pin, accessed_by, access_type, accessed_at, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [readerPin, 'liz', 'view', new Date(), request.ip || null]
      );

      // Send file for inline viewing
      reply.header('Content-Type', cv_mimetype);
      reply.header('Content-Disposition', `inline; filename="${cv_filename}"`);
      reply.send(cv_data);

      console.log(`✅ CV viewed: ${cv_filename}`);

    } catch (error) {
      console.error('❌ Error viewing CV:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to view CV',
        details: error.message
      });
    }
  }

  // ==============================================
  // LOCATION BLOCK 3: COMPLIANCE REVIEW (CM/Liz)
  // ==============================================

  /**
   * Get all pending compliance submissions
   * GET /api/compliance/pending
   */
  static async getPendingCompliance(request, reply) {
    try {
      console.log('\n📋 === FETCHING PENDING COMPLIANCE ===');

      const result = await executeQuery(
        `SELECT id, reader_pin, reader_name, reader_type, cv_filename, cv_file_size,
                prof_ref_status, char_ref_status, submitted_at, reviewed_at
         FROM reader_compliance
         WHERE approved = FALSE
         ORDER BY submitted_at ASC`
      );

      return reply.code(200).send({
        success: true,
        count: result.rows.length,
        compliance: result.rows
      });

    } catch (error) {
      console.error('❌ Error getting pending compliance:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get pending compliance',
        details: error.message
      });
    }
  }

  /**
   * Approve compliance
   * POST /api/compliance/approve/:complianceId
   */
  static async approveCompliance(request, reply) {
    try {
      const { complianceId } = request.params;
      const { approvedBy, notes } = request.body;

      console.log(`\n✅ === APPROVING COMPLIANCE ===`);
      console.log(`Compliance ID: ${complianceId}`);

      const result = await executeQuery(
        `UPDATE reader_compliance
         SET approved = TRUE, approved_at = $1, reviewed_at = $2, reviewed_by = $3, approval_notes = $4, updated_at = $5
         WHERE id = $6
         RETURNING reader_name, reader_pin`,
        [new Date(), new Date(), approvedBy || 'liz', notes, new Date(), complianceId]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Compliance record not found'
        });
      }

      // TODO: Send approval notification email to reader
      // await notificationService.notifyComplianceApproved(...)

      console.log(`✅ Compliance approved for ${result.rows[0].reader_name}`);

      return reply.code(200).send({
        success: true,
        message: 'Compliance approved successfully'
      });

    } catch (error) {
      console.error('❌ Error approving compliance:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to approve compliance',
        details: error.message
      });
    }
  }

  /**
   * Get compliance statistics
   * GET /api/compliance/statistics
   */
  static async getComplianceStatistics(request, reply) {
    try {
      const result = await executeQuery(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN approved = TRUE THEN 1 END) as approved,
          COUNT(CASE WHEN approved = FALSE THEN 1 END) as pending,
          COUNT(CASE WHEN reader_type = 'first_reader' THEN 1 END) as first_readers,
          COUNT(CASE WHEN reader_type = 'second_reader' THEN 1 END) as second_readers,
          SUM(cv_file_size) as total_cv_storage_bytes
        FROM reader_compliance
      `);

      return reply.code(200).send({
        success: true,
        statistics: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get statistics',
        details: error.message
      });
    }
  }

  /**
   * Log compliance access (GDPR audit trail)
   * POST /api/compliance/log-access
   */
  static async logComplianceAccess(request, reply) {
    try {
      const { readerPin, accessedBy, accessType, accessNotes } = request.body;

      await executeQuery(
        `INSERT INTO compliance_access_log
         (reader_pin, accessed_by, access_type, accessed_at, ip_address, access_notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [readerPin, accessedBy, accessType, new Date(), request.ip || null, accessNotes || null]
      );

      return reply.code(200).send({
        success: true,
        message: 'Access logged successfully'
      });

    } catch (error) {
      console.error('❌ Error logging access:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to log access',
        details: error.message
      });
    }
  }

  /**
   * Get compliance access logs
   * GET /api/compliance/access-logs/:readerPin
   */
  static async getAccessLogs(request, reply) {
    try {
      const { readerPin } = request.params;

      const result = await executeQuery(
        `SELECT * FROM compliance_access_log
         WHERE reader_pin = $1
         ORDER BY accessed_at DESC
         LIMIT 50`,
        [readerPin]
      );

      return reply.code(200).send({
        success: true,
        count: result.rows.length,
        logs: result.rows
      });

    } catch (error) {
      console.error('❌ Error getting access logs:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get access logs',
        details: error.message
      });
    }
  }

  // Placeholder methods for remaining endpoints
  static async submitProfessionalReference(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async submitCharacterReference(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async getReferenceDetails(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async getComplianceDetails(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async updateComplianceStatus(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async rejectCompliance(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async getReferenceForm(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async submitReferenceForm(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async updateReferenceStatus(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async downloadReferenceForm(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async getReadersByComplianceStatus(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }

  static async getComplianceTimeline(request, reply) {
    return reply.code(501).send({ success: false, message: 'Not yet implemented' });
  }
}

// ==============================================
// EXPORT CONTROLLER
// ==============================================
export default ReadersComplianceController;
