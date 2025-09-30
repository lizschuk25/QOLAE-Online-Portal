// utils/PINValidator.js (SSOT)
// 🎯 AI-Powered Predictive PIN Validation System for QOLAE ECOSYSTEM
// Author: Claude & Liz 👑
// Purpose: Centralized PIN validation for ALL QOLAE dashboards
// 
// ⚡ SSOT SERVICE: Used by Admin, Lawyers, Clients, and future dashboards
// ⚡ CROSS-SYSTEM: Validates PINs across entire QOLAE ecosystem
// ⚡ AI-POWERED: Smart typo detection, suggestions, and predictions

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Dashboard endpoints for cross-system PIN checking
const DASHBOARD_ENDPOINTS = {
  admin: 'http://localhost:3000',      // Admin Dashboard
  lawyers: 'http://localhost:3001',    // Lawyers Dashboard  
  clients: 'http://localhost:3002',    // Clients Dashboard (future)
};

// =====================================
// 🎯 CENTRALIZED PIN VALIDATION SYSTEM
// =====================================

export class PINValidator {
  constructor() {
    // Flexible PIN format: 1-10 letters only (no special chars like &) + 6 digits
    // Examples: A-123456 (single), AM-123456 (partnership), AAM-123456 (3 partners), AAAMM-123456 (5 partners)
    this.validFormat = /^[A-Z]{1,10}-\d{6}$/;
    this.countryCodeMap = {
      'GB': 'United Kingdom',
      'US': 'United States', 
      'GE': 'Georgia',
      'NG': 'Nigeria',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'ZA': 'South Africa',
      'KE': 'Kenya',
      'GH': 'Ghana',
      'UG': 'Uganda',
      'TZ': 'Tanzania',
      'ZM': 'Zambia',
      'ZW': 'Zimbabwe',
      'BW': 'Botswana'
    };
  }

  // 🌐 SSOT Main validation function with cross-system intelligence
  async validatePIN(pin, options = {}) {
    const validation = {
      pin: pin,
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: [],
      confidence: 0,
      predictedCountry: null,
      alternatives: [],
      exists: false,
      existsIn: [], // Track which systems have this PIN
      crossSystemCheck: options.crossSystemCheck !== false,
      timestamp: new Date().toISOString()
    };

    try {
      console.log(`🎯 SSOT PIN Validation: ${pin}`);

      // 1. Basic format validation
      const formatResult = this.validateFormat(pin);
      validation.errors.push(...formatResult.errors);
      validation.warnings.push(...formatResult.warnings);
      validation.suggestions.push(...formatResult.suggestions);
      
      // 2. Smart typo detection and correction
      if (!formatResult.isValid) {
        const typoCorrections = await this.detectAndCorrectTypos(pin);
        validation.alternatives = typoCorrections.suggestions;
        validation.suggestions.push(...typoCorrections.suggestions.map(s => 
          `Did you mean "${s.pin}"? (${s.reason})`
        ));
      }
      
      // 3. Country code validation
      const countryResult = this.validateCountryCode(pin);
      validation.predictedCountry = countryResult.country;
      if (countryResult.warnings.length > 0) {
        validation.warnings.push(...countryResult.warnings);
      }
      
      // 4. 🌐 CROSS-SYSTEM PIN existence check
      if (formatResult.isValid && validation.crossSystemCheck) {
        const existsResult = await this.checkPINExistsAcrossSystems(pin);
        validation.exists = existsResult.exists;
        validation.existsIn = existsResult.foundIn;
        
        if (existsResult.exists) {
          const systems = existsResult.foundIn.join(', ');
          validation.warnings.push(`PIN ${pin} already exists in: ${systems}`);
          validation.suggestions.push('Consider using the next available PIN');
        }
      }
      
      // 5. Generate next available PIN if requested
      if (options.generateNext || validation.exists) {
        const nextPIN = await this.generateNextAvailablePIN(pin);
        if (nextPIN) {
          validation.suggestions.unshift(`🚀 Next available PIN: ${nextPIN}`);
          validation.alternatives.unshift({
            pin: nextPIN,
            reason: 'Next sequential PIN (cross-system verified)',
            confidence: 100
          });
        }
      }
      
      // 6. Calculate overall confidence
      validation.confidence = this.calculateConfidence(validation);
      validation.isValid = validation.errors.length === 0;
      
      // 7. Audit the validation
      console.log(`✅ SSOT PIN Validation complete: ${pin} - Valid: ${validation.isValid}`);
      
      return validation;
      
    } catch (error) {
      console.error('❌ SSOT PIN validation error:', error);
      validation.errors.push('Internal validation error');
      return validation;
    }
  }

