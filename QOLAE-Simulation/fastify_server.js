import fastify from 'fastify';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import jwt from '@fastify/jwt';
import { exec } from "child_process";
import ejs from "ejs";
import { Pool } from 'pg';

// Load environment variables FIRST
dotenv.config();

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for file paths - make them configurable
const config = {
  centralRepository: process.env.CENTRAL_REPOSITORY_PATH || '/var/www/api.qolae.com/central-repository',
  paths: {
    signedTob: 'signed-tob',
    temp: 'temp',
    uploads: 'uploads',
    images: 'images',
    signatures: 'signatures'
  }
};

// Helper function to build file paths
const buildFilePath = (type, fileName) => {
  const subPath = config.paths[type] || 'uploads';
  return path.join(config.centralRepository, subPath, fileName);
};

// Initialize PostgreSQL connection pool for qolae_lawyers
const lawyersPool = new Pool({
  connectionString: process.env.LAWYERS_DATABASE_URL || process.env.DATABASE_URL,
});

// Test lawyers database connection
lawyersPool.connect()
  .then(() => console.log("✅ Connected to qolae_lawyers database"))
  .catch(err => console.error("❌ Lawyers DB connection error:", err));

// NOTE: PDF generation now handled by LaTeX in generateLawyersCustomizedTOB.js
// Chrome Headless function removed to eliminate conflicts

const server = fastify({ 
  logger: true,
  trustProxy: true
});

// Add cache-busting headers for all responses
server.addHook('onSend', async (request, reply, payload) => {
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  reply.header('Surrogate-Control', 'no-store');
  reply.header('Last-Modified', new Date().toUTCString());
  reply.header('ETag', `"${Date.now()}"`);
  return payload;
});

// Register CORS for cross-origin request so the 
server.register(await import('@fastify/cors'), {
  origin: [
    'https://qolae.com',
    'https://www.qolae.com',
    'https://admin.qolae.com',
    'https://lawyers.qolae.com',
    'https://clients.qolae.com',
    'https://casemanagers.qolae.com',
    'https://readers.qolae.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// Custom JSON parser for better error handling
server.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// Register multipart for file uploads
server.register(await import('@fastify/multipart'));

// Register formbody for parsing form data (essential for auth endpoints)
server.register(await import('@fastify/formbody'));

// Register cookie plugin for JWT storage
try {
  const cookiePlugin = await import('@fastify/cookie');
  server.register(cookiePlugin.default || cookiePlugin);
  console.log('✅ @fastify/cookie plugin registered successfully');
} catch (error) {
  console.error('❌ Failed to register @fastify/cookie plugin:', error);
  process.exit(1);
}

// Register JWT plugin
server.register(jwt, {
  secret: process.env.JWT_SECRET || 'qolae-api-dashboard-secret-key-2024'
});

// Authentication decorator
server.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Invalid or expired token' });
  }
});

// Lawyer token verification endpoint
server.get('/api/lawyer/verify-token', {
  preValidation: [server.authenticate]
}, async (req, reply) => {
  return reply.send({ user: req.user });
});

// Serve static files from central repository
server.register(await import('@fastify/static'), {
  root: config.centralRepository,
  prefix: '/central-repository/'
});

// Health check endpoint
server.get('/health', async (request, reply) => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'QOLAE API Dashboard',
    version: '1.0.0'
  };
});

// NOTE: Generate Lawyers TOB endpoint moved to /documents/generate-lawyers-tob
// This ensures proper /documents/ prefix and security compliance

// Download signed TOB endpoint (NEW - for serving signed documents)
server.get('/documents/:pin/signed', async (req, reply) => {
  try {
    const { pin } = req.params;
    const signedPath = buildFilePath('signedTob', `TOB_${pin}_SIGNED.pdf`);
    
    console.log(`📄 Download request for signed TOB - PIN: ${pin}`);
        console.log(`📁 Looking for file at: ${signedPath}`);
    
    if (fs.existsSync(signedPath)) {
        const stats = fs.statSync(signedPath);
        console.log(`✅ Serving signed TOB for PIN: ${pin} (${stats.size} bytes)`);
        
        // Check if this is a view request (no download parameter)
        const isViewRequest = !req.query.download;
        
        const headers = {
            'Content-Type': 'application/pdf',
            'Content-Length': stats.size,
            'Access-Control-Allow-Origin': 'https://lawyers.qolae.com',
            'Access-Control-Allow-Credentials': 'true'
        };
        
        // Only add Content-Disposition for download requests
        if (!isViewRequest) {
            headers['Content-Disposition'] = `attachment; filename="TOB_${pin}_Signed.pdf"`;
        }

        // Set all headers
        Object.entries(headers).forEach(([key, value]) => {
            reply.header(key, value);
        });
        
        // Send the file
        const fileStream = fs.createReadStream(signedPath);
        return reply.send(fileStream);
        
    } else {
        console.error(`❌ Signed TOB not found for PIN: ${pin} at path: ${signedPath}`);
        return reply.code(404).send({
            error: 'Signed TOB document not found',
            pin: pin,
            expectedPath: signedPath,
            message: 'Document may not have been processed yet. Please try signing again.'
        });
    }
    
  } catch (error) {
    console.error('❌ Error serving signed TOB:', error);
    return reply.code(500).send({ 
      error: 'Internal server error serving signed TOB',
      success: false 
    });
  }
});

