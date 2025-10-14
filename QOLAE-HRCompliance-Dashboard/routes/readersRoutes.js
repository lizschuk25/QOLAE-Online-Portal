// ==============================================
// READERS REGISTRATION ROUTES
// ==============================================
// Purpose: Routes for reader registration workflow
// Mirrors Admin workflow with NDA generation
// Date: October 14, 2025
// ==============================================

import ReadersController from '../controllers/ReadersController.js';

export default async function readersRoutes(fastify, options) {

  // ==============================================
  // LOCATION BLOCK 1: PIN GENERATION
  // ==============================================

  fastify.post('/api/readers/generate-pin', ReadersController.generateReaderPIN);

  // ==============================================
  // LOCATION BLOCK 2: MEDICAL VERIFICATION (MOCK)
  // ==============================================

  fastify.post('/api/readers/verify-medical-registration', ReadersController.verifyMedicalRegistration);

  // ==============================================
  // LOCATION BLOCK 3: NDA GENERATION
  // ==============================================

  fastify.post('/api/readers/generate-nda', ReadersController.generateCustomizedNDA);

  // ==============================================
  // LOCATION BLOCK 4: EMAIL PREVIEW
  // ==============================================

  fastify.post('/api/readers/preview-email', ReadersController.previewEmailWithNDA);

  // ==============================================
  // LOCATION BLOCK 5: SEND EMAIL & COMPLETE REGISTRATION
  // ==============================================

  fastify.post('/api/readers/send-invitation', ReadersController.sendReaderInvitation);

  // ==============================================
  // LOCATION BLOCK 6: READER MANAGEMENT
  // ==============================================

  fastify.get('/api/readers/pending', ReadersController.getPendingReaders);
  fastify.get('/api/readers/approved', ReadersController.getApprovedReaders);
  fastify.get('/api/readers/all', ReadersController.getAllReaders);

  // ==============================================
  // LOCATION BLOCK 7: HEALTH CHECK
  // ==============================================

  fastify.get('/api/readers/health', async (request, reply) => {
    return {
      success: true,
      status: 'healthy',
      service: 'Readers Registration Routes',
      timestamp: new Date().toISOString()
    };
  });

  console.log(' Readers Registration routes registered successfully');
}
