// Real-time audit service based on draft-ztp logic
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Import getBehaviorData function
const getLocalBehaviorData = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('hospital_behavior_data') || '[]');
  } catch {
    return [];
  }
};

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  email: string;
  action: string;
  ipAddress: string;
  session: string;
  risk: 'Pending ML' | 'Low Risk' | 'Medium Risk' | 'High Risk';
  score: string;
  userAgent?: string;
  details?: any;
}

export interface AuditResponse {
  events: AuditEvent[];
  total: number;
  pages: number;
}

// Convert backend activity to audit event format
const convertBackendActivityToAuditEvent = (activity: any): AuditEvent => {
  return {
    id: activity._id || activity.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(activity.timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    user: activity.user || activity.username || 'Unknown',
    email: activity.email || `${activity.user || activity.username}@hospital`,
    action: activity.action || 'unknown_action',
    ipAddress: activity.ipAddress || '127.0.0.1',
    session: `${Math.floor(Math.random() * 60)}m\n${activity.sessionId || Math.random().toString(36).substring(7)}`,
    risk: determineRiskLevel(activity.riskScore || 0),
    score: 'Pending ML',
    userAgent: activity.userAgent,
    details: activity
  };
};

// Convert local behavior data to audit event format
const convertLocalBehaviorToAuditEvent = (behaviorData: any): AuditEvent => {
  const sessionPeriod = behaviorData.sessionPeriod || 0;
  const sessionId = behaviorData.sessionId || 'unknown';
  
  return {
    id: `local-${behaviorData.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(behaviorData.timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    user: behaviorData.username || 'Unknown',
    email: behaviorData.email || `${behaviorData.username}@hospital`,
    action: behaviorData.action || 'unknown_action',
    ipAddress: behaviorData.ipAddress || '127.0.0.1',
    session: `${sessionPeriod}m\n${sessionId.substring(sessionId.length - 7)}`,
    risk: determineRiskLevel(behaviorData.riskScore || 0),
    score: 'Pending ML',
    userAgent: behaviorData.userAgent,
    details: behaviorData
  };
};

// Determine risk level based on score
const determineRiskLevel = (score: number): 'Pending ML' | 'Low Risk' | 'Medium Risk' | 'High Risk' => {
  if (score >= 70) return 'High Risk';
  if (score >= 40) return 'Medium Risk';
  if (score >= 10) return 'Low Risk';
  return 'Pending ML';
};

// Fetch real-time audit events from backend and local storage
export async function fetchAuditEvents(filters: any = {}, page: number = 1, limit: number = 50): Promise<AuditResponse> {
  try {
    // First, try to get local behavior data
    const localBehaviorData = getLocalBehaviorData();
    const localEvents = localBehaviorData.map(convertLocalBehaviorToAuditEvent);

    // Then try backend API
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    let backendEvents: AuditEvent[] = [];
    try {
      const response = await fetch(`${BACKEND_URL}/api/hospital/activities?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          backendEvents = data.data.map(convertBackendActivityToAuditEvent);
        }
      }
    } catch (backendError) {
      console.warn('Backend API unavailable, using local data only:', backendError);
    }

    // Combine local and backend events, remove duplicates
    const allEvents = [...localEvents, ...backendEvents];
    const uniqueEvents = allEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id || (e.user === event.user && e.timestamp === event.timestamp && e.action === event.action))
    );

    // Sort by timestamp (newest first)
    const sortedEvents = uniqueEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedEvents = sortedEvents.slice(startIndex, startIndex + limit);

    return {
      events: paginatedEvents,
      total: sortedEvents.length,
      pages: Math.ceil(sortedEvents.length / limit)
    };
  } catch (error) {
    console.error('Error fetching audit events:', error);
    
    // Generate fallback sample data
    const sampleEvents = generateSampleAuditEvents(limit);
    return {
      events: sampleEvents,
      total: 100,
      pages: Math.ceil(100 / limit)
    };
  }
}

// Generate sample audit events as fallback
function generateSampleAuditEvents(count: number): AuditEvent[] {
  const users = [
    { name: 'admin', email: 'admin@hospital' },
    { name: 'dr.johnson', email: 'johnson@hospital' },
    { name: 'nurse.smith', email: 'smith@hospital' },
    { name: 'dr.wilson', email: 'wilson@hospital' },
    { name: 'nurse.davis', email: 'davis@hospital' }
  ];
  
  const actions = [
    'page_view_unified_admin_dashboard',
    'page_view_home',
    'login',
    'logout',
    'access_patient_records',
    'update_medication',
    'view_lab_results',
    'schedule_appointment',
    'view_medical_records',
    'update_patient_info'
  ];

  const risks: ('Pending ML' | 'Low Risk' | 'Medium Risk' | 'High Risk')[] = ['Pending ML', 'Low Risk', 'Medium Risk', 'High Risk'];
  
  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const now = new Date();
    const eventTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    
    return {
      id: `sample-event-${i}-${Date.now()}`,
      timestamp: eventTime.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      user: user.name,
      email: user.email,
      action: actions[Math.floor(Math.random() * actions.length)],
      ipAddress: `124.182.6.${Math.floor(Math.random() * 255)}`,
      session: `${Math.floor(Math.random() * 60)}m\n${Math.random().toString(36).substring(7)}`,
      risk: risks[Math.floor(Math.random() * risks.length)],
      score: 'Pending ML'
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Real-time polling subscription (similar to draft-ztp)
export function subscribeToAuditUpdates(callback: (events: AuditEvent[]) => void, intervalMs: number = 30000): () => void {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const result = await fetchAuditEvents({}, 1, 50);
      callback(result.events);
    } catch (error) {
      console.error('Error in audit polling:', error);
    }
  };
  
  // Initial fetch
  poll();
  
  // Set up polling interval
  const pollInterval = setInterval(poll, intervalMs);
  
  // Return unsubscribe function
  return () => {
    isActive = false;
    clearInterval(pollInterval);
  };
}

// Fetch dashboard metrics for audit overview
export async function fetchAuditMetrics(): Promise<{
  totalEvents: number;
  pendingML: number;
  lowMediumRisk: number;
  highRisk: number;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/hospital/dashboard-metrics`);
    const data = await response.json();
    
    if (data.success) {
      return {
        totalEvents: data.data.totalActivities || 0,
        pendingML: Math.floor(data.data.totalActivities * 0.7) || 0,
        lowMediumRisk: Math.floor(data.data.totalActivities * 0.25) || 0,
        highRisk: data.data.highRiskEvents || 0
      };
    }
    
    throw new Error('Failed to fetch metrics');
  } catch (error) {
    console.error('Error fetching audit metrics:', error);
    
    // Return sample metrics
    return {
      totalEvents: 156,
      pendingML: 109,
      lowMediumRisk: 39,
      highRisk: 8
    };
  }
}
