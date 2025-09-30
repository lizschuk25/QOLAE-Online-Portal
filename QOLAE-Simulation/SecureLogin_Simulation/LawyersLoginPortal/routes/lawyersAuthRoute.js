// LawyersLoginPortal/routes/lawyersAuthRoute.js
// 🌉 THE BRIDGE: Lawyers-specific authentication routes
// Author: Claude & Liz 👑
// GDPR CRITICAL: All auth attempts must be logged

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Configure axios to call the SSOT API
axios.defaults.baseURL = 'http://localhost:3011';

export default async function lawyersAuthRoutes(fastify, opts) {
  
  // 🔐 Lawyers Login with PIN (from email click)
  fastify.post('/lawyers-auth/login', async (request, reply) => {
    const { email, pin } = request.body;
    const clientIP = request.ip;
    
    // 📝 GDPR Audit Log
    fastify.log.info({
      event: 'lawyer_login_attempt',
      pin: pin,
      email: email,
      ip: clientIP,
      timestamp: new Date().toISOString(),
      gdpr_category: 'authentication'
    });

    if (!email || !pin) {
      return reply.code(400).send({ 
        success: false, 
        error: 'Email and PIN are required' 
      });
    }

    try {
      // ✅ Validate PIN format first (using SSOT)
      const pinValidation = await axios.post('/api/pin/validate', {
        pin: pin
      });

      if (!pinValidation.data.validation.isValid) {
        fastify.log.warn({
          event: 'invalid_pin_format',
          pin: pin,
          errors: pinValidation.data.validation.errors
        });
        return reply.code(400).send({ 
          success: false, 
          error: 'Invalid PIN format',
          details: pinValidation.data.validation.errors
        });
      }

      // ✅ Call SSOT API for authentication
      const apiResponse = await axios.post('/auth/request-token', {
        email,
        pin,
        source: 'lawyers-portal',
        ip: clientIP
      });

      if (apiResponse.data.success) {
        // Create temporary auth data for 2FA page
        const tempAuthData = jwt.sign(
          {
            pin: pin,
            email: email,
            lawFirm: apiResponse.data.lawyer.lawFirm,
            contactName: apiResponse.data.lawyer.contactName || apiResponse.data.lawyer.name || 'Lawyer',
            step: '2fa_pending',
            gdpr_consent_status: apiResponse.data.lawyer.gdprConsentStatus || 'pending'
          },
          process.env.JWT_SECRET || 'qolae-lawyers-secret-key-2024',
          { expiresIn: '10m' } // Short expiry for security
        );

        // 📝 GDPR Audit: Successful login
        fastify.log.info({
          event: 'lawyer_login_success',
          pin: pin,
          lawFirm: apiResponse.data.lawyer.lawFirm,
          gdpr_consent: apiResponse.data.lawyer.gdprConsentStatus
        });

        return reply.send({
          success: true,
          redirect: `/lawyers-2fa?auth=${encodeURIComponent(tempAuthData)}`,
          email,
          pin,
          lawFirm: apiResponse.data.lawyer.lawFirm,
          contactName: apiResponse.data.lawyer.contactName
        });
      } else {
        // 📝 GDPR Audit: Failed login
        fastify.log.warn({
          event: 'lawyer_login_failed',
          pin: pin,
          error: apiResponse.data.error
        });
        
        return reply.code(401).send({ 
          success: false, 
          error: apiResponse.data.error || 'Authentication failed' 
        });
      }
    } catch (err) {
      // 📝 GDPR Audit: System error
      fastify.log.error({
        event: 'lawyer_login_error',
        pin: pin,
        error: err.message,
        stack: err.stack
      });

      // Handle API validation errors
      if (err.response?.data?.error) {
        return reply.code(err.response?.status || 500).send({ 
          success: false, 
          error: err.response.data.error 
        });
      }
      
      return reply.code(500).send({ 
        success: false, 
        error: 'Authentication service unavailable' 
      });
    }
  });

  // 📧 Request Email Verification Code
  fastify.post('/lawyers-auth/request-email-code', async (request, reply) => {
    const { authToken } = request.body;
    const clientIP = request.ip;

    if (!authToken) {
      return reply.code(400).send({ 
        success: false, 
        error: 'Auth token required' 
      });
    }

    try {
      // Decode the temp auth token
      const authData = jwt.verify(authToken, process.env.JWT_SECRET || 'qolae-lawyers-secret-key-2024');
      
      // Call SSOT API to request verification code
      const apiResponse = await axios.post('/auth/request-email-code', {
        pin: authData.pin,
        email: authData.email,
        source: 'lawyers-portal',
        ip: clientIP
      });

      if (apiResponse.data.success) {
        // 📝 GDPR Audit: Verification code requested
        fastify.log.info({
          event: 'verification_code_requested',
          pin: authData.pin,
          email: authData.email
        });

        return reply.send({
          success: true,
          message: 'Verification code sent to your email',
          lawyer: {
            pin: authData.pin,
            email: authData.email,
            lawFirm: authData.lawFirm,
            contactName: authData.contactName
          }
        });
      } else {
        return reply.code(400).send({ 
          success: false, 
          error: apiResponse.data.error || 'Failed to send verification code' 
        });
      }
    } catch (err) {
      // 📝 GDPR Audit: System error
      fastify.log.error({
        event: 'verification_code_request_error',
        error: err.message
      });

      return reply.code(500).send({ 
        success: false, 
        error: 'Verification code service unavailable' 
      });
    }
  });

  // 🔐 2FA Verification
  fastify.post('/lawyers-auth/verify-2fa', async (request, reply) => {
    const { authToken, verificationCode } = request.body;
    const clientIP = request.ip;

    // 📝 GDPR Audit Log
    fastify.log.info({
      event: '2fa_verification_attempt',
      ip: clientIP,
      timestamp: new Date().toISOString(),
      gdpr_category: 'authentication'
    });

    if (!authToken || !verificationCode) {
      return reply.code(400).send({ 
        success: false, 
        error: 'Auth token and verification code required' 
      });
    }

    try {
      // Decode the temp auth token
      const authData = jwt.verify(authToken, process.env.JWT_SECRET || 'qolae-lawyers-secret-key-2024');
      
      // Call SSOT API for 2FA verification
      const apiResponse = await axios.post('/auth/verify-email-code', {
        pin: authData.pin,
        email: authData.email,
        code: verificationCode,
        source: 'lawyers-portal',
        ip: clientIP
      });

      if (apiResponse.data.success) {
        // Create session token
        const sessionToken = jwt.sign(
          {
            pin: authData.pin,
            email: authData.email,
            lawFirm: authData.lawFirm,
            contactName: authData.contactName,
            role: 'lawyer',
            gdpr_consent: authData.gdpr_consent_status,
            authenticated: true
          },
          process.env.JWT_SECRET || 'qolae-lawyers-secret-key-2024',
          { expiresIn: process.env.SESSION_TIMEOUT || '1d' }
        );

        // 📝 GDPR Audit: Successful 2FA
        fastify.log.info({
          event: '2fa_verification_success',
          pin: authData.pin,
          lawFirm: authData.lawFirm
        });

        // Check if lawyer has completed password setup
        try {
          const { Pool } = await import('pg');
          const pool = new Pool({
            connectionString: process.env.LAWYERS_DATABASE_URL
          });
          
          const result = await pool.query(
            'SELECT password_setup_completed FROM lawyers WHERE pin = $1',
            [authData.pin]
          );
          
          await pool.end();
          
          if (result.rows.length > 0 && result.rows[0].password_setup_completed) {
            // Returning lawyer - redirect to secure login with alert
            return reply.send({
              success: true,
              redirect: `http://localhost:3009/secure-login?pin=${authData.pin}&setup_completed=true`,
              token: sessionToken
            });
          } else {
            // New lawyer - redirect to secure login for password setup
            return reply.send({
              success: true,
              redirect: `http://localhost:3009/secure-login?pin=${authData.pin}&verified=true`,
              token: sessionToken
            });
          }
        } catch (error) {
          console.error('❌ Error checking password setup status:', error);
          // Default to secure login if check fails
          return reply.send({
            success: true,
            redirect: `http://localhost:3009/secure-login?pin=${authData.pin}&verified=true`,
            token: sessionToken
          });
        }
      } else {
        // 📝 GDPR Audit: Failed 2FA
        fastify.log.warn({
          event: '2fa_verification_failed',
          pin: authData.pin,
          error: apiResponse.data.error
        });

        return reply.code(401).send({ 
          success: false, 
          error: apiResponse.data.error || '2FA verification failed' 
        });
      }
    } catch (err) {
      // 📝 GDPR Audit: System error
      fastify.log.error({
        event: '2fa_verification_error',
        error: err.message
      });

      return reply.code(500).send({ 
        success: false, 
        error: '2FA verification service unavailable' 
      });
    }
  });

  // 🔐 Logout
  fastify.post('/lawyers-auth/logout', async (request, reply) => {
    return reply.send({
      success: true,
      redirect: '/LawyersLogin'
    });
  });

  // 🔐 Session Check
  fastify.get('/lawyers-auth/session', async (request, reply) => {
    return reply.code(401).send({ 
      success: false, 
      authenticated: false 
    });
  });
}