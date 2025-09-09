/**
 * Risk Assessment Service
 * Manages user risk scores with consistent rules across the application
 */

// Base risk scores by role
const BASE_RISK_SCORES = {
  admin: 30,
  manager: 30,
  employee: 30,
  member: 30,
  default: 30
};

// Risk factors and their impact
const RISK_FACTORS = {
  // Login factors
  FAILED_LOGIN: 15,
  UNUSUAL_LOCATION: 10,
  UNUSUAL_DEVICE: 10,
  OUTSIDE_BUSINESS_HOURS: 5,
  
  // Navigation factors (only for non-admin/manager users)
  SENSITIVE_PAGE_ACCESS: 10,
  SUSPICIOUS_BEHAVIOR: 20,
  
  // Time-based factors
  RAPID_NAVIGATION: 5,
  MULTIPLE_FAILED_ATTEMPTS: 25
};

// Pages that increase risk for non-privileged users
const SENSITIVE_PAGES = [
  '/dashboard/users/management',
  '/dashboard/policies',
  '/dashboard/access-control',
  '/dashboard/audit',
  '/dashboard/behavioral-monitoring'
];

/**
 * Get user's current risk score
 * @param {string} userId - User ID
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<number>} Current risk score (0-100)
 */
export async function getUserRiskScore(userId, pool) {
  try {
    const client = await pool.connect();
    
    // Get user's recent activity from user_behavior table
    const query = `
      SELECT * FROM user_behavior 
      WHERE user_id = $1 
        AND timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
    `;
    
    const result = await client.query(query, [userId]);
    client.release();
    
    const recentLogs = result.rows;

    if (recentLogs.length === 0) {
      return BASE_RISK_SCORES.default;
    }

    // Get user's primary role
    const userRole = getUserPrimaryRole(recentLogs[0].roles);
    let riskScore = BASE_RISK_SCORES[userRole] || BASE_RISK_SCORES.default;

    // Calculate risk based on recent activity
    riskScore += calculateActivityRisk(recentLogs, userRole);

    // Cap risk score at 100
    return Math.min(100, Math.max(0, riskScore));
    
  } catch (error) {
    console.error('Error calculating user risk score:', error);
    return BASE_RISK_SCORES.default;
  }
}

/**
 * Calculate risk increase for page navigation
 * @param {string} userId - User ID
 * @param {string} page - Page being accessed
 * @param {string[]} userRoles - User's roles
 * @returns {Promise<number>} Risk score increase
 */
export async function calculatePageNavigationRisk(userId, page, userRoles = []) {
  const userRole = getUserPrimaryRole(userRoles);
  
  // Admin and managers don't get risk increase for navigation
  if (userRole === 'admin' || userRole === 'manager') {
    return 0;
  }

  // Check if page is sensitive
  if (SENSITIVE_PAGES.some(sensitivePage => page.includes(sensitivePage))) {
    return RISK_FACTORS.SENSITIVE_PAGE_ACCESS;
  }

  return 0;
}

/**
 * Log user activity and update risk score
 * @param {string} userId - User ID
 * @param {string} action - Action performed
 * @param {Object} context - Additional context (IP, user agent, page, etc.)
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<number>} Updated risk score
 */
