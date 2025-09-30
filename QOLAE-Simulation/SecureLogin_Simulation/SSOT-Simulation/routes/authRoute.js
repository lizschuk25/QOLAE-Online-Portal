import { PrismaClient } from '@prisma/client';
import { generateAuthToken } from '../controllers/authController.js';
import { sendVerificationCode } from '../controllers/emailController.js';
const prisma = new PrismaClient();

export default async function (fastify, opts) {
 
  // ... rest of your existing routes
  // Generate auth token route
  fastify.post('/generate-token', generateAuthToken);

  // Request email verification code
  fastify.post('/request-email-code', async (request, reply) => {
    const { pin, email } = request.body;

    if (!pin || !email) {
      return reply.status(400).send({ error: 'PIN and email required' });
    }

    // ✅ VALIDATION STEP 1: Check PIN format (e.g., ABC-123456)
    if (!pin.match(/^[A-Z]{2,4}-\d{6}$/)) {
      return reply.status(400).send({ 
        error: 'Invalid PIN format. Please use the PIN from your email.' 
      });
    }

    try {
      // 🎭 SIMULATION MODE: Skip database operations
      if (process.env.NODE_ENV === 'simulation') {
        console.log('🎭 SIMULATION MODE: Mocking verification code generation');
        console.log(`   📧 PIN: ${pin}`);
        console.log(`   📧 Email: ${email}`);
        
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`   🔢 Verification Code: ${code}`);
        
        // Mock successful response
        return reply.send({
          success: true,
          message: 'Verification code sent successfully (SIMULATION)',
          code: code,
          expiresIn: '10 minutes'
        });
      }

      // ✅ VALIDATION STEP 2: Check if lawyer exists in database
      const lawyer = await prisma.Lawyer.findUnique({
        where: { pin: pin },
        select: {
          pin: true,
          email: true,
          lawFirm: true,
          contactName: true
        }
      });

      if (!lawyer) {
        return reply.status(401).send({ 
          error: 'PIN not found. Please check your email for the correct PIN.' 
        });
      }

      // ✅ VALIDATION STEP 3: Check email matches PIN registration
      if (email.toLowerCase() !== lawyer.email.toLowerCase()) {
        return reply.status(401).send({ 
          error: 'Email does not match the PIN registration.' 
        });
      }

      // ✅ VALIDATION STEP 4: Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now
      
      console.log('🔍 Generated verification code:', code, 'for PIN:', pin, 'Email:', email);

      // Store the verification code in qolae_lawyers database (raw SQL)
      console.log('🔍 About to store verification code in qolae_lawyers...');
      try {
        const { Pool } = await import('pg');
        console.log('🔍 Creating database pool...');
        const pool = new Pool({
          connectionString: process.env.LAWYERS_DATABASE_URL
        });
        
        console.log('🔍 Executing INSERT query...');
        const result = await pool.query(
          `INSERT INTO email_verification (pin, email, code, expires_at, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [pin, email, code, expiresAt]
        );
        
        console.log('🔍 Query result:', result);
        await pool.end();
        console.log('✅ Verification code stored in qolae_lawyers database');
      } catch (dbError) {
        console.error('❌ Database error storing verification code:', dbError);
        console.error('❌ Error details:', dbError.message);
        console.error('❌ Error code:', dbError.code);
        // If database fails, still proceed with email sending
        // The code is already generated and logged
      }

      console.log(`✅ Email verification code for ${email} (${lawyer.lawFirm}): ${code}`);

      // ✅ Send verification code email
      try {
        const emailResult = await sendVerificationCode(
          email, 
          code, 
          lawyer.contactName, 
          lawyer.lawFirm
        );
        console.log('📧 Email sent successfully:', emailResult.messageId);
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
        // Don't fail the request - user can still see code in console
        // But log the error for debugging
      }

      return reply.send({ 
        success: true,
        message: 'Verification code sent to your email',
        lawyer: {
          pin: lawyer.pin,
          email: lawyer.email,
          lawFirm: lawyer.lawFirm,
          contactName: lawyer.contactName
        }
      });
    } catch (err) {
      console.error('❌ Error generating email code:', err);
      return reply.status(500).send({ error: 'Failed to generate verification code' });
    }
  });

  fastify.post('/request-token', async (request, reply) => {
    const { email, pin, password, source, skipTwoFactor } = request.body;

    if (!email || !pin) {
      return reply.status(400).send({ error: 'Email and PIN required' });
    }

    // ✅ VALIDATION STEP 1: Check PIN format (e.g., ABC-123456)
    if (!pin.match(/^[A-Z]{2,4}-\d{6}$/)) {
      return reply.status(400).send({ 
        error: 'Invalid PIN format. Please use the PIN from your email.' 
      });
    }

    try {
      // ✅ VALIDATION STEP 2: Check if lawyer exists in database
      const lawyer = await prisma.Lawyer.findUnique({
        where: { pin: pin },
        select: {
          pin: true,
          email: true,
          lawFirm: true,
          contactName: true
        }
      });

      if (!lawyer) {
        return reply.status(401).send({ 
          error: 'PIN not found. Please check your email for the correct PIN.' 
        });
      }

      // ✅ VALIDATION STEP 3: Check email matches PIN registration
      if (email.toLowerCase() !== lawyer.email.toLowerCase()) {
        return reply.status(401).send({ 
          error: 'Email does not match the PIN registration.' 
        });
      }

      // ✅ VALIDATION STEP 4: Generate JWT token for Lawyers Dashboard
      const accessToken = fastify.jwt.sign({
        email,
        pin,
        contactName: lawyer.contactName,
        lawFirm: lawyer.lawFirm,
        verified: true,
        type: 'access',
        source: source || 'lawyers-dashboard'
      }, {
        expiresIn: '1h'
      });

      // ✅ Create refresh token (24 hours)
      const refreshToken = fastify.jwt.sign({
        email,
        pin,
        type: 'refresh',
        source: source || 'lawyers-dashboard'
      }, {
        expiresIn: '24h'
      });

      console.log(`✅ JWT token generated for ${email} (${lawyer.lawFirm})`);
      console.log(`🔑 Access token: ${accessToken.substring(0, 20)}...`);
      console.log(`🔄 Refresh token: ${refreshToken.substring(0, 20)}...`);

      return reply.send({ 
        success: true,
        token: accessToken, // Return access token as 'token' for compatibility
        accessToken: accessToken,
        refreshToken: refreshToken,
        lawyer: {
          pin: lawyer.pin,
          email: lawyer.email,
          lawFirm: lawyer.lawFirm,
          contactName: lawyer.contactName
        }
      });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to generate token' });
    }
  });

 fastify.post('/verify2fa', async (request, reply) => {
    const { email, pin, token } = request.body;

    if (!email || !pin || !token) {
      return reply.status(400).send({ error: 'Email, PIN and token are required.' });
    }
 
    try {
      const record = await prisma.authVerificationToken.findFirst({
        where: {
          email,
          pin,
          token,
          expiresAt: { gte: new Date() }
        }
      });

      if (!record) {
        return reply.status(401).send({ error: 'Invalid or expired token.' });
      }

      // ✅ Invalidate token after use
      await prisma.authVerificationToken.delete({
        where: { id: record.id }
      });

      // ✅ Create JWT
      const jwt = fastify.jwt.sign({
        email,
        pin,
        verified: true
      }, {
        expiresIn: '1h'
      });

      return reply.send({
        success: true,
        token: jwt
      });

    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Token verification failed.' });
    }
  });

  fastify.post('/verify-email-code', async (request, reply) => {
    const { email, pin, code } = request.body;

    if (!email || !pin || !code) {
      return reply.status(400).send({ error: 'Email, PIN and code are required.' });
    }

    try {
      // Find the verification code in qolae_lawyers database (raw SQL)
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.LAWYERS_DATABASE_URL
      });
      
      const result = await pool.query(
        `SELECT * FROM email_verification 
         WHERE pin = $1 AND email = $2 AND code = $3 
         AND expires_at > NOW()`,
        [pin, email, code]
      );
      
      if (result.rows.length === 0) {
        await pool.end();
        return reply.status(401).send({ error: 'Invalid or expired verification code.' });
      }
      
      const record = result.rows[0];

      // ✅ Delete the verification code after successful use
      await pool.query(
        'DELETE FROM email_verification WHERE id = $1',
        [record.id]
      );
      
      await pool.end();

      // ✅ Look up lawyer data for JWT
      const lawyer = await prisma.Lawyer.findUnique({
        where: { pin },
        select: { contactName: true, lawFirm: true }
      });

      // ✅ Create JWT with full lawyer data
      const accessToken = fastify.jwt.sign({
        email,
        pin,
        contactName: lawyer?.contactName || null,
        lawFirm: lawyer?.lawFirm || null,
        verified: true,
        type: 'access'
      }, {
        expiresIn: '1h'
      });

      // ✅ Create refresh token (24 hours)
      const refreshToken = fastify.jwt.sign({
        email,
        pin,
        type: 'refresh'
      }, {
        expiresIn: '24h'
      });

      // ✅ Store refresh token in database for tracking
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.LAWYERS_DATABASE_URL
        });
        
        // Hash the refresh token for secure storage
        const crypto = await import('crypto');
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        
        // Insert the new refresh token (token_hash is unique, so this will fail if duplicate)
        await pool.query(
          `INSERT INTO refresh_tokens (pin, email, token_hash, expires_at, session_started_at, ip_address, user_agent) 
           VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
          [pin, email, tokenHash, new Date(Date.now() + 24 * 60 * 60 * 1000), request.ip, request.headers['user-agent']]
        );
        
        await pool.end();
        console.log('✅ Refresh token stored in database');
      } catch (dbError) {
        console.error('❌ Database error storing refresh token:', dbError);
        // Continue even if database fails
      }

      console.log('🔑 Access token generated:', accessToken.substring(0, 20) + '...');
      console.log('🔄 Refresh token generated:', refreshToken.substring(0, 20) + '...');

      // ✅ Return JWT tokens in response body (no cookies)
      return reply.send({
        success: true,
        message: 'Verification successful',
        accessToken: accessToken,
        refreshToken: refreshToken,
        redirect: '/LawyersDashboard'
      });

    } catch (err) {
      console.error('❌ Email verification error:', err);
      return reply.status(500).send({ error: 'Verification failed' });
    }
  });

  // ✅ SSOT-friendly verify-session (token from body only)
  fastify.post('/verify-session', async (request, reply) => {
    // Accept token from body only
    const bearer = request.body?.token;
    if (!bearer) {
      return reply.status(400).send({ valid: false, error: 'No session' });
    }

    try {
      const decoded = fastify.jwt.verify(bearer);

      const lawyer = await prisma.Lawyer.findUnique({
        where: { pin: decoded.pin },
        select: { pin: true, email: true, lawFirm: true, contactName: true }
      });

      if (!lawyer) return reply.status(401).send({ valid: false, error: 'Lawyer not found' });

      return reply.send({
        valid: true,
        user: {
          email: decoded.email,
          pin: decoded.pin,
          lawFirm: lawyer.lawFirm,
          contactName: lawyer.contactName,
          verified: decoded.verified
        }
      });

    } catch (err) {
      console.error('❌ Token verification failed:', err);
      return reply.send({ valid: false, error: 'Invalid token' });
    }
  });

  // ✅ SSOT Gate Route - API decides access, not the Dashboard
  fastify.get('/gate', async (request, reply) => {
    const dest = String(request.query?.redirect || '/LawyersLogin');

    // Allowlist to prevent open redirects
    const ALLOW = ['/lawyers.qolae.com', '/admin.qolae.com'];
    if (!ALLOW.some(p => dest.startsWith(p))) {
      return reply.code(400).send('Invalid redirect');
    }

    const t = request.headers.authorization?.split(' ')[1];
    if (!t) return reply.redirect('/LawyersLogin');

    try {
      fastify.jwt.verify(t);
      return reply.redirect(dest);   // ✅ SSOT blesses, continue
    } catch {
      return reply.redirect('/LawyersLogin');
    }
  });

  // ✅ Session probe (for sanity while testing)
  fastify.get('/session', async (request, reply) => {
    const t = request.headers.authorization?.split(' ')[1];
    if (!t) return reply.code(401).send({ valid: false });
    try {
      const u = fastify.jwt.verify(t);
      return reply.send({ valid: true, user: { email: u.email, pin: u.pin } });
    } catch {
      return reply.code(401).send({ valid: false });
    }
  });

  // ✅ Test endpoint for database connection
  fastify.get('/test-db', async (request, reply) => {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.LAWYERS_DATABASE_URL
      });
      
      const result = await pool.query('SELECT COUNT(*) as count FROM email_verification');
      await pool.end();
      
      return reply.send({ 
        success: true, 
        message: 'Database connection successful',
        count: result.rows[0].count 
      });
    } catch (error) {
      console.error('❌ Database test error:', error);
      return reply.status(500).send({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // ✅ Refresh token endpoint
  fastify.post('/refresh-token', async (request, reply) => {
    const refreshToken = request.body?.refreshToken;
    
    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token provided' });
    }

    try {
      // Verify refresh token
      const decoded = fastify.jwt.verify(refreshToken);
      
      if (decoded.type !== 'refresh') {
        return reply.status(401).send({ error: 'Invalid token type' });
      }

      // Check refresh token in database
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.LAWYERS_DATABASE_URL
      });
      
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      
      const result = await pool.query(
        `SELECT * FROM refresh_tokens 
         WHERE token_hash = $1 AND pin = $2 AND is_revoked = FALSE AND expires_at > NOW()`,
        [tokenHash, decoded.pin]
      );
      
      if (result.rows.length === 0) {
        await pool.end();
        return reply.status(401).send({ error: 'Invalid or expired refresh token' });
      }

      const tokenRecord = result.rows[0];
      
      // Check 12-hour session limit
      const sessionDuration = Math.floor((Date.now() - new Date(tokenRecord.session_started_at).getTime()) / 1000);
      const maxSessionDuration = 12 * 60 * 60; // 12 hours in seconds
      
      if (sessionDuration > maxSessionDuration) {
        // Revoke token and end session
        await pool.query(
          'UPDATE refresh_tokens SET is_revoked = TRUE, revoked_at = NOW(), revoked_reason = $1 WHERE id = $2',
          ['max_session_exceeded', tokenRecord.id]
        );
        
        await pool.end();
        return reply.status(401).send({ error: 'Maximum session duration exceeded (12 hours)' });
      }

      // Look up lawyer data for new access token
      const lawyer = await prisma.Lawyer.findUnique({
        where: { pin: decoded.pin },
        select: { contactName: true, lawFirm: true }
      });

      if (!lawyer) {
        await pool.end();
        return reply.status(401).send({ error: 'Lawyer not found' });
      }

      // Create new access token
      const newAccessToken = fastify.jwt.sign({
        email: decoded.email,
        pin: decoded.pin,
        contactName: lawyer.contactName,
        lawFirm: lawyer.lawFirm,
        verified: true,
        type: 'access'
      }, {
        expiresIn: '1h'
      });

      // Update refresh token usage
      await pool.query(
        'UPDATE refresh_tokens SET last_used_at = NOW(), total_session_time = $1 WHERE id = $2',
        [sessionDuration, tokenRecord.id]
      );

      // Log refresh event
      await pool.query(
        `INSERT INTO token_refresh_events (refresh_token_id, pin, event_type, success, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tokenRecord.id, decoded.pin, 'refresh', true, request.ip, request.headers['user-agent']]
      );
      
      await pool.end();

      console.log('🔄 Token refreshed successfully for PIN:', decoded.pin, 'Session duration:', Math.floor(sessionDuration / 60), 'minutes');

      return reply.send({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
        sessionDuration: Math.floor(sessionDuration / 60), // minutes
        maxSessionDuration: 12 * 60 // minutes
      });

    } catch (err) {
      console.error('❌ Token refresh failed:', err);
      return reply.status(401).send({ error: 'Invalid or expired refresh token' });
    }
  });

  // ✅ Get stored JWT token for bootstrap
  fastify.get('/get-stored-token', async (request, reply) => {
    const { pin } = request.query;
    
    if (!pin) {
      return reply.status(400).send({ error: 'PIN required' });
    }
    
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.LAWYERS_DATABASE_URL
      });
      
      // Get stored refresh token from database
      const tokenResult = await pool.query(
        'SELECT token_hash, expires_at, session_started_at FROM refresh_tokens WHERE pin = $1 AND expires_at > NOW() AND is_revoked = FALSE',
        [pin]
      );
      
      await pool.end();
      
      if (tokenResult.rows.length === 0) {
        return reply.status(401).send({ error: 'No valid JWT token found' });
      }
      
      const { token_hash, expires_at, session_started_at } = tokenResult.rows[0];
      
      // Generate new access token for this request
      const lawyer = await prisma.Lawyer.findUnique({
        where: { pin },
        select: { contactName: true, lawFirm: true, email: true }
      });
      
      if (!lawyer) {
        return reply.status(404).send({ error: 'Lawyer not found' });
      }
      
      const accessToken = fastify.jwt.sign({
        email: lawyer.email,
        pin,
        contactName: lawyer.contactName,
        lawFirm: lawyer.lawFirm,
        verified: true,
        type: 'access',
        source: 'lawyers-dashboard'
      }, {
        expiresIn: '1h'
      });
      
      return reply.send({
        success: true,
        accessToken: accessToken,
        expiresAt: expires_at,
        sessionStartedAt: session_started_at
      });
      
    } catch (error) {
      console.error('❌ Get stored token error:', error);
      return reply.status(500).send({ error: 'Failed to retrieve stored token' });
    }
  });

  // ✅ Logout (no cookies to clear)
  fastify.get('/logout', async (request, reply) => {
    return reply.send({ success: true, message: 'Logged out successfully' });
  });
}
