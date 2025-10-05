// ==============================================
// LAWYERSDASHBOARD SERVER.JS - COMPLETE VERSION
// Organized by Location Block Workflow Pattern
// Includes ALL endpoints and functionality
// ==============================================

// ==============================================
// LOCATION BLOCK A: IMPORTS & CONFIGURATION
// Core Dependencies, ES6 Setup, Environment Variables
// ==============================================

import fastify from 'fastify';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configure base URL for server-to-server calls to SSOT
const SSOT_BASE_URL = process.env.SSOT_BASE_URL || 'https://api.qolae.com';


// ==============================================
// LOCATION BLOCK B: SERVER & DATABASE SETUP
// Fastify Server Initialization, PostgreSQL Pool Configuration
// ==============================================

// Initialize Fastify server with logger
const server = fastify({ logger: true });

// PostgreSQL Pool Configuration
// LAWYERS DATABASE: qolae_lawyers (Local lawyers portal data)
const pool = new Pool({ 
  connectionString: process.env.LAWYERS_DATABASE_URL || 
    'postgresql://lawyers_user:lawyers_password@localhost:5432/qolae_lawyers'
});

// Make pool available to routes
server.decorate('db', pool);


// ==============================================
// LOCATION BLOCK C: MIDDLEWARE & PLUGINS
// CORS, Cache-Busting, JWT, View Engine, Static Files, GDPR
// ==============================================

// CORS Configuration
server.register(await import('@fastify/cors'), {
  origin: [
    'https://admin.qolae.com',
    'https://api.qolae.com', 
    'https://lawyers.qolae.com',
    'https://clients.qolae.com',
    'https://casemanagers.qolae.com',
    'https://readers.qolae.com',
  ],
  methods: ['GET', 'POST'],
  credentials: true
});

// Cache-Busting Middleware - Prevent stale content
server.addHook('onRequest', async (request, reply) => {
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  reply.header('Last-Modified', new Date().toUTCString());
  reply.header('ETag', `"${Date.now()}"`);
});

// Form body parser
server.register(await import('@fastify/formbody'));

// JWT plugin registration for bootstrap endpoint
server.register(await import('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'fallback-secret'
});

// Serve static files from public directory
server.register(await import('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/',
});

// EJS View Engine Configuration
server.register(await import('@fastify/view'), {
  engine: {
    ejs: (await import('ejs')).default
  },
  root: path.join(__dirname, 'views'),
  options: {
    cache: false,
    'view cache': false
  }
});

// Register GDPR middleware
server.register(await import('./middleware/gdprConsent.js'));


// ==============================================
// LOCATION BLOCK D: HELPER FUNCTIONS
// SSOT Verification, Database Sync
// ==============================================

// Helper function to verify credentials with SSOT
async function verifyWithSSOT(email, password, pin) {
  try {
    const response = await fetch(`${SSOT_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, pin })
    });

    if (!response.ok) {
      return { success: false, error: 'SSOT verification failed' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('❌ SSOT verification error:', error);
    return { success: false, error: 'Failed to connect to authentication service' };
  }
}

// Helper function to sync lawyer data from qolae_admin to qolae_lawyers
async function syncLawyerFromAdminDB(pin) {
  try {
    // Fetch from qolae_admin (marketing DB)
    const adminDbPool = new Pool({
      connectionString: process.env.DATABASE_URL // qolae_admin connection
    });

    const adminResult = await adminDbPool.query(
      'SELECT pin, "contactName", "lawFirm", email, phone FROM "Lawyer" WHERE pin = $1',
      [pin]
    );

    await adminDbPool.end();

    if (adminResult.rows.length === 0) {
      return null;
    }

    const adminLawyer = adminResult.rows[0];

    // Check if exists in qolae_lawyers
    const localResult = await pool.query(
      'SELECT pin FROM lawyers WHERE pin = $1',
      [pin]
    );

    if (localResult.rows.length === 0) {
      // Insert new lawyer into qolae_lawyers
      await pool.query(
        `INSERT INTO lawyers (pin, contact_name, law_firm, email, workflow_stage, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [adminLawyer.pin, adminLawyer.contactName, adminLawyer.lawFirm, adminLawyer.email]
      );
      console.log(`✅ Synced new lawyer ${pin} from qolae_admin to qolae_lawyers`);
    }

    return adminLawyer;
  } catch (error) {
    console.error('❌ Database sync error:', error);
    return null;
  }
}


