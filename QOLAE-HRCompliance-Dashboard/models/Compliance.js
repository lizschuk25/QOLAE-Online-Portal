// ==============================================
// COMPLIANCE DATA MODEL
// ==============================================
// Purpose: Data model for HR compliance records
// Author: Phoenix Agent
// Date: October 14, 2025
// Database: qolae_hrcompliance.compliance
// ==============================================

import { executeQuery, executeTransaction } from '../config/database.js';

// ==============================================
// COMPLIANCE STATUS ENUMS
// ==============================================
export const COMPLIANCE_STATUS = {
  SUBMITTED: 'submitted',
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING_REFERENCES: 'pending_references'
};

export const REFERENCE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RECEIVED: 'received',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// ==============================================
// COMPLIANCE MODEL CLASS
// ==============================================
export class Compliance {
  constructor(data = {}) {
    this.id = data.id || null;
    this.personType = data.personType || null; // 'reader', 'new_starter', 'case_manager'
    this.personId = data.personId || null; // Reference to person in their respective table
    this.personName = data.personName || null;
    this.personEmail = data.personEmail || null;
    this.complianceStatus = data.complianceStatus || COMPLIANCE_STATUS.SUBMITTED;
    this.submittedAt = data.submittedAt || null;
    this.reviewedAt = data.reviewedAt || null;
    this.approvedAt = data.approvedAt || null;
    this.reviewedBy = data.reviewedBy || null; // Liz's user ID
    this.notes = data.notes || null;
    
    // Document references
    this.cvPath = data.cvPath || null;
    this.applicationFormPath = data.applicationFormPath || null;
    this.identityDocuments = data.identityDocuments || []; // Array of file paths
    this.utilityBills = data.utilityBills || []; // Array of file paths
    this.qualifications = data.qualifications || []; // Array of file paths
    this.professionalRegistration = data.professionalRegistration || null; // PIN/GMC number
    this.dbsPvgPath = data.dbsPvgPath || null;
    
    // Reference tracking
    this.professionalReferenceStatus = data.professionalReferenceStatus || REFERENCE_STATUS.PENDING;
    this.professionalReferenceDetails = data.professionalReferenceDetails || null; // JSON object
    this.professionalReferenceFormPath = data.professionalReferenceFormPath || null;
    this.professionalReferenceReceivedAt = data.professionalReferenceReceivedAt || null;
    
    this.characterReferenceStatus = data.characterReferenceStatus || REFERENCE_STATUS.PENDING;
    this.characterReferenceDetails = data.characterReferenceDetails || null; // JSON object
    this.characterReferenceFormPath = data.characterReferenceFormPath || null;
    this.characterReferenceReceivedAt = data.characterReferenceReceivedAt || null;
    
    // Audit fields
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy || null;
    this.updatedBy = data.updatedBy || null;
  }