// Serve review TOB files
server.get('/central-repository/temp/:filename', async (req, reply) => {
  try {
    const { filename } = req.params;
    const reviewPath = buildFilePath('temp', filename);
    
    console.log(`📄 Review TOB request for: ${filename}`);
    console.log(`📁 Looking for file at: ${reviewPath}`);
    
    if (fs.existsSync(reviewPath)) {
        const stats = fs.statSync(reviewPath);
        console.log(`✅ Serving review TOB: ${filename} (${stats.size} bytes)`);
        
        const headers = {
            'Content-Type': 'application/pdf',
            'Content-Length': stats.size,
            'Access-Control-Allow-Origin': 'https://lawyers.qolae.com',
            'Access-Control-Allow-Credentials': 'true'
        };
        
        // Set all headers
        Object.entries(headers).forEach(([key, value]) => {
            reply.header(key, value);
        });
        
        // Send the file
        const fileStream = fs.createReadStream(reviewPath);
        return reply.send(fileStream);
        
    } else {
        console.error(`❌ Review TOB not found: ${filename} at path: ${reviewPath}`);
        return reply.code(404).send({
            error: 'Review TOB document not found',
            filename: filename,
            expectedPath: reviewPath
        });
    }
    
  } catch (error) {
    console.error('❌ Error serving review TOB:', error);
    return reply.code(500).send({ 
      error: 'Internal server error serving review TOB',
      success: false 
    });
  }
});

// SSOT health endpoint
server.get('/health/ssot', (req, reply) => {
  reply.send({
    role: 'SSOT',
    endpoints: ['/auth/gate','/auth/session','/workspace/bootstrap'],
    sessionCookieScope: 'api.qolae.com (host-only)'
  });
});

// Lawyers Dashboard state refresh endpoint
server.post('/api/lawyers/:pin/refresh-state', async (req, reply) => {
  try {
    const { pin } = req.params;
    
    console.log(`🔄 State refresh request for PIN: ${pin}`);
    
    // Update lawyer workflow stage in database
    const result = await lawyersPool.query(
      'UPDATE lawyers SET workflow_stage = 2, updated_at = NOW() WHERE pin = $1 RETURNING *',
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
    
    console.log(`✅ Workflow stage updated for PIN: ${pin} - Stage: ${lawyer.workflow_stage}`);
    
    // Return updated state
    return reply.send({
      success: true,
      message: 'Dashboard state refreshed successfully',
      pin: pin,
      workflowStage: lawyer.workflow_stage,
      updatedAt: lawyer.updated_at,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error refreshing lawyer state:', error);
    return reply.code(500).send({
      success: false,
      error: 'Failed to refresh dashboard state',
      message: error.message
    });
  }
});

// API Information endpoint
server.get('/api', async (request, reply) => {
  return {
    message: 'QOLAE API Dashboard',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      email: '/api/email',
      documents: '/api/documents',
      websocket: '/api/websocket'
    },
    documentation: 'API endpoints for centralized QOLAE services'
  };
});

// Test JWT token generation route
server.post('/auth/token', async (req, reply) => {
  const { pin } = req.body;

  // Validate pin, find user (optional)

  const token = server.jwt.sign({
    pin,
    role: 'lawyer'
  });

  return reply.send({ token });
});

// Register route modules
server.register(await import('./routes/emailRoutes.js'), { prefix: '/api/email' });
server.register(await import('./routes/documentRoutes.js'), { prefix: '/documents' });
server.register(await import('./routes/websocketRoutes.js'), { prefix: '/api/websocket' });
server.register(await import('./routes/authRoute.js'), { prefix: '/auth' });
server.register(await import('./routes/workspaceRoute.js'), { prefix: '/workspace' });

// 🎯 REGISTER SSOT SERVICES
server.register(await import('./routes/PINValidationRoutes.js'));
server.register(await import('./routes/HealthMonitorRoutes.js'));
server.register(await import('./routes/AdminAuditRoutes.js'));
server.register(await import('./routes/gdprRoutes.js')); // GDPR consent verification

server.ready(err => {
  if (err) throw err;
  console.log('📦 Registered Routes:');
  server.printRoutes();
});

// Root endpoint
server.get('/', async (request, reply) => {
  return {
    message: 'QOLAE API Dashboard',
    version: '1.0.0',
    description: 'Centralized API services for QOLAE Online Portal',
    endpoints: {
      health: '/health',
      api: '/api',
      email: '/api/email',
      documents: '/api/documents',
      websocket: '/api/websocket'
    }
  };
});

// Start server
const start = async () => {
  try {
    const port = process.env.API_PORT || 3008;
    await server.listen({ 
      port: port, 
      host: '0.0.0.0' 
    });
    console.log(`🚀 QOLAE API Dashboard (Fastify) running on port ${port}`);
    console.log(`📧 Email API: http://localhost:${port}/api/email`);
    console.log(`📄 Document API: http://localhost:${port}/api/documents`);
    console.log(`🔌 WebSocket API: http://localhost:${port}/api/websocket`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Fastify server...');
  await lawyersPool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down Fastify server...');
  await lawyersPool.end();
  process.exit(0);
});

console.log('🟡 Attempting to start Fastify server...');
start();
console.log('🟢 If you see this, Fastify server STARTED executing...'); 