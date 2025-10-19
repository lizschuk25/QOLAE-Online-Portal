// ==============================================
// QOLAE HR COMPLIANCE & OPERATIONS DASHBOARD SERVER
// ==============================================
// Purpose: Main server for HR Compliance Dashboard
// Handles HR compliance, new starters, readers compliance, and operations
// Author: Liz & Phoenix Agent
// Date: October 14, 2025
// Port: 3012
// ==============================================

// ==============================================
// LOCATION BLOCK A: IMPORTS & CONFIGURATION
// ==============================================

import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import fastifyFormbody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import dotenv from 'dotenv';

// Import database configuration
import { testDatabaseConnection, healthCheck } from './config/database.js';

// Import notification service
import notificationService from './services/NotificationService.js';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================================
// LOCATION BLOCK B: SERVER & DATABASE SETUP
// ==============================================

const server = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Test database connection on startup
async function initializeDatabase() {
  try {
    console.log('\n🔍 Testing HR Compliance database connection...');
    const dbInfo = await testDatabaseConnection();
    console.log(`✅ Connected to database: ${dbInfo.database}`);
    console.log(`📊 PostgreSQL version: ${dbInfo.version}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('⚠️  Server will start but database operations will fail');
    return false;
  }
}

// ==============================================
// LOCATION BLOCK C: MIDDLEWARE & PLUGINS
// ==============================================

// 1. CORS Configuration
await server.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN || 'https://hrcompliance.qolae.com',
  credentials: true,
});

// 2. Form Body Parser
await server.register(fastifyFormbody);

// 2.5 Multipart File Upload Handler
await server.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// 3. Static Files (using assets directory)
await server.register(fastifyStatic, {
  root: path.join(__dirname, 'assets'),
  prefix: '/assets/',
});

// 4. View Engine (EJS)
await server.register(fastifyView, {
  engine: {
    ejs: ejs,
  },
  root: path.join(__dirname, 'views'),
  options: {
    filename: path.join(__dirname, 'views'),
  },
});

// ==============================================
// LOCATION BLOCK 1: HEALTH CHECK & ROOT ROUTES
// ==============================================

// Root route - redirect to dashboard
server.get('/', async (request, reply) => {
  return reply.redirect('/hr-compliance-dashboard');
});

// Health check endpoint
server.get('/health', async (request, reply) => {
  const dbHealth = await healthCheck();

  return {
    status: 'healthy',
    service: 'qolae-hr-compliance-dashboard',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbHealth.status,
    notificationService: {
      websocketClients: notificationService.getConnectedClientsCount(),
    },
  };
});

// ==============================================
// LOCATION BLOCK 2: ROUTE REGISTRATION SYSTEM
// ==============================================
// This section will be populated by Atlas, Iris, and Sage agents
// Each agent will register their routes here for parallel work

// Dashboard main view route
server.get('/hr-compliance-dashboard', async (request, reply) => {
  return reply.view('hrCompliance-dashboard.ejs', {
    title: 'QOLAE HR Compliance & Operations',
    user: {
      name: 'Liz',
      role: 'Administrator',
      avatar: 'L'
    }
  });
});

// Readers Registration Modal route
server.get('/readers-registration-modal', async (request, reply) => {
  return reply.view('readersRegistrationModal.ejs', {
    title: 'Register Reader - QOLAE HR Compliance'
  });
});

// Legacy Readers Registration page route (for backward compatibility)
server.get('/readers/register', async (request, reply) => {
  return reply.view('readersRegistration.ejs', {
    title: 'Register Reader - QOLAE HR Compliance'
  });
});

// New Starters routes (Atlas Agent) ✅ COMPLETE
await server.register(import('./routes/newStarterRoute.js'));

// Readers Compliance routes (Iris Agent) ✅ COMPLETE
await server.register(import('./routes/readersComplianceRoute.js'));

// Compliance Review routes (Sage Agent) ✅ COMPLETE
await server.register(import('./routes/complianceReviewRoutes.js'), { prefix: '/api/compliance-review' });

// Readers Registration routes ✅ COMPLETE
await server.register(import('./routes/readersRoutes.js'));

// Assignment routes
// await server.register(import('./routes/assignmentRoutes.js'));

// Clients routes
// await server.register(import('./routes/clientsRoutes.js'));

// Operations routes
// await server.register(import('./routes/operationsRoutes.js'));

// ==============================================
// LOCATION BLOCK 3: ERROR HANDLING
// ==============================================

server.setErrorHandler((error, request, reply) => {
  server.log.error(error);

  // Send appropriate error response
  reply.status(error.statusCode || 500).send({
    success: false,
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// ==============================================
// LOCATION BLOCK 4: SERVER STARTUP
// ==============================================

const start = async () => {
  try {
    // Initialize database first
    await initializeDatabase();

    const port = process.env.HRCOMPLIANCE_PORT || 3012;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    console.log('');
    console.log('🚀 QOLAE HR COMPLIANCE DASHBOARD STARTED 🚀');
    console.log('');
    console.log(`🌐 Server running at: http://${host}:${port}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ Database: qolae_hrcompliance`);
    console.log('');
    console.log('Available Routes:');
    console.log('  📊 Dashboard: /hr-compliance-dashboard ✅ LIVE');
    console.log('  👤 New Starters: /new-starter/* ✅ COMPLETE (Atlas Agent)');
    console.log('  👁️ Readers Compliance: /api/readers/* ✅ COMPLETE (Iris Agent)');
    console.log('  🧠 Compliance Review: /api/compliance-review/* ✅ COMPLETE (Sage Agent)');
    console.log('  📖 Readers Registration: /api/readers/* ✅ COMPLETE');
    console.log('  ❤️ Health Check: /health');
    console.log('');
    console.log('🔥 Phoenix Foundation Complete - Ready for parallel agent work!');
    console.log('');
    console.log('Agent Progress:');
    console.log('  ✅ Phoenix Agent: Foundation & Database COMPLETE');
    console.log('  ✅ Atlas Agent: New Starters workflow COMPLETE');
    console.log('  ✅ Iris Agent: Readers compliance workflow COMPLETE');
    console.log('  ✅ Sage Agent: Compliance review workflow COMPLETE');
    console.log('  ⏳ Mercury Agent: WebSocket integration (Next)');
    console.log('');

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// ==============================================
// LOCATION BLOCK 5: GRACEFUL SHUTDOWN
// ==============================================

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down HR Compliance Dashboard...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down HR Compliance Dashboard...');
  await server.close();
  process.exit(0);
});

// ==============================================
// START THE SERVER
// ==============================================

start();

export default server;