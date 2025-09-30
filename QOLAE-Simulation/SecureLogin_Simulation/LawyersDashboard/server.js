// ==============================================
// LOCATION BLOCK A: IMPORTS & CONFIGURATION
// A.1: Core Dependencies & ES6 Setup
// ==============================================
import fastify from 'fastify';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// JWT tokens are stored in qolae_lawyers database

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================================
// LOCATION BLOCK B: ENVIRONMENT & SERVER SETUP
// B.1: Environment Variables Load
// B.2: Fastify Server Initialization
// ==============================================
dotenv.config({ path: path.join(__dirname, 'simulation.env') });

// Configure base URL for server-to-server calls to SSOT
const SSOT_BASE_URL = process.env.SSOT_BASE_URL || 'http://localhost:3011';

const server = fastify({ logger: true });

// ==============================================
// LOCATION BLOCK C: DATABASE CONNECTIONS
// C.1: PostgreSQL Pool Configuration
// ==============================================
// 🎯 LAWYERS DATABASE: qolae_lawyers (Local lawyers portal data)
const pool = new Pool({ 
  connectionString: process.env.LAWYERS_DATABASE_URL || 'postgresql://lawyers_user:lawyers_password@localhost:5432/qolae_lawyers'
});

// Make pool available to routes
server.decorate('db', pool);

// Register plugins
server.register(await import('@fastify/cors'), {
  origin: [
    'https://admin.qolae.com',
    'http://localhost:3011', 
    'https://lawyers.qolae.com',
    'https://clients.qolae.com',
    'https://casemanagers.qolae.com',
    'https://readers.qolae.com',
  ],
  methods: ['GET', 'POST'],
  credentials: true
});

// 🛡️ CACHE-BUSTING MIDDLEWARE - Prevent stale content
server.addHook('onRequest', async (request, reply) => {
  // Add cache-busting headers to all responses
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  reply.header('Last-Modified', new Date().toUTCString());
  reply.header('ETag', `"${Date.now()}"`);
});

server.register(await import('@fastify/formbody'));

    // JWT plugin removed for simulation - using jsonwebtoken directly
    
    // Bootstrap endpoint for frontend data loading
    server.get('/api/workspace/bootstrap', async (request, reply) => {
      try {
        const { pin } = request.query;
        
        if (!pin) {
          return reply.status(400).send({ error: 'PIN is required' });
        }
        
        // For simulation, return mock data
        const mockLawyer = {
          pin: pin,
          contactName: pin === 'HC-002164' ? 'Judith Henriksson' : 'James Fry',
          lawFirm: pin === 'HC-002164' ? 'Henriksson & Cluster LLP' : 'Macaffety & Fry LLP',
          email: pin === 'HC-002164' ? 'judith.henriksson@henriksson-cluster.com' : 'james.fry@macaffety-fry.com',
          workflowProgress: {
            termsSigned: false,
            paymentComplete: false,
            consentComplete: false,
            instructionsComplete: false,
            documentsComplete: false
          }
        };
        
        return reply.send({
          success: true,
          lawyer: mockLawyer
        });
        
      } catch (error) {
        server.log.error('Bootstrap error:', error);
        return reply.status(500).send({ error: 'Failed to load workspace data' });
      }
    });

// GDPR consent verification handled by SSOT API at https://api.qolae.com

// Serve static files from public directory
server.register(await import('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/'
});

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

// Routes
server.get('/', async (request, reply) => {
  // Redirect to workspace entry point
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
  // ✅ SSOT handles authentication - just redirect to workspace entry
  return reply.redirect('/LawyersDashboard');
});

