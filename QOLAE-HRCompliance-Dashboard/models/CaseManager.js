// ==============================================
// CASE MANAGER DATA MODEL
// ==============================================
// Purpose: Data model for case manager (new starter) records
// Author: Phoenix Agent
// Date: October 14, 2025
// Database: qolae_hrcompliance.case_managers
// ==============================================

import { executeQuery } from '../config/database.js';

// ==============================================
// CASE MANAGER STATUS ENUMS
// ==============================================
export const CM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_COMPLIANCE: 'pending_compliance',
  SUSPENDED: 'suspended'
};

export const CM_ROLE = {
  CASE_MANAGER: 'case_manager',
  ADMIN: 'admin',
  OPERATIONS: 'operations'
};

// ==============================================
// CASE MANAGER MODEL CLASS
// ==============================================
export class CaseManager {
  constructor(data = {}) {
    this.id = data.id || null;
    this.pin = data.pin || null; // Unique ID PIN
    this.name = data.name || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.role = data.role || CM_ROLE.CASE_MANAGER;
    this.status = data.status || CM_STATUS.PENDING_COMPLIANCE;

    // Professional details
    this.professionalRegistration = data.professionalRegistration || null; // PIN/GMC/NMC
    this.qualifications = data.qualifications || [];
    this.specialties = data.specialties || [];

    // Compliance tracking
    this.complianceSubmitted = data.complianceSubmitted || false;
    this.complianceSubmittedAt = data.complianceSubmittedAt || null;
    this.complianceApproved = data.complianceApproved || false;
    this.complianceApprovedAt = data.complianceApprovedAt || null;

    // Workspace access
    this.workspaceAccess = data.workspaceAccess || 'limited'; // 'limited' or 'full'

    // Reference details
    this.professionalReferenceDetails = data.professionalReferenceDetails || null;
    this.characterReferenceDetails = data.characterReferenceDetails || null;

    // Work statistics
    this.totalCasesManaged = data.totalCasesManaged || 0;
    this.activeCases = data.activeCases || 0;

    // Audit fields
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy || null;
    this.updatedBy = data.updatedBy || null;
  }

  // ==============================================
  // CREATE NEW CASE MANAGER
  // ==============================================
  static async create(cmData) {
    try {
      console.log('\n=d === CREATING CASE MANAGER RECORD ===');
      console.log(`Name: ${cmData.name}, Role: ${cmData.role}`);

      const query = `
        INSERT INTO case_managers (
          pin, name, email, phone, role, status,
          professional_registration, qualifications, specialties,
          compliance_submitted, workspace_access,
          professional_reference_details, character_reference_details,
          created_at, updated_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `;

      const params = [
        cmData.pin,
        cmData.name,
        cmData.email,
        cmData.phone,
        cmData.role || CM_ROLE.CASE_MANAGER,
        cmData.status || CM_STATUS.PENDING_COMPLIANCE,
        cmData.professionalRegistration,
        JSON.stringify(cmData.qualifications || []),
        JSON.stringify(cmData.specialties || []),
        cmData.complianceSubmitted || false,
        cmData.workspaceAccess || 'limited',
        JSON.stringify(cmData.professionalReferenceDetails || {}),
        JSON.stringify(cmData.characterReferenceDetails || {}),
        new Date(),
        new Date(),
        cmData.createdBy || 'system'
      ];

      const result = await executeQuery(query, params);
      console.log(` Case Manager record created with ID: ${result.rows[0].id}`);

      return new CaseManager(result.rows[0]);

    } catch (error) {
      console.error('L Failed to create case manager record:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND CASE MANAGER BY PIN
  // ==============================================
  static async findByPin(pin) {
    try {
      const query = 'SELECT * FROM case_managers WHERE pin = $1';
      const result = await executeQuery(query, [pin]);

      if (result.rows.length === 0) {
        return null;
      }

      return new CaseManager(result.rows[0]);
    } catch (error) {
      console.error('L Failed to find case manager by PIN:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND CASE MANAGER BY ID
  // ==============================================
  static async findById(id) {
    try {
      const query = 'SELECT * FROM case_managers WHERE id = $1';
      const result = await executeQuery(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new CaseManager(result.rows[0]);
    } catch (error) {
      console.error('L Failed to find case manager by ID:', error);
      throw error;
    }
  }

  // ==============================================
  // GET ALL CASE MANAGERS
  // ==============================================
  static async getAll() {
    try {
      const query = 'SELECT * FROM case_managers ORDER BY created_at DESC';
      const result = await executeQuery(query);

      return result.rows.map(row => new CaseManager(row));
    } catch (error) {
      console.error('L Failed to get all case managers:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE STATUS
  // ==============================================
  async updateStatus(newStatus, updatedBy = null) {
    try {
      console.log(`\n= === UPDATING CASE MANAGER STATUS ===`);
      console.log(`PIN: ${this.pin}, Status: ${this.status} ’ ${newStatus}`);

      const query = `
        UPDATE case_managers
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

      console.log(` Case Manager status updated successfully`);
      return this;

    } catch (error) {
      console.error('L Failed to update case manager status:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE COMPLIANCE STATUS
  // ==============================================
  async updateComplianceStatus(submitted = false, approved = false) {
    try {
      console.log(`\n=Ë === UPDATING CASE MANAGER COMPLIANCE STATUS ===`);
      console.log(`PIN: ${this.pin}, Submitted: ${submitted}, Approved: ${approved}`);

      const query = `
        UPDATE case_managers
        SET compliance_submitted = $1,
            compliance_submitted_at = $2,
            compliance_approved = $3,
            compliance_approved_at = $4,
            workspace_access = $5,
            updated_at = $6
        WHERE id = $7
        RETURNING *
      `;

      const params = [
        submitted,
        submitted ? new Date() : this.complianceSubmittedAt,
        approved,
        approved ? new Date() : this.complianceApprovedAt,
        approved ? 'full' : 'limited', // Full access when approved
        new Date(),
        this.id
      ];

      const result = await executeQuery(query, params);

      // Update local instance
      Object.assign(this, result.rows[0]);

      console.log(` Case Manager compliance status updated successfully`);
      return this;

    } catch (error) {
      console.error('L Failed to update case manager compliance status:', error);
      throw error;
    }
  }

  // ==============================================
  // VALIDATE CASE MANAGER DATA
  // ==============================================
  validate() {
    const errors = [];

    if (!this.pin) {
      errors.push('Case Manager PIN is required');
    }

    if (!this.name) {
      errors.push('Case Manager name is required');
    }

    if (!this.email) {
      errors.push('Case Manager email is required');
    }

    if (!this.role) {
      errors.push('Case Manager role is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ==============================================
  // TO JSON
  // ==============================================
  toJSON() {
    return {
      id: this.id,
      pin: this.pin,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      status: this.status,
      professionalRegistration: this.professionalRegistration,
      complianceSubmitted: this.complianceSubmitted,
      complianceSubmittedAt: this.complianceSubmittedAt,
      complianceApproved: this.complianceApproved,
      complianceApprovedAt: this.complianceApprovedAt,
      workspaceAccess: this.workspaceAccess,
      totalCasesManaged: this.totalCasesManaged,
      activeCases: this.activeCases,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default CaseManager;
