// ==============================================
// READER DATA MODEL
// ==============================================
// Purpose: Data model for reader records in HR compliance context
// Author: Phoenix Agent
// Date: October 14, 2025
// Database: qolae_hrcompliance.readers
// ==============================================

import { executeQuery } from '../config/database.js';

// ==============================================
// READER TYPE ENUMS
// ==============================================
export const READER_TYPE = {
  FIRST_READER: 'first_reader',
  SECOND_READER: 'second_reader' // Medical professional
};

export const READER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_COMPLIANCE: 'pending_compliance',
  SUSPENDED: 'suspended'
};

// ==============================================
// READER MODEL CLASS
// ==============================================
export class Reader {
  constructor(data = {}) {
    this.id = data.id || null;
    this.pin = data.pin || null; // Unique reader PIN
    this.name = data.name || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.readerType = data.readerType || READER_TYPE.FIRST_READER;
    this.status = data.status || READER_STATUS.PENDING_COMPLIANCE;
    this.paymentRate = data.paymentRate || null; // £50 for first reader, £75 for second reader
    
    // Medical professional fields (for second readers)
    this.professionalRegistration = data.professionalRegistration || null; // PIN/GMC number
    this.medicalSpecialty = data.medicalSpecialty || null;
    this.qualifications = data.qualifications || []; // Array of qualifications
    
    // Compliance tracking
    this.complianceSubmitted = data.complianceSubmitted || false;
    this.complianceSubmittedAt = data.complianceSubmittedAt || null;
    this.complianceApproved = data.complianceApproved || false;
    this.complianceApprovedAt = data.complianceApprovedAt || null;
    
    // Reference details
    this.professionalReferenceDetails = data.professionalReferenceDetails || null; // JSON object
    this.characterReferenceDetails = data.characterReferenceDetails || null; // JSON object
    
    // Work statistics
    this.totalReportsAssigned = data.totalReportsAssigned || 0;
    this.totalReportsCompleted = data.totalReportsCompleted || 0;
    this.averageCompletionTime = data.averageCompletionTime || null; // in hours
    this.lastReportAssigned = data.lastReportAssigned || null;
    this.lastReportCompleted = data.lastReportCompleted || null;
    
    // Audit fields
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy || null;
    this.updatedBy = data.updatedBy || null;
  }

