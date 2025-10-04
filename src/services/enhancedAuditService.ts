import { getUserInfo } from './keycloak';

// Enhanced audit event interface
export interface EnhancedAuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  email: string;
  roles: string[];
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  sessionDuration: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
  metadata: {
    page?: string;
    department?: string;
    location?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    additionalContext?: any;
  };
  complianceFlags: {
    hipaaRelevant: boolean;
    dataAccess: boolean;
    adminAction: boolean;
    securityEvent: boolean;
    patientDataAccess: boolean;
  };
}

// Audit event categories for comprehensive tracking
export const AUDIT_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  SYSTEM_ADMIN: 'system_admin',
  SECURITY: 'security',
  COMPLIANCE: 'compliance',
  USER_MANAGEMENT: 'user_management',
  REPORTING: 'reporting',
  NAVIGATION: 'navigation',
  FILE_OPERATIONS: 'file_operations',
  API_ACCESS: 'api_access'
} as const;

// Risk levels and their thresholds
export const RISK_LEVELS = {
  LOW: { threshold: 0, color: 'green' },
  MEDIUM: { threshold: 30, color: 'yellow' },
  HIGH: { threshold: 60, color: 'orange' },
  CRITICAL: { threshold: 80, color: 'red' }
} as const;

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Generate unique event ID
const generateEventId = (): string => {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get user's IP address
const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.warn('Failed to get IP address:', error);
    return 'unknown';
  }
};

// Parse user agent for device/browser info
const parseUserAgent = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  
  const browser = ua.includes('chrome') ? 'Chrome' :
                 ua.includes('firefox') ? 'Firefox' :
                 ua.includes('safari') ? 'Safari' :
                 ua.includes('edge') ? 'Edge' : 'Unknown';
  
  const os = ua.includes('windows') ? 'Windows' :
            ua.includes('mac') ? 'macOS' :
            ua.includes('linux') ? 'Linux' :
            ua.includes('android') ? 'Android' :
            ua.includes('ios') ? 'iOS' : 'Unknown';
  
  const deviceType = ua.includes('mobile') ? 'Mobile' :
                    ua.includes('tablet') ? 'Tablet' : 'Desktop';
  
  return { browser, os, deviceType };
};

// Calculate risk score based on action and context
const calculateRiskScore = (action: string, context: any): number => {
  let riskScore = 0;
  
  // Base risk by action type
  const actionRiskMap: { [key: string]: number } = {
    'user_login': 5,
    'user_logout': 2,
    'page_view': 1,
    'access_medical_record': 25,
    'access_patient_data': 30,
    'admin_action': 40,
    'data_export': 35,
    'user_management': 45,
    'security_event': 60,
    'failed_login': 50,
    'suspicious_activity': 80,
    'data_deletion': 70,
    'bulk_operations': 55,
    'api_access': 20,
    'file_download': 30,
    'file_upload': 40
  };
  
  riskScore += actionRiskMap[action] || 10;
  
  // Additional risk factors
  if (context.isAdminAction) riskScore += 20;
  if (context.isPatientDataAccess) riskScore += 25;
  if (context.isOutsideBusinessHours) riskScore += 15;
  if (context.isNewDevice) riskScore += 10;
  if (context.isHighVolume) riskScore += 20;
  if (context.isFailedAction) riskScore += 30;
  
  return Math.min(100, Math.max(0, riskScore));
};

// Determine risk level from score
const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score >= RISK_LEVELS.CRITICAL.threshold) return 'critical';
  if (score >= RISK_LEVELS.HIGH.threshold) return 'high';
  if (score >= RISK_LEVELS.MEDIUM.threshold) return 'medium';
  return 'low';
};

// Check compliance flags
const checkComplianceFlags = (action: string, context: any) => {
  return {
    hipaaRelevant: action.includes('patient') || action.includes('medical') || action.includes('health'),
    dataAccess: action.includes('access') || action.includes('view') || action.includes('read'),
    adminAction: action.includes('admin') || context.isAdminAction,
    securityEvent: action.includes('security') || action.includes('failed') || action.includes('suspicious'),
    patientDataAccess: action.includes('patient') || action.includes('medical_record')
  };
};

