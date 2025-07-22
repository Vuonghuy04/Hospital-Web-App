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
  riskLevel: string;
  riskScore: number;
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

// Generate random risk level and score for demonstration
const generateRiskData = () => {
  const riskLevels = ['low', 'medium', 'high'];
  const randomLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  let riskScore: number;
  
  switch (randomLevel) {
    case 'low':
      riskScore = Math.random() * 0.3; // 0-0.3
      break;
    case 'medium':
      riskScore = 0.3 + Math.random() * 0.4; // 0.3-0.7
      break;
    case 'high':
      riskScore = 0.7 + Math.random() * 0.3; // 0.7-1.0
      break;
    default:
      riskScore = Math.random();
  }
  
  return { riskLevel: randomLevel, riskScore: Number(riskScore.toFixed(3)) };
};

// Create behavior data object
const createBehaviorData = async (action: string): Promise<UserBehaviorData> => {
  const userInfo = getUserInfo();
  const ipAddress = await getUserIP();
  const { riskLevel, riskScore } = generateRiskData();
  
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
    riskLevel,
    riskScore,
    metadata: {
      realm: process.env.REACT_APP_KEYCLOAK_REALM || 'demo',
      clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'demo-client',
      tokenType: 'Bearer',
    },
  };
};

// Send behavior data to backend (or log for now)
const sendBehaviorData = async (data: UserBehaviorData): Promise<void> => {
  try {
    console.log('🔍 USER BEHAVIOR TRACKED:', {
      action: data.action,
      user: data.username,
      timestamp: data.timestamp.toISOString(),
      sessionPeriod: `${data.sessionPeriod} minutes`,
      riskLevel: data.riskLevel,
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

    // Send to backend API
    try {
      const response = await fetch('http://localhost:5000/api/behavior-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Behavior data sent to backend:', result.message);
      } else {
        console.error('❌ Failed to send behavior data:', response.status, response.statusText);
      }
    } catch (apiError) {
      console.error('❌ API Error sending behavior data:', apiError);
    }
    
  } catch (error) {
    console.error('Failed to send behavior data:', error);
  }
};

// Public functions for tracking different actions
export const trackLogin = async (): Promise<void> => {
  const data = await createBehaviorData('login');
  await sendBehaviorData(data);
};

export const trackLogout = async (): Promise<void> => {
  const data = await createBehaviorData('logout');
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
  const data = await createBehaviorData(`record_access_${recordId}`);
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

// Get stored behavior data (for debugging)
export const getBehaviorData = (): UserBehaviorData[] => {
  return JSON.parse(localStorage.getItem('hospital_behavior_data') || '[]');
};

// Clear stored behavior data
export const clearBehaviorData = (): void => {
  localStorage.removeItem('hospital_behavior_data');
}; 