  // ==============================================
  // CREATE NEW READER RECORD
  // ==============================================
  static async create(readerData) {
    try {
      console.log('\n👤 === CREATING READER RECORD ===');
      console.log(`Name: ${readerData.name}, Type: ${readerData.readerType}`);
      
      const query = `
        INSERT INTO readers (
          pin, name, email, phone, reader_type, status, payment_rate,
          professional_registration, medical_specialty, qualifications,
          compliance_submitted, professional_reference_details, character_reference_details,
          created_at, updated_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `;
      
      const params = [
        readerData.pin,
        readerData.name,
        readerData.email,
        readerData.phone,
        readerData.readerType,
        readerData.status || READER_STATUS.PENDING_COMPLIANCE,
        readerData.paymentRate || (readerData.readerType === READER_TYPE.FIRST_READER ? 50 : 75),
        readerData.professionalRegistration,
        readerData.medicalSpecialty,
        JSON.stringify(readerData.qualifications || []),
        readerData.complianceSubmitted || false,
        JSON.stringify(readerData.professionalReferenceDetails || {}),
        JSON.stringify(readerData.characterReferenceDetails || {}),
        new Date(),
        new Date(),
        readerData.createdBy || 'system'
      ];
      
      const result = await executeQuery(query, params);
      console.log(`✅ Reader record created with ID: ${result.rows[0].id}`);
      
      return new Reader(result.rows[0]);
      
    } catch (error) {
      console.error('❌ Failed to create reader record:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND READER BY PIN
  // ==============================================
  static async findByPin(pin) {
    try {
      const query = 'SELECT * FROM readers WHERE pin = $1';
      const result = await executeQuery(query, [pin]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Reader(result.rows[0]);
    } catch (error) {
      console.error('❌ Failed to find reader by PIN:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND READER BY ID
  // ==============================================
  static async findById(id) {
    try {
      const query = 'SELECT * FROM readers WHERE id = $1';
      const result = await executeQuery(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Reader(result.rows[0]);
    } catch (error) {
      console.error('❌ Failed to find reader by ID:', error);
      throw error;
    }
  }

  // ==============================================
  // GET ALL READERS WITH COMPLIANCE STATUS
  // ==============================================
  static async getAllWithComplianceStatus() {
    try {
      const query = `
        SELECT r.*, 
               c.compliance_status,
               c.submitted_at as compliance_submitted_at,
               c.approved_at as compliance_approved_at,
               c.professional_reference_status,
               c.character_reference_status
        FROM readers r
        LEFT JOIN compliance c ON r.id = c.person_id AND c.person_type = 'reader'
        ORDER BY r.created_at DESC
      `;
      
      const result = await executeQuery(query);
      
      return result.rows.map(row => {
        const reader = new Reader(row);
        // Add compliance fields
        reader.complianceStatus = row.compliance_status;
        reader.complianceSubmittedAt = row.compliance_submitted_at;
        reader.complianceApprovedAt = row.compliance_approved_at;
        reader.professionalReferenceStatus = row.professional_reference_status;
        reader.characterReferenceStatus = row.character_reference_status;
        return reader;
      });
    } catch (error) {
      console.error('❌ Failed to get readers with compliance status:', error);
      throw error;
    }
  }

  // ==============================================
  // GET PENDING COMPLIANCE READERS
  // ==============================================
  static async getPendingCompliance() {
    try {
      const query = `
        SELECT r.*, 
               c.compliance_status,
               c.submitted_at as compliance_submitted_at,
               c.professional_reference_status,
               c.character_reference_status
        FROM readers r
        LEFT JOIN compliance c ON r.id = c.person_id AND c.person_type = 'reader'
        WHERE r.status = $1 OR c.compliance_status IN ($2, $3, $4)
        ORDER BY c.submitted_at ASC NULLS LAST
      `;
      
      const params = [
        READER_STATUS.PENDING_COMPLIANCE,
        'submitted',
        'in_progress',
        'pending_references'
      ];
      
      const result = await executeQuery(query, params);
      
      return result.rows.map(row => {
        const reader = new Reader(row);
        reader.complianceStatus = row.compliance_status;
        reader.complianceSubmittedAt = row.compliance_submitted_at;
        reader.professionalReferenceStatus = row.professional_reference_status;
        reader.characterReferenceStatus = row.character_reference_status;
        return reader;
      });
    } catch (error) {
      console.error('❌ Failed to get pending compliance readers:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE READER STATUS
  // ==============================================
  async updateStatus(newStatus, updatedBy = null) {
    try {
      console.log(`\n🔄 === UPDATING READER STATUS ===`);
      console.log(`PIN: ${this.pin}, Status: ${this.status} → ${newStatus}`);
      
      const query = `
        UPDATE readers 
        SET status = $1, updated_at = $2, updated_by = $3
        WHERE id = $4
        RETURNING *
      `;
      
      const params = [
        newStatus,
        new Date(),
        updatedBy || 'system',
        this.id
      ];
      
      const result = await executeQuery(query, params);
      
      // Update local instance
      Object.assign(this, result.rows[0]);
      
      console.log(`✅ Reader status updated successfully`);
      return this;
      
    } catch (error) {
      console.error('❌ Failed to update reader status:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE COMPLIANCE STATUS
  // ==============================================
  async updateComplianceStatus(submitted = false, approved = false) {
    try {
      console.log(`\n📋 === UPDATING READER COMPLIANCE STATUS ===`);
      console.log(`PIN: ${this.pin}, Submitted: ${submitted}, Approved: ${approved}`);
      
      const query = `
        UPDATE readers 
        SET compliance_submitted = $1,
            compliance_submitted_at = $2,
            compliance_approved = $3,
            compliance_approved_at = $4,
            updated_at = $5
        WHERE id = $6
        RETURNING *
      `;
      
      const params = [
        submitted,
        submitted ? new Date() : this.complianceSubmittedAt,
        approved,
        approved ? new Date() : this.complianceApprovedAt,
        new Date(),
        this.id
      ];
      
      const result = await executeQuery(query, params);
      
      // Update local instance
      Object.assign(this, result.rows[0]);
      
      console.log(`✅ Reader compliance status updated successfully`);
      return this;
      
    } catch (error) {
      console.error('❌ Failed to update reader compliance status:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE REFERENCE DETAILS
  // ==============================================
  async updateReferenceDetails(referenceType, details) {
    try {
      console.log(`\n📝 === UPDATING READER REFERENCE DETAILS ===`);
      console.log(`PIN: ${this.pin}, Reference Type: ${referenceType}`);
      
      let query, params;
      
      if (referenceType === 'professional') {
        query = `
          UPDATE readers 
          SET professional_reference_details = $1, updated_at = $2
          WHERE id = $3
          RETURNING *
        `;
        params = [JSON.stringify(details), new Date(), this.id];
      } else if (referenceType === 'character') {
        query = `
          UPDATE readers 
          SET character_reference_details = $1, updated_at = $2
          WHERE id = $3
          RETURNING *
        `;
        params = [JSON.stringify(details), new Date(), this.id];
      } else {
        throw new Error('Invalid reference type. Must be "professional" or "character"');
      }
      
      const result = await executeQuery(query, params);
      
      // Update local instance
      Object.assign(this, result.rows[0]);
      
      console.log(`✅ Reader reference details updated successfully`);
      return this;
      
    } catch (error) {
      console.error('❌ Failed to update reader reference details:', error);
      throw error;
    }
  }

  // ==============================================
  // GET READER STATISTICS
  // ==============================================
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          reader_type,
          status,
          COUNT(*) as count,
          AVG(payment_rate) as avg_payment_rate,
          SUM(total_reports_completed) as total_reports_completed,
          COUNT(CASE WHEN compliance_approved = true THEN 1 END) as compliance_approved_count
        FROM readers 
        GROUP BY reader_type, status
        ORDER BY reader_type, status
      `;
      
      const result = await executeQuery(query);
      
      const stats = {
        total: 0,
        byType: {},
        byStatus: {},
        complianceApproved: 0,
        totalReportsCompleted: 0
      };
      
      result.rows.forEach(row => {
        const count = parseInt(row.count);
        stats.total += count;
        stats.complianceApproved += parseInt(row.compliance_approved_count);
        stats.totalReportsCompleted += parseInt(row.total_reports_completed);
        
        // By type
        if (!stats.byType[row.reader_type]) {
          stats.byType[row.reader_type] = { count: 0, avgPaymentRate: 0 };
        }
        stats.byType[row.reader_type].count += count;
        stats.byType[row.reader_type].avgPaymentRate = parseFloat(row.avg_payment_rate);
        
        // By status
        if (!stats.byStatus[row.status]) {
          stats.byStatus[row.status] = 0;
        }
        stats.byStatus[row.status] += count;
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get reader statistics:', error);
      throw error;
    }
  }

  // ==============================================
  // VALIDATE READER DATA
  // ==============================================
  validate() {
    const errors = [];
    
    if (!this.pin) {
      errors.push('Reader PIN is required');
    }
    
    if (!this.name) {
      errors.push('Reader name is required');
    }
    
    if (!this.email) {
      errors.push('Reader email is required');
    }
    
    if (!this.readerType) {
      errors.push('Reader type is required');
    }
    
    if (this.readerType === READER_TYPE.SECOND_READER && !this.professionalRegistration) {
      errors.push('Professional registration (PIN/GMC) is required for second readers');
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
      pin: this.pin,
      name: this.name,
      email: this.email,
      phone: this.phone,
      readerType: this.readerType,
      status: this.status,
      paymentRate: this.paymentRate,
      professionalRegistration: this.professionalRegistration,
      medicalSpecialty: this.medicalSpecialty,
      complianceSubmitted: this.complianceSubmitted,
      complianceSubmittedAt: this.complianceSubmittedAt,
      complianceApproved: this.complianceApproved,
      complianceApprovedAt: this.complianceApprovedAt,
      totalReportsAssigned: this.totalReportsAssigned,
      totalReportsCompleted: this.totalReportsCompleted,
      averageCompletionTime: this.averageCompletionTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default Reader;
