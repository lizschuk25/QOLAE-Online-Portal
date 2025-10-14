// ==============================================
// COMPLIANCE REVIEW ROUTES
// ==============================================
// Agent: Sage
// Date: October 14, 2025
// Purpose: Routes for Liz-only compliance review and approval workflow
// Dependencies: ComplianceReviewController, Compliance Model, Reader Model
// Framework: Fastify (ES6 Modules)
// ==============================================

import ComplianceReviewController from '../controllers/ComplianceReviewController.js';

// ==============================================
// FASTIFY ROUTE PLUGIN
// ==============================================

export default async function complianceReviewRoutes(server, options) {

  // ==============================================
  // LOCATION BLOCK 1: GET PENDING COMPLIANCE SUBMISSIONS
  // ==============================================
  // GET /api/compliance-review/pending
  // Description: Get all pending compliance submissions for Liz to review
  // Access: Liz-only
  // Returns: List of all pending submissions with compliance status
  server.get('/pending', async (request, reply) => {
    try {
      console.log('\n📋 === GET PENDING COMPLIANCE SUBMISSIONS ===');
      const result = await ComplianceReviewController.getPendingComplianceList();
      return reply.send(result);
    } catch (error) {
      console.error('❌ Error getting pending compliance:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve pending compliance submissions'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 2: GET SPECIFIC COMPLIANCE DETAILS
  // ==============================================
  // GET /api/compliance-review/:complianceId
  // Description: Get detailed compliance record for review
  // Access: Liz-only
  // Returns: Full compliance record with all documents and reference details
  server.get('/:complianceId', async (request, reply) => {
    try {
      const { complianceId } = request.params;
      console.log(`\n🔍 === GET COMPLIANCE DETAILS: ${complianceId} ===`);

      const result = await ComplianceReviewController.getComplianceDetails(complianceId);
      return reply.send(result);
    } catch (error) {
      console.error('❌ Error getting compliance details:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve compliance details'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 3: SEND REFERENCE REQUEST (PHONE)
  // ==============================================
  // POST /api/compliance-review/request-reference/phone
  // Description: Liz calls referee and fills out reference form
  // Access: Liz-only
  // Body: { complianceId, referenceType, refereeDetails, formData }
  server.post('/request-reference/phone', async (request, reply) => {
    try {
      console.log('\n📞 === PHONE REFERENCE REQUEST ===');
      const { complianceId, referenceType, refereeDetails, formData } = request.body;

      const result = await ComplianceReviewController.createPhoneReference({
        complianceId,
        referenceType,
        refereeDetails,
        formData,
        filledBy: 'liz'
      });

      return reply.send(result);
    } catch (error) {
      console.error('❌ Error creating phone reference:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create phone reference'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 4: SEND REFERENCE REQUEST (EMAIL)
  // ==============================================
  // POST /api/compliance-review/request-reference/email
  // Description: Send email to referee with self-fill reference form link
  // Access: Liz-only
  // Body: { complianceId, referenceType, refereeEmail }
  server.post('/request-reference/email', async (request, reply) => {
    try {
      console.log('\n📧 === EMAIL REFERENCE REQUEST ===');
      const { complianceId, referenceType, refereeEmail, refereeName } = request.body;

      const result = await ComplianceReviewController.sendReferenceRequestEmail({
        complianceId,
        referenceType,
        refereeEmail,
        refereeName
      });

      return reply.send(result);
    } catch (error) {
      console.error('❌ Error sending reference request email:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to send reference request email'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 5: SAVE REFERENCE FORM DATA
  // ==============================================
  // POST /api/compliance-review/save-reference
  // Description: Save reference form data (phone or email submission)
  // Access: Liz-only (phone) or Referee (email)
  // Body: { complianceId, referenceType, formData, signaturePath }
  server.post('/save-reference', async (request, reply) => {
    try {
      console.log('\n💾 === SAVE REFERENCE FORM DATA ===');
      const { complianceId, referenceType, formData, signaturePath, filledBy } = request.body;

      const result = await ComplianceReviewController.saveReferenceForm({
        complianceId,
        referenceType,
        formData,
        signaturePath,
        filledBy
      });

      return reply.send(result);
    } catch (error) {
      console.error('❌ Error saving reference form:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to save reference form'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 6: UPDATE REFERENCE STATUS
  // ==============================================
  // PATCH /api/compliance-review/reference-status
  // Description: Update status of reference (pending, in_progress, received, approved)
  // Access: Liz-only
  // Body: { complianceId, referenceType, status }
  server.patch('/reference-status', async (request, reply) => {
    try {
      console.log('\n🔄 === UPDATE REFERENCE STATUS ===');
      const { complianceId, referenceType, status, formPath } = request.body;

      const result = await ComplianceReviewController.updateReferenceStatus({
        complianceId,
        referenceType,
        status,
        formPath
      });

      return reply.send(result);
    } catch (error) {
      console.error('❌ Error updating reference status:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update reference status'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 7: APPROVE COMPLIANCE
  // ==============================================
  // POST /api/compliance-review/approve
  // Description: Final approval - activates reader/starter account
  // Access: Liz-only
  // Body: { complianceId, approvalNotes }
  server.post('/approve', async (request, reply) => {
    try {
      console.log('\n✅ === APPROVE COMPLIANCE ===');
      const { complianceId, approvalNotes } = request.body;

      const result = await ComplianceReviewController.approveCompliance({
        complianceId,
        approvalNotes,
        approvedBy: 'liz'
      });

      return reply.send(result);
    } catch (error) {
      console.error('❌ Error approving compliance:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to approve compliance'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 8: REJECT COMPLIANCE
  // ==============================================
  // POST /api/compliance-review/reject
  // Description: Reject compliance submission with reason
  // Access: Liz-only
  // Body: { complianceId, rejectionReason }
  server.post('/reject', async (request, reply) => {
    try {
      console.log('\n❌ === REJECT COMPLIANCE ===');
      const { complianceId, rejectionReason } = request.body;

      const result = await ComplianceReviewController.rejectCompliance({
        complianceId,
        rejectionReason,
        rejectedBy: 'liz'
      });

      return reply.send(result);
    } catch (error) {
      console.error('❌ Error rejecting compliance:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to reject compliance'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 9: GET COMPLIANCE STATISTICS
  // ==============================================
  // GET /api/compliance-review/statistics
  // Description: Get compliance review statistics (pending, approved, rejected counts)
  // Access: Liz-only
  // Returns: Statistics object with counts and trends
  server.get('/statistics', async (request, reply) => {
    try {
      console.log('\n📊 === GET COMPLIANCE STATISTICS ===');
      const result = await ComplianceReviewController.getComplianceStatistics();
      return reply.send(result);
    } catch (error) {
      console.error('❌ Error getting compliance statistics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve compliance statistics'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 10: LOG COMPLIANCE ACCESS (GDPR AUDIT)
  // ==============================================
  // POST /api/compliance-review/log-access
  // Description: Log when Liz accesses compliance documents (GDPR audit trail)
  // Access: Liz-only
  // Body: { complianceId, accessType, accessNotes }
  server.post('/log-access', async (request, reply) => {
    try {
      console.log('\n📝 === LOG COMPLIANCE ACCESS ===');
      const { complianceId, accessType, accessNotes } = request.body;

      const result = await ComplianceReviewController.logComplianceAccess({
        complianceId,
        accessType,
        accessNotes,
        accessedBy: 'liz',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return reply.send(result);
    } catch (error) {
      console.error('❌ Error logging compliance access:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to log compliance access'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 11: DOWNLOAD CV
  // ==============================================
  // GET /api/compliance-review/download-cv/:complianceId
  // Description: Secure download of reader's CV (logs access)
  // Access: Liz-only
  // Returns: CV PDF file
  server.get('/download-cv/:complianceId', async (request, reply) => {
    try {
      const { complianceId } = request.params;
      console.log(`\n📄 === DOWNLOAD CV: ${complianceId} ===`);

      const result = await ComplianceReviewController.downloadCV({
        complianceId,
        accessedBy: 'liz',
        ipAddress: request.ip
      });

      if (!result.success) {
        return reply.status(404).send(result);
      }

      // Send file as download
      return reply.sendFile(result.filename, result.filePath);

    } catch (error) {
      console.error('❌ Error downloading CV:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to download CV'
      });
    }
  });

  // ==============================================
  // LOCATION BLOCK 12: VIEW REFERENCE FORM
  // ==============================================
  // GET /api/compliance-review/view-reference/:referenceId
  // Description: View signed reference form (logs access)
  // Access: Liz-only
  // Returns: Reference form PDF in browser
  server.get('/view-reference/:referenceId', async (request, reply) => {
    try {
      const { referenceId } = request.params;
      console.log(`\n📋 === VIEW REFERENCE FORM: ${referenceId} ===`);

      const result = await ComplianceReviewController.viewReferenceForm({
        referenceId,
        accessedBy: 'liz',
        ipAddress: request.ip
      });

      if (!result.success) {
        return reply.status(404).send(result);
      }

      // Send file for viewing in browser
      return reply.sendFile(result.filePath);

    } catch (error) {
      console.error('❌ Error viewing reference form:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to view reference form'
      });
    }
  });

}

// ==============================================
// EXPORT FASTIFY PLUGIN
// ==============================================
