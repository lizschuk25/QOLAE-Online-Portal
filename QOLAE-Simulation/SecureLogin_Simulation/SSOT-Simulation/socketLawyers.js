// /var/www/api.qolae.com/socketLawyers.js
import http from 'http';
import { Server } from 'socket.io';
import { createRequire } from 'module';
import { Pool } from 'pg';
const require = createRequire(import.meta.url);

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.LAWYERS_DATABASE_URL,
});

// Test database connection
pool.connect()
  .then(() => console.log("✅ Connected to qolae_lawyers"))
  .catch(err => console.error("❌ DB connection error:", err));

let jwt;
try {
  console.log('[WS] trying to load jsonwebtoken from', process.cwd());
  console.log('[WS] require.resolve(jsonwebtoken)=', require.resolve('jsonwebtoken'));
  jwt = require('jsonwebtoken');
  console.log('[WS] jsonwebtoken loaded OK');
} catch (e) {
  console.error('[WS] jsonwebtoken load error:', e && e.message);
  // keep running without JWT so we can see the log; the upgrade handler will still 4401
}

// --- Socket.IO room helpers ---
function broadcast(room, payload) {
  io.to(room).emit(payload.type || 'update', payload);
}
// optional export if you ever import from same process
export function notifyFirm(pin, payload) { broadcast(`firm:${pin}`, payload); }

// --- HTTP + Socket.IO server ---
const server = http.createServer((req, res) => {
  // 🛡️ CACHE-BUSTING HEADERS - Prevent stale content
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Last-Modified', new Date().toUTCString());
  res.setHeader('ETag', `"${Date.now()}"`);
  
  // Handle basic HTTP requests
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.IO Server Running');
});

