/**
 * Risk Assessment Service
 * Manages user risk scores with consistent rules across the application
 */

import mongoose from 'mongoose';

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
 * @returns {Promise<number>} Current risk score (0-100)
 */
export async function getUserRiskScore(userId) {
  try {
    // Get Log model (it's defined in routes/log.js)
    const Log = mongoose.models.Log || mongoose.model('Log');
    
    // Get user's recent activity from logs
    const recentLogs = await Log.find({
      userId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ timestamp: -1 });

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
 * @returns {Promise<number>} Updated risk score
 */
export async function logActivityAndUpdateRisk(userId, action, context = {}) {
  try {
    // Get Log model (it's defined in routes/log.js)
    const Log = mongoose.models.Log || mongoose.model('Log');
    
    const { ip, userAgent, page, roles = [], success = true, forceRiskScore } = context;
    
    let finalRiskScore;
    
    // Check if we need to force a specific risk score (for classified data access)
    if (forceRiskScore !== undefined) {
      finalRiskScore = Math.min(100, Math.max(0, forceRiskScore));
    } else {
      // Calculate current risk score
      const currentRisk = await getUserRiskScore(userId);
      
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
    
    // Log the activity (this will be stored in MongoDB)
    const logData = {
      userId,
      username: context.username,
      email: context.email,
      roles,
      action,
      success,
      ipAddress: ip,
      userAgent,
      riskLevel,
      riskScore: finalRiskScore,
      timestamp: new Date(),
      metadata: {
        page,
        additionalRisk,
        factors: getAppliedRiskFactors(context, roles, success, action)
      }
    };
    
    // Save to database
    const log = new Log(logData);
    await log.save();
    
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
 * @returns {Promise<number>} Initial risk score
 */
export async function initializeUserRisk(userId, userInfo) {
  const userRole = getUserPrimaryRole(userInfo.roles || []);
  const baseScore = BASE_RISK_SCORES[userRole] || BASE_RISK_SCORES.default;
  
  // Log initial login with base risk score
  await logActivityAndUpdateRisk(userId, 'login', {
    ...userInfo,
    success: true
  });
  
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
 * @returns {Promise<Object>} Risk score summary
 */
export async function getAllUsersRiskSummary() {
  try {
    // Get Log model (it's defined in routes/log.js)
    const Log = mongoose.models.Log || mongoose.model('Log');
    
    const users = await Log.aggregate([
      {
        $match: {
          username: { $exists: true, $ne: null },
          userId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          roles: { $first: '$roles' },
          lastActivity: { $max: '$timestamp' },
          currentRiskScore: { 
            $avg: { 
              $cond: [
                { $gte: ['$timestamp', { $subtract: [new Date(), 24 * 60 * 60 * 1000] }] },
                '$riskScore',
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          userId: '$_id',
          username: 1,
          roles: 1,
          lastActivity: 1,
          riskScore: { 
            $ifNull: [
              { $round: ['$currentRiskScore', 0] },
              BASE_RISK_SCORES.default
            ]
          }
        }
      }
    ]);
    
    return users;
  } catch (error) {
    console.error('Error getting users risk summary:', error);
    return [];
  }
} 