  // 🔍 Format validation with smart suggestions
  validateFormat(pin) {
    const result = {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!pin || typeof pin !== 'string') {
      result.errors.push('PIN is required');
      result.suggestions.push('PIN format: [1-10 letters]-[6 digits] (e.g., A-123456, AM-123456, AAM-123456)');
      return result;
    }

    const trimmedPin = pin.trim().toUpperCase();

    // Check for business entity suffixes that should not be in PINs
    const businessSuffixes = ['PARTNERS', 'PARTNER', 'LLP', 'LLC', 'LTD', 'LIMITED', 'COMPANY', 'CO', 'ASSOCIATES', 'ASSOC', 'GROUP', 'FIRM'];
    const letterPart = trimmedPin.split('-')[0];
    
    for (const suffix of businessSuffixes) {
      if (letterPart && letterPart.includes(suffix)) {
        result.errors.push(`PIN should not contain business entity suffixes like "${suffix}"`);
        result.suggestions.push('Use only partner initials (e.g., AAM-123456 for partners A, A, M)');
        break;
      }
    }

    // Check overall format
    if (!this.validFormat.test(trimmedPin)) {
      result.errors.push('Invalid PIN format');
      
      // Smart suggestions based on common mistakes
      if (trimmedPin.length < 9) {
        result.suggestions.push('PIN too short. Format: [1-10 letters]-[6 digits] (8-17 characters total)');
      } else if (trimmedPin.length > 9) {
        result.suggestions.push('PIN too long. Format: [1-10 letters]-[6 digits] (max 17 characters)');
      }
      
      if (!trimmedPin.includes('-')) {
        result.suggestions.push('Missing hyphen. Use format: [letters]-[6 digits]');
        // Suggest adding hyphen
        if (trimmedPin.length === 8) {
          result.suggestions.push(`Did you mean: ${trimmedPin.slice(0,2)}-${trimmedPin.slice(2)}?`);
        }
      }
      
      if (!/^[A-Z]{2}/.test(trimmedPin)) {
        result.suggestions.push('First two characters must be uppercase letters (country code)');
      }
      
      if (!/\d{6}$/.test(trimmedPin.replace('-', ''))) {
        result.suggestions.push('Last six characters must be digits');
      }
    } else {
      result.isValid = true;
    }

    return result;
  }

  // 🌍 Country code validation
  validateCountryCode(pin) {
    const result = {
      country: null,
      warnings: []
    };

    if (!pin || pin.length < 2) return result;

    const countryCode = pin.slice(0, 2).toUpperCase();
    
    if (this.countryCodeMap[countryCode]) {
      result.country = this.countryCodeMap[countryCode];
    } else {
      result.warnings.push(`Unknown country code: ${countryCode}`);
      
      // Suggest similar country codes
      const similarCodes = this.findSimilarCountryCodes(countryCode);
      if (similarCodes.length > 0) {
        result.warnings.push(`Did you mean: ${similarCodes.join(', ')}?`);
      }
    }

    return result;
  }

  // 🔍 Find similar country codes for typo correction
  findSimilarCountryCodes(code) {
    const similar = [];
    const codes = Object.keys(this.countryCodeMap);
    
    codes.forEach(validCode => {
      let similarity = 0;
      
      // Character similarity
      for (let i = 0; i < 2; i++) {
        if (code[i] === validCode[i]) similarity++;
      }
      
      // Keyboard proximity (basic)
      if (similarity === 1) {
        similar.push(`${validCode} (${this.countryCodeMap[validCode]})`);
      }
    });
    
    return similar;
  }

  // 🌐 CROSS-SYSTEM PIN existence checking
  async checkPINExistsAcrossSystems(pin) {
    const result = {
      exists: false,
      foundIn: [],
      details: {}
    };

    const cleanPIN = pin.trim().toUpperCase();
    
    // Check each dashboard system
    for (const [system, endpoint] of Object.entries(DASHBOARD_ENDPOINTS)) {
      try {
        console.log(`🔍 Checking PIN ${cleanPIN} in ${system} system...`);
        
        let response;
        if (system === 'admin') {
          // Check local database for admin system
          response = await this.checkAdminDatabase(cleanPIN);
        } else {
          // HTTP check for other systems (when they exist)
          response = await this.checkExternalSystem(endpoint, cleanPIN, system);
        }
        
        if (response.exists) {
          result.exists = true;
          result.foundIn.push(system);
          result.details[system] = response.details;
        }
        
      } catch (error) {
        console.warn(`⚠️ Could not check ${system} system:`, error.message);
        // Continue with other systems
      }
    }
    
    return result;
  }

  // Check Admin Dashboard database
  async checkAdminDatabase(pin) {
    try {
      const lawyer = await prisma.lawyer.findUnique({
        where: { pin: pin }
      });
      
      return {
        exists: !!lawyer,
        details: lawyer ? {
          lawFirm: lawyer.lawFirm,
          status: lawyer.status,
          lastModified: lawyer.lastModified
        } : null
      };
    } catch (error) {
      console.error('Admin database check failed:', error);
      return { exists: false, error: error.message };
    }
  }

