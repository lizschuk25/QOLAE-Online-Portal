// ==============================================
// COMPLIANCE REVIEW CONTROLLER
// ==============================================
// Agent: Sage
// Date: October 14, 2025
// Purpose: Complete compliance review and approval workflow for Liz
// Dependencies: Compliance Model, Reader Model, NotificationService, referenceCollection util
// ==============================================

import Compliance, { COMPLIANCE_STATUS, REFERENCE_STATUS } from '../models/Compliance.js';
import Reader, { READER_STATUS } from '../models/Reader.js';
import NotificationService from '../services/NotificationService.js';
import { executeQuery } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

// ==============================================
// COMPLIANCE REVIEW CONTROLLER CLASS
// ==============================================
class ComplianceReviewController {

  // ==============================================
  // GET PENDING COMPLIANCE LIST
  // ==============================================
  async getPendingComplianceList() {
    try {
      console.log('\n📋 === FETCHING PENDING COMPLIANCE LIST ===');

      const query = `
        SELECT
          rc.id,
          rc.reader_pin,
          rc.reader_name,
          rc.reader_type,
          rc.cv_filename,
          rc.cv_file_size,
          rc.cv_uploaded_at,
          rc.prof_ref_name,
          rc.prof_ref_status,
          rc.char_ref_name,
          rc.char_ref_status,
          rc.submitted_at,
          rc.approved,
          rc.reviewed_by,
          rc.approval_notes,
          EXTRACT(EPOCH FROM (NOW() - rc.submitted_at)) / 86400 as days_pending
        FROM reader_compliance rc
        WHERE rc.approved = false
        ORDER BY rc.submitted_at ASC
      `;

      const result = await executeQuery(query);

      const complianceList = result.rows.map(row => ({
        id: row.id,
        readerPin: row.reader_pin,
        readerName: row.reader_name,
        readerType: row.reader_type,
        submittedAt: row.submitted_at,
        daysPending: Math.floor(row.days_pending),
        professionalReferenceStatus: row.prof_ref_status,
        characterReferenceStatus: row.char_ref_status,
        professionalReferenceName: row.prof_ref_name,
        characterReferenceName: row.char_ref_name,
        cvAvailable: !!row.cv_filename,
        cvFilename: row.cv_filename,
        cvFileSize: row.cv_file_size,
        approved: row.approved,
        reviewedBy: row.reviewed_by,
        approvalNotes: row.approval_notes
      }));

      console.log(`✅ Found ${complianceList.length} pending compliance submissions`);

      return {
        success: true,
        count: complianceList.length,
        complianceList,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error fetching pending compliance list:', error);
      throw error;
    }
  }

  // ==============================================
  // GET COMPLIANCE DETAILS
  // ==============================================
  async getComplianceDetails(complianceId) {
    try {
      console.log(`\n🔍 === FETCHING COMPLIANCE DETAILS: ${complianceId} ===`);

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      // Get associated person details (reader or new starter)
      let personDetails = {};
      if (compliance.personType === 'reader') {
        const reader = await Reader.findById(compliance.personId);
        if (reader) {
          personDetails = reader.toJSON();
        }
      }

      // Get reference forms
      const referenceFormsQuery = `
        SELECT * FROM reference_forms
        WHERE compliance_id = $1
        ORDER BY created_at DESC
      `;
      const referenceForms = await executeQuery(referenceFormsQuery, [complianceId]);

      // Get access log
      const accessLogQuery = `
        SELECT * FROM compliance_access_log
        WHERE compliance_id = $1
        ORDER BY accessed_at DESC
        LIMIT 10
      `;
      const accessLog = await executeQuery(accessLogQuery, [complianceId]);

      console.log(`✅ Retrieved compliance details for ${compliance.personName}`);

      return {
        success: true,
        compliance: compliance.toJSON(),
        personDetails,
        referenceForms: referenceForms.rows,
        accessLog: accessLog.rows,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error fetching compliance details:', error);
      throw error;
    }
  }

  // ==============================================
  // CREATE PHONE REFERENCE
  // ==============================================
  async createPhoneReference({ complianceId, referenceType, refereeDetails, formData, filledBy }) {
    try {
      console.log('\n📞 === CREATING PHONE REFERENCE ===');
      console.log(`Compliance ID: ${complianceId}, Reference Type: ${referenceType}`);

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      // Insert reference form
      const insertQuery = `
        INSERT INTO reference_forms (
          reader_pin, compliance_id, reference_type, referee_name, referee_email, referee_phone,
          form_method, filled_by_cm, filled_at, form_data, form_status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *
      `;

      const reader = await Reader.findById(compliance.personId);

      const params = [
        reader.pin,
        complianceId,
        referenceType,
        refereeDetails.name,
        refereeDetails.email,
        refereeDetails.phone,
        'phone_call',
        filledBy,
        new Date(),
        JSON.stringify(formData),
        'signed', // Phone references are immediately signed
        new Date(),
        new Date()
      ];

      const result = await executeQuery(insertQuery, params);
      const referenceForm = result.rows[0];

      // Update reference status in compliance table
      await compliance.updateReferenceStatus(referenceType, REFERENCE_STATUS.RECEIVED);

      // Update compliance status if both references received
      if (compliance.professionalReferenceStatus === REFERENCE_STATUS.RECEIVED &&
          compliance.characterReferenceStatus === REFERENCE_STATUS.RECEIVED) {
        await compliance.updateStatus(COMPLIANCE_STATUS.IN_PROGRESS, filledBy, 'Both references received');
      }

      // Send notification
      await NotificationService.notifyReferenceReceived(
        compliance.personName,
        referenceType,
        complianceId
      );

      console.log(`✅ Phone reference created successfully`);

      return {
        success: true,
        message: 'Phone reference created successfully',
        referenceForm,
        compliance: compliance.toJSON()
      };

    } catch (error) {
      console.error('❌ Error creating phone reference:', error);
      throw error;
    }
  }

  // ==============================================
  // SEND REFERENCE REQUEST EMAIL
  // ==============================================
  async sendReferenceRequestEmail({ complianceId, referenceType, refereeEmail, refereeName }) {
    try {
      console.log('\n📧 === SENDING REFERENCE REQUEST EMAIL ===');
      console.log(`Compliance ID: ${complianceId}, Reference Type: ${referenceType}`);

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      const reader = await Reader.findById(compliance.personId);

      // Create draft reference form
      const insertQuery = `
        INSERT INTO reference_forms (
          reader_pin, compliance_id, reference_type, referee_name, referee_email, referee_phone,
          form_method, form_status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) RETURNING *
      `;

      const params = [
        reader.pin,
        complianceId,
        referenceType,
        refereeName,
        refereeEmail,
        '', // Phone to be filled by referee
        'email_self_filled',
        'sent_to_referee',
        new Date(),
        new Date()
      ];

      const result = await executeQuery(insertQuery, params);
      const referenceForm = result.rows[0];

      // Send email to referee
      const referenceUrl = `https://hrcompliance.qolae.com/reference-form/${referenceForm.id}`;

      await NotificationService.sendNotification({
        type: 'reference_request',
        channel: 'email',
        recipient: refereeEmail,
        title: `Reference Request for ${compliance.personName}`,
        message: `Dear ${refereeName}, you have been listed as a ${referenceType} reference for ${compliance.personName}. Please complete the reference form at your earliest convenience.`,
        data: {
          readerName: compliance.personName,
          referenceType,
          formUrl: referenceUrl
        }
      });

      // Update reference status
      await compliance.updateReferenceStatus(referenceType, REFERENCE_STATUS.IN_PROGRESS);

      console.log(`✅ Reference request email sent successfully`);

      return {
        success: true,
        message: 'Reference request email sent successfully',
        referenceForm,
        referenceUrl
      };

    } catch (error) {
      console.error('❌ Error sending reference request email:', error);
      throw error;
    }
  }

  // ==============================================
  // SAVE REFERENCE FORM
  // ==============================================
  async saveReferenceForm({ complianceId, referenceType, formData, signaturePath, filledBy }) {
    try {
      console.log('\n💾 === SAVING REFERENCE FORM ===');

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      // Find the reference form
      const findFormQuery = `
        SELECT * FROM reference_forms
        WHERE compliance_id = $1 AND reference_type = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const findResult = await executeQuery(findFormQuery, [complianceId, referenceType]);

      if (findResult.rows.length === 0) {
        return {
          success: false,
          error: 'Reference form not found'
        };
      }

      const referenceFormId = findResult.rows[0].id;

      // Update reference form with data and signature
      const updateQuery = `
        UPDATE reference_forms
        SET form_data = $1,
            signature_path = $2,
            signed_at = $3,
            form_status = $4,
            updated_at = $5
        WHERE id = $6
        RETURNING *
      `;

      const params = [
        JSON.stringify(formData),
        signaturePath,
        new Date(),
        'signed',
        new Date(),
        referenceFormId
      ];

      const updateResult = await executeQuery(updateQuery, params);
      const updatedForm = updateResult.rows[0];

      // Update reference status in compliance
      await compliance.updateReferenceStatus(referenceType, REFERENCE_STATUS.RECEIVED, signaturePath);

      // Check if both references are now received
      if (compliance.professionalReferenceStatus === REFERENCE_STATUS.RECEIVED &&
          compliance.characterReferenceStatus === REFERENCE_STATUS.RECEIVED) {
        await compliance.updateStatus(COMPLIANCE_STATUS.IN_PROGRESS, filledBy, 'Both references received, ready for final review');
      }

      console.log(`✅ Reference form saved successfully`);

      return {
        success: true,
        message: 'Reference form saved successfully',
        referenceForm: updatedForm,
        compliance: compliance.toJSON()
      };

    } catch (error) {
      console.error('❌ Error saving reference form:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE REFERENCE STATUS
  // ==============================================
  async updateReferenceStatus({ complianceId, referenceType, status, formPath }) {
    try {
      console.log('\n🔄 === UPDATING REFERENCE STATUS ===');
      console.log(`Compliance ID: ${complianceId}, Reference Type: ${referenceType}, Status: ${status}`);

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      await compliance.updateReferenceStatus(referenceType, status, formPath);

      console.log(`✅ Reference status updated successfully`);

      return {
        success: true,
        message: 'Reference status updated successfully',
        compliance: compliance.toJSON()
      };

    } catch (error) {
      console.error('❌ Error updating reference status:', error);
      throw error;
    }
  }

  // ==============================================
  // APPROVE COMPLIANCE
  // ==============================================
  async approveCompliance({ complianceId, approvalNotes, approvedBy }) {
    try {
      console.log('\n✅ === APPROVING COMPLIANCE ===');
      console.log(`Compliance ID: ${complianceId}`);

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      // Check if both references are received
      if (compliance.professionalReferenceStatus !== REFERENCE_STATUS.RECEIVED ||
          compliance.characterReferenceStatus !== REFERENCE_STATUS.RECEIVED) {
        return {
          success: false,
          error: 'Cannot approve compliance: Both references must be received'
        };
      }

      // Approve compliance
      await compliance.approve(approvedBy, approvalNotes);

      // Activate reader account if person_type is reader
      if (compliance.personType === 'reader') {
        const reader = await Reader.findById(compliance.personId);
        if (reader) {
          await reader.updateStatus(READER_STATUS.ACTIVE, approvedBy);
          await reader.updateComplianceStatus(true, true);

          // Send approval notification to reader
          await NotificationService.notifyComplianceApproved(
            reader.name,
            reader.email,
            'reader'
          );
        }
      }

      // Send WebSocket notification to Liz
      await NotificationService.sendNotification({
        type: 'compliance_approved',
        channel: 'websocket',
        recipient: 'liz',
        title: 'Compliance Approved',
        message: `${compliance.personName} compliance has been approved and account activated`,
        data: {
          complianceId,
          personName: compliance.personName
        }
      });

      console.log(`✅ Compliance approved successfully`);

      return {
        success: true,
        message: 'Compliance approved and account activated',
        compliance: compliance.toJSON()
      };

    } catch (error) {
      console.error('❌ Error approving compliance:', error);
      throw error;
    }
  }

  // ==============================================
  // REJECT COMPLIANCE
  // ==============================================
  async rejectCompliance({ complianceId, rejectionReason, rejectedBy }) {
    try {
      console.log('\n❌ === REJECTING COMPLIANCE ===');
      console.log(`Compliance ID: ${complianceId}`);

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      // Update compliance status to rejected
      await compliance.updateStatus(COMPLIANCE_STATUS.REJECTED, rejectedBy, rejectionReason);

      // Send rejection notification
      await NotificationService.sendNotification({
        type: 'compliance_rejected',
        channel: 'email',
        recipient: compliance.personEmail,
        title: 'Compliance Submission Update',
        message: `Dear ${compliance.personName}, your compliance submission requires additional information. Reason: ${rejectionReason}`,
        data: {
          complianceId,
          rejectionReason
        }
      });

      console.log(`✅ Compliance rejected successfully`);

      return {
        success: true,
        message: 'Compliance rejected and notification sent',
        compliance: compliance.toJSON()
      };

    } catch (error) {
      console.error('❌ Error rejecting compliance:', error);
      throw error;
    }
  }

  // ==============================================
  // GET COMPLIANCE STATISTICS
  // ==============================================
  async getComplianceStatistics() {
    try {
      console.log('\n📊 === FETCHING COMPLIANCE STATISTICS ===');

      const stats = await Compliance.getStatistics();

      // Additional statistics for references
      const referenceStatsQuery = `
        SELECT
          reference_type,
          form_status,
          COUNT(*) as count
        FROM reference_forms
        WHERE form_status IN ('draft', 'sent_to_referee', 'signed')
        GROUP BY reference_type, form_status
        ORDER BY reference_type, form_status
      `;

      const referenceStats = await executeQuery(referenceStatsQuery);

      console.log(`✅ Statistics retrieved successfully`);

      return {
        success: true,
        complianceStats: stats,
        referenceStats: referenceStats.rows,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error fetching compliance statistics:', error);
      throw error;
    }
  }

  // ==============================================
  // LOG COMPLIANCE ACCESS (GDPR AUDIT)
  // ==============================================
  async logComplianceAccess({ complianceId, accessType, accessNotes, accessedBy, ipAddress, userAgent }) {
    try {
      console.log('\n📝 === LOGGING COMPLIANCE ACCESS ===');
      console.log(`Compliance ID: ${complianceId}, Access Type: ${accessType}`);

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      const reader = await Reader.findById(compliance.personId);

      const insertQuery = `
        INSERT INTO compliance_access_log (
          reader_pin, compliance_id, accessed_by, access_type, accessed_at,
          ip_address, user_agent, access_notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `;

      const params = [
        reader ? reader.pin : null,
        complianceId,
        accessedBy,
        accessType,
        new Date(),
        ipAddress,
        userAgent,
        accessNotes
      ];

      const result = await executeQuery(insertQuery, params);

      console.log(`✅ Compliance access logged successfully`);

      return {
        success: true,
        message: 'Compliance access logged',
        accessLog: result.rows[0]
      };

    } catch (error) {
      console.error('❌ Error logging compliance access:', error);
      throw error;
    }
  }

  // ==============================================
  // DOWNLOAD CV
  // ==============================================
  async downloadCV({ complianceId, accessedBy, ipAddress }) {
    try {
      console.log('\n📄 === DOWNLOADING CV ===');
      console.log(`Compliance ID: ${complianceId}`);

      const compliance = await Compliance.findById(complianceId);

      if (!compliance) {
        return {
          success: false,
          error: 'Compliance record not found'
        };
      }

      if (!compliance.cvPath) {
        return {
          success: false,
          error: 'CV not available for this compliance record'
        };
      }

      // Log access
      await this.logComplianceAccess({
        complianceId,
        accessType: 'download_cv',
        accessNotes: 'CV downloaded for review',
        accessedBy,
        ipAddress,
        userAgent: 'server'
      });

      // Check if file exists
      try {
        await fs.access(compliance.cvPath);
      } catch (error) {
        return {
          success: false,
          error: 'CV file not found on server'
        };
      }

      console.log(`✅ CV ready for download`);

      return {
        success: true,
        filePath: compliance.cvPath,
        filename: path.basename(compliance.cvPath)
      };

    } catch (error) {
      console.error('❌ Error downloading CV:', error);
      throw error;
    }
  }

  // ==============================================
  // VIEW REFERENCE FORM
  // ==============================================
  async viewReferenceForm({ referenceId, accessedBy, ipAddress }) {
    try {
      console.log('\n📋 === VIEWING REFERENCE FORM ===');
      console.log(`Reference ID: ${referenceId}`);

      const query = `
        SELECT * FROM reference_forms
        WHERE id = $1
      `;

      const result = await executeQuery(query, [referenceId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Reference form not found'
        };
      }

      const referenceForm = result.rows[0];

      if (!referenceForm.signed_form_pdf_path) {
        return {
          success: false,
          error: 'Signed reference form not available yet'
        };
      }

      // Log access
      await this.logComplianceAccess({
        complianceId: referenceForm.compliance_id,
        accessType: 'view_reference',
        accessNotes: `${referenceForm.reference_type} reference form viewed`,
        accessedBy,
        ipAddress,
        userAgent: 'server'
      });

      // Check if file exists
      try {
        await fs.access(referenceForm.signed_form_pdf_path);
      } catch (error) {
        return {
          success: false,
          error: 'Reference form file not found on server'
        };
      }

      console.log(`✅ Reference form ready for viewing`);

      return {
        success: true,
        filePath: referenceForm.signed_form_pdf_path,
        filename: path.basename(referenceForm.signed_form_pdf_path)
      };

    } catch (error) {
      console.error('❌ Error viewing reference form:', error);
      throw error;
    }
  }
}

// ==============================================
// EXPORT SINGLETON INSTANCE
// ==============================================
const complianceReviewController = new ComplianceReviewController();
export default complianceReviewController;
