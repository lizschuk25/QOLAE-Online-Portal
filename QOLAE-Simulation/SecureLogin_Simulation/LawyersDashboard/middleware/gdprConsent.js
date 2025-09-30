// LawyersDashboard/middleware/gdprConsent.js
// 🛡️ GDPR CONSENT FIREWALL - Medical Data Protection
// Author: Claude & Liz 👑
// CRITICAL: Article 9 Special Category Data Protection

import axios from 'axios';

/**
 * GDPR Consent Firewall Middleware
 * CRITICAL: Protects Article 9 Special Category Data (Medical Information)
 * 
 * This middleware ensures:
 * 1. User has given explicit consent for medical data processing
 * 2. Consent is current and valid (not withdrawn)
 * 3. Purpose limitation is enforced
 * 4. All access is logged for GDPR audit trails
 */
export class GDPRConsentFirewall {
  constructor(fastify) {
    this.fastify = fastify;
    this.requiredConsents = {
      medical_data: 'Medical data processing for legal case preparation',
      document_storage: 'Secure document storage and processing',
      third_party_sharing: 'Sharing with case managers and medical experts',
      data_retention: 'Data retention for legal and regulatory compliance'
    };
  }

  /**
   * Main consent verification middleware
   * @param {string[]} requiredConsents - Array of consent types required
   * @returns {Function} Fastify middleware function
   */
  requireConsent(requiredConsents = ['medical_data']) {
    return async (request, reply) => {
      const startTime = Date.now();
      const userPin = this.extractUserPin(request);
      const userIP = request.ip;
      const endpoint = request.url;

      // 📝 GDPR Audit Log - Access Attempt
      this.fastify.log.info({
        event: 'gdpr_access_attempt',
        pin: userPin,
        endpoint: endpoint,
        ip: userIP,
        requiredConsents: requiredConsents,
        timestamp: new Date().toISOString(),
        gdpr_category: 'consent_verification'
      });

      try {
        // Check consent status via SSOT API
        const consentCheck = await this.verifyUserConsent(userPin, requiredConsents);
        
        if (!consentCheck.valid) {
          // 📝 GDPR Audit Log - Access Denied
          this.fastify.log.warn({
            event: 'gdpr_access_denied',
            pin: userPin,
            endpoint: endpoint,
            reason: consentCheck.reason,
            missingConsents: consentCheck.missingConsents,
            gdpr_violation_risk: 'high'
          });

          return reply.code(403).send({
            error: 'GDPR Consent Required',
            message: 'Access to medical data requires explicit consent',
            consentRequired: true,
            missingConsents: consentCheck.missingConsents,
            consentUrl: `/consent?pin=${userPin}&redirect=${encodeURIComponent(endpoint)}`,
            gdprNotice: 'This request involves special category data under GDPR Article 9'
          });
        }

        // 📝 GDPR Audit Log - Access Granted
        this.fastify.log.info({
          event: 'gdpr_access_granted',
          pin: userPin,
          endpoint: endpoint,
          consentTypes: requiredConsents,
          responseTime: Date.now() - startTime,
          gdpr_compliance: 'verified'
        });

        // Add consent info to request for downstream handlers
        request.gdprConsent = {
          valid: true,
          consents: consentCheck.consents,
          verifiedAt: new Date().toISOString(),
          userPin: userPin
        };

        return; // Continue to next handler

      } catch (error) {
        // 📝 GDPR Audit Log - System Error
        this.fastify.log.error({
          event: 'gdpr_verification_error',
          pin: userPin,
          endpoint: endpoint,
          error: error.message,
          gdpr_risk: 'critical_system_failure'
        });

        // Fail secure - deny access on consent verification failure
        return reply.code(500).send({
          error: 'Consent Verification Failed',
          message: 'Unable to verify GDPR compliance. Access denied for safety.',
          retryAfter: 30,
          supportContact: 'Liz.Chukwu@qolae.com'
        });
      }
    };
  }

