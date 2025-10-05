// ==============================================
// workflowRoutes.js - Workflow Progress Tracking Routes
// Organized by Location Block Pattern
// Handles: Workflow stage updates and progress tracking
// ==============================================

// ==============================================
// LOCATION BLOCK A: IMPORTS & DEPENDENCIES
// A.1: Core Dependencies
// A.2: Database Configuration
// ==============================================

// A.1: Core Dependencies
import { Pool } from 'pg';

// A.2: Database Configuration
// Initialize PostgreSQL connection pool for qolae_lawyers
const lawyersPool = new Pool({
  connectionString: process.env.LAWYERS_DATABASE_URL || process.env.DATABASE_URL,
});

// ==============================================
// LOCATION BLOCK B: HELPER FUNCTIONS
// (None needed for this simple route file)
// ==============================================

// ==============================================
// LOCATION BLOCK C: ROUTE DEFINITIONS
// C.1: Workflow Progress Endpoints
// ==============================================

export default async function workflowRoutes(server, options) {
  
  // ==============================================
  // C.1: WORKFLOW PROGRESS ENDPOINTS
  // ==============================================

  // 📊 Update Workflow Progress
  server.post('/api/workflow/progress', async (request, reply) => {
    try {
      const { pin, workflow, status } = request.body;

      if (!pin || !workflow || !status) {
        return reply.code(400).send({
          success: false,
          error: 'PIN, workflow, and status are required',
          hint: 'Expected format: { pin: "CC-001881", workflow: "tob", status: "completed" }'
        });
      }

      console.log(`📊 Updating workflow progress for PIN: ${pin}`);
      console.log(`📋 Workflow: ${workflow} - Status: ${status}`);

      // Determine workflow stage based on workflow and status
      let workflowStage = 'pending';
      
      if (workflow === 'tob' && status === 'completed') {
        workflowStage = 'tob_completed';
      } else if (workflow === 'payment' && status === 'completed') {
        workflowStage = 'payment_completed';
      } else if (workflow === 'consent' && status === 'completed') {
        workflowStage = 'consent_completed';
      } else if (workflow === 'referral' && status === 'completed') {
        workflowStage = 'referral_completed';
      } else {
        workflowStage = `${workflow}_${status}`;
      }

      // Update lawyer workflow stage
      const result = await lawyersPool.query(
        `UPDATE lawyers 
         SET workflow_stage = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE pin = $2
         RETURNING pin, workflow_stage, updated_at`,
        [workflowStage, pin]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Lawyer not found',
          pin: pin
        });
      }

      const lawyer = result.rows[0];

      console.log(`✅ Workflow progress updated for PIN: ${pin}`);
      console.log(`📊 New workflow stage: ${lawyer.workflow_stage}`);

      return reply.send({
        success: true,
        message: 'Workflow progress updated successfully',
        pin: lawyer.pin,
        workflow: workflow,
        status: status,
        workflow_stage: lawyer.workflow_stage,
        updated_at: lawyer.updated_at
      });

    } catch (error) {
      console.error('❌ Error updating workflow progress:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update workflow progress',
        details: error.message
      });
    }
  });

  // 📈 Get Workflow Status (Optional - for dashboard queries)
  server.get('/api/workflow/status/:pin', async (request, reply) => {
    try {
      const { pin } = request.params;

      console.log(`📈 Fetching workflow status for PIN: ${pin}`);

      // Get lawyer workflow information
      const result = await lawyersPool.query(
        `SELECT 
          pin,
          workflow_stage,
          tob_completed,
          tob_completed_at,
          tob_step_1_completed_at,
          tob_step_2_completed_at,
          tob_step_3_completed_at,
          email_preference,
          updated_at
         FROM lawyers
         WHERE pin = $1`,
        [pin]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Lawyer not found',
          pin: pin
        });
      }

      const lawyer = result.rows[0];

      console.log(`✅ Workflow status retrieved for PIN: ${pin}`);

      return reply.send({
        success: true,
        pin: lawyer.pin,
        workflow_stage: lawyer.workflow_stage,
        tob: {
          completed: lawyer.tob_completed,
          completed_at: lawyer.tob_completed_at,
          step_1_completed: !!lawyer.tob_step_1_completed_at,
          step_2_completed: !!lawyer.tob_step_2_completed_at,
          step_3_completed: !!lawyer.tob_step_3_completed_at,
          email_preference: lawyer.email_preference
        },
        updated_at: lawyer.updated_at
      });

    } catch (error) {
      console.error('❌ Error fetching workflow status:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch workflow status',
        details: error.message
      });
    }
  });

}