// ✅ Dashboard route (3002) — render EJS; client-side Bootstrap handles auth + data
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
      pin: ''
    });
  }
  
  try {
    console.log(`🔍 Dashboard route called with PIN: ${pin}`);
    
    // Fetch lawyer data from qolae_lawyers database using PIN
    const result = await pool.query(
      'SELECT pin, contact_name, law_firm, email, workflow_stage FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    console.log(`🔍 Database query result:`, result.rows.length, 'rows found');
    
    if (result.rows.length > 0) {
      const lawyer = result.rows[0];
      console.log(`✅ Dashboard loading for ${lawyer.contact_name} (${pin})`);
      
      return reply.view('lawyers-dashboard.ejs', {
        title: 'QOLAE Lawyers Dashboard',
        contactName: lawyer.contact_name || 'Lawyer',
        lawFirm: lawyer.law_firm || 'Law Firm',
        pin: pin,
        email: lawyer.email || '',
        workflowStage: lawyer.workflow_stage || 1
      });
    } else {
      console.log(`❌ PIN ${pin} not found in qolae_lawyers database`);
      // PIN not found in qolae_lawyers database, sync from qolae_admin
      console.log(`📡 Lawyer ${pin} not found locally, syncing from qolae_admin...`);
      
      const syncedLawyer = await syncLawyerFromSSOT(pin);
      
      if (syncedLawyer) {
        console.log(`✅ Successfully synced lawyer: ${syncedLawyer.contact_name}`);
        return reply.view('lawyers-dashboard.ejs', {
          title: 'QOLAE Lawyers Dashboard',
          contactName: syncedLawyer.contact_name || 'Lawyer',
          lawFirm: syncedLawyer.law_firm || 'Law Firm',
          pin: pin,
          email: syncedLawyer.email || '',
          workflowStage: syncedLawyer.workflow_stage || 1
        });
      } else {
        // Fallback if sync fails
        console.log(`❌ Could not sync lawyer ${pin} from qolae_admin`);
        return reply.view('lawyers-dashboard.ejs', {
          title: 'QOLAE Lawyers Dashboard',
          contactName: 'Lawyer',
          lawFirm: 'Law Firm',
          pin: pin,
          email: '',
          workflowStage: 1
        });
      }
    }
  } catch (error) {
    console.error('❌ Error fetching lawyer data:', error);
    // Fallback to basic data
    return reply.view('lawyers-dashboard.ejs', {
      title: 'QOLAE Lawyers Dashboard',
      contactName: 'Lawyer',
      lawFirm: 'Law Firm',
      pin: pin,
      email: '',
      workflowStage: 1
    });
  }
});

// TOB Modal route - serves the TOB workflow content as a partial template
server.get('/tobModal', async (req, reply) => {
  // Force no caching to ensure fresh content after fixes
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  reply.header('ETag', `"tob-${Date.now()}"`);
  
  const { pin } = req.query;
  
  if (!pin) {
    return reply.view('tobModal.ejs', {
      lawyerPin: '',
      lawyerName: 'Lawyer',
      lawyerData: null
    });
  }
  
  try {
    // Fetch lawyer data from database using PIN (ONLY fields in PDF!)
    const result = await pool.query(
      'SELECT pin, law_firm, contact_name FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    if (result.rows.length > 0) {
      const lawyer = result.rows[0];
      return reply.view('tobModal.ejs', {
        lawyerPin: pin,
        lawyerName: lawyer.contact_name || 'Lawyer',
        lawyerData: {
          lawFirm: lawyer.law_firm || 'Unknown Law Firm',
          contactName: lawyer.contact_name || 'Unknown Contact'
          // ❌ REMOVED: email, phone (not in PDF)
        }
      });
    } else {
      // PIN not found in client portal database, sync from admin database
      console.log(`📡 Lawyer ${pin} not found locally, syncing from admin database...`);
      
      const syncedLawyer = await syncLawyerFromSSOT(pin);
      
      if (syncedLawyer) {
        console.log(`✅ Successfully synced lawyer: ${syncedLawyer.contact_name}`);
        return reply.view('tobModal.ejs', {
          lawyerPin: pin,
          lawyerName: syncedLawyer.contact_name || 'Lawyer',
          lawyerData: {
            lawFirm: syncedLawyer.law_firm || 'Unknown Law Firm',
            contactName: syncedLawyer.contact_name || 'Unknown Contact'
          }
        });
      } else {
        // Fallback if sync fails
        console.log(`❌ Could not sync lawyer ${pin} from admin database`);
        return reply.view('tobModal.ejs', {
          lawyerPin: pin,
          lawyerName: 'Lawyer',
          lawyerData: null
        });
      }
    }
  } catch (error) {
    console.error('❌ Error fetching lawyer data:', error);
    // Fallback to basic data
    return reply.view('tobModal.ejs', {
      lawyerPin: pin,
      lawyerName: 'Lawyer',
      lawyerData: null
    });
  }
});

