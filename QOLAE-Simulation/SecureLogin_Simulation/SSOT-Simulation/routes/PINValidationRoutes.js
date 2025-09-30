// routes/PINValidationRoutes.js (SSOT)
// 🎯 CENTRALIZED PIN Validation API Routes for QOLAE ECOSYSTEM
// Author: Claude & Liz 👑
// 
// ⚡ SSOT SERVICE: Serves ALL QOLAE dashboards (Admin, Lawyers, Clients, etc.)
// ⚡ CROSS-SYSTEM: Validates PINs across entire QOLAE ecosystem  
// ⚡ AI-POWERED: Smart suggestions, typo correction, predictive validation
//
// Usage:
// - Admin Dashboard: Creating new lawyer entries
// - Lawyers Dashboard: PIN verification and lookup
// - Clients Dashboard: Lawyer PIN references
// - Future Systems: Any PIN-related validation

import pinValidator from '../utils/PINValidator.js';

export default async function PINValidationRoutes(fastify, options) {
  
  // 🎯 MAIN: Validate PIN with AI-powered suggestions (Used by ALL dashboards)
  fastify.post('/api/pin/validate', async (request, reply) => {
    try {
      const { 
        pin, 
        generateNext = false, 
        crossSystemCheck = true,
        source = 'unknown' 
      } = request.body;
      
      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }
      
      console.log(`🎯 SSOT PIN validation request from: ${source} for PIN: ${pin}`);
      
      const validation = await pinValidator.validatePIN(pin, { 
        generateNext, 
        crossSystemCheck 
      });
      
      reply.send({
        success: true,
        source: 'ssot-api-dashboard',
        validation,
        crossSystemEnabled: crossSystemCheck,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ SSOT PIN validation error:', error);
      reply.code(500).send({
        success: false,
        error: 'PIN validation failed',
        source: 'ssot-api-dashboard'
      });
    }
  });
  
  // 🚀 Generate next available PIN (Cross-system verified)
  fastify.post('/api/pin/generate-next', async (request, reply) => {
    try {
      const { 
        basePIN, 
        countryCode = 'GE',
        source = 'unknown'
      } = request.body;
      
      console.log(`🚀 SSOT next PIN generation request from: ${source}`);
      
      let nextPIN;
      if (basePIN) {
        nextPIN = await pinValidator.generateNextAvailablePIN(basePIN);
      } else {
        // Generate first available PIN for country
        nextPIN = await pinValidator.generateNextAvailablePIN(`${countryCode}-000000`);
      }
      
      if (nextPIN) {
        // Validate the generated PIN for extra safety
        const validation = await pinValidator.validatePIN(nextPIN);
        
        reply.send({
          success: true,
          source: 'ssot-api-dashboard',
          nextPIN,
          validation,
          crossSystemVerified: true
        });
      } else {
        reply.code(404).send({
          success: false,
          error: `No available PINs found for country: ${countryCode}`,
          source: 'ssot-api-dashboard'
        });
      }
      
    } catch (error) {
      console.error('❌ SSOT PIN generation error:', error);
      reply.code(500).send({
        success: false,
        error: 'PIN generation failed',
        source: 'ssot-api-dashboard'
      });
    }
  });
  
  // 📊 Get cross-system PIN statistics  
  fastify.get('/api/pin/statistics', async (request, reply) => {
    try {
      const stats = await pinValidator.getPINStatistics();
      
      reply.send({
        success: true,
        source: 'ssot-api-dashboard',
        statistics: stats,
        scope: 'Cross-system PIN statistics',
        note: 'Statistics aggregated from all QOLAE systems'
      });
      
    } catch (error) {
      console.error('❌ SSOT PIN statistics error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get PIN statistics',
        source: 'ssot-api-dashboard'
      });
    }
  });
  
  // 🔍 Check if PIN exists across all systems
  fastify.get('/api/pin/check/:pin', async (request, reply) => {
    try {
      const { pin } = request.params;
      const { source = 'unknown' } = request.query;
      
      console.log(`🔍 SSOT PIN existence check from: ${source} for PIN: ${pin}`);
      
      const result = await pinValidator.checkPINExistsAcrossSystems(pin);
      
      reply.send({
        success: true,
        source: 'ssot-api-dashboard',
        pin,
        exists: result.exists,
        foundIn: result.foundIn,
        details: result.details,
        crossSystemCheck: true
      });
      
    } catch (error) {
      console.error('❌ SSOT PIN check error:', error);
      reply.code(500).send({
        success: false,
        error: 'PIN check failed',
        source: 'ssot-api-dashboard'
      });
    }
  });
  
  // 🎯 Bulk PIN validation (for data imports/migrations)
  fastify.post('/api/pin/validate-bulk', async (request, reply) => {
    try {
      const { pins, source = 'unknown' } = request.body;
      
      if (!Array.isArray(pins) || pins.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Array of PINs is required'
        });
      }
      
      if (pins.length > 100) {
        return reply.code(400).send({
          success: false,
          error: 'Maximum 100 PINs per request'
        });
      }
      
      console.log(`🎯 SSOT bulk PIN validation from: ${source} - ${pins.length} PINs`);
      
      const results = [];
      for (const pin of pins) {
        const validation = await pinValidator.validatePIN(pin);
        results.push(validation);
      }
      
      const summary = {
        total: results.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length,
        duplicates: results.filter(r => r.exists).length,
        crossSystemDuplicates: results.filter(r => r.existsIn && r.existsIn.length > 0).length
      };
      
      reply.send({
        success: true,
        source: 'ssot-api-dashboard',
        results,
        summary,
        crossSystemEnabled: true
      });
      
    } catch (error) {
      console.error('❌ SSOT bulk PIN validation error:', error);
      reply.code(500).send({
        success: false,
        error: 'Bulk validation failed',
        source: 'ssot-api-dashboard'
      });
    }
  });

  // 🔧 Get supported country codes
  fastify.get('/api/pin/countries', async (request, reply) => {
    try {
      reply.send({
        success: true,
        source: 'ssot-api-dashboard',
        countries: pinValidator.countryCodeMap,
        totalCountries: Object.keys(pinValidator.countryCodeMap).length
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Failed to get country codes'
      });
    }
  });

  // 🎯 Smart PIN suggestions (AI-powered typo correction)
  fastify.post('/api/pin/suggest', async (request, reply) => {
    try {
      const { pin, source = 'unknown' } = request.body;
      
      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required for suggestions'
        });
      }
      
      console.log(`🎯 SSOT PIN suggestions request from: ${source} for: ${pin}`);
      
      const typoCorrections = await pinValidator.detectAndCorrectTypos(pin);
      
      reply.send({
        success: true,
        source: 'ssot-api-dashboard',
        originalPIN: pin,
        suggestions: typoCorrections.suggestions,
        note: 'AI-powered typo correction and smart suggestions'
      });
      
    } catch (error) {
      console.error('❌ SSOT PIN suggestions error:', error);
      reply.code(500).send({
        success: false,
        error: 'PIN suggestions failed',
        source: 'ssot-api-dashboard'
      });
    }
  });
}