// ==============================================
// LOCATION BLOCK 1: AUTHENTICATION & ROUTING
// Root, Health Check, Authentication Routes
// ==============================================

// Root endpoint - redirect to workspace entry point
server.get('/', async (request, reply) => {
  return reply.redirect('/LawyersDashboard');
});

// SSOT health endpoint
server.get('/health/ssot', (req, reply) => {
  reply.send({
    role: 'frontend',
    authDecision: 'delegated to /auth/gate',
    bootstrap: '/workspace/bootstrap',
    localAuthLogic: 'none'
  });
});

// Authentication check - redirect to dashboard if no valid token
server.get('/auth', async (request, reply) => {
  return reply.redirect('/LawyersDashboard');
}); 

// Dashboard redirect route - simplified for SSOT
server.get('/dashboard', async (request, reply) => {
  // SSOT handles authentication - just redirect to workspace entry
  return reply.redirect('/LawyersDashboard');
});


// ==============================================
// LOCATION BLOCK 2: SECURE LOGIN ENDPOINTS
// Secure Login Page, Secure Login API, Future Login
// ==============================================

// Secure login page - replaces direct dashboard access
server.get('/secure-login', async (req, reply) => {
  const { verified, pin } = req.query;
  
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  
  return reply.view('secure-login.ejs', {
    title: 'Secure Login - QOLAE Lawyers Portal',
    verified: verified || false,
    pin: pin || ''
  });
});