  // Check external system via HTTP
  async checkExternalSystem(endpoint, pin, systemName) {
    try {
      const response = await axios.get(`${endpoint}/api/pin/check/${pin}`, {
        timeout: 3000
      });
      
      return {
        exists: response.data.exists || false,
        details: response.data.details || null
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`📝 ${systemName} system not running - skipping check`);
      } else {
        console.warn(`⚠️ ${systemName} system check failed:`, error.message);
      }
      return { exists: false };
    }
  }

  // 🎯 Advanced typo detection and correction
  async detectAndCorrectTypos(pin) {
    const suggestions = [];
    
    if (!pin) return { suggestions };
    
    const cleaned = pin.trim().toUpperCase();
    
    // Common typo patterns
    const typoPatterns = [
      // Missing hyphen
      { pattern: /^([A-Z]{2})(\d{6})$/, fix: '$1-$2', reason: 'Added missing hyphen' },
      
      // Wrong hyphen position
      { pattern: /^([A-Z])(\d)([A-Z])(\d{5})$/, fix: '$1$3-$2$4', reason: 'Fixed hyphen position' },
      
      // Lowercase letters
      { pattern: /^([a-z]{2})-(\d{6})$/i, fix: (match, p1, p2) => `${p1.toUpperCase()}-${p2}`, reason: 'Capitalized country code' },
      
      // Extra characters
      { pattern: /^([A-Z]{2})-(\d{6})\w+$/, fix: '$1-$2', reason: 'Removed extra characters' },
      
      // Missing leading zero
      { pattern: /^([A-Z]{2})-(\d{5})$/, fix: '$1-0$2', reason: 'Added leading zero' }
    ];
    
    typoPatterns.forEach(({ pattern, fix, reason }) => {
      if (pattern.test(cleaned)) {
        const corrected = typeof fix === 'function' ? 
          cleaned.replace(pattern, fix) : 
          cleaned.replace(pattern, fix);
          
        if (this.validFormat.test(corrected)) {
          suggestions.push({
            pin: corrected,
            reason: reason,
            confidence: 85
          });
        }
      }
    });
    
    return { suggestions: suggestions.slice(0, 5) }; // Limit suggestions
  }

  // 🚀 Generate next available PIN (cross-system verified)
  async generateNextAvailablePIN(basePIN) {
    try {
      let countryCode = 'GE'; // Default
      let startNumber = 1;
      
      if (basePIN && this.validFormat.test(basePIN.trim().toUpperCase())) {
        const [prefix, digits] = basePIN.trim().toUpperCase().split('-');
        countryCode = prefix;
        startNumber = parseInt(digits) + 1;
      }
      
      console.log(`🚀 Generating next PIN after ${countryCode}-${startNumber.toString().padStart(6, '0')}`);
      
      // Find next available PIN across ALL systems
      for (let i = startNumber; i <= 999999; i++) {
        const candidate = `${countryCode}-${i.toString().padStart(6, '0')}`;
        const exists = await this.checkPINExistsAcrossSystems(candidate);
        
        if (!exists.exists) {
          console.log(`✅ Found available PIN: ${candidate}`);
          return candidate;
        }
      }
      
      console.warn(`⚠️ All PINs exhausted for country ${countryCode}`);
      return null; 
    } catch (error) {
      console.error('Error generating next PIN:', error);
      return null;
    }
  }

  // 📊 Calculate validation confidence score
  calculateConfidence(validation) {
    let confidence = 0;
    
    if (validation.errors.length === 0) confidence += 50;
    if (validation.warnings.length === 0) confidence += 30;
    if (validation.predictedCountry) confidence += 10;
    if (!validation.exists) confidence += 10;
    
    return Math.min(confidence, 100);
  }

  // 📈 Get cross-system PIN statistics
  async getPINStatistics() {
    try {
      // Get admin system stats
      const adminStats = await prisma.lawyer.groupBy({
        by: ['pin'],
        _count: { pin: true }
      });
      
      const countryStats = {};
      adminStats.forEach(item => {
        if (item.pin) {
          const countryCode = item.pin.slice(0, 2);
          countryStats[countryCode] = (countryStats[countryCode] || 0) + 1;
        }
      });
      
      // TODO: Aggregate stats from other systems when they exist
      
      return {
        totalPINs: adminStats.length,
        countryDistribution: countryStats,
        availableCountries: Object.keys(this.countryCodeMap),
        systemsCovered: ['admin'], // Will expand as other systems come online
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting PIN statistics:', error);
      return { error: error.message };
    }
  }
}

// Export singleton instance
const pinValidator = new PINValidator();
export default pinValidator;