const io = new Server(server, {
  path: '/wslawyers/socket.io/',  // Custom path for Lawyers Dashboard
  cors: {
    origin: [
      'https://lawyers.qolae.com',
      'https://admin.qolae.com',
      'http://localhost:3012'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handler
io.on('connection', async (socket) => {
  console.log(`🟢 Lawyers Dashboard Socket.IO connected: ${socket.id}`);

  // 1) Auth from Authorization header
  const authHeader = socket.handshake.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('❌ No JWT token found in Authorization header, disconnecting socket');
    return socket.disconnect(true);
  }
  
  let u; 
  try { 
    u = jwt.verify(token, process.env.JWT_SECRET); 
    console.log(`🔐 JWT verified for user: ${u.email}, PIN: ${u.pin}`);
  } catch (error) { 
    console.log('❌ JWT verification failed:', error.message);
    return socket.disconnect(true); 
  }

  // 2) Join firm room
  const room = `firm:${u.pin}`;
  socket.join(room);
  console.log(`🏢 Lawyers Dashboard: joined room=${room}, socket=${socket.id}`);

  // 3) Initial snapshot (same shape as /workspace/bootstrap)
  try {
    const snapshot = await buildBootstrapForUser(u);
    socket.emit('bootstrap', snapshot);
    console.log(`📊 Bootstrap data sent to ${u.pin}`);
  } catch (error) {
    console.error('❌ Bootstrap error:', error.message);
    socket.emit('toast', { text: 'Bootstrap unavailable.' });
  }

  // 4) Heartbeat (optional)
  const iv = setInterval(() => {
    try { socket.emit('ping', { ts: Date.now() }); } catch {}
  }, 25000);
  socket.on('disconnect', () => {
    clearInterval(iv);
    console.log(`🔌 Lawyers Dashboard disconnected: ${socket.id} from room ${room}`);
  });

  // 5) Workflow event handlers for Lawyers Dashboard
  socket.on('workflow:tob-completed', async (data) => {
    try {
      console.log(`📄 TOB completed for PIN: ${u.pin}`);
      
      // Update database with TOB completion
      await pool.query(
        'UPDATE lawyers SET workflow_stage = 2, updated_at = CURRENT_TIMESTAMP WHERE pin = $1',
        [u.pin]
      );
      
      // Broadcast to admin dashboard
      broadcast(`firm:${u.pin}`, {
        type: 'workflow-update',
        stage: 'tob',
        completed: true,
        timestamp: new Date().toISOString()
      });
      
      socket.emit('toast', { text: 'TOB workflow completed successfully!' });
    } catch (error) {
      console.error('❌ TOB completion error:', error.message);
      socket.emit('toast', { text: 'Failed to update TOB status' });
    }
  });

  socket.on('workflow:payment-completed', async (data) => {
    try {
      console.log(`💳 Payment completed for PIN: ${u.pin}`);
      
      // Update database with payment completion
      await pool.query(
        'UPDATE lawyers SET workflow_stage = 3, updated_at = CURRENT_TIMESTAMP WHERE pin = $1',
        [u.pin]
      );
      
      // Broadcast to admin dashboard
      broadcast(`firm:${u.pin}`, {
        type: 'workflow-update',
        stage: 'payment',
        completed: true,
        timestamp: new Date().toISOString()
      });
      
      socket.emit('toast', { text: 'Payment workflow completed successfully!' });
    } catch (error) {
      console.error('❌ Payment completion error:', error.message);
      socket.emit('toast', { text: 'Failed to update payment status' });
    }
  });

  socket.on('workflow:consent-completed', async (data) => {
    try {
      console.log(`📋 Consent completed for PIN: ${u.pin}`);
      
      // Update database with consent completion
      await pool.query(
        'UPDATE lawyers SET workflow_stage = 4, updated_at = CURRENT_TIMESTAMP WHERE pin = $1',
        [u.pin]
      );
      
      // Broadcast to admin dashboard
      broadcast(`firm:${u.pin}`, {
        type: 'workflow-update',
        stage: 'consent',
        completed: true,
        timestamp: new Date().toISOString()
      });
      
      socket.emit('toast', { text: 'Consent workflow completed successfully!' });
    } catch (error) {
      console.error('❌ Consent completion error:', error.message);
      socket.emit('toast', { text: 'Failed to update consent status' });
    }
  });

  // Database health check event
  socket.on('db:health', async () => {
    try {
      const result = await pool.query('SELECT current_database(), current_user');
      socket.emit('db:health-response', {
        success: true,
        database: result.rows[0].current_database,
        user: result.rows[0].current_user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Database health check error:', error.message);
      socket.emit('db:health-response', {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 6) Optional client prefs
  socket.on('pref:email', async (data) => {
    try {
      // persist preference for u.email...
      socket.emit('toast', { text: data.optIn ? 'Email notifications ON' : 'Email notifications OFF' });
    } catch {}
  });
});

// HTTP endpoint for external broadcasts (e.g., from other services)
server.on('request', async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/workspace/emit') return;

  // ✅ Localhost-only guard (no key needed)
  const ip = req.socket.remoteAddress;
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLocal) { res.writeHead(403); return res.end('local only'); }

  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    const { pin, payload } = JSON.parse(body || '{}');
    if (!pin || !payload) { res.writeHead(400); return res.end('bad request'); }

    // Broadcast to Socket.IO room
    broadcast(`firm:${pin}`, payload);
    console.log('[Socket.IO] broadcast → room=', `firm:${pin}`, 'type=', payload?.type);

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch {
    res.writeHead(400); res.end('bad request');
  }
});

// Build bootstrap data from qolae_lawyers database
async function buildBootstrapForUser(u) {
  try {
    console.log(`📊 Building bootstrap for PIN: ${u.pin}`);
    
    // Fetch lawyer data from qolae_lawyers database
    const result = await pool.query(
      'SELECT * FROM lawyers WHERE pin = $1',
      [u.pin]
    );
    
    if (result.rows.length === 0) {
      console.error(`❌ Lawyer not found for PIN: ${u.pin}`);
      return {
        valid: false,
        error: 'Lawyer not found in database'
      };
    }
    
    const lawyer = result.rows[0];
    
    // Determine workflow completion status based on database fields
    const tobCompleted = lawyer.workflow_stage >= 2; // Assuming stage 2+ means TOB completed
    const paymentCompleted = lawyer.workflow_stage >= 3; // Assuming stage 3+ means payment completed
    const consentCompleted = lawyer.workflow_stage >= 4; // Assuming stage 4+ means consent completed
    
    return {
      valid: true,
      user: { 
        contactName: lawyer.contact_name, 
        email: lawyer.email, 
        pin: lawyer.pin, 
        lawFirm: lawyer.law_firm 
      },
      branding: {},
      gates: { 
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
      },
      features: { 
        consentForms: true, 
        referrals: false, 
        uploads: false 
      },
      links: {},
      settings: { 
        emailOptIn: true,
        workflowStage: lawyer.workflow_stage || 1
      }
    };
  } catch (error) {
    console.error('❌ Bootstrap error:', error.message);
    return {
      valid: false,
      error: 'Failed to load user data from database'
    };
  }
}

server.listen(3012, () => {
  console.log('🔌 Lawyers Dashboard Socket.IO server running on port 3012');
  console.log('📍 Socket.IO path: /wslawyers/socket.io/');
  console.log('🌐 CORS origins: https://lawyers.qolae.com, http://localhost:3002');
  console.log('🗄️ Connected to qolae_lawyers PostgreSQL database via pg');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Lawyers Dashboard Socket.IO server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down Lawyers Dashboard Socket.IO server...');
  await pool.end();
  process.exit(0);
});