// TOB content handled directly in dashboard modal - no route needed

// Note: Signed TOB download now handled by main API server at /documents/:pin/signed
// This route was removed to avoid conflicts with the centralized API

// Document serving handled by SSOT API at https://api.qolae.com
// Lawyers Dashboard focuses on UI workflow, API handles document generation/serving

// Payment Modal route - serves the Payment modal
server.get('/paymentModal', async (req, reply) => {
  return reply.view('paymentModal.ejs', {
    title: 'Complete Payment - QOLAE Lawyers Dashboard',
    user: { /* SSOT will provide user data */ },
    lawFirm: 'Your Law Firm'
  });
});

// Consent Modal route - serves the Consent workflow modal
server.get('/consentModal', async (req, reply) => {
  return reply.view('consentModal.ejs', {
    title: 'Consent Forms - QOLAE Lawyers Dashboard',
    user: { /* SSOT will provide user data */ },
    lawFirm: 'Your Law Firm'
  });
});

// Referral Modal route - serves the Case Referral & Instructions modal
server.get('/referralModal', async (req, reply) => {
  return reply.view('referralModal.ejs', {
    title: 'Case Referrals & Instructions - QOLAE Lawyers Dashboard',
    user: { /* SSOT will provide user data */ },
    lawFirm: 'Your Law Firm'
  });
});

// Document Upload Modal route - serves the Document Upload modal
server.get('/documentUploadModal', async (req, reply) => {
  return reply.view('documentUploadModal.ejs', {
    title: 'Document Uploads - QOLAE Lawyers Dashboard',
    user: { /* SSOT will provide user data */ },
    lawFirm: 'Your Law Firm'
  });
});

// Support Modal route - serves the Support modal
server.get('/supportModal', async (req, reply) => {
  return reply.view('supportModal.ejs', {
    title: 'Support - QOLAE Lawyers Dashboard',
    user: { /* SSOT will provide user data */ },
    lawFirm: 'Your Law Firm'
  });
});

// Consent Forms Section - Internal Workspace Route 
server.get('/consent-forms', async (request, reply) => {
  // SSOT handles authentication and GDPR consent verification
  return reply.view('consent-forms.ejs', {
    title: 'Consent Forms - QOLAE Lawyers Dashboard',
    user: { /* SSOT will provide user data */ },
    lawFirm: 'Your Law Firm'
  });
});

// Referral Forms Section - Internal Workspace Route
server.get('/referral-forms', async (request, reply) => {
  // ✅ SSOT handles authentication - just render the view
  return reply.view('referral-forms.ejs', {
    title: 'Referral Forms - QOLAE Lawyers Dashboard',
    user: { /* SSOT will provide user data */ },
    lawFirm: 'Your Law Firm'
  });
});

// Document Uploads Section - Internal Workspace Route
server.get('/document-uploads', async (request, reply) => {
  // SSOT handles authentication and GDPR consent verification
  return reply.view('document-forms.ejs', {
    title: 'Document Uploads - QOLAE Lawyers Dashboard',
    user: { /* SSOT will provide user data */ },
    lawFirm: 'Your Law Firm'
  });
});