  // ==============================================
  // CREATE NEW COMPLIANCE RECORD
  // ==============================================
  static async create(complianceData) {
    try {
      console.log('\n📝 === CREATING COMPLIANCE RECORD ===');
      console.log(`Person: ${complianceData.personName} (${complianceData.personType})`);
      
      const query = `
        INSERT INTO compliance (
          person_type, person_id, person_name, person_email, compliance_status,
          submitted_at, cv_path, application_form_path, identity_documents,
          utility_bills, qualifications, professional_registration,
          professional_reference_details, character_reference_details,
          created_at, updated_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *
      `;
      
      const params = [
        complianceData.personType,
        complianceData.personId,
        complianceData.personName,
        complianceData.personEmail,
        complianceData.complianceStatus || COMPLIANCE_STATUS.SUBMITTED,
        complianceData.submittedAt || new Date(),
        complianceData.cvPath,
        complianceData.applicationFormPath,
        JSON.stringify(complianceData.identityDocuments || []),
        JSON.stringify(complianceData.utilityBills || []),
        JSON.stringify(complianceData.qualifications || []),
        complianceData.professionalRegistration,
        JSON.stringify(complianceData.professionalReferenceDetails || {}),
        JSON.stringify(complianceData.characterReferenceDetails || {}),
        new Date(),
        new Date(),
        complianceData.createdBy || 'system'
      ];
      
      const result = await executeQuery(query, params);
      console.log(`✅ Compliance record created with ID: ${result.rows[0].id}`);
      
      return new Compliance(result.rows[0]);
      
    } catch (error) {
      console.error('❌ Failed to create compliance record:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND COMPLIANCE BY ID
  // ==============================================
  static async findById(id) {
    try {
      const query = 'SELECT * FROM compliance WHERE id = $1';
      const result = await executeQuery(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Compliance(result.rows[0]);
    } catch (error) {
      console.error('❌ Failed to find compliance by ID:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND COMPLIANCE BY PERSON
  // ==============================================
  static async findByPerson(personType, personId) {
    try {
      const query = 'SELECT * FROM compliance WHERE person_type = $1 AND person_id = $2 ORDER BY created_at DESC LIMIT 1';
      const result = await executeQuery(query, [personType, personId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Compliance(result.rows[0]);
    } catch (error) {
      console.error('❌ Failed to find compliance by person:', error);
      throw error;
    }
  }

  // ==============================================
  // GET ALL PENDING COMPLIANCE RECORDS
  // ==============================================
  static async getPendingCompliance() {
    try {
      const query = `
        SELECT * FROM compliance 
        WHERE compliance_status IN ($1, $2, $3)
        ORDER BY submitted_at ASC
      `;
      
      const params = [
        COMPLIANCE_STATUS.SUBMITTED,
        COMPLIANCE_STATUS.IN_PROGRESS,
        COMPLIANCE_STATUS.PENDING_REFERENCES
      ];
      
      const result = await executeQuery(query, params);
      
      return result.rows.map(row => new Compliance(row));
    } catch (error) {
      console.error('❌ Failed to get pending compliance:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE COMPLIANCE STATUS
  // ==============================================
  async updateStatus(newStatus, updatedBy = null, notes = null) {
    try {
      console.log(`\n🔄 === UPDATING COMPLIANCE STATUS ===`);
      console.log(`ID: ${this.id}, Status: ${this.complianceStatus} → ${newStatus}`);
      
      const query = `
        UPDATE compliance 
        SET compliance_status = $1, updated_at = $2, updated_by = $3, notes = $4
        WHERE id = $5
        RETURNING *
      `;
      
      const params = [
        newStatus,
        new Date(),
        updatedBy || 'system',
        notes,
        this.id
      ];
      
      const result = await executeQuery(query, params);
      
      // Update local instance
      Object.assign(this, result.rows[0]);
      
      console.log(`✅ Compliance status updated successfully`);
      return this;
      
    } catch (error) {
      console.error('❌ Failed to update compliance status:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE REFERENCE STATUS
  // ==============================================
  async updateReferenceStatus(referenceType, newStatus, formPath = null) {
    try {
      console.log(`\n📋 === UPDATING REFERENCE STATUS ===`);
      console.log(`Reference Type: ${referenceType}, Status: ${newStatus}`);
      
      let query, params;
      
      if (referenceType === 'professional') {
        query = `
          UPDATE compliance 
          SET professional_reference_status = $1, 
              professional_reference_form_path = $2,
              professional_reference_received_at = $3,
              updated_at = $4
          WHERE id = $5
          RETURNING *
        `;
        params = [
          newStatus,
          formPath,
          newStatus === REFERENCE_STATUS.RECEIVED ? new Date() : null,
          new Date(),
          this.id
        ];
      } else if (referenceType === 'character') {
        query = `
          UPDATE compliance 
          SET character_reference_status = $1, 
              character_reference_form_path = $2,
              character_reference_received_at = $3,
              updated_at = $4
          WHERE id = $5
          RETURNING *
        `;
        params = [
          newStatus,
          formPath,
          newStatus === REFERENCE_STATUS.RECEIVED ? new Date() : null,
          new Date(),
          this.id
        ];
      } else {
        throw new Error('Invalid reference type. Must be "professional" or "character"');
      }
      
      const result = await executeQuery(query, params);
      
      // Update local instance
      Object.assign(this, result.rows[0]);
      
      console.log(`✅ Reference status updated successfully`);
      return this;
      
    } catch (error) {
      console.error('❌ Failed to update reference status:', error);
      throw error;
    }
  }

  // ==============================================
  // APPROVE COMPLIANCE
  // ==============================================
  async approve(approvedBy = null, notes = null) {
    try {
      console.log(`\n✅ === APPROVING COMPLIANCE ===`);
      console.log(`ID: ${this.id}, Person: ${this.personName}`);
      
      const query = `
        UPDATE compliance 
        SET compliance_status = $1, 
            approved_at = $2, 
            reviewed_at = $3,
            reviewed_by = $4,
            notes = $5,
            updated_at = $6
        WHERE id = $7
        RETURNING *
      `;
      
      const params = [
        COMPLIANCE_STATUS.APPROVED,
        new Date(),
        new Date(),
        approvedBy || 'liz',
        notes,
        new Date(),
        this.id
      ];
      
      const result = await executeQuery(query, params);
      
      // Update local instance
      Object.assign(this, result.rows[0]);
      
      console.log(`✅ Compliance approved successfully`);
      return this;
      
    } catch (error) {
      console.error('❌ Failed to approve compliance:', error);
      throw error;
    }
  }

  // ==============================================
  // GET COMPLIANCE STATISTICS
  // ==============================================
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          compliance_status,
          COUNT(*) as count,
          COUNT(CASE WHEN submitted_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
          COUNT(CASE WHEN submitted_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
        FROM compliance 
        GROUP BY compliance_status
        ORDER BY compliance_status
      `;
      
      const result = await executeQuery(query);
      
      const stats = {
        total: 0,
        byStatus: {},
        last7Days: 0,
        last30Days: 0
      };
      
      result.rows.forEach(row => {
        stats.byStatus[row.compliance_status] = {
          count: parseInt(row.count),
          last7Days: parseInt(row.last_7_days),
          last30Days: parseInt(row.last_30_days)
        };
        stats.total += parseInt(row.count);
        stats.last7Days += parseInt(row.last_7_days);
        stats.last30Days += parseInt(row.last_30_days);
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get compliance statistics:', error);
      throw error;
    }
  }

  // ==============================================
  // VALIDATE COMPLIANCE DATA
  // ==============================================
  validate() {
    const errors = [];
    
    if (!this.personType) {
      errors.push('Person type is required');
    }
    
    if (!this.personId) {
      errors.push('Person ID is required');
    }
    
    if (!this.personName) {
      errors.push('Person name is required');
    }
    
    if (!this.personEmail) {
      errors.push('Person email is required');
    }
    
    if (this.personType === 'reader' && !this.cvPath) {
      errors.push('CV is required for readers');
    }
    
    if (this.personType === 'new_starter' && !this.applicationFormPath) {
      errors.push('Application form is required for new starters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ==============================================
  // TO JSON (for API responses)
  // ==============================================
  toJSON() {
    return {
      id: this.id,
      personType: this.personType,
      personId: this.personId,
      personName: this.personName,
      personEmail: this.personEmail,
      complianceStatus: this.complianceStatus,
      submittedAt: this.submittedAt,
      reviewedAt: this.reviewedAt,
      approvedAt: this.approvedAt,
      reviewedBy: this.reviewedBy,
      notes: this.notes,
      professionalReferenceStatus: this.professionalReferenceStatus,
      characterReferenceStatus: this.characterReferenceStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default Compliance;
