// ==============================================
// ASSIGNMENT DATA MODEL
// ==============================================
// Purpose: Data model for case/report assignments
// Author: Phoenix Agent
// Date: October 14, 2025
// Database: qolae_hrcompliance.assignments
// ==============================================

import { executeQuery } from '../config/database.js';

// ==============================================
// ASSIGNMENT STATUS ENUMS
// ==============================================
export const ASSIGNMENT_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ASSIGNMENT_TYPE = {
  INA_REPORT: 'ina_report',
  CASE_REVIEW: 'case_review',
  COMPLIANCE_CHECK: 'compliance_check'
};

// ==============================================
// ASSIGNMENT MODEL CLASS
// ==============================================
export class Assignment {
  constructor(data = {}) {
    this.id = data.id || null;
    this.assignmentType = data.assignmentType || ASSIGNMENT_TYPE.INA_REPORT;
    this.caseManagerId = data.caseManagerId || null;
    this.readerId = data.readerId || null;
    this.clientId = data.clientId || null;
    this.status = data.status || ASSIGNMENT_STATUS.PENDING;
    this.assignedAt = data.assignedAt || null;
    this.dueDate = data.dueDate || null;
    this.completedAt = data.completedAt || null;
    this.notes = data.notes || null;

    // Audit fields
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy || null;
    this.updatedBy = data.updatedBy || null;
  }

  // ==============================================
  // CREATE NEW ASSIGNMENT
  // ==============================================
  static async create(assignmentData) {
    try {
      console.log('\n=Ë === CREATING ASSIGNMENT ===');

      const query = `
        INSERT INTO assignments (
          assignment_type, case_manager_id, reader_id, client_id,
          status, assigned_at, due_date, notes, created_at, updated_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *
      `;

      const params = [
        assignmentData.assignmentType,
        assignmentData.caseManagerId,
        assignmentData.readerId,
        assignmentData.clientId,
        assignmentData.status || ASSIGNMENT_STATUS.PENDING,
        assignmentData.assignedAt || new Date(),
        assignmentData.dueDate,
        assignmentData.notes,
        new Date(),
        new Date(),
        assignmentData.createdBy || 'system'
      ];

      const result = await executeQuery(query, params);
      console.log(` Assignment created with ID: ${result.rows[0].id}`);

      return new Assignment(result.rows[0]);

    } catch (error) {
      console.error('L Failed to create assignment:', error);
      throw error;
    }
  }

  // ==============================================
  // FIND ASSIGNMENT BY ID
  // ==============================================
  static async findById(id) {
    try {
      const query = 'SELECT * FROM assignments WHERE id = $1';
      const result = await executeQuery(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Assignment(result.rows[0]);
    } catch (error) {
      console.error('L Failed to find assignment by ID:', error);
      throw error;
    }
  }

  // ==============================================
  // GET ALL ASSIGNMENTS BY READER
  // ==============================================
  static async getByReader(readerId) {
    try {
      const query = 'SELECT * FROM assignments WHERE reader_id = $1 ORDER BY assigned_at DESC';
      const result = await executeQuery(query, [readerId]);

      return result.rows.map(row => new Assignment(row));
    } catch (error) {
      console.error('L Failed to get assignments by reader:', error);
      throw error;
    }
  }

  // ==============================================
  // UPDATE ASSIGNMENT STATUS
  // ==============================================
  async updateStatus(newStatus, updatedBy = null) {
    try {
      console.log(`\n= === UPDATING ASSIGNMENT STATUS ===`);
      console.log(`ID: ${this.id}, Status: ${this.status} ’ ${newStatus}`);

      const query = `
        UPDATE assignments
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

      console.log(` Assignment status updated successfully`);
      return this;

    } catch (error) {
      console.error('L Failed to update assignment status:', error);
      throw error;
    }
  }

  // ==============================================
  // TO JSON
  // ==============================================
  toJSON() {
    return {
      id: this.id,
      assignmentType: this.assignmentType,
      caseManagerId: this.caseManagerId,
      readerId: this.readerId,
      clientId: this.clientId,
      status: this.status,
      assignedAt: this.assignedAt,
      dueDate: this.dueDate,
      completedAt: this.completedAt,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Assignment;
