// ==============================================
// GENERATE NEW STARTER PIN UTILITY
// ==============================================
// Purpose: Generate unique PIN for new starters
// Pattern: NS-{FirstInitial}{LastInitial}{6-digit-number}
// Author: Atlas Agent
// Date: October 14, 2025
// Example: NS-JD123456 (John Doe)
// ==============================================

import { executeQuery } from '../config/database.js';

// ==============================================
// GENERATE UNIQUE NEW STARTER PIN
// ==============================================
/**
 * Generates a unique PIN for a new starter
 * @param {string} firstName - New starter's first name
 * @param {string} lastName - New starter's last name
 * @returns {Promise<string>} - Unique PIN (e.g., NS-JD123456)
 */
export async function generateNewStarterPIN(firstName, lastName) {
  try {
    console.log('\n🆔 === GENERATING NEW STARTER PIN ===');
    console.log(`Name: ${firstName} ${lastName}`);

    // Extract initials
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    const initials = `${firstInitial}${lastInitial}`;

    console.log(`Initials: ${initials}`);

    // Generate random 6-digit number
    let pin;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6 digits
      pin = `NS-${initials}${randomNumber}`;

      console.log(`Attempt ${attempts + 1}: Generated PIN ${pin}`);

      // Check if PIN exists in new_starters table
      const checkQuery = `
        SELECT COUNT(*) as count
        FROM new_starters
        WHERE pin = $1
      `;

      const result = await executeQuery(checkQuery, [pin]);
      const count = parseInt(result.rows[0].count);

      if (count === 0) {
        isUnique = true;
        console.log(`✅ PIN ${pin} is unique!`);
      } else {
        console.log(`⚠️  PIN ${pin} already exists, regenerating...`);
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error(`Failed to generate unique PIN after ${maxAttempts} attempts`);
    }

    console.log(`✅ NEW STARTER PIN GENERATED: ${pin}`);
    return pin;

  } catch (error) {
    console.error('❌ Failed to generate new starter PIN:', error);
    throw error;
  }
}

// ==============================================
// VALIDATE NEW STARTER PIN FORMAT
// ==============================================
/**
 * Validates that a PIN follows the new starter format
 * @param {string} pin - PIN to validate
 * @returns {boolean} - True if valid format
 */
export function validateNewStarterPIN(pin) {
  // Pattern: NS-{2 letters}{6 digits}
  const pinPattern = /^NS-[A-Z]{2}\d{6}$/;
  return pinPattern.test(pin);
}

// ==============================================
// CHECK IF PIN EXISTS
// ==============================================
/**
 * Checks if a PIN already exists in the database
 * @param {string} pin - PIN to check
 * @returns {Promise<boolean>} - True if exists
 */
export async function pinExists(pin) {
  try {
    const query = 'SELECT COUNT(*) as count FROM new_starters WHERE pin = $1';
    const result = await executeQuery(query, [pin]);
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('❌ Failed to check if PIN exists:', error);
    throw error;
  }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default {
  generateNewStarterPIN,
  validateNewStarterPIN,
  pinExists
};