// Create enhanced audit event
const createAuditEvent = async (
  action: string,
  category: string,
  context: any = {}
): Promise<EnhancedAuditEvent> => {
  const userInfo = getUserInfo();
  const ipAddress = await getUserIP();
  const userAgent = navigator.userAgent;
  const { browser, os, deviceType } = parseUserAgent(userAgent);
  
  const sessionId = sessionStorage.getItem('hospital_session_id') || 'unknown';
  const sessionStart = sessionStorage.getItem('session_start_time');
  const sessionDuration = sessionStart ? 
    Math.floor((Date.now() - parseInt(sessionStart)) / 1000) : 0;
  
  const riskScore = calculateRiskScore(action, context);
  const riskLevel = getRiskLevel(riskScore);
  const complianceFlags = checkComplianceFlags(action, context);
  
  return {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    userId: userInfo?.username || 'anonymous',
    username: userInfo?.username || 'anonymous',
    email: userInfo?.email || '',
    roles: userInfo?.roles || [],
    action,
    resource: context.resource,
    resourceId: context.resourceId,
    ipAddress,
    userAgent,
    sessionId,
    sessionDuration,
    riskScore,
    riskLevel,
    success: context.success !== false,
    errorMessage: context.errorMessage,
    metadata: {
      page: context.page,
      department: userInfo?.roles?.[0] || 'unknown',
      location: 'unknown', // Could be enhanced with geolocation
      deviceType,
      browser,
      os,
      additionalContext: context.additionalContext
    },
    complianceFlags
  };
};

