// =====================================================
// WORKSPACE ACCESS CONTROL MIDDLEWARE (NEW STARTERS)
// =====================================================
// Purpose: Gate features based on new starter compliance status
// Database: qolae_hrcompliance.new_starters
// Date: October 18, 2025
// NOTE: This is for NEW STARTERS accessing their own workspace
// For CM role permissions (Liz vs other CMs), see separate middleware
// =====================================================

import pool from '../config/database.js';

/**
 * Feature access levels for new starters
 * - pending: No workspace access (awaiting compliance submission)
 * - limited: Basic workspace access (compliance submitted, awaiting approval)
 * - full: Complete workspace access (compliance approved by HR)
 */
const WORKSPACE_ACCESS_LEVELS = {
  PENDING: 'pending',
  LIMITED: 'limited',
  FULL: 'full'
};

/**
 * Feature requirements for new starters
 * Maps features to minimum required access level
 */
const FEATURE_REQUIREMENTS = {
  // Limited access features (available after compliance submission)
  documents_library: WORKSPACE_ACCESS_LEVELS.LIMITED,
  compliance_folder: WORKSPACE_ACCESS_LEVELS.LIMITED,
  policies: WORKSPACE_ACCESS_LEVELS.LIMITED,
  basic_functions: WORKSPACE_ACCESS_LEVELS.LIMITED,

  // Full access features (available after compliance approval)
  full_dashboard: WORKSPACE_ACCESS_LEVELS.FULL,
  case_assignment: WORKSPACE_ACCESS_LEVELS.FULL,
  ina_visits: WORKSPACE_ACCESS_LEVELS.FULL,
  medical_notes: WORKSPACE_ACCESS_LEVELS.FULL,
  report_writing: WORKSPACE_ACCESS_LEVELS.FULL
};

/**
 * Get new starter by ID
 * @param {number} userId - New starter user ID
 * @returns {Promise<Object|null>} New starter record
 */
async function getNewStarterById(userId) {
  const query = `
    SELECT id, pin, full_name, email, workspace_access,
           compliance_submitted, compliance_approved
    FROM new_starters
    WHERE id = $1
  `;

  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Check if new starter has access to a specific feature
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @param {string} requiredFeature - Feature name to check
 * @returns {Promise<boolean>} True if access granted, sends error if denied
 */
export async function checkWorkspaceAccess(request, reply, requiredFeature) {
  try {
    // Get user ID from session/JWT
    const userId = request.user?.id || request.session?.userId;

    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized - Please log in'
      });
    }

    // Get user's workspace access level
    const user = await getNewStarterById(userId);

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: 'User not found'
      });
    }

    // Get required access level for this feature
    const requiredLevel = FEATURE_REQUIREMENTS[requiredFeature];

    if (!requiredLevel) {
      // Feature not defined in requirements - allow by default
      console.warn(`⚠️ Feature "${requiredFeature}" not defined in FEATURE_REQUIREMENTS`);
      return true;
    }

    // Check access level
    const userAccessLevel = user.workspace_access || WORKSPACE_ACCESS_LEVELS.PENDING;

    // Access logic:
    // - PENDING: No access to anything
    // - LIMITED: Access to limited features only
    // - FULL: Access to everything

    let hasAccess = false;

    if (userAccessLevel === WORKSPACE_ACCESS_LEVELS.FULL) {
      // Full access users can access everything
      hasAccess = true;
    } else if (userAccessLevel === WORKSPACE_ACCESS_LEVELS.LIMITED) {
      // Limited access users can only access limited features
      hasAccess = requiredLevel === WORKSPACE_ACCESS_LEVELS.LIMITED;
    } else {
      // Pending users have no access
      hasAccess = false;
    }

    if (!hasAccess) {
      const message = getAccessDeniedMessage(userAccessLevel, requiredFeature);

      return reply.code(403).send({
        success: false,
        error: 'Access denied',
        message: message,
        userAccessLevel: userAccessLevel,
        requiredLevel: requiredLevel
      });
    }

    // Access granted
    return true;

  } catch (error) {
    console.error('❌ Error checking workspace access:', error);
    return reply.code(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get user-friendly access denied message
 * @param {string} userLevel - User's current access level
 * @param {string} feature - Feature being accessed
 * @returns {string} User-friendly message
 */
function getAccessDeniedMessage(userLevel, feature) {
  if (userLevel === WORKSPACE_ACCESS_LEVELS.PENDING) {
    return '🔒 This feature is locked until you submit your compliance documents. Please complete the compliance form to unlock workspace access.';
  }

  if (userLevel === WORKSPACE_ACCESS_LEVELS.LIMITED) {
    return '🔒 This feature will be available after your compliance is approved. Your submission is being reviewed by HR.';
  }

  return '🔒 You do not have access to this feature.';
}

/**
 * Get list of allowed features for new starter
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @returns {Promise<Object>} List of allowed features and access level
 */
export async function getAllowedFeatures(request, reply) {
  try {
    const userId = request.user?.id || request.session?.userId;

    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized'
      });
    }

    const user = await getNewStarterById(userId);

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: 'User not found'
      });
    }

    const userAccessLevel = user.workspace_access || WORKSPACE_ACCESS_LEVELS.PENDING;
    const allowedFeatures = [];

    // Determine which features user can access
    if (userAccessLevel === WORKSPACE_ACCESS_LEVELS.PENDING) {
      // No features available - only compliance submission
      allowedFeatures.push('compliance_submission');
    } else if (userAccessLevel === WORKSPACE_ACCESS_LEVELS.LIMITED) {
      // Limited features
      allowedFeatures.push(
        'documents_library',
        'compliance_folder',
        'policies',
        'basic_functions'
      );
    } else if (userAccessLevel === WORKSPACE_ACCESS_LEVELS.FULL) {
      // All features
      allowedFeatures.push(
        'documents_library',
        'compliance_folder',
        'policies',
        'basic_functions',
        'full_dashboard',
        'case_assignment',
        'ina_visits',
        'medical_notes',
        'report_writing'
      );
    }

    return {
      success: true,
      accessLevel: userAccessLevel,
      features: allowedFeatures,
      complianceSubmitted: user.compliance_submitted,
      complianceApproved: user.compliance_approved
    };

  } catch (error) {
    console.error('❌ Error getting allowed features:', error);
    return reply.code(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Update workspace access level (called by HR after compliance approval)
 * @param {number} newStarterId - New starter ID
 * @param {string} accessLevel - New access level (limited or full)
 * @returns {Promise<boolean>} Success status
 */
export async function updateWorkspaceAccess(newStarterId, accessLevel) {
  try {
    // Validate access level
    if (!Object.values(WORKSPACE_ACCESS_LEVELS).includes(accessLevel)) {
      throw new Error(`Invalid access level: ${accessLevel}`);
    }

    const query = `
      UPDATE new_starters
      SET workspace_access = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, pin, full_name, workspace_access
    `;

    const result = await pool.query(query, [accessLevel, newStarterId]);

    if (result.rows.length === 0) {
      throw new Error(`New starter ${newStarterId} not found`);
    }

    console.log(`✅ Updated workspace access for ${result.rows[0].pin} to ${accessLevel}`);
    return true;

  } catch (error) {
    console.error('❌ Error updating workspace access:', error);
    throw error;
  }
}

export default {
  checkWorkspaceAccess,
  getAllowedFeatures,
  updateWorkspaceAccess,
  WORKSPACE_ACCESS_LEVELS,
  FEATURE_REQUIREMENTS
};
