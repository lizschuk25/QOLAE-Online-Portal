import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import fastifyView from '@fastify/view';
import ejs from 'ejs';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'simulation.env') });

const fastify = Fastify({ logger: true });

// Register plugins
fastify.register(cors, {
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
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  reply.header('Last-Modified', new Date().toUTCString());
  reply.header('ETag', `"${Date.now()}"`);
});

fastify.register(formbody);

// Serve static files from both public and central repository
fastify.register(await import('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/'
});

// Register central repository with a different name to avoid conflicts
fastify.register(async function (fastify, opts) {
  await fastify.register(await import('@fastify/static'), {
    root: process.env.CENTRAL_REPOSITORY_PATH || path.join(__dirname, '../central-repository'),
    prefix: '/central-repository/'
  });
});

fastify.register(fastifyView, {
  engine: {
    ejs: ejs
  },
  root: path.join(__dirname, 'views')
});

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET;

// In-memory store for lawyer credentials (replace with database in production)
const lawyerCredentials = new Map();

// Middleware to verify JWT token
const authenticateToken = async (request, reply) => {
  const authHeader = request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return reply.code(401).send({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
  } catch (err) {
    return reply.code(403).send({ error: 'Invalid token' });
  }
};

// Routes
fastify.get('/', async (request, reply) => {
  return reply.redirect('/lawyers-login');
});

// Lawyers Login Page - Main route (capital L for email links)
fastify.get('/LawyersLogin', async (request, reply) => {
  return reply.view('lawyers-login.ejs', {
    title: 'QOLAE Lawyers Login',
    error: request.query.error || null,
    success: request.query.success || null
  });
});

// Alternative lowercase route for consistency with file naming
fastify.get('/lawyers-login', async (request, reply) => {
  const { pin } = request.query;
  
  // If PIN is provided, check if lawyer has completed password setup
  if (pin) {
    try {
      console.log(`🔍 Checking password setup status for PIN: ${pin}`);
      
      // Check if lawyer has completed password setup in qolae_lawyers database
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.LAWYERS_DATABASE_URL || 'postgresql://lawyers_user:LawyersDB2024!@localhost:5432/qolae_lawyers'
      });
      
      console.log(`🔍 Database URL: ${process.env.LAWYERS_DATABASE_URL}`);
      
      const result = await pool.query(
        'SELECT password_setup_completed FROM lawyers WHERE pin = $1',
        [pin]
      );
      
      console.log(`🔍 Database query result:`, result.rows);
      
      if (result.rows.length > 0 && result.rows[0].password_setup_completed) {
        // Lawyer has completed password setup - show alert message but continue with normal flow
        console.log(`🔐 Lawyer ${pin} has completed password setup - continuing with normal 2FA flow`);
        // Don't redirect early - let them go through 2FA first, then redirect to secure login
      }
      
      await pool.end();
    } catch (error) {
      console.error('❌ Error checking password setup status:', error);
      // Continue with normal flow if check fails
    }
  }
  
  return reply.view('lawyers-login.ejs', {
    title: 'QOLAE Lawyers Login',
    error: request.query.error || null,
    success: request.query.success || null
  });
});

// Redirect old /login route to /lawyers-login for backward compatibility
fastify.get('/login', async (request, reply) => {
  const { pin } = request.query;
  const redirectUrl = pin ? `/lawyers-login?pin=${pin}` : '/lawyers-login';
  return reply.redirect(redirectUrl);
});

// 2FA Authentication Page - Step 2: WebAuthn + Email Verification
fastify.get('/lawyers-2fa', async (request, reply) => {
  const { auth } = request.query;
  
  if (!auth) {
    // Show error page instead of redirecting to login
    return reply.view('lawyers-2fa.ejs', {
      title: '2-Way Authentication - QOLAE Lawyers Portal',
      error: 'Invalid authentication token. Please return to login.',
      pin: null,
      email: null,
      lawFirm: null,
      contactName: null,
      authToken: null
    });
  }

  try {
    // Decode the temporary auth data
    const authData = jwt.verify(auth, JWT_SECRET);
    
    // Debug: Log the auth data
    fastify.log.info('2FA Auth Data:', authData);
    
    if (authData.step !== '2fa_pending') {
      // Show error page instead of redirecting to login
      return reply.view('lawyers-2fa.ejs', {
        title: '2-Way Authentication - QOLAE Lawyers Portal',
        error: 'Invalid authentication step. Please return to login.',
        pin: null,
        email: null,
        lawFirm: null,
        contactName: null,
        authToken: null
      });
    }

    return reply.view('lawyers-2fa.ejs', {
      title: '2-Way Authentication - QOLAE Lawyers Portal',
      pin: authData.pin,
      email: authData.email,
      lawFirm: authData.lawFirm,
      contactName: authData.contactName,
      authToken: auth
    });

  } catch (error) {
    fastify.log.error('2FA page error:', error);
    // Show error page instead of redirecting to login
    return reply.view('lawyers-2fa.ejs', {
      title: '2-Way Authentication - QOLAE Lawyers Portal',
      error: 'Authentication token expired or invalid. Please return to login.',
      pin: null,
      email: null,
      lawFirm: null,
      authToken: null
    });
  }
});

// Redirect to main Lawyers Dashboard (protected route)
fastify.get('/lawyers-dashboard', { preHandler: authenticateToken }, async (request, reply) => {
  // Redirect directly to the main Lawyers Dashboard project
  return reply.redirect('/LawyersLogin?token=' + encodeURIComponent(request.user.token));
});

// Logout
fastify.post('/logout', async (request, reply) => {
  return reply.send({
    success: true,
    message: 'Logged out successfully',
    redirect: '/lawyers-login'
  });
});

// Helper function to check lawyer in system (using centralized API)
const checkLawyerInSystem = async (pin) => {
  try {
    // Call the centralized API on SSOT-Simulation using axios
    const response = await axios.get(`/api/lawyer/validate/${pin}`);
    const result = response.data;
    
    if (result.success && result.lawyer) {
      fastify.log.info(`✅ Lawyer found via API: ${result.lawyer.lawFirm} (${result.lawyer.pin})`);
      return {
        pin: result.lawyer.pin,
        email: result.lawyer.email,
        lawFirm: result.lawyer.lawFirm,
        contactName: result.lawyer.contactName
      };
    } else {
      fastify.log.warn(`❌ Lawyer not found via API: ${pin}`);
      return null;
    }
  } catch (error) {
    fastify.log.error('Error checking lawyer via API:', error);
    return null;
  }
}

// Make checkLawyerInSystem available to routes
fastify.decorate('checkLawyerInSystem', checkLawyerInSystem);

// Register external route modules
import lawyersAuthRoute from './routes/lawyersAuthRoute.js';
fastify.register(lawyersAuthRoute);

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: process.env.PORT || 3010,
      host: '0.0.0.0'
    });
    const address = fastify.server.address();
    console.log(`🚀 LawyersLoginPortal bound to: ${address.address}:${address.port}`);

    fastify.log.info(`Lawyers Login Portal running on port ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();