// Send audit event to backend
const sendAuditEvent = async (event: EnhancedAuditEvent): Promise<void> => {
  try {
    // Store locally as backup
    const existingEvents = JSON.parse(localStorage.getItem('enhanced_audit_events') || '[]');
    existingEvents.push(event);
    
    // Keep only last 500 events locally
    if (existingEvents.length > 500) {
      existingEvents.splice(0, existingEvents.length - 500);
    }
    localStorage.setItem('enhanced_audit_events', JSON.stringify(existingEvents));
    
    // Send to backend
    const response = await fetch(`${API_BASE_URL}/api/audit/enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      console.warn('Failed to send audit event to backend:', response.status);
    }
  } catch (error) {
    console.error('Error sending audit event:', error);
  }
};

// Enhanced tracking functions for comprehensive audit logging

// Authentication events
export const trackLogin = async (success: boolean = true, errorMessage?: string): Promise<void> => {
  const event = await createAuditEvent('user_login', AUDIT_CATEGORIES.AUTHENTICATION, {
    success,
    errorMessage,
    isAdminAction: false
  });
  await sendAuditEvent(event);
};

export const trackLogout = async (): Promise<void> => {
  const event = await createAuditEvent('user_logout', AUDIT_CATEGORIES.AUTHENTICATION, {
    success: true
  });
  await sendAuditEvent(event);
};

export const trackFailedLogin = async (username: string, errorMessage: string): Promise<void> => {
  const event = await createAuditEvent('failed_login', AUDIT_CATEGORIES.AUTHENTICATION, {
    success: false,
    errorMessage,
    username,
    isFailedAction: true
  });
  await sendAuditEvent(event);
};

// Data access events
export const trackDataAccess = async (
  resource: string,
  resourceId: string,
  accessType: 'read' | 'write' | 'delete' = 'read'
): Promise<void> => {
  const event = await createAuditEvent(`data_${accessType}`, AUDIT_CATEGORIES.DATA_ACCESS, {
    resource,
    resourceId,
    isPatientDataAccess: resource.includes('patient') || resource.includes('medical'),
    isDataAccess: true
  });
  await sendAuditEvent(event);
};

export const trackMedicalRecordAccess = async (recordId: string, patientId: string): Promise<void> => {
  const event = await createAuditEvent('access_medical_record', AUDIT_CATEGORIES.DATA_ACCESS, {
    resource: 'medical_record',
    resourceId: recordId,
    isPatientDataAccess: true,
    isDataAccess: true,
    additionalContext: { patientId }
  });
  await sendAuditEvent(event);
};

// Admin events
export const trackAdminAction = async (
  action: string,
  target?: string,
  details?: any
): Promise<void> => {
  const event = await createAuditEvent(`admin_${action}`, AUDIT_CATEGORIES.SYSTEM_ADMIN, {
    resource: target,
    isAdminAction: true,
    additionalContext: details
  });
  await sendAuditEvent(event);
};

export const trackUserManagement = async (
  action: string,
  targetUser: string,
  details?: any
): Promise<void> => {
  const event = await createAuditEvent(`user_management_${action}`, AUDIT_CATEGORIES.USER_MANAGEMENT, {
    resource: 'user',
    resourceId: targetUser,
    isAdminAction: true,
    additionalContext: details
  });
  await sendAuditEvent(event);
};

// Security events
export const trackSecurityEvent = async (
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details?: any
): Promise<void> => {
  const event = await createAuditEvent(`security_${eventType}`, AUDIT_CATEGORIES.SECURITY, {
    isSecurityEvent: true,
    additionalContext: { severity, ...details }
  });
  await sendAuditEvent(event);
};

// Navigation events
export const trackNavigation = async (fromPage: string, toPage: string): Promise<void> => {
  const event = await createAuditEvent('page_navigation', AUDIT_CATEGORIES.NAVIGATION, {
    page: toPage,
    additionalContext: { fromPage, toPage }
  });
  await sendAuditEvent(event);
};

// File operations
export const trackFileOperation = async (
  operation: 'upload' | 'download' | 'delete' | 'export',
  fileName: string,
  fileType?: string
): Promise<void> => {
  const event = await createAuditEvent(`file_${operation}`, AUDIT_CATEGORIES.FILE_OPERATIONS, {
    resource: 'file',
    resourceId: fileName,
    additionalContext: { fileType }
  });
  await sendAuditEvent(event);
};

// API access
export const trackAPIAccess = async (
  endpoint: string,
  method: string,
  success: boolean = true
): Promise<void> => {
  const event = await createAuditEvent('api_access', AUDIT_CATEGORIES.API_ACCESS, {
    resource: endpoint,
    success,
    additionalContext: { method, endpoint }
  });
  await sendAuditEvent(event);
};

// Compliance events
export const trackComplianceEvent = async (
  eventType: string,
  details: any
): Promise<void> => {
  const event = await createAuditEvent(`compliance_${eventType}`, AUDIT_CATEGORIES.COMPLIANCE, {
    additionalContext: details
  });
  await sendAuditEvent(event);
};

// Generic action tracking
export const trackAction = async (
  action: string,
  category: string,
  context: any = {}
): Promise<void> => {
  const event = await createAuditEvent(action, category, context);
  await sendAuditEvent(event);
};

// Get stored audit events
export const getStoredAuditEvents = (): EnhancedAuditEvent[] => {
  return JSON.parse(localStorage.getItem('enhanced_audit_events') || '[]');
};

// Clear stored audit events
export const clearStoredAuditEvents = (): void => {
  localStorage.removeItem('enhanced_audit_events');
};

// Export for use in other components
export default {
  trackLogin,
  trackLogout,
  trackFailedLogin,
  trackDataAccess,
  trackMedicalRecordAccess,
  trackAdminAction,
  trackUserManagement,
  trackSecurityEvent,
  trackNavigation,
  trackFileOperation,
  trackAPIAccess,
  trackComplianceEvent,
  trackAction,
  getStoredAuditEvents,
  clearStoredAuditEvents,
  AUDIT_CATEGORIES,
  RISK_LEVELS
};