// Logout - redirect to SSOT for proper session cleanup
server.post('/logout', async (request, reply) => {
  // ✅ SSOT handles session cleanup - just redirect
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

// ========================================
// SECURE LOGIN FLOW
// ========================================

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
    console.log(`🏛️ Professional workspace setup for PIN: ${pin}, Email: ${email}`);
    
    // Step 1: Check if this is first-time setup or existing login
    const existingLawyer = await pool.query(
      'SELECT pin, email, password_hash FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    let ssotVerification;
    
    if (existingLawyer.rows.length > 0 && existingLawyer.rows[0].password_hash) {
      // Existing lawyer - verify password
      console.log(`🔐 Existing lawyer login for ${pin}`);
      ssotVerification = await verifyWithSSOT(email, password, pin);
    } else {
      // First-time setup - create password and verify with SSOT
      console.log(`🏛️ First-time professional workspace setup for ${pin}`);
      ssotVerification = await setupLawyerPassword(email, password, pin);
    }
    
    if (!ssotVerification.success) {
      return reply.status(401).send({
        success: false,
        error: ssotVerification.error || 'Invalid credentials'
      });
    }
    
    // Step 2: Sync lawyer to local database (create/update record)
    const lawyer = await syncLawyerToDatabase(ssotVerification.lawyer);
    
    if (!lawyer) {
      return reply.status(500).send({
        success: false,
        error: 'Failed to set up lawyer workspace'
      });
    }
    
    console.log(`✅ Secure login successful for ${lawyer.contact_name} (${pin})`);
    
    // Step 3: Get qolae_token from SSOT for bootstrap access
    const tokenResponse = await fetch(`${SSOT_BASE_URL}/auth/request-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        pin, 
        password,
        source: 'lawyers-dashboard-secure',
        skipTwoFactor: true // Skip 2FA since we already verified credentials
      })
    });
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      if (tokenData.success && tokenData.token) {
        // JWT tokens are now stored by SSOT-Simulation
        console.log('✅ JWT tokens handled by SSOT-Simulation');
      } else {
        console.log('⚠️ SSOT token not available, using local session only');
      }
    } else {
      console.log('⚠️ SSOT token request failed, using local session only');
    }
    
    reply.send({
      success: true,
      message: 'Login successful',
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

// Bootstrap API endpoint - Lawyers Dashboard calls SSOT with stored JWT tokens
server.get('/lawyers-dashboard/api/bootstrap', async (request, reply) => {
  const { pin } = request.query;
  
  if (!pin) {
    return reply.status(400).send({ error: 'PIN required' });
  }
  
  try {
    // Get stored JWT token from SSOT-Simulation
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
// LOCATION BLOCK D: SHARED DATABASE FUNCTIONS
// D.1: Cross-Database Lawyer Fetching
// ==============================================
// 🎯 ADMIN DATABASE: qolae_admin (Marketing & admin functions)
// Fetch lawyer data from qolae_admin database (shared function)
async function getLawyerDataFromAdminDB(pin) {
  let marketingDb = null;
  try {
    console.log(`📡 Fetching lawyer ${pin} from qolae_admin database...`);
    
    marketingDb = new Pool({
      connectionString: process.env.DATABASE_URL  // This connects to qolae_admin
    });
    
    const lawyerResult = await marketingDb.query(
      'SELECT pin, "contactName", "lawFirm", email, phone FROM "Lawyer" WHERE pin = $1',
      [pin]
    );
    
    if (lawyerResult.rows.length > 0) {
      const lawyerData = lawyerResult.rows[0];
      console.log(`✅ Found lawyer in qolae_admin:`, {
        pin: lawyerData.pin,
        name: lawyerData.contactName,
        firm: lawyerData.lawFirm
      });
      
      return {
        pin: lawyerData.pin,
        email: lawyerData.email,
        contactName: lawyerData.contactName,
        lawFirm: lawyerData.lawFirm,
        phone: lawyerData.phone
      };
    }
    
    console.log(`❌ Lawyer ${pin} not found in qolae_admin database`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error fetching lawyer ${pin} from admin database:`, error);
    return null;
  } finally {
    if (marketingDb) {
      await marketingDb.end();
    }
  }
}

// Verify credentials for existing lawyer login
async function verifyWithSSOT(email, password, pin) {
  try {
    console.log(`🔐 Verifying existing lawyer credentials: ${email}, PIN: ${pin}`);
    
    // Step 1: Get lawyer from local database
    const lawyerResult = await pool.query(
      'SELECT pin, email, contact_name, law_firm, password_hash FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    if (lawyerResult.rows.length === 0) {
      console.log('❌ Lawyer not found in local database');
      return { success: false, error: 'Lawyer not found' };
    }
    
    const lawyer = lawyerResult.rows[0];
    
    // Step 2: Verify password
    const bcrypt = await import('bcryptjs');
    const passwordMatch = await bcrypt.compare(password, lawyer.password_hash);
    
    if (!passwordMatch) {
      console.log('❌ Password verification failed');
      return { success: false, error: 'Invalid password' };
    }
    
    // Step 3: Verify email matches
    if (lawyer.email !== email) {
      console.log('❌ Email mismatch');
      return { success: false, error: 'Email does not match PIN' };
    }
    
    console.log('✅ Existing lawyer credentials verified successfully');
    
    return {
      success: true,
      lawyer: {
        pin: lawyer.pin,
        email: lawyer.email,
        contact_name: lawyer.contact_name,
        law_firm: lawyer.law_firm
      }
    };
    
  } catch (error) {
    console.error('❌ Credential verification error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// ==============================================
// LOCATION BLOCK F: LOCAL DATABASE OPERATIONS
// F.1: SSOT to Local Database Sync
// ==============================================
// Sync lawyer from SSOT to local database
async function syncLawyerToDatabase(lawyerData) {
  try {
    console.log(`📊 Syncing lawyer to database:`, lawyerData);
    
    // Check if lawyer already exists
    const existingResult = await pool.query(
      'SELECT * FROM lawyers WHERE pin = $1',
      [lawyerData.pin]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing lawyer
      const updateResult = await pool.query(
        `UPDATE lawyers 
         SET email = $2, contact_name = $3, law_firm = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE pin = $1 
         RETURNING *`,
        [lawyerData.pin, lawyerData.email, lawyerData.contact_name, lawyerData.law_firm]
      );
      
      console.log(`✅ Updated existing lawyer: ${lawyerData.pin}`);
      return updateResult.rows[0];
    } else {
      // Create new lawyer record
      const insertResult = await pool.query(
        `INSERT INTO lawyers (pin, email, contact_name, law_firm, workflow_stage) 
         VALUES ($1, $2, $3, $4, 1) 
         RETURNING *`,
        [lawyerData.pin, lawyerData.email, lawyerData.contact_name, lawyerData.law_firm]
      );
      
      console.log(`✅ Created new lawyer: ${lawyerData.pin}`);
      return insertResult.rows[0];
    }
    
  } catch (error) {
    console.error('❌ Database sync error:', error);
    return null;
  }
}

// ==============================================
// LOCATION BLOCK E: DATA SYNCHRONIZATION
// E.1: Admin to Lawyers Database Sync
// ==============================================

// Setup lawyer password for first-time professional workspace
async function setupLawyerPassword(email, password, pin) {
  try {
    console.log(`🏛️ Setting up professional password for ${pin}`);
    
    // Step 1: Validate PIN with SSOT
    const pinValidation = await fetch(`${SSOT_BASE_URL}/api/pin/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    
    if (!pinValidation.ok) {
      console.log('❌ PIN validation failed');
      return { success: false, error: 'Invalid PIN' };
    }
    
    // Step 2: Get lawyer data from qolae_admin database
    const lawyerFromAdmin = await getLawyerDataFromAdminDB(pin);
    
    if (!lawyerFromAdmin) {
      console.log(`❌ Lawyer ${pin} not found in admin database`);
      return { success: false, error: 'Lawyer not found in system' };
    }
    
    // Step 3: Hash the password securely
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Step 4: Create or update lawyer record with password in qolae_lawyers
    const result = await pool.query(
      `INSERT INTO lawyers (pin, email, contact_name, law_firm, password_hash, password_setup_completed, workflow_stage, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (pin) 
       DO UPDATE SET 
         email = EXCLUDED.email,
         contact_name = EXCLUDED.contact_name,
         law_firm = EXCLUDED.law_firm,
         password_hash = EXCLUDED.password_hash,
         password_setup_completed = TRUE,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [pin, email, lawyerFromAdmin.contactName, lawyerFromAdmin.lawFirm, passwordHash]
    );
    
    console.log(`✅ Professional workspace setup complete for ${lawyerFromAdmin.contactName} (${pin})`);
    
    return {
      success: true,
      lawyer: {
        pin: pin,
        email: email,
        contact_name: lawyerFromAdmin.contactName,
        law_firm: lawyerFromAdmin.lawFirm,
        password_hash: passwordHash
      }
    };
    
  } catch (error) {
    console.error('❌ Professional workspace setup error:', error);
    return { success: false, error: 'Failed to setup professional workspace' };
  }
}
// Sync lawyer data from admin database (qolae_admin) to client portal database
async function syncLawyerFromSSOT(pin) {
  try {
    console.log(`🔄 Syncing onboarded lawyer ${pin} from admin database...`);
    
    // Fetch lawyer data from qolae_admin database
    const lawyerData = await getLawyerDataFromAdminDB(pin);
    
    if (!lawyerData) {
      console.log(`❌ Lawyer ${pin} not found in admin database`);
      return null;
    }
    
    console.log(`✅ Found lawyer in marketing system:`, {
      pin: lawyerData.pin,
      name: lawyerData.contactName,
      firm: lawyerData.lawFirm
    });
    
    // Check if lawyer already exists in client portal database
    const portalResult = await pool.query(
      'SELECT * FROM lawyers WHERE pin = $1',
      [pin]
    );
    
    if (portalResult.rows.length > 0) {
      // Update existing lawyer data (but preserve their workflow progress)
      const updateResult = await pool.query(
        `UPDATE lawyers 
         SET email = $2, 
             contact_name = $3, 
             law_firm = $4,
             updated_at = CURRENT_TIMESTAMP 
         WHERE pin = $1 
         RETURNING *`,
        [pin, lawyerData.email, lawyerData.contactName, lawyerData.lawFirm]
      );
      
      console.log(`✅ Updated lawyer ${pin} in client portal`);
      return updateResult.rows[0];
    } else {
      // Create new lawyer in client portal with initial workflow stage
      const insertResult = await pool.query(
        `INSERT INTO lawyers (pin, email, contact_name, law_firm, workflow_stage, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [pin, lawyerData.email, lawyerData.contactName, lawyerData.lawFirm]
      );
      
      console.log(`✅ Onboarded lawyer ${pin} to client portal`);
      console.log(`👋 Welcome ${lawyerData.contactName} from ${lawyerData.lawFirm}!`);
      return insertResult.rows[0];
    }
    
  } catch (error) {
    console.error(`❌ Error syncing lawyer ${pin}:`, error);
    return null;
  }
}

// Register route modules (only dashboard functionality)
// Future login route for existing lawyers (Option 2: Keep 2FA Always)
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
        skipTwoFactor: false // Keep 2FA for future logins
      })
    });
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      if (tokenData.success && tokenData.token) {
        // JWT tokens are now stored by SSOT-Simulation
        console.log('✅ JWT tokens handled by SSOT-Simulation');
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

// ========================================
// DATABASE UPDATE ENDPOINTS - TOB Completion
// ========================================

// Update lawyer workflow status after TOB completion
server.post('/lawyers-dashboard/api/:pin/complete-tob', async (request, reply) => {
  const { pin } = request.params;
  const { timestamp, signatureData } = request.body;
  
  if (!pin) {
    return reply.status(400).send({
      success: false,
      error: 'PIN is required'
    });
  }
  
  try {
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
    
    // Send success response
    reply.send({
      success: true,
      message: 'TOB completion status updated successfully',
      data: {
        pin: updatedLawyer.pin,
        workflow_stage: updatedLawyer.workflow_stage,
        updated_at: updatedLawyer.updated_at
      }
    });
    
    // TODO: Trigger WebSocket broadcast to notify dashboard
    // This would ideally trigger the WebSocket server to broadcast
    // a 'workflow:updated' event to connected clients
    console.log(`📡 Should trigger WebSocket broadcast for PIN ${pin}`);
    
  } catch (error) {
    console.error('❌ Database error updating TOB completion:', error);
    reply.status(500).send({
      success: false,
      error: 'Database error occurred'
    });
  }
});

// Get lawyer workflow status (for dashboard refresh)
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
        tob_completed: lawyer.workflow_stage >= 2, // TOB completed if workflow_stage >= 2
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

// Start server
const start = async () => {
  try {
    // Wait for plugins to be registered before starting
    await server.ready();
    
    await server.listen({
      port: process.env.PORT || 3009,
      host: '0.0.0.0'
    });
    server.log.info(`Lawyers Dashboard running on port ${server.server.address().port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start(); 


