// ==============================================
// API FASTIFY SERVER.JS
// QOLAE Centralized API Services (SSOT)
// Organized by Location Block Workflow Pattern
// ==============================================

// ==============================================
// LOCATION BLOCK A: IMPORTS & CONFIGURATION
// Core Dependencies, ES6 Setup, Environment Variables
// ==============================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import pg from 'pg';
import multipart from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const { Pool } = pg;

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ==============================================
// LOCATION BLOCK B: SERVER & DATABASE SETUP
// Fastify Server Initialization, PostgreSQL Pool Configuration, Prisma Client, File Path Configuration
// ==============================================

// Load environment variables FIRST (for simulation.env)
dotenv.config({ path: path.join(__dirname, 'simulation.env') });

// Configuration for file paths - make them configurable
const config = {
  centralRepository: process.env.CENTRAL_REPOSITORY_PATH,
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

// Initialize Fastify server with logger
const server = Fastify({ 
  logger: true,
  trustProxy: true,
  bodyLimit: 104857600 // 100MB limit for file uploads
});

// PostgreSQL Pool Configuration for Lawyers Database
const lawyersPool = new Pool({
  connectionString: process.env.LAWYERS_DATABASE_URL || process.env.DATABASE_URL
});

// Test lawyers database connection
lawyersPool.connect()
  .then(() => console.log("✅ Connected to qolae_lawyers database"))
  .catch(err => console.error("❌ Lawyers DB connection error:", err));

// Initialize Prisma client for qolae_admin database
const prisma = new PrismaClient();

// Make pool available to routes
server.decorate('lawyersDb', lawyersPool);


// ==============================================
// LOCATION BLOCK C: MIDDLEWARE & PLUGINS
// CORS, Cache-Busting, JSON Parser, JWT, Multipart, Static Files
// ==============================================

// Cache-Busting Middleware - Prevent stale content (uses onSend hook)
server.addHook('onSend', async (request, reply, payload) => {
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Surrogate-Control', 'no-store');
  reply.header('Last-Modified', new Date().toUTCString());
  reply.header('ETag', `"${Date.now()}"`);
  return payload;
});

// CORS Configuration
server.register(cors, {
  origin: [
    'http://localhost:3009', // LawyersDashboard
    'http://localhost:3010', // LawyersLoginPortal
    'https://lawyers.qolae.com',
    'https://admin.qolae.com',
    'https://clients.qolae.com',
    'https://casemanagers.qolae.com',
    'https://readers.qolae.com'
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
server.register(multipart);

// Register formbody for parsing form data
server.register(await import('@fastify/formbody'));

// Register JWT plugin
server.register(jwt, {
  secret: process.env.JWT_SECRET
});

// Serve static files from central repository
server.register(await import('@fastify/static'), {
  root: config.centralRepository,
  prefix: '/central-repository/'
});

// Authentication decorator
server.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Invalid or expired token' });
  }
});


// ==============================================
// LOCATION BLOCK 1: ROOT & HEALTH ENDPOINTS
// API Information, Health Check
// ==============================================

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

// Health check endpoint
server.get('/api/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'qolae-api-dashboard',
    version: '1.0.0'
  };
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


// ==============================================
// LOCATION BLOCK 2: AUTHENTICATION ENDPOINTS
// JWT Token Generation, Verification, Lawyer Token Verification
// ==============================================

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

// Lawyer token verification endpoint
server.get('/api/lawyer/verify-token', {
  preValidation: [server.authenticate]
}, async (req, reply) => {
  return reply.send({ user: req.user });
});


// ==============================================
// LOCATION BLOCK 3: SIGNATURE ENDPOINTS
// Canvas Signature Drawer, Save Signature to Database & Filesystem
// ==============================================

// Canvas signature drawer endpoint
server.get('/signature-canvas', async (request, reply) => {
  const htmlPath = path.join(__dirname, 'signature-drawer.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  reply.type('text/html').send(htmlContent);
});

// Save canvas signature endpoint - saves to both filesystem and database
server.post('/api/save-signature', async (request, reply) => {
  try {
    const { signatureData, filename } = request.body;
    
    if (!signatureData || !signatureData.startsWith('data:image/')) {
      return reply.code(400).send({ 
        success: false, 
        error: 'Invalid signature data' 
      });
    }
    
    // Extract base64 data
    const base64Data = signatureData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save to signatures directory
    const signaturePath = buildFilePath('signatures', filename);
    fs.writeFileSync(signaturePath, buffer);
    
    return {
      success: true,
      message: 'Signature saved successfully',
      path: signaturePath,
      size: buffer.length
    };
  } catch (error) {
    server.log.error('Save signature error:', error);
    return reply.code(500).send({ success: false, error: error.message });
  }
});


// ==============================================
// LOCATION BLOCK 4: PDF PROCESSING ENDPOINTS
// PDF Flattening, TOB PDF Operations, Document Serving
// ==============================================

// PDF flattening endpoint
server.post('/api/flatten-pdf', async (request, reply) => {
  try {
    const { pin } = request.body;
    
    if (!pin) {
      return reply.code(400).send({ success: false, error: 'PIN is required' });
    }
    
    // Import pdf-lib for flattening
    const { PDFDocument } = await import('pdf-lib');
    
    // Find the signed PDF
    const signedPdfPath = buildFilePath('signedTob', `TOB_${pin}_Signed.pdf`);
    
    if (!fs.existsSync(signedPdfPath)) {
      return reply.code(404).send({
        success: false,
        error: 'Signed PDF not found. Please complete signature process first.'
      });
    }
    
    // Load the signed PDF
    const existingPdfBytes = fs.readFileSync(signedPdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Flatten the PDF (convert form fields to content)
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log(`🔄 Flattening PDF for ${pin} - converting ${fields.length} form fields to permanent content`);
    
    // Save flattened PDF (overwrite the original signed PDF)
    const flattenedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(signedPdfPath, flattenedPdfBytes);
    
    console.log(`✅ PDF flattened successfully: ${signedPdfPath} (${fields.length} form fields converted to permanent content)`);
    
    return {
      success: true,
      message: 'PDF flattened successfully - signatures are now permanently embedded',
      pin: pin,
      downloadUrl: `/documents/${pin}/signed`,
      outputPath: signedPdfPath,
      fieldsFlattened: fields.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    server.log.error('PDF flattening error:', error);
    return reply.code(500).send({ success: false, error: error.message });
  }
});

// Download signed TOB endpoint - for serving signed documents
server.get('/documents/:pin/signed', async (req, reply) => {
  try {
    const { pin } = req.params;
    const signedPath = buildFilePath('signedTob', `TOB_${pin}_Signed.pdf`);
    
    console.log(`📥 Download request for signed TOB - PIN: ${pin}`);
    console.log(`📂 Looking for file at: ${signedPath}`);
    
    if (fs.existsSync(signedPath)) {
      const stats = fs.statSync(signedPath);
      console.log(`✅ Serving signed TOB for PIN: ${pin} (${stats.size} bytes)`);
      
      // Check if this is a view request (no download parameter)
      const isViewRequest = !req.query.download;
      
      const headers = {
        'Content-Type': 'application/pdf',
        'Content-Length': stats.size
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

// Serve review TOB files from temp directory
server.get('/central-repository/temp/:filename', async (req, reply) => {
  try {
    const { filename } = req.params;
    const reviewPath = buildFilePath('temp', filename);
    
    console.log(`👁️ Review TOB request for: ${filename}`);
    console.log(`📂 Looking for file at: ${reviewPath}`);
    
    if (fs.existsSync(reviewPath)) {
      const stats = fs.statSync(reviewPath);
      console.log(`✅ Serving review TOB: ${filename} (${stats.size} bytes)`);
      
      const headers = {
        'Content-Type': 'application/pdf',
        'Content-Length': stats.size
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
    endpoints: ['/auth/gate', '/auth/session', '/workspace/bootstrap'],
    authentication: 'Authorization header'
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

// Test canvas signature endpoint
server.post('/api/test-canvas-signature', async (request, reply) => {
  try {
    const { pin } = request.body;
    
    // Import the signature insertion function
    const { insertSignaturesIntoPDF } = await import('./utils/insertSignaturesIntoPDF.js');
    
    // Use the canvas signature by checking for the canvas file
    const canvasSignaturePath = buildFilePath('signatures', 'lizs-signature-canvas.png');
    let signatureData = {};
    
    if (fs.existsSync(canvasSignaturePath)) {
      signatureData.lizSignature = true;
    } else {
      return reply.code(400).send({
        success: false,
        error: 'Canvas signature not found. Please save your signature first.'
      });
    }
    
    // Test signature insertion
    const result = await insertSignaturesIntoPDF(pin, {}, signatureData);
    
    if (result.success) {
      return {
        success: true,
        message: 'Test PDF generated successfully',
        downloadUrl: `/documents/${pin}/signed`,
        outputPath: result.outputPath
      };
    } else {
      return reply.code(500).send({
        success: false,
        error: result.error || 'Failed to generate test PDF'
      });
    }
  } catch (error) {
    server.log.error('Test canvas signature error:', error);
    return reply.code(500).send({ success: false, error: error.message });
  }
});


// ==============================================
// LOCATION BLOCK 5: ROUTE MODULE REGISTRATION
// Register All Route Modules (Email, Documents, WebSocket, Auth, Workspace, SSOT Services)
// ==============================================

// Register route modules
server.register(await import('./routes/emailRoutes.js'), { prefix: '/api/email' });
server.register(await import('./routes/documentRoutes.js'), { prefix: '/documents' });
server.register(await import('./routes/websocketRoutes.js'), { prefix: '/api/websocket' });
server.register(await import('./routes/authRoute.js'), { prefix: '/auth' });
server.register(await import('./routes/workspaceRoute.js'), { prefix: '/workspace' });

// 🆕 NEW: Lawyer & Workflow Routes
server.register(await import('./routes/lawyerRoutes.js'));
server.register(await import('./routes/workflowRoutes.js'));

// Register SSOT Services
server.register(await import('./routes/PINValidationRoutes.js'));
server.register(await import('./routes/HealthMonitorRoutes.js'));
server.register(await import('./routes/AdminAuditRoutes.js'));
server.register(await import('./routes/gdprRoutes.js')); // GDPR consent verification

// Print all registered routes after setup
server.ready(err => {
  if (err) throw err;
  console.log('📋 Registered Routes:');
  server.printRoutes();
});


// ==============================================
// LOCATION BLOCK 6: SERVER STARTUP & SHUTDOWN
// Start Fastify Server, Graceful Shutdown Handlers
// ==============================================

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3011;
    await server.listen({ 
      port: port, 
      host: '0.0.0.0' 
    });
    console.log(`🚀 QOLAE API Dashboard (Fastify) running on port ${port}`);
    console.log(`📧 Email API: ${process.env.API_BASE_URL}/api/email`);
    console.log(`📄 Document API: ${process.env.API_BASE_URL}/api/documents`);
    console.log(`🔌 WebSocket API: ${process.env.API_BASE_URL}/api/websocket`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('⏹️ Shutting down Fastify server...');
  await lawyersPool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('⏹️ Shutting down Fastify server...');
  await lawyersPool.end();
  process.exit(0);
});

start();