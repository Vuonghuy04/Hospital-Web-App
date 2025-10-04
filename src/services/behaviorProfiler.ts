/**
 * Advanced Behavior Profiler Service
 * ===================================
 * 
 * This service builds comprehensive user behavior profiles by analyzing
 * patterns, establishing baselines, and detecting anomalies in user actions.
 */

import { getUserInfo } from './keycloak';

// Enhanced behavior data interface
export interface BehaviorProfile {
  userId: string;
  username: string;
  role: string;
  
  // Baseline patterns
  baseline: {
    established: boolean;
    establishedAt?: Date;
    typicalHours: number[];
    averageSessionDuration: number;
    commonActions: string[];
    peakActivityHours: number[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  // Current session metrics
  currentSession: {
    sessionId: string;
    startTime: Date;
    actionCount: number;
    uniqueActionsCount: number;
    riskScore: number;
    anomalies: BehaviorAnomaly[];
  };
  
  // Historical patterns
  patterns: {
    accessPatterns: AccessPattern[];
    temporalPatterns: TemporalPattern[];
    interactionPatterns: InteractionPattern[];
    riskTrends: RiskTrend[];
  };
  
  // Peer comparison
  peerAnalysis: {
    roleGroup: string;
    consistencyScore: number; // 0-1, how consistent with role peers
    outlierScore: number; // 0-1, how different from peers
    riskRanking: number; // percentile within role group
  };
}

export interface BehaviorAnomaly {
  id: string;
  timestamp: Date;
  type: 'temporal' | 'access' | 'sequence' | 'volume' | 'context';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  context: any;
}

export interface AccessPattern {
  resourceType: string;
  frequency: number;
  averageAccessTime: number;
  typicalHours: number[];
  riskLevel: number;
}

export interface TemporalPattern {
  dayOfWeek: number;
  hourOfDay: number;
  activityLevel: number;
  sessionDuration: number;
}

export interface InteractionPattern {
  actionSequence: string[];
  frequency: number;
  averageDuration: number;
  completionRate: number;
}

export interface RiskTrend {
  date: Date;
  riskScore: number;
  contributingFactors: string[];
}

class BehaviorProfilerService {
  private profiles: Map<string, BehaviorProfile> = new Map();
  private readonly API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
  
  // Role-based behavioral expectations
  private readonly roleExpectations = {
    doctor: {
      typicalActions: ['access_patient_record', 'view_lab_results', 'create_prescription', 'update_diagnosis'],
      peakHours: [8, 9, 10, 11, 14, 15, 16, 17],
      riskThreshold: 0.4,
      sessionDuration: { min: 30, max: 180 }, // minutes
    },
    nurse: {
      typicalActions: ['update_patient_care', 'view_patient_record', 'medication_administration', 'vital_signs'],
      peakHours: [6, 7, 8, 14, 15, 16, 22, 23], // shift-based
      riskThreshold: 0.3,
      sessionDuration: { min: 15, max: 480 }, // longer shifts
    },
    admin: {
      typicalActions: ['user_management', 'system_monitoring', 'audit_review', 'configuration_change'],
      peakHours: [9, 10, 11, 13, 14, 15, 16],
      riskThreshold: 0.5,
      sessionDuration: { min: 60, max: 240 },
    },
    manager: {
      typicalActions: ['dashboard_view', 'report_generation', 'staff_management', 'analytics_review'],
      peakHours: [9, 10, 11, 13, 14, 15, 16],
      riskThreshold: 0.4,
      sessionDuration: { min: 45, max: 180 },
    },
    user: {
      typicalActions: ['view_appointment', 'view_records', 'update_profile', 'message_doctor'],
      peakHours: [8, 9, 10, 11, 19, 20, 21],
      riskThreshold: 0.2,
      sessionDuration: { min: 5, max: 60 },
    }
  };

  /**
   * Initialize or update user behavior profile
   */
  async initializeProfile(userId: string): Promise<BehaviorProfile> {
    if (this.profiles.has(userId)) {
      return this.profiles.get(userId)!;
    }

    // Try to load existing profile from backend
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/behavior-profiles/${userId}`);
      if (response.ok) {
        const profileData = await response.json();
        const profile = this.deserializeProfile(profileData);
        this.profiles.set(userId, profile);
        return profile;
      }
    } catch (error) {
      console.warn('Could not load existing profile:', error);
    }

    // Create new profile
    const userInfo = getUserInfo();
    const newProfile: BehaviorProfile = {
      userId,
      username: userInfo?.username || userId,
      role: userInfo?.roles?.[0] || 'user',
      baseline: {
        established: false,
        typicalHours: [],
        averageSessionDuration: 0,
        commonActions: [],
        peakActivityHours: [],
        riskLevel: 'low'
      },
      currentSession: {
        sessionId: this.generateSessionId(),
        startTime: new Date(),
        actionCount: 0,
        uniqueActionsCount: 0,
        riskScore: 0,
        anomalies: []
      },
      patterns: {
        accessPatterns: [],
        temporalPatterns: [],
        interactionPatterns: [],
        riskTrends: []
      },
      peerAnalysis: {
        roleGroup: userInfo?.roles?.[0] || 'user',
        consistencyScore: 1.0,
        outlierScore: 0.0,
        riskRanking: 50
      }
    };

    this.profiles.set(userId, newProfile);
    return newProfile;
  }

  /**
   * Analyze user action and update behavior profile
   */
  async analyzeAction(userId: string, action: string, context: any = {}): Promise<BehaviorAnomaly[]> {
    const profile = await this.initializeProfile(userId);
    const currentTime = new Date();
    
    // Update current session metrics
    profile.currentSession.actionCount++;
    const uniqueActions = new Set([...profile.patterns.interactionPatterns.map(p => p.actionSequence).flat(), action]);
    profile.currentSession.uniqueActionsCount = uniqueActions.size;

    // Detect anomalies
    const anomalies = await this.detectAnomalies(profile, action, context, currentTime);
    profile.currentSession.anomalies.push(...anomalies);

    // Update patterns
    await this.updatePatterns(profile, action, context, currentTime);

    // Calculate risk score
    profile.currentSession.riskScore = await this.calculateRiskScore(profile, action, context);

    // Update peer analysis
    await this.updatePeerAnalysis(profile);

    // Save profile updates
    await this.saveProfile(profile);

    return anomalies;
  }

  /**
   * Detect behavioral anomalies
   */
  private async detectAnomalies(
    profile: BehaviorProfile, 
    action: string, 
    context: any, 
    timestamp: Date
  ): Promise<BehaviorAnomaly[]> {
    const anomalies: BehaviorAnomaly[] = [];
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    // Temporal anomalies
    if (profile.baseline.established) {
      const isTypicalHour = profile.baseline.typicalHours.includes(hour);
      if (!isTypicalHour && profile.baseline.typicalHours.length > 0) {
        anomalies.push({
          id: this.generateAnomalyId(),
          timestamp,
          type: 'temporal',
          severity: this.calculateSeverity(action, 'temporal'),
          description: `Activity outside typical hours (${hour}:00)`,
          confidence: 0.8,
          context: { hour, typicalHours: profile.baseline.typicalHours }
        });
      }
    }

    // Access pattern anomalies
    const roleExpectation = this.roleExpectations[profile.role as keyof typeof this.roleExpectations];
    if (roleExpectation && !roleExpectation.typicalActions.some(typical => action.includes(typical))) {
      anomalies.push({
        id: this.generateAnomalyId(),
        timestamp,
        type: 'access',
        severity: 'medium',
        description: `Unusual action for role: ${action}`,
        confidence: 0.7,
        context: { action, role: profile.role, expectedActions: roleExpectation.typicalActions }
      });
    }

    // Volume anomalies
    const sessionDuration = (timestamp.getTime() - profile.currentSession.startTime.getTime()) / (1000 * 60);
    if (roleExpectation && sessionDuration > roleExpectation.sessionDuration.max) {
      anomalies.push({
        id: this.generateAnomalyId(),
        timestamp,
        type: 'volume',
        severity: 'low',
        description: `Extended session duration: ${Math.round(sessionDuration)} minutes`,
        confidence: 0.6,
        context: { duration: sessionDuration, maxExpected: roleExpectation.sessionDuration.max }
      });
    }

    // High-frequency action anomalies
    if (profile.currentSession.actionCount > 100) { // threshold for rapid actions
      anomalies.push({
        id: this.generateAnomalyId(),
        timestamp,
        type: 'volume',
        severity: 'medium',
        description: `High action frequency: ${profile.currentSession.actionCount} actions`,
        confidence: 0.75,
        context: { actionCount: profile.currentSession.actionCount }
      });
    }

    return anomalies;
  }

  /**
   * Update behavioral patterns
   */
  private async updatePatterns(
    profile: BehaviorProfile, 
    action: string, 
    context: any, 
    timestamp: Date
  ): Promise<void> {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    // Update temporal patterns
    const existingTemporal = profile.patterns.temporalPatterns.find(
      p => p.dayOfWeek === dayOfWeek && p.hourOfDay === hour
    );

    if (existingTemporal) {
      existingTemporal.activityLevel++;
    } else {
      profile.patterns.temporalPatterns.push({
        dayOfWeek,
        hourOfDay: hour,
        activityLevel: 1,
        sessionDuration: 0 // Will be updated on session end
      });
    }

    // Update access patterns
    const resourceType = this.extractResourceType(action);
    const existingAccess = profile.patterns.accessPatterns.find(p => p.resourceType === resourceType);
    
    if (existingAccess) {
      existingAccess.frequency++;
    } else {
      profile.patterns.accessPatterns.push({
        resourceType,
        frequency: 1,
        averageAccessTime: 0,
        typicalHours: [hour],
        riskLevel: this.calculateActionRisk(action)
      });
    }

    // Update baseline if enough data
    if (!profile.baseline.established && profile.currentSession.actionCount > 50) {
      await this.establishBaseline(profile);
    }
  }

  /**
   * Establish user behavioral baseline
   */
  private async establishBaseline(profile: BehaviorProfile): Promise<void> {
    // Calculate typical hours from temporal patterns
    const hourCounts: { [hour: number]: number } = {};
    profile.patterns.temporalPatterns.forEach(pattern => {
      hourCounts[pattern.hourOfDay] = (hourCounts[pattern.hourOfDay] || 0) + pattern.activityLevel;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8) // Top 8 hours
      .map(([hour]) => parseInt(hour));

    // Calculate common actions
    const actionCounts: { [action: string]: number } = {};
    profile.patterns.accessPatterns.forEach(pattern => {
      actionCounts[pattern.resourceType] = pattern.frequency;
    });

    const commonActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10 actions
      .map(([action]) => action);

    // Update baseline
    profile.baseline = {
      established: true,
      establishedAt: new Date(),
      typicalHours: sortedHours,
      averageSessionDuration: this.calculateAverageSessionDuration(profile),
      commonActions,
      peakActivityHours: sortedHours.slice(0, 4),
      riskLevel: profile.currentSession.riskScore > 0.5 ? 'high' : 
                 profile.currentSession.riskScore > 0.3 ? 'medium' : 'low'
    };

    console.log(`✅ Baseline established for user ${profile.username}`, profile.baseline);
  }

  /**
   * Calculate risk score based on current behavior
   */
  private async calculateRiskScore(profile: BehaviorProfile, action: string, context: any): Promise<number> {
    let riskScore = 0;

    // Base risk from action type
    riskScore += this.calculateActionRisk(action);

    // Anomaly-based risk
    const recentAnomalies = profile.currentSession.anomalies.filter(
      a => (new Date().getTime() - a.timestamp.getTime()) < 300000 // Last 5 minutes
    );
    
    recentAnomalies.forEach(anomaly => {
      switch (anomaly.severity) {
        case 'critical': riskScore += 0.4; break;
        case 'high': riskScore += 0.3; break;
        case 'medium': riskScore += 0.2; break;
        case 'low': riskScore += 0.1; break;
      }
    });

    // Temporal risk
    const currentHour = new Date().getHours();
    const roleExpectation = this.roleExpectations[profile.role as keyof typeof this.roleExpectations];
    if (roleExpectation && !roleExpectation.peakHours.includes(currentHour)) {
      riskScore += 0.1;
    }

    // Volume-based risk
    const sessionDuration = (new Date().getTime() - profile.currentSession.startTime.getTime()) / (1000 * 60);
    if (sessionDuration > 240) { // 4 hours
      riskScore += 0.15;
    }

    return Math.min(riskScore, 1.0); // Cap at 1.0
  }

  /**
   * Update peer analysis
   */
  private async updatePeerAnalysis(profile: BehaviorProfile): Promise<void> {
    // This would typically involve comparing with other users in the same role
    // For now, we'll use simplified logic
    
    const roleExpectation = this.roleExpectations[profile.role as keyof typeof this.roleExpectations];
    if (!roleExpectation) return;

    // Calculate consistency with role expectations
    const commonActionsMatch = profile.baseline.commonActions.filter(
      action => roleExpectation.typicalActions.some(expected => action.includes(expected))
    ).length;

    profile.peerAnalysis.consistencyScore = commonActionsMatch / Math.max(profile.baseline.commonActions.length, 1);
    profile.peerAnalysis.outlierScore = 1 - profile.peerAnalysis.consistencyScore;
    
    // Simple risk ranking (would be more sophisticated with real peer data)
    profile.peerAnalysis.riskRanking = Math.round((1 - profile.currentSession.riskScore) * 100);
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private extractResourceType(action: string): string {
    // Extract resource type from action string
    if (action.includes('patient_record')) return 'patient_record';
    if (action.includes('prescription')) return 'prescription';
    if (action.includes('lab_result')) return 'lab_result';
    if (action.includes('appointment')) return 'appointment';
    if (action.includes('admin')) return 'admin_function';
    if (action.includes('audit')) return 'audit_log';
    return 'general';
  }

  private calculateActionRisk(action: string): number {
    // Risk scoring based on action sensitivity
    if (action.includes('admin') || action.includes('delete') || action.includes('export')) return 0.4;
    if (action.includes('patient_record') || action.includes('medical')) return 0.3;
    if (action.includes('prescription') || action.includes('lab')) return 0.2;
    if (action.includes('view') || action.includes('page_view')) return 0.1;
    return 0.05;
  }

  private calculateSeverity(action: string, anomalyType: string): 'low' | 'medium' | 'high' | 'critical' {
    if (action.includes('admin') || action.includes('delete')) return 'high';
    if (action.includes('export') || action.includes('audit')) return 'medium';
    if (anomalyType === 'temporal' && (action.includes('patient') || action.includes('medical'))) return 'medium';
    return 'low';
  }

  private calculateAverageSessionDuration(profile: BehaviorProfile): number {
    // Simplified calculation - would use historical data in practice
    return 45; // minutes
  }

  private deserializeProfile(data: any): BehaviorProfile {
    // Convert serialized profile data back to BehaviorProfile object
    return {
      ...data,
      currentSession: {
        ...data.currentSession,
        startTime: new Date(data.currentSession.startTime),
        anomalies: data.currentSession.anomalies.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }))
      },
      baseline: {
        ...data.baseline,
        establishedAt: data.baseline.establishedAt ? new Date(data.baseline.establishedAt) : undefined
      }
    };
  }

  private async saveProfile(profile: BehaviorProfile): Promise<void> {
    try {
      await fetch(`${this.API_BASE_URL}/api/behavior-profiles/${profile.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (error) {
      console.error('Failed to save behavior profile:', error);
    }
  }

  // Public methods
  public async getProfile(userId: string): Promise<BehaviorProfile | null> {
    return this.profiles.get(userId) || null;
  }

  public async getAllAnomalies(userId: string): Promise<BehaviorAnomaly[]> {
    const profile = this.profiles.get(userId);
    return profile?.currentSession.anomalies || [];
  }

  public async getProfileSummary(userId: string): Promise<any> {
    // Try to get from API first
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/behavior-profiles/${userId}/summary`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch profile summary from API:', error);
    }

    // Fallback to local profile
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    return {
      username: profile.username,
      role: profile.role,
      riskScore: profile.currentSession.riskScore,
      riskLevel: profile.baseline.riskLevel,
      consistencyScore: profile.peerAnalysis.consistencyScore,
      anomalyCount: profile.currentSession.anomalies.length,
      sessionDuration: Math.round((new Date().getTime() - profile.currentSession.startTime.getTime()) / (1000 * 60)),
      baselineEstablished: profile.baseline.established
    };
  }

  // New API-backed methods
  public async getAllProfiles(filters?: { role?: string; riskLevel?: string; limit?: number; offset?: number }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.role) queryParams.append('role', filters.role);
      if (filters?.riskLevel) queryParams.append('riskLevel', filters.riskLevel);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());

      const response = await fetch(`${this.API_BASE_URL}/api/behavior-profiles?${queryParams}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch all profiles:', error);
    }
    return { profiles: [], total: 0 };
  }

  public async getSystemAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/behavior-profiles/analytics/overview`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch system analytics:', error);
    }
    return null;
  }

  public async exportProfile(userId: string, format: string = 'json'): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/behavior-profiles/export/${userId}?format=${format}`);
      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.error('Failed to export profile:', error);
    }
    return null;
  }

  public async importProfile(profileData: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/behavior-profiles/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to import profile:', error);
      return false;
    }
  }

  public async addAnomaly(userId: string, anomaly: Partial<BehaviorAnomaly>): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/behavior-profiles/${userId}/anomalies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anomaly)
      });
      
      if (response.ok) {
        // Update local profile if it exists
        const profile = this.profiles.get(userId);
        if (profile) {
          const fullAnomaly = await response.json();
          profile.currentSession.anomalies.push(fullAnomaly.anomaly);
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to add anomaly:', error);
    }
    return false;
  }
}

// Export singleton instance
export const behaviorProfiler = new BehaviorProfilerService();

// Enhanced tracking function that integrates with behavior profiler
export const trackActionWithProfiling = async (action: string, context: any = {}): Promise<void> => {
  const userInfo = getUserInfo();
  if (!userInfo?.username) return;

  // Analyze with behavior profiler
  const anomalies = await behaviorProfiler.analyzeAction(userInfo.username, action, context);

  // Log significant anomalies
  if (anomalies.length > 0) {
    console.warn('🚨 Behavioral anomalies detected:', anomalies);
    
    // Could trigger alerts, additional authentication, etc.
    anomalies.forEach(anomaly => {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        console.error(`High-risk anomaly: ${anomaly.description}`, anomaly);
        // Trigger security alert
      }
    });
  }
};
