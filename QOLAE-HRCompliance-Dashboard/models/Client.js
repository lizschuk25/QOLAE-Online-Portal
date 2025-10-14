// ==============================================
// CLIENT DATA MODEL
// ==============================================
// Purpose: Data model for client consent tracking
// Author: Phoenix Agent
// Date: October 14, 2025
// Database: qolae_hrcompliance.clients
// ==============================================

import { executeQuery } from '../config/database.js';

// ==============================================
// CLIENT CONSENT STATUS ENUMS
// ==============================================
export const CONSENT_STATUS = {
  PENDING: 'pending',
  GRANTED: 'granted',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired'
};

export const CLIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

// ==============================================
// CLIENT MODEL CLASS
// ==============================================
export class Client {
  constructor(data = {}) {
    this.id = data.id || null;
    this.clientId = data.clientId || null; // External client reference ID
    this.name = data.name || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.status = data.status || CLIENT_STATUS.ACTIVE;

    // Consent tracking
    this.consentStatus = data.consentStatus || CONSENT_STATUS.PENDING;
    this.consentGrantedAt = data.consentGrantedAt || null;
    this.consentWithdrawnAt = data.consentWithdrawnAt || null;
    this.consentExpiresAt = data.consentExpiresAt || null;
    this.consentFormPath = data.consentFormPath || null;
    this.consentNotes = data.consentNotes || null;

    // Case information
    this.assignedCaseManagerId = data.assignedCaseManagerId || null;
    this.caseType = data.caseType || null;
    this.caseStatus = data.caseStatus || null;

    // Audit fields
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy || null;
    this.updatedBy = data.updatedBy || null;
  }

  // ==============================================
  // CREATE NEW CLIENT
  // ==============================================
  static async create(clientData) {
    try {
      console.log('\n=d === CREATING CLIENT RECORD ===');
      console.log(`Name: ${clientData.name}`);

      const query = `
        INSERT INTO clients (
          client_id, name, email, phone, status,
          consent_status, consent_granted_at, consent_expires_at,
          consent_form_path, consent_notes,
          assigned_case_manager_id, case_type, case_status,
          created_at, updated_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `;

      const params = [
        clientData.clientId,
        clientData.name,
        clientData.email,
        clientData.phone,
        clientData.status || CLIENT_STATUS.ACTIVE,
        clientData.consentStatus || CONSENT_STATUS.PENDING,
        clientData.consentGrantedAt,
        clientData.consentExpiresAt,
        clientData.consentFormPath,
        clientData.consentNotes,
        clientData.assignedCaseManagerId,
        clientData.caseType,
        clientData.caseStatus,
        new Date(),
        new Date(),
        clientData.createdBy || 'system'
      ];

      const result = await executeQuery(query, params);
      console.log(` Client record created with ID: ${result.rows[0].id}`);

      return new Client(result.rows[0]);

    } catch (error) {
      console.error('L Failed to create client record:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND CLIENT BY ID
  // ==============================================
  static async findById(id) {
    try {
      const query = 'SELECT * FROM clients WHERE id = $1';
      const result = await executeQuery(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Client(result.rows[0]);
    } catch (error) {
      console.error('L Failed to find client by ID:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND CLIENT BY CLIENT ID
  // ==============================================
  static async findByClientId(clientId) {
    try {
      const query = 'SELECT * FROM clients WHERE client_id = $1';
      const result = await executeQuery(query, [clientId]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Client(result.rows[0]);
    } catch (error) {
      console.error('L Failed to find client by client ID:', error);
      throw error;
    }
  }

  // ==============================================
  // GET ALL CLIENTS
  // ==============================================
  static async getAll() {
    try {
      const query = 'SELECT * FROM clients ORDER BY created_at DESC';
      const result = await executeQuery(query);

      return result.rows.map(row => new Client(row));
    } catch (error) {
      console.error('L Failed to get all clients:', error);
      throw error;
    }
  }

  // ==============================================
  // GET CLIENTS BY CASE MANAGER
  // ==============================================
  static async getByCaseManager(caseManagerId) {
    try {
      const query = 'SELECT * FROM clients WHERE assigned_case_manager_id = $1 ORDER BY created_at DESC';
      const result = await executeQuery(query, [caseManagerId]);

      return result.rows.map(row => new Client(row));
    } catch (error) {
      console.error('L Failed to get clients by case manager:', error);
      throw error;
    }
  }

  // ==============================================
  // GET CLIENTS WITH PENDING CONSENT
  // ==============================================
  static async getPendingConsent() {
    try {
      const query = `
        SELECT * FROM clients
        WHERE consent_status = $1
        ORDER BY created_at ASC
      `;
      const result = await executeQuery(query, [CONSENT_STATUS.PENDING]);

      return result.rows.map(row => new Client(row));
    } catch (error) {
      console.error('L Failed to get clients with pending consent:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE CONSENT STATUS
  // ==============================================
  async updateConsentStatus(newStatus, updatedBy = null, notes = null) {
    try {
      console.log(`\n=Ë === UPDATING CLIENT CONSENT STATUS ===`);
      console.log(`Client: ${this.name}, Status: ${this.consentStatus} ’ ${newStatus}`);

      let consentGrantedAt = this.consentGrantedAt;
      let consentWithdrawnAt = this.consentWithdrawnAt;

      if (newStatus === CONSENT_STATUS.GRANTED && !this.consentGrantedAt) {
        consentGrantedAt = new Date();
      }

      if (newStatus === CONSENT_STATUS.WITHDRAWN) {
        consentWithdrawnAt = new Date();
      }

      const query = `
        UPDATE clients
        SET consent_status = $1,
            consent_granted_at = $2,
            consent_withdrawn_at = $3,
            consent_notes = $4,
            updated_at = $5,
            updated_by = $6
        WHERE id = $7
        RETURNING *
      `;

      const params = [
        newStatus,
        consentGrantedAt,
        consentWithdrawnAt,
        notes || this.consentNotes,
        new Date(),
        updatedBy || 'system',
        this.id
      ];

      const result = await executeQuery(query, params);

      // Update local instance
      Object.assign(this, result.rows[0]);

      console.log(` Client consent status updated successfully`);
      return this;

    } catch (error) {
      console.error('L Failed to update client consent status:', error);
      throw error;
    }
  }

  // ==============================================
  // CHECK IF CONSENT IS VALID
  // ==============================================
  isConsentValid() {
    if (this.consentStatus !== CONSENT_STATUS.GRANTED) {
      return false;
    }

    if (this.consentExpiresAt) {
      const now = new Date();
      const expiryDate = new Date(this.consentExpiresAt);
      return now < expiryDate;
    }

    return true;
  }

  // ==============================================
  // VALIDATE CLIENT DATA
  // ==============================================
  validate() {
    const errors = [];

    if (!this.clientId) {
      errors.push('Client ID is required');
    }

    if (!this.name) {
      errors.push('Client name is required');
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
      clientId: this.clientId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      status: this.status,
      consentStatus: this.consentStatus,
      consentGrantedAt: this.consentGrantedAt,
      consentWithdrawnAt: this.consentWithdrawnAt,
      consentExpiresAt: this.consentExpiresAt,
      consentFormPath: this.consentFormPath,
      isConsentValid: this.isConsentValid(),
      assignedCaseManagerId: this.assignedCaseManagerId,
      caseType: this.caseType,
      caseStatus: this.caseStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Client;