  /**
   * Verify user consent via SSOT API
   * @param {string} userPin - User PIN
   * @param {string[]} requiredConsents - Required consent types
   * @returns {Object} Consent verification result
   */
  async verifyUserConsent(userPin, requiredConsents) {
    try {
      const response = await axios.post('/api/gdpr/verify-consent', {
        pin: userPin,
        requiredConsents: requiredConsents,
        source: 'lawyers-dashboard',
        timestamp: new Date().toISOString()
      });

      const result = response.data;
      
      if (!result.success) {
        return {
          valid: false,
          reason: result.error || 'Consent verification failed',
          missingConsents: result.missingConsents || requiredConsents
        };
      }

      return {
        valid: true,
        consents: result.consents || {},
        verifiedAt: result.verifiedAt
      };

    } catch (error) {
      this.fastify.log.error('GDPR consent verification API error:', error);
      
      // Fail secure - if we can't verify consent, deny access
      return {
        valid: false,
        reason: 'Consent verification service unavailable',
        missingConsents: requiredConsents,
        systemError: true
      };
    }
  }

  /**
   * Extract user PIN from request (various sources)
   * @param {Object} request - Fastify request object
   * @returns {string} User PIN or null
   */
  extractUserPin(request) {
    // Try URL parameter first (dashboard redirects)
    if (request.query.pin) {
      return request.query.pin;
    }

    // Try JWT token
    if (request.user?.pin) {
      return request.user.pin;
    }

    // Try session/cookie
    if (request.session?.pin) {
      return request.session.pin;
    }

    // Try headers (for API calls)
    if (request.headers['x-lawyer-pin']) {
      return request.headers['x-lawyer-pin'];
    }

    return null;
  }

  /**
   * Middleware for medical data endpoints (strictest protection)
   */
  requireMedicalConsent() {
    return this.requireConsent([
      'medical_data',
      'document_storage',
      'third_party_sharing'
    ]);
  }

  /**
   * Middleware for document storage endpoints
   */
  requireDocumentConsent() {
    return this.requireConsent([
      'document_storage',
      'data_retention'
    ]);
  }

  /**
   * Middleware for case sharing endpoints
   */
  requireSharingConsent() {
    return this.requireConsent([
      'medical_data',
      'third_party_sharing'
    ]);
  }

  /**
   * Generate GDPR-compliant response headers
   * @param {Object} reply - Fastify reply object
   * @param {Object} consentInfo - Consent verification info
   */
  addGDPRHeaders(reply, consentInfo) {
    reply.header('X-GDPR-Consent-Verified', consentInfo.valid ? 'true' : 'false');
    reply.header('X-GDPR-Special-Category', 'Medical Data - Article 9');
    reply.header('X-GDPR-Processing-Basis', 'Explicit Consent');
    reply.header('X-GDPR-Data-Controller', 'QOLAE Legal Services');
    reply.header('X-GDPR-Retention-Period', '7 years (legal requirement)');
    reply.header('X-GDPR-Right-To-Withdraw', 'Contact: Liz.Chukwu@qolae.com');
    
    if (consentInfo.valid) {
      reply.header('X-GDPR-Consent-Types', Object.keys(consentInfo.consents).join(','));
      reply.header('X-GDPR-Verified-At', consentInfo.verifiedAt);
    }
  }
}

/**
 * Fastify plugin registration
 */
export default async function gdprConsentPlugin(fastify, options) {
  const gdprFirewall = new GDPRConsentFirewall(fastify);
  
  // Register as decorators for easy access in routes
  fastify.decorate('gdprFirewall', gdprFirewall);
  fastify.decorate('requireConsent', gdprFirewall.requireConsent.bind(gdprFirewall));
  fastify.decorate('requireMedicalConsent', gdprFirewall.requireMedicalConsent.bind(gdprFirewall));
  fastify.decorate('requireDocumentConsent', gdprFirewall.requireDocumentConsent.bind(gdprFirewall));
  fastify.decorate('requireSharingConsent', gdprFirewall.requireSharingConsent.bind(gdprFirewall));
  
  fastify.log.info('🛡️ GDPR Consent Firewall initialized - Medical data protection active');
}