export async function logActivityAndUpdateRisk(userId, action, context = {}, pool) {
  try {
    const { ip, userAgent, page, roles = [], success = true, forceRiskScore } = context;
    
    let finalRiskScore;
    
    // Check if we need to force a specific risk score (for classified data access)
    if (forceRiskScore !== undefined) {
      finalRiskScore = Math.min(100, Math.max(0, forceRiskScore));
    } else {
      // Calculate current risk score
      const currentRisk = await getUserRiskScore(userId, pool);
      
      // Calculate additional risk from this action
      let additionalRisk = 0;
      
      if (!success && action === 'login') {
        additionalRisk += RISK_FACTORS.FAILED_LOGIN;
      }
      
      if (page) {
        additionalRisk += await calculatePageNavigationRisk(userId, page, roles);
      }
      
      // Special handling for classified data access
      if (action === 'classified_data_access') {
        // Set risk score to 75 for classified data access
        finalRiskScore = 75;
      } else {
        // Check for time-based risk (outside business hours)
        const hour = new Date().getHours();
        if (hour < 9 || hour > 17) {
          additionalRisk += RISK_FACTORS.OUTSIDE_BUSINESS_HOURS;
        }
        
        finalRiskScore = Math.min(100, currentRisk + additionalRisk);
      }
    }
    
    const riskLevel = calculateRiskLevel(finalRiskScore);
    
    // Log the activity (this will be stored in PostgreSQL)
    const client = await pool.connect();
    const logQuery = `
      INSERT INTO user_behavior (
        username, user_id, email, roles, ip_address, user_agent, 
        action, session_id, session_period, risk_score, risk_level, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;
    
    const logValues = [
      context.username || 'unknown',
      userId,
      context.email || '',
      roles,
      ip || 'unknown',
      userAgent || '',
      action,
      context.sessionId || 'unknown',
      context.sessionPeriod || 0,
      finalRiskScore / 100, // Convert to 0-1 scale for storage
      riskLevel,
      JSON.stringify({
        page,
        additionalRisk,
        factors: getAppliedRiskFactors(context, roles, success, action)
      })
    ];
    
    await client.query(logQuery, logValues);
    client.release();
    
    return finalRiskScore;
    
  } catch (error) {
    console.error('Error logging activity and updating risk:', error);
    return BASE_RISK_SCORES.default;
  }
}

/**
 * Initialize user with default risk score on first login
 * @param {string} userId - User ID
 * @param {Object} userInfo - User information
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<number>} Initial risk score
 */
export async function initializeUserRisk(userId, userInfo, pool) {
  const userRole = getUserPrimaryRole(userInfo.roles || []);
  const baseScore = BASE_RISK_SCORES[userRole] || BASE_RISK_SCORES.default;
  
  // Log initial login with base risk score
  await logActivityAndUpdateRisk(userId, 'login', {
    ...userInfo,
    success: true
  }, pool);
  
  return baseScore;
}

/**
 * Get user's primary role
 * @param {string[]} roles - Array of user roles
 * @returns {string} Primary role
 */
function getUserPrimaryRole(roles = []) {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('manager')) return 'manager';
  if (roles.includes('employee')) return 'employee';
  if (roles.includes('member')) return 'member';
  return 'default';
}

/**
 * Calculate risk level based on score
 * @param {number} riskScore - Risk score (0-100)
 * @returns {string} Risk level
 */
function calculateRiskLevel(riskScore) {
  if (riskScore >= 70) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
}

/**
 * Calculate risk from recent activity
 * @param {Array} recentLogs - Recent user logs
 * @param {string} userRole - User's primary role
 * @returns {number} Additional risk from activity
 */
function calculateActivityRisk(recentLogs, userRole) {
  let additionalRisk = 0;
  
  // Count failed logins in last 24 hours
  const failedLogins = recentLogs.filter(log => 
    log.action === 'login' && !log.success
  ).length;
  
  if (failedLogins > 0) {
    additionalRisk += failedLogins * RISK_FACTORS.FAILED_LOGIN;
  }
  
  // Check for rapid navigation (many page accesses in short time)
  const pageAccesses = recentLogs.filter(log => 
    log.action === 'page_access'
  );
  
  if (pageAccesses.length > 50) { // More than 50 page accesses in 24 hours
    additionalRisk += RISK_FACTORS.RAPID_NAVIGATION;
  }
  
  return additionalRisk;
}

/**
 * Get list of applied risk factors for logging
 * @param {Object} context - Activity context
 * @param {string[]} roles - User roles
 * @param {boolean} success - Whether action was successful
 * @param {string} action - Action performed
 * @returns {string[]} List of risk factors
 */
function getAppliedRiskFactors(context, roles, success, action) {
  const factors = [];
  
  if (!success && action === 'login') {
    factors.push('failed_login');
  }
  
  const userRole = getUserPrimaryRole(roles);
  if (context.page && userRole !== 'admin' && userRole !== 'manager') {
    if (SENSITIVE_PAGES.some(sensitivePage => context.page.includes(sensitivePage))) {
      factors.push('sensitive_page_access');
    }
  }
  
  const hour = new Date().getHours();
  if (hour < 9 || hour > 17) {
    factors.push('outside_business_hours');
  }
  
  return factors;
}

/**
 * Get risk score for all users (for dashboard displays)
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<Object>} Risk score summary
 */
export async function getAllUsersRiskSummary(pool) {
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT 
        user_id,
        username,
        roles,
        MAX(timestamp) as last_activity,
        AVG(CASE 
          WHEN timestamp >= NOW() - INTERVAL '24 hours' 
          THEN risk_score 
          ELSE NULL 
        END) as current_risk_score
      FROM user_behavior 
      WHERE username IS NOT NULL 
        AND user_id IS NOT NULL
      GROUP BY user_id, username, roles
    `;
    
    const result = await client.query(query);
    client.release();
    
    const users = result.rows.map(user => ({
      userId: user.user_id,
      username: user.username,
      roles: user.roles,
      lastActivity: user.last_activity,
      riskScore: Math.round((user.current_risk_score || BASE_RISK_SCORES.default / 100) * 100)
    }));
    
    return users;
  } catch (error) {
    console.error('Error getting users risk summary:', error);
    return [];
  }
}