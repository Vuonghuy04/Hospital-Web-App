import { getUserInfo, getToken } from './keycloak';

// Interface for user behavior data
interface UserBehaviorData {
  username: string;
  userId: string;
  email: string;
  roles: string[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  action: string;
  sessionId: string;
  sessionPeriod: number;
  riskScore: number; // Default to 0, will be updated by ML model
  metadata: {
    realm: string;
    clientId: string;
    tokenType: string;
  };
}

// Generate session ID if not exists
let currentSessionId = sessionStorage.getItem('hospital_session_id');
if (!currentSessionId) {
  currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('hospital_session_id', currentSessionId);
  sessionStorage.setItem('session_start_time', Date.now().toString());
}

// Get session period in minutes
const getSessionPeriod = (): number => {
  const startTime = sessionStorage.getItem('session_start_time');
  if (!startTime) return 0;
  return Math.floor((Date.now() - parseInt(startTime)) / (1000 * 60));
};

// Get user's IP address (simplified - in production use a proper service)
const getUserIP = async (): Promise<string> => {
  try {
    // In production, you might want to use a service like ipapi.co
    // For now, we'll use a placeholder
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.warn('Failed to get IP address:', error);
    return 'unknown';
  }
};

// Note: Risk score generation removed - will be handled by ML model

// Create behavior data object
const createBehaviorData = async (action: string): Promise<UserBehaviorData> => {
  const userInfo = getUserInfo();
  const ipAddress = await getUserIP();
  
  return {
    username: userInfo?.username || 'anonymous',
    userId: userInfo?.username || 'anonymous', // Using username as userId for now
    email: userInfo?.email || '',
    roles: userInfo?.roles || [],
    ipAddress,
    userAgent: navigator.userAgent,
    timestamp: new Date(),
    action,
    sessionId: currentSessionId!,
    sessionPeriod: getSessionPeriod(),
    riskScore: 0, // Default to 0, will be updated by ML model
    metadata: {
      realm: process.env.REACT_APP_KEYCLOAK_REALM || 'demo',
      clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'demo-client',
      tokenType: 'Bearer',
    },
  };
};

// Determine API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Send behavior data to backend (or log for now)
const sendBehaviorData = async (data: UserBehaviorData): Promise<void> => {
  try {
    console.log('🔍 USER BEHAVIOR TRACKED:', {
      action: data.action,
      user: data.username,
      timestamp: data.timestamp.toISOString(),
      sessionPeriod: `${data.sessionPeriod} minutes`,
      riskScore: data.riskScore,
      ipAddress: data.ipAddress,
    });

    // Store in localStorage as backup
    const existingData = JSON.parse(localStorage.getItem('hospital_behavior_data') || '[]');
    existingData.push(data);
    
    // Keep only last 100 records in localStorage
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }
    
    localStorage.setItem('hospital_behavior_data', JSON.stringify(existingData));

    // Send to backend API with ML risk prediction
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml-risk/behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Behavior data sent with ML prediction:', {
          message: result.message,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          mlPrediction: result.mlPrediction
        });
      } else {
        console.error('❌ Failed to send behavior data:', response.status, response.statusText);
        
        // Fallback to regular behavior tracking if ML service is unavailable
        try {
          const fallbackResponse = await fetch(`${API_BASE_URL}/api/behavior-tracking`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (fallbackResponse.ok) {
            console.log('✅ Behavior data sent via fallback endpoint');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback API also failed:', fallbackError);
        }
      }
    } catch (apiError) {
      console.error('❌ API Error sending behavior data:', apiError);
      
      // Fallback to regular behavior tracking if ML service is unavailable
      try {
        const fallbackResponse = await fetch(`${API_BASE_URL}/api/behavior-tracking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (fallbackResponse.ok) {
          console.log('✅ Behavior data sent via fallback endpoint');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback API also failed:', fallbackError);
      }
    }
    
  } catch (error) {
    console.error('Failed to send behavior data:', error);
  }
};

// Public functions for tracking different actions
export const trackLogin = async (): Promise<void> => {
  const data = await createBehaviorData('user_login');
  await sendBehaviorData(data);
};

export const trackLogout = async (): Promise<void> => {
  const data = await createBehaviorData('user_logout');
  await sendBehaviorData(data);
  
  // Clear session data on logout
  sessionStorage.removeItem('hospital_session_id');
  sessionStorage.removeItem('session_start_time');
};

export const trackPageView = async (page: string): Promise<void> => {
  const data = await createBehaviorData(`page_view_${page}`);
  await sendBehaviorData(data);
};

export const trackRecordAccess = async (recordId: string): Promise<void> => {
  const data = await createBehaviorData(`access_medical_record_${recordId}`);
  await sendBehaviorData(data);
};

export const trackJITRequest = async (requestType: string): Promise<void> => {
  const data = await createBehaviorData(`jit_request_${requestType}`);
  await sendBehaviorData(data);
};

export const trackJITApproval = async (requestId: string, decision: 'approve' | 'deny'): Promise<void> => {
  const data = await createBehaviorData(`jit_${decision}_${requestId}`);
  await sendBehaviorData(data);
};

export const trackUserAction = async (action: string, details?: string): Promise<void> => {
  const actionName = details ? `${action}_${details}` : action;
  const data = await createBehaviorData(actionName);
  await sendBehaviorData(data);
};

// Enhanced tracking functions for comprehensive user behavior monitoring
export const trackAppointmentView = async (appointmentId: string): Promise<void> => {
  const data = await createBehaviorData(`view_appointment_${appointmentId}`);
  await sendBehaviorData(data);
};

export const trackAppointmentCreate = async (): Promise<void> => {
  const data = await createBehaviorData('create_appointment');
  await sendBehaviorData(data);
};

export const trackAppointmentUpdate = async (appointmentId: string): Promise<void> => {
  const data = await createBehaviorData(`update_appointment_${appointmentId}`);
  await sendBehaviorData(data);
};

export const trackPrescriptionView = async (prescriptionId: string): Promise<void> => {
  const data = await createBehaviorData(`view_prescription_${prescriptionId}`);
  await sendBehaviorData(data);
};

export const trackLabResultView = async (labId: string): Promise<void> => {
  const data = await createBehaviorData(`view_lab_result_${labId}`);
  await sendBehaviorData(data);
};

export const trackPatientSearch = async (searchTerm: string): Promise<void> => {
  const data = await createBehaviorData(`search_patient_${searchTerm.length > 0 ? 'with_term' : 'empty'}`);
  await sendBehaviorData(data);
};

export const trackDataExport = async (dataType: string): Promise<void> => {
  const data = await createBehaviorData(`export_data_${dataType}`);
  await sendBehaviorData(data);
};

export const trackAdminAction = async (action: string, target?: string): Promise<void> => {
  const actionName = target ? `admin_${action}_${target}` : `admin_${action}`;
  const data = await createBehaviorData(actionName);
  await sendBehaviorData(data);
};

export const trackSecurityEvent = async (eventType: string, details?: string): Promise<void> => {
  const actionName = details ? `security_${eventType}_${details}` : `security_${eventType}`;
  const data = await createBehaviorData(actionName);
  await sendBehaviorData(data);
};

export const trackSystemAccess = async (resource: string, accessType: 'read' | 'write' | 'delete' = 'read'): Promise<void> => {
  const data = await createBehaviorData(`${accessType}_${resource}`);
  await sendBehaviorData(data);
};

export const trackButtonClick = async (buttonName: string, context?: string): Promise<void> => {
  const actionName = context ? `click_${buttonName}_${context}` : `click_${buttonName}`;
  const data = await createBehaviorData(actionName);
  await sendBehaviorData(data);
};

export const trackFormSubmission = async (formName: string, success: boolean = true): Promise<void> => {
  const data = await createBehaviorData(`submit_${formName}_${success ? 'success' : 'failed'}`);
  await sendBehaviorData(data);
};

export const trackNavigationChange = async (fromPage: string, toPage: string): Promise<void> => {
  const data = await createBehaviorData(`navigate_${fromPage}_to_${toPage}`);
  await sendBehaviorData(data);
};

export const trackFileDownload = async (fileName: string, fileType?: string): Promise<void> => {
  const actionName = fileType ? `download_${fileType}_${fileName}` : `download_${fileName}`;
  const data = await createBehaviorData(actionName);
  await sendBehaviorData(data);
};

export const trackSessionActivity = async (): Promise<void> => {
  const data = await createBehaviorData('session_activity_ping');
  await sendBehaviorData(data);
};

// Get stored behavior data (for debugging)
export const getBehaviorData = (): UserBehaviorData[] => {
  return JSON.parse(localStorage.getItem('hospital_behavior_data') || '[]');
};

// Clear stored behavior data
export const clearBehaviorData = (): void => {
  localStorage.removeItem('hospital_behavior_data');
}; 