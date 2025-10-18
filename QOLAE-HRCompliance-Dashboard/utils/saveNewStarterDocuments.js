// =====================================================
// SAVE NEW STARTER DOCUMENTS UTILITY
// Purpose: Store uploaded files as binary data in qolae_hrcompliance database
// Database: qolae_hrcompliance.new_starter_documents
// Storage: BYTEA (binary data) - no file system storage
// Date: October 18, 2025
// =====================================================

import pool from '../config/database.js';

// File validation constants (from API Contract)
const MAX_FILE_SIZE = 10 * 1024 * 1024;        // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;       // 50MB total
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

/**
 * Determine document type from field name or filename
 * @param {string} fieldName - Multipart form field name
 * @param {string} filename - Original filename
 * @returns {string} Document type
 */
function determineDocumentType(fieldName, filename) {
  const lowerField = fieldName.toLowerCase();
  const lowerFile = filename.toLowerCase();

  // Map field names to document types
  if (lowerField.includes('identity') || lowerField.includes('passport') || lowerField.includes('driving')) {
    return 'proof_of_id';
  }
  if (lowerField.includes('utility') || lowerField.includes('address') || lowerField.includes('bill')) {
    return 'proof_of_address';
  }
  if (lowerField.includes('qualification') || lowerField.includes('certificate') || lowerField.includes('degree')) {
    return 'qualifications';
  }
  if (lowerField.includes('dbs') || lowerField.includes('pvg') || lowerField.includes('background')) {
    return 'dbs_certificate';
  }
  if (lowerField.includes('professional') || lowerField.includes('registration') || lowerField.includes('nmc') || lowerField.includes('gmc')) {
    return 'professional_registration';
  }

  // Fallback: try to determine from filename
  if (lowerFile.includes('passport') || lowerFile.includes('license') || lowerFile.includes('id')) {
    return 'proof_of_id';
  }
  if (lowerFile.includes('bill') || lowerFile.includes('address')) {
    return 'proof_of_address';
  }

  // Default
  return 'other_document';
}

/**
 * Validate file size and type
 * @param {Object} file - Fastify multipart file object
 * @throws {Error} If validation fails
 */
function validateFile(file) {
  // Check file size
  if (file.file.bytesRead > MAX_FILE_SIZE) {
    throw new Error(`File too large (${Math.round(file.file.bytesRead / 1024 / 1024)}MB > 10MB limit): ${file.filename}`);
  }

  // Check file type by MIME type (not extension - security!)
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type (${file.mimetype} not allowed): ${file.filename}`);
  }
}

/**
 * Validate total size of all files
 * @param {Array} files - Array of file objects
 * @throws {Error} If total size exceeds limit
 */
function validateTotalSize(files) {
  const totalSize = files.reduce((sum, file) => sum + file.file.bytesRead, 0);

  if (totalSize > MAX_TOTAL_SIZE) {
    throw new Error(`Total size exceeded (${Math.round(totalSize / 1024 / 1024)}MB > 50MB limit)`);
  }
}

/**
 * Save uploaded files to database as binary data (BYTEA)
 * @param {Array} files - Array of Fastify multipart file objects
 * @param {number} newStarterId - Database ID of new starter
 * @returns {Promise<Array>} Array of saved file metadata objects
 */
export async function saveNewStarterDocuments(files, newStarterId) {
  try {
    // Validate inputs
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    if (!newStarterId) {
      throw new Error('New starter ID is required');
    }

    // Validate each file individually
    for (const file of files) {
      validateFile(file);
    }

    // Validate total size
    validateTotalSize(files);

    const savedFiles = [];

    // Process each file
    for (const file of files) {
      // Read file into buffer
      const fileBuffer = await file.toBuffer();

      // Determine document type
      const documentType = determineDocumentType(file.fieldname, file.filename);

      // Store in database
      const query = `
        INSERT INTO new_starter_documents
        (new_starter_id, document_type, file_name, file_data, file_size, uploaded_at, status)
        VALUES ($1, $2, $3, $4, $5, NOW(), 'pending_review')
        RETURNING id, document_type, file_name, file_size, uploaded_at, status
      `;

      const values = [
        newStarterId,
        documentType,
        file.filename,
        fileBuffer,
        fileBuffer.length
      ];

      const result = await pool.query(query, values);

      savedFiles.push({
        id: result.rows[0].id,
        documentType: result.rows[0].document_type,
        fileName: result.rows[0].file_name,
        fileSize: result.rows[0].file_size,
        uploadedAt: result.rows[0].uploaded_at,
        status: result.rows[0].status
      });
    }

    console.log(`✅ Saved ${savedFiles.length} documents for new starter ID ${newStarterId}`);
    return savedFiles;

  } catch (error) {
    console.error('❌ Error saving new starter documents:', error);
    throw error;
  }
}

/**
 * Retrieve document from database
 * @param {number} documentId - Document ID
 * @returns {Promise<Object>} Document with binary data
 */
export async function getNewStarterDocument(documentId) {
  try {
    const query = `
      SELECT id, new_starter_id, document_type, file_name, file_data, file_size, uploaded_at, status
      FROM new_starter_documents
      WHERE id = $1
    `;

    const result = await pool.query(query, [documentId]);

    if (result.rows.length === 0) {
      throw new Error(`Document ${documentId} not found`);
    }

    return result.rows[0];

  } catch (error) {
    console.error('❌ Error retrieving document:', error);
    throw error;
  }
}

/**
 * Get all documents for a new starter
 * @param {number} newStarterId - New starter ID
 * @returns {Promise<Array>} Array of document metadata (without binary data)
 */
export async function getNewStarterDocumentsList(newStarterId) {
  try {
    const query = `
      SELECT id, document_type, file_name, file_size, uploaded_at, status
      FROM new_starter_documents
      WHERE new_starter_id = $1
      ORDER BY uploaded_at DESC
    `;

    const result = await pool.query(query, [newStarterId]);
    return result.rows;

  } catch (error) {
    console.error('❌ Error retrieving documents list:', error);
    throw error;
  }
}

/**
 * Delete a document
 * @param {number} documentId - Document ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteNewStarterDocument(documentId) {
  try {
    const query = 'DELETE FROM new_starter_documents WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [documentId]);

    if (result.rows.length === 0) {
      throw new Error(`Document ${documentId} not found`);
    }

    console.log(`✅ Deleted document ${documentId}`);
    return true;

  } catch (error) {
    console.error('❌ Error deleting document:', error);
    throw error;
  }
}

export default {
  saveNewStarterDocuments,
  getNewStarterDocument,
  getNewStarterDocumentsList,
  deleteNewStarterDocument
};
