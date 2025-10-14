// ==============================================
// READERS COMPLIANCE ROUTES
// ==============================================
// Purpose: Routes for readers compliance workflow
// Agent: Iris
// Date: October 14, 2025
// Integration: Fastify plugin for HR Compliance Dashboard
// ==============================================

import ReadersComplianceController from '../controllers/ReadersComplianceController.js';

export default async function readersComplianceRoutes(fastify, options) {

  // ==============================================
  // LOCATION BLOCK 1: COMPLIANCE SUBMISSION ROUTES
  // ==============================================

  fastify.post('/api/readers/submit-compliance', ReadersComplianceController.submitCompliance);
  fastify.get('/api/readers/compliance-status/:readerPin', ReadersComplianceController.getComplianceStatus);
  fastify.put('/api/readers/update-compliance/:readerPin', ReadersComplianceController.updateCompliance);

  // ==============================================
  // LOCATION BLOCK 2: REFERENCE SUBMISSION ROUTES
  // ==============================================

  fastify.post('/api/readers/submit-professional-reference', ReadersComplianceController.submitProfessionalReference);
  fastify.post('/api/readers/submit-character-reference', ReadersComplianceController.submitCharacterReference);
  fastify.get('/api/readers/reference-details/:readerPin', ReadersComplianceController.getReferenceDetails);

  // ==============================================
  // LOCATION BLOCK 3: COMPLIANCE REVIEW ROUTES
  // ==============================================

  fastify.get('/api/compliance/pending', ReadersComplianceController.getPendingCompliance);
  fastify.get('/api/compliance/details/:complianceId', ReadersComplianceController.getComplianceDetails);
  fastify.put('/api/compliance/update-status/:complianceId', ReadersComplianceController.updateComplianceStatus);
  fastify.post('/api/compliance/approve/:complianceId', ReadersComplianceController.approveCompliance);
  fastify.post('/api/compliance/reject/:complianceId', ReadersComplianceController.rejectCompliance);

  // ==============================================
  // LOCATION BLOCK 4: REFERENCE FORM ROUTES
  // ==============================================

  fastify.get('/api/compliance/reference-form/:complianceId/:referenceType', ReadersComplianceController.getReferenceForm);
  fastify.post('/api/compliance/submit-reference-form', ReadersComplianceController.submitReferenceForm);
  fastify.put('/api/compliance/reference-status/:complianceId', ReadersComplianceController.updateReferenceStatus);

  // ==============================================
  // LOCATION BLOCK 5: DOCUMENT ACCESS ROUTES
  // ==============================================

  fastify.get('/api/compliance/download-cv/:readerPin', ReadersComplianceController.downloadCV);
  fastify.get('/api/compliance/view-cv/:readerPin', ReadersComplianceController.viewCV);
  fastify.get('/api/compliance/download-reference/:referenceId', ReadersComplianceController.downloadReferenceForm);

  // ==============================================
  // LOCATION BLOCK 6: STATISTICS & REPORTING ROUTES
  // ==============================================

  fastify.get('/api/compliance/statistics', ReadersComplianceController.getComplianceStatistics);
  fastify.get('/api/compliance/readers-by-status', ReadersComplianceController.getReadersByComplianceStatus);
  fastify.get('/api/compliance/timeline/:readerPin', ReadersComplianceController.getComplianceTimeline);

  // ==============================================
  // LOCATION BLOCK 7: AUDIT LOG ROUTES
  // ==============================================

  fastify.post('/api/compliance/log-access', ReadersComplianceController.logComplianceAccess);
  fastify.get('/api/compliance/access-logs/:readerPin', ReadersComplianceController.getAccessLogs);

  // ==============================================
  // LOCATION BLOCK 8: VIEW ROUTE
  // ==============================================

  fastify.get('/readers-compliance', async (request, reply) => {
    const { readerPin } = request.query;
    if (!readerPin) {
      return reply.code(400).send({ success: false, error: 'Reader PIN required' });
    }
    return reply.view('readers-compliance.ejs', {
      readerPin,
      portalTitle: 'QOLAE Readers Compliance Portal',
      companyName: 'Quality of Life & Excellence Ltd',
      year: new Date().getFullYear()
    });
  });

  // ==============================================
  // LOCATION BLOCK 9: HEALTH CHECK
  // ==============================================

  fastify.get('/api/readers-compliance/health', async (request, reply) => {
    return {
      success: true,
      status: 'healthy',
      service: 'Readers Compliance Routes',
      timestamp: new Date().toISOString()
    };
  });

  console.log(' Readers Compliance routes registered successfully');
}
