// ==============================================
// NEW STARTER ROUTES
// ==============================================
// Purpose: Route registration for new starter workflow
// Author: Atlas Agent
// Date: October 14, 2025
// Integration: Fastify plugin for HR Compliance Dashboard
// ==============================================

import NewStarterController from '../controllers/NewStarterController.js';

// ==============================================
// REGISTER NEW STARTER ROUTES (Fastify Plugin)
// ==============================================
export default async function newStarterRoutes(fastify, options) {

  // ==============================================
  // PUBLIC ROUTES (For New Starter Portal)
  // ==============================================

  /**
   * GET /api/new-starter/verify
   * Verify new starter PIN and retrieve basic info
   * Query params: pin
   */
  fastify.get('/api/new-starter/verify', {
    schema: {
      querystring: {
        type: 'object',
        required: ['pin'],
        properties: {
          pin: { type: 'string', pattern: '^NS-[A-Z]{2}\\d{6}$' }
        }
      }
    }
  }, NewStarterController.getNewStarterByPIN);

  /**
   * POST /api/new-starter/submit-compliance
   * Submit compliance documents from new starter portal
   * Body: { pin, addressLine1, addressLine2, city, postcode, ... }
   */
  fastify.post('/api/new-starter/submit-compliance', {
    schema: {
      body: {
        type: 'object',
        required: ['pin'],
        properties: {
          pin: { type: 'string' },
          addressLine1: { type: 'string' },
          addressLine2: { type: 'string' },
          city: { type: 'string' },
          postcode: { type: 'string' },
          emergencyContactName: { type: 'string' },
          emergencyContactPhone: { type: 'string' },
          emergencyContactRelationship: { type: 'string' },
          professionalReferenceName: { type: 'string' },
          professionalReferenceTitle: { type: 'string' },
          professionalReferenceOrganisation: { type: 'string' },
          professionalReferenceEmail: { type: 'string' },
          professionalReferencePhone: { type: 'string' },
          professionalReferenceRelationship: { type: 'string' },
          characterReferenceName: { type: 'string' },
          characterReferenceRelationship: { type: 'string' },
          characterReferenceEmail: { type: 'string' },
          characterReferencePhone: { type: 'string' },
          characterReferenceKnownDuration: { type: 'string' }
        }
      }
    }
  }, NewStarterController.submitCompliance);

  /**
   * GET /new-starter-compliance
   * Serve new starter compliance view
   * Query params: pin
   */
  fastify.get('/new-starter-compliance', async (request, reply) => {
    const { pin } = request.query;

    if (!pin) {
      return reply.code(400).send({
        success: false,
        error: 'PIN is required'
      });
    }

    return reply.view('newStarter-compliance.ejs', {
      pin: pin,
      portalTitle: 'QOLAE New Starter Compliance Portal',
      companyName: 'Quality of Life & Excellence Ltd',
      year: new Date().getFullYear()
    });
  });

  // ==============================================
  // PROTECTED ROUTES (For HR Dashboard - Liz Only)
  // ==============================================

  /**
   * POST /api/new-starter/create
   * Create new starter record and send invitation
   * Body: { firstName, lastName, email, phone, role, department, startDate }
   */
  fastify.post('/api/new-starter/create', {
    schema: {
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'role'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string' },
          department: { type: 'string' },
          startDate: { type: 'string' },
          createdBy: { type: 'string' }
        }
      }
    }
  }, NewStarterController.createNewStarter);

  /**
   * GET /api/new-starter/all
   * Get all new starters with compliance status
   */
  fastify.get('/api/new-starter/all', NewStarterController.getAllNewStarters);

  /**
   * POST /api/new-starter/approve
   * Approve new starter compliance (Liz only)
   * Body: { pin, approvedBy, notes, workspaceAccess[] }
   */
  fastify.post('/api/new-starter/approve', {
    schema: {
      body: {
        type: 'object',
        required: ['pin'],
        properties: {
          pin: { type: 'string' },
          approvedBy: { type: 'string' },
          notes: { type: 'string' },
          workspaceAccess: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  }, NewStarterController.approveCompliance);

  /**
   * POST /api/new-starter/send-reminder
   * Send reminder email to new starter
   * Body: { pin }
   */
  fastify.post('/api/new-starter/send-reminder', {
    schema: {
      body: {
        type: 'object',
        required: ['pin'],
        properties: {
          pin: { type: 'string' }
        }
      }
    }
  }, NewStarterController.sendReminder);

  // ==============================================
  // HEALTH CHECK FOR NEW STARTER ROUTES
  // ==============================================
  fastify.get('/api/new-starter/health', async (request, reply) => {
    return {
      success: true,
      service: 'new-starter-routes',
      status: 'operational',
      timestamp: new Date().toISOString(),
      routes: {
        public: [
          'GET /api/new-starter/verify',
          'POST /api/new-starter/submit-compliance',
          'GET /new-starter-compliance'
        ],
        protected: [
          'POST /api/new-starter/create',
          'GET /api/new-starter/all',
          'POST /api/new-starter/approve',
          'POST /api/new-starter/send-reminder'
        ]
      }
    };
  });

  console.log(' New Starter routes registered successfully');
}
