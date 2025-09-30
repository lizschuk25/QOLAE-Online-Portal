// /var/www/api.qolae.com/routes/workspaceRoute.js
export default async function workspaceRoute(fastify) {
  // NOTE: this file is registered with prefix '/workspace'
    fastify.get('/bootstrap', async (req, reply) => {
      // Accept JWT token from Authorization header only
      const authHeader = req.headers.authorization;
      const t = authHeader && authHeader.split(' ')[1];
      if (!t) return reply.code(401).send({ valid:false });
  
      let u;
      try { u = fastify.jwt.verify(t); } catch { return reply.code(401).send({ valid:false }); }

      // Get dynamic data from database (same as WebSocket version)
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.LAWYERS_DATABASE_URL
        });
        
        const result = await pool.query('SELECT * FROM lawyers WHERE pin = $1', [u.pin]);
        
        console.log(`🔍 Database query for PIN ${u.pin}:`, {
          rowsFound: result.rows.length,
          pin: u.pin,
          email: u.email
        });
        
        if (result.rows.length === 0) {
          console.error(`❌ Lawyer not found for PIN: ${u.pin} in qolae_lawyers database`);
          return reply.code(404).send({ 
            valid: false, 
            error: `Lawyer with PIN ${u.pin} not found in qolae_lawyers database` 
          });
        }
        
        const lawyer = result.rows[0];
        
        // Determine workflow completion status based on database fields
        const tobCompleted = lawyer.workflow_stage >= 2;
        const paymentCompleted = lawyer.workflow_stage >= 3;
        const consentCompleted = lawyer.workflow_stage >= 4;
        
        const gates = {
          tob: { 
            completed: tobCompleted, 
            next: tobCompleted ? null : '/tobModal'
          },
          payment: { 
            completed: paymentCompleted, 
            next: paymentCompleted ? null : '/paymentModal' 
          },
          consent: { 
            completed: consentCompleted,
            next: consentCompleted ? null : '/consentModal'
          },
          referral: { completed: false },
          uploads: { completed: false }
        };
        
        const features = { 
          consentForms: true, 
          referrals: false, 
          uploads: false 
        };
        
        const links = {
          consentCreate: '/consent-forms',
          consentHistory: '',
          referralNew: '/referral-forms',
          referralActive: '/referral-forms/active',
          uploadsNew: '/document-uploads',
          library: '/document-uploads'
        };

        // Debug: log what's available in the JWT token
        console.log('[SSOT] JWT user data:', {
          email: u.email,
          pin: u.pin,
          contactName: u.contactName,
          lawFirm: u.lawFirm,
          workflow_stage: lawyer.workflow_stage,
          allFields: Object.keys(u)
        });

        await pool.end();

        return reply.send({
          valid: true,
          user: {
            contactName: u.contactName || 'Lawyer',
            pin: u.pin,
            lawFirm: u.lawFirm || 'Your Law Firm',
            email: u.email
          },
          gates, 
          features, 
          links
        });
        
      } catch (error) {
        console.error('❌ Bootstrap database error:', error.message);
        return reply.code(500).send({ 
          valid: false, 
          error: 'Database error occurred' 
        });
      }
    });

  // Workspace Health Check
  fastify.get('/health', async (req, reply) => {
    return reply.send({
      status: 'healthy',
      service: 'QOLAE Workspace Bootstrap',
      timestamp: new Date().toISOString(),
      endpoints: [
        '/workspace/bootstrap',
        '/workspace/health'
      ]
    });
  });
}
  