// Secure login API endpoint
server.post('/lawyers-dashboard/api/secure-login', async (request, reply) => {
  const { email, password, pin } = request.body;
  
  if (!email || !password || !pin) {
    return reply.status(400).send({
      success: false,
      error: 'Email, password, and PIN are required'
    });
  }

  try {
    console.log(`🔐 Secure login attempt for PIN: ${pin}`);

    // Verify credentials with SSOT
    const ssotVerification = await verifyWithSSOT(email, password, pin);
    
    if (!ssotVerification.success) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if lawyer exists in qolae_lawyers
    const result = await pool.query(
      'SELECT pin, contact_name, law_firm, workflow_stage FROM lawyers WHERE pin = $1',
      [pin]
    );

    let lawyer;

    if (result.rows.length === 0) {
      // Sync from qolae_admin
      const syncedLawyer = await syncLawyerFromAdminDB(pin);
      
      if (!syncedLawyer) {
        return reply.status(404).send({
          success: false,
          error: 'Lawyer not found in system'
        });
      }

      lawyer = {
        pin: syncedLawyer.pin,
        contact_name: syncedLawyer.contactName,
        law_firm: syncedLawyer.lawFirm,
        workflow_stage: 1
      };
    } else {
      lawyer = result.rows[0];
    }

    // Get stored JWT token from SSOT
    const tokenResponse = await fetch(`${SSOT_BASE_URL}/auth/store-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pin: lawyer.pin,
        tempToken: ssotVerification.data?.token
      })
    });

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      if (tokenData.success && tokenData.token) {
        console.log('✅ SSOT token available for bootstrap access');
      } else {
        console.log('⚠ SSOT token not available');
      }
    } else {
      console.log('⚠ SSOT token request failed');
    }

    reply.send({
      success: true,
      message: 'Login successful',
      redirect: `/LawyersDashboard?pin=${lawyer.pin}`,
      lawyer: {
        pin: lawyer.pin,
        name: lawyer.contact_name,
        firm: lawyer.law_firm,
        workflow_stage: lawyer.workflow_stage
      }
    });

  } catch (error) {
    console.error('❌ Secure login error:', error);
    reply.status(500).send({
      success: false,
      error: 'Internal server error during login'
    });
  }
});

// Future login route for existing lawyers
server.get('/lawyers-login', async (req, reply) => {
  const { pin, email } = req.query;
  
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  
  return reply.view('lawyers-login.ejs', {
    title: 'Lawyers Login - QOLAE Portal',
    pin: pin || '',
    email: email || ''
  });
});

// Future login API endpoint (PIN + Email + Password + 2FA)
server.post('/lawyers-dashboard/api/lawyers-login', async (request, reply) => {
  const { email, password, pin } = request.body;
  
  if (!email || !password || !pin) {
    return reply.status(400).send({
      success: false,
      error: 'Email, password, and PIN are required'
    });
  }
  
  try {
    console.log(`🔐 Future login attempt for PIN: ${pin}, Email: ${email}`);
    
    // Check if lawyer exists with password
    const existingLawyer = await pool.query(
      'SELECT pin, email, password_hash FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    if (existingLawyer.rows.length === 0 || !existingLawyer.rows[0].password_hash) {
      return reply.status(401).send({
        success: false,
        error: 'Lawyer not found or no password set. Please use secure login for first-time setup.'
      });
    }
    
    // Verify password
    const ssotVerification = await verifyWithSSOT(email, password, pin);
    
    if (!ssotVerification.success) {
      return reply.status(401).send({
        success: false,
        error: ssotVerification.error || 'Invalid credentials'
      });
    }

    // Get qolae_token from SSOT for bootstrap access
    const tokenResponse = await fetch(`${SSOT_BASE_URL}/auth/request-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        pin, 
        password,
        source: 'lawyers-dashboard-login',
        skipTwoFactor: false
      })
    });
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      if (tokenData.success && tokenData.token) {
        console.log('✅ SSOT token available for future login');
      }
    }
    
    reply.send({
      success: true,
      message: 'Login successful - redirecting to 2FA',
      redirectTo: `/lawyers-2fa?pin=${pin}&email=${email}&verified=true`
    });
    
  } catch (error) {
    console.error('❌ Future login error:', error);
    reply.status(500).send({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});


// ==============================================
// LOCATION BLOCK 3: MAIN DASHBOARD ROUTE
// LawyersDashboard EJS Rendering
// ==============================================

// Dashboard route (3002) — render EJS; client-side Bootstrap handles auth + data
server.get('/LawyersDashboard', async (req, reply) => {
  // Force no caching
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  
  // Extract PIN from URL parameters
  const { pin } = req.query;
  
  if (!pin) {
    return reply.view('lawyers-dashboard.ejs', {
      title: 'QOLAE Lawyers Dashboard',
      contactName: 'Lawyer',
      lawFirm: '',
      pin: '',
      ssotBaseUrl: SSOT_BASE_URL
    });
  }
  
  try {
    console.log(`🔍 Dashboard route called with PIN: ${pin}`);
    
    // Fetch lawyer data from qolae_lawyers database using PIN
    const result = await pool.query(
      'SELECT pin, contact_name, law_firm, email, workflow_stage FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    console.log(`📊 Database query result:`, result.rows.length, 'rows found');
    
    if (result.rows.length > 0) {
      const lawyer = result.rows[0];
      console.log(`✅ Dashboard loading for ${lawyer.contact_name} (${pin})`);
      
      return reply.view('lawyers-dashboard.ejs', {
        title: 'QOLAE Lawyers Dashboard',
        contactName: lawyer.contact_name || 'Lawyer',
        lawFirm: lawyer.law_firm || 'Law Firm',
        pin: pin,
        email: lawyer.email || '',
        workflowStage: lawyer.workflow_stage || 1,
        ssotBaseUrl: SSOT_BASE_URL
      });
    } else {
      console.log(`❌ PIN ${pin} not found in qolae_lawyers database`);
      return reply.view('lawyers-dashboard.ejs', {
        title: 'QOLAE Lawyers Dashboard',
        contactName: 'Lawyer',
        lawFirm: 'Law Firm',
        pin: pin,
        lawyerData: null,
        lawyerName: 'Lawyer',
        ssotBaseUrl: SSOT_BASE_URL
      });
    }
  } catch (error) {
    console.error('❌ Dashboard route error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Server error loading dashboard'
    });
  }
});


// ==============================================
// LOCATION BLOCK 4: BOOTSTRAP API ENDPOINT
// Client-side Bootstrap Data Retrieval with JWT
// ==============================================

// Bootstrap API endpoint - Lawyers Dashboard calls SSOT with stored JWT tokens
server.get('/lawyers-dashboard/api/bootstrap', async (request, reply) => {
  const { pin } = request.query;
  
  if (!pin) {
    return reply.status(400).send({ error: 'PIN required' });
  }
  
  try {
    // Get stored JWT token from SSOT
    const tokenResponse = await fetch(`${SSOT_BASE_URL}/auth/get-stored-token?pin=${pin}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!tokenResponse.ok) {
      return reply.status(401).send({ error: 'No valid JWT token found' });
    }
    
    const tokenData = await tokenResponse.json();
    const { accessToken } = tokenData;
    
    // Call SSOT bootstrap endpoint with stored JWT token
    const bootstrapResponse = await fetch(`${SSOT_BASE_URL}/workspace/bootstrap`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (bootstrapResponse.ok) {
      const bootstrapData = await bootstrapResponse.json();
      return reply.send(bootstrapData);
    } else {
      console.error('❌ SSOT bootstrap failed:', bootstrapResponse.status);
      return reply.status(bootstrapResponse.status).send({ error: 'Bootstrap failed' });
    }
    
  } catch (error) {
    console.error('❌ Bootstrap API error:', error);
    return reply.status(500).send({ error: 'Bootstrap failed' });
  }
});


// ==============================================
// LOCATION BLOCK 5: LAWYER DATA API ENDPOINTS
// Fetch Lawyer Profile Data, Status, and Workflow Stage
// ==============================================

// Get full lawyer data by PIN (for dashboard bootstrap)
server.get('/lawyers-dashboard/api/lawyer/:pin', async (request, reply) => {
  const { pin } = request.params;
  
  if (!pin) {
    return reply.status(400).send({
      success: false,
      error: 'PIN is required'
    });
  }
  
  try {
    const result = await pool.query(
      'SELECT pin, contact_name, email, law_firm, workflow_stage, created_at, updated_at FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    if (result.rows.length === 0) {
      return reply.status(404).send({
        success: false,
        error: 'Lawyer not found'
      });
    }
    
    const lawyer = result.rows[0];
    
    reply.send({
      success: true,
      pin: lawyer.pin,
      contact_name: lawyer.contact_name,
      email: lawyer.email,
      law_firm: lawyer.law_firm,
      workflow_stage: lawyer.workflow_stage,
      created_at: lawyer.created_at,
      updated_at: lawyer.updated_at
    });
    
  } catch (error) {
    console.error('❌ Error fetching lawyer data:', error);
    reply.status(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get lawyer workflow status by PIN
server.get('/lawyers-dashboard/api/:pin/status', async (request, reply) => {
  const { pin } = request.params;
  
  if (!pin) {
    return reply.status(400).send({
      success: false,
      error: 'PIN is required'
    });
  }
  
  try {
    const result = await pool.query(
      'SELECT pin, workflow_stage, created_at, updated_at FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    if (result.rows.length === 0) {
      return reply.status(404).send({
        success: false,
        error: 'Lawyer not found'
      });
    }
    
    const lawyer = result.rows[0];
    
    reply.send({
      success: true,
      data: {
        pin: lawyer.pin,
        workflow_stage: lawyer.workflow_stage,
        tob_completed: lawyer.workflow_stage >= 2,
        created_at: lawyer.created_at,
        updated_at: lawyer.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ Database error fetching lawyer status:', error);
    reply.status(500).send({
      success: false,
      error: 'Database error occurred'
    });
  }
});


// ==============================================
// LOCATION BLOCK 6: TOB WORKFLOW ENDPOINTS
// Update Workflow Step, Complete TOB
// ==============================================

// Update lawyer workflow status after specific step completion
server.post('/lawyers-dashboard/api/update-workflow-step', async (request, reply) => {
  const { pin, step, stepData } = request.body;
  
  if (!pin || !step) {
    return reply.status(400).send({
      success: false,
      error: 'PIN and step are required'
    });
  }
  
  try {
    console.log(`📊 DATABASE: Updating workflow step ${step} for PIN ${pin}`);
    
    // Update workflow stage to completed (stage 2)
    const updateResult = await pool.query(
      `UPDATE lawyers 
       SET workflow_stage = 2, 
           updated_at = CURRENT_TIMESTAMP
       WHERE pin = $1
       RETURNING pin, workflow_stage, updated_at`,
      [pin]
    );
    
    if (updateResult.rows.length === 0) {
      return reply.status(404).send({
        success: false,
        error: 'Lawyer not found with provided PIN'
      });
    }
    
    const updatedLawyer = updateResult.rows[0];
    
    console.log(`✅ TOB completed for lawyer ${pin}:`, {
      workflow_stage: updatedLawyer.workflow_stage,
      updated_at: updatedLawyer.updated_at
    });
    
    reply.send({
      success: true,
      message: 'TOB completion status updated successfully',
      data: {
        pin: updatedLawyer.pin,
        workflow_stage: updatedLawyer.workflow_stage,
        updated_at: updatedLawyer.updated_at
      }
    });
    
    console.log(`🔌 Should trigger WebSocket broadcast for PIN ${pin}`);
    
  } catch (error) {
    console.error('❌ Database error updating TOB completion:', error);
    reply.status(500).send({
      success: false,
      error: 'Database error occurred'
    });
  }
});


// ==============================================
// LOCATION BLOCK 7: WORKFLOW MODAL ROUTES
// TOB Modal, Payment Modal, Consent Modal, Referral Modal, Document Upload Modal
// ==============================================

// TOB Modal route
server.get('/tobModal', async (req, reply) => {
  return reply.view('tobModal.ejs', {
    title: 'Terms of Business - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});

// Payment Modal route
server.get('/paymentModal', async (req, reply) => {
  return reply.view('paymentModal.ejs', {
    title: 'Complete Payment - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});

// Consent Modal route
server.get('/consentModal', async (req, reply) => {
  return reply.view('consentModal.ejs', {
    title: 'Consent Forms - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});

// Referral Modal route
server.get('/referralModal', async (req, reply) => {
  return reply.view('referralModal.ejs', {
    title: 'Case Referrals & Instructions - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});

// Document Upload Modal route
server.get('/documentUploadModal', async (req, reply) => {
  return reply.view('documentUploadModal.ejs', {
    title: 'Document Uploads - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});

// Support Modal route
server.get('/supportModal', async (req, reply) => {
  return reply.view('supportModal.ejs', {
    title: 'Support - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});

// Consent Forms Section - Internal Workspace Route 
server.get('/consent-forms', async (request, reply) => {
  return reply.view('consent-forms.ejs', {
    title: 'Consent Forms - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});

// Referral Forms Section - Internal Workspace Route
server.get('/referral-forms', async (request, reply) => {
  return reply.view('referral-forms.ejs', {
    title: 'Referral Forms - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});

// Document Uploads Section - Internal Workspace Route
server.get('/document-uploads', async (request, reply) => {
  return reply.view('document-forms.ejs', {
    title: 'Document Uploads - QOLAE Lawyers Dashboard',
    user: {},
    lawFirm: 'Your Law Firm'
  });
});


// ==============================================
// LOCATION BLOCK 8: LOGOUT ROUTES
// Logout Endpoints
// ==============================================

// Logout - redirect to SSOT for proper session cleanup
server.post('/logout', async (request, reply) => {
  return reply.send({
    success: true,
    message: 'Logged out successfully',
    redirect: '/auth/logout'
  });
});

// GET logout for header links - direct bounce to SSOT
server.get('/logout', async (req, reply) => {
  return reply.redirect('/auth/logout');
});


// ==============================================
// LOCATION BLOCK 9: SERVER STARTUP
// Start Fastify Server on Port 3002
// ==============================================

// Start server
const start = async () => {
  try {
    // Wait for plugins to be registered before starting
    await server.ready();
    
    await server.listen({
      port: process.env.PORT || 3002,
      host: '0.0.0.0'
    });
    server.log.info(`Lawyers Dashboard running on port ${server.server.address().port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();