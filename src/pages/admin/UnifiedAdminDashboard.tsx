import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/MockAuthContext';
import { useNavigate } from 'react-router-dom';
import { trackPageView, trackButtonClick, trackLogout, getBehaviorData, clearBehaviorData } from '../../services/behaviorTracking';
import { trackActionWithProfiling, behaviorProfiler } from '../../services/behaviorProfiler';
import BehaviorProfileDashboard from '../../components/BehaviorProfileDashboard';
import JITApprovalPanel from '../../components/JITApprovalPanel';
import PolicyViolationsPanel from '../../components/PolicyViolationsPanel';
import MLRiskDashboard from '../../components/MLRiskDashboard';
import UnifiedHeader from '../../components/UnifiedHeader';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Activity,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  Target,
  Brain,
  Zap,
  CheckCircle,
  FileText,
  Lock,
} from 'lucide-react';

// Types
interface UserActivity {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
  riskLevel: 'low' | 'medium' | 'high';
}

interface BehaviorData {
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
  riskScore: number;
  metadata: {
    realm: string;
    clientId: string;
    tokenType: string;
  };
}

interface BehaviorPattern {
  id: string;
  userId: string;
  username: string;
  pattern: string;
  confidence: number;
  riskScore: number;
  anomalyType: 'time_pattern' | 'access_pattern' | 'location_pattern' | 'behavior_change';
  description: string;
  detectedAt: string;
  status: 'monitoring' | 'investigating' | 'resolved';
}

interface RiskAssessment {
  id: string;
  userId: string;
  username: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAssessment: string;
}

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalActivities: number;
  highRiskEvents: number;
  averageRiskScore: number;
}

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const UnifiedAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard data
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalActivities: 0,
    highRiskEvents: 0,
    averageRiskScore: 0
  });
  
  // Activity data
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Behavior analysis data
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  
  // Risk assessment data
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  
  // Behavior analytics data
  const [behaviorData, setBehaviorData] = useState<BehaviorData[]>([]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'activity', label: 'User Activity', icon: Activity },
    { id: 'behavior-profiles', label: 'Behavior Profiles', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'risk', label: 'Risk Assessment', icon: Target },
    { id: 'jit-approvals', label: 'JIT Approvals', icon: CheckCircle },
    { id: 'policy-violations', label: 'Policy Violations', icon: AlertTriangle }
  ];

  useEffect(() => {
    // Enhanced behavior tracking with profiling
    trackPageView('unified_admin_dashboard');
    trackActionWithProfiling('admin_dashboard_access', { 
      page: 'unified_admin_dashboard',
      role: 'admin',
      context: 'page_load'
    });
  }, []);

  // Load behavior data when activity tab is selected
  useEffect(() => {
    if (activeTab === 'activity') {
      refreshBehaviorData();
    }
    
    // Track tab changes with enhanced profiling
    trackActionWithProfiling(`admin_tab_switch_${activeTab}`, {
      previous_tab: 'unknown', // Could track previous tab if needed
      current_tab: activeTab,
      context: 'unified_admin_dashboard'
    });
  }, [activeTab]);

  // Generate mock data
  const generateMockData = () => {
    // Dashboard metrics
    setDashboardMetrics({
      totalUsers: 245,
      activeUsers: 42,
      totalActivities: 1250,
      highRiskEvents: 8,
      averageRiskScore: 3.2
    });

    // User activities (audit logs)
    const users = ['dr.johnson', 'nurse.smith', 'admin', 'dr.wilson', 'nurse.davis'];
    const actions = ['login', 'logout', 'view_patient_record', 'update_medication', 'access_lab_results', 'schedule_appointment'];
    const resources = ['patient_records', 'medication_system', 'lab_system', 'scheduling_system', 'user_management'];
    const statuses: ('success' | 'failed' | 'warning')[] = ['success', 'failed', 'warning'];
    const riskLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

    const mockActivities = Array.from({ length: 100 }, (_, i) => ({
      id: `activity-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      username: users[Math.floor(Math.random() * users.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      resource: resources[Math.floor(Math.random() * resources.length)],
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)]
    }));
    setActivities(mockActivities);

    // Behavior patterns
    const anomalyTypes: ('time_pattern' | 'access_pattern' | 'location_pattern' | 'behavior_change')[] = 
      ['time_pattern', 'access_pattern', 'location_pattern', 'behavior_change'];
    const behaviorStatuses: ('monitoring' | 'investigating' | 'resolved')[] = ['monitoring', 'investigating', 'resolved'];

    const mockPatterns = Array.from({ length: 30 }, (_, i) => ({
      id: `pattern-${i}`,
      userId: `user-${i}`,
      username: users[Math.floor(Math.random() * users.length)],
      pattern: `Unusual ${anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)].replace('_', ' ')}`,
      confidence: Math.floor(Math.random() * 40) + 60,
      riskScore: Math.floor(Math.random() * 100),
      anomalyType: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
      description: [
        'User accessing systems outside normal hours',
        'Unusual access pattern to patient records',
        'Login from new geographic location',
        'Significant change in daily activity volume'
      ][Math.floor(Math.random() * 4)],
      detectedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      status: behaviorStatuses[Math.floor(Math.random() * behaviorStatuses.length)]
    }));
    setPatterns(mockPatterns);

    // Risk assessments
    const riskLevels2: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
    const mockAssessments = users.map((username, i) => {
      const overallRisk = Math.floor(Math.random() * 100);
      const riskLevel = overallRisk >= 85 ? 'critical' : 
                       overallRisk >= 70 ? 'high' : 
                       overallRisk >= 40 ? 'medium' : 'low';
      return {
        id: `assessment-${i}`,
        userId: `user-${i}`,
        username,
        overallRiskScore: overallRisk,
        riskLevel,
        lastAssessment: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      };
    });
    setAssessments(mockAssessments);
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      generateMockData();
      setLoading(false);
    }, 1000);
  }, []);



  // Helper functions
  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-500/20 text-green-300 border-green-500/30',
      failed: 'bg-red-500/20 text-red-300 border-red-500/30',
      warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`;
  };

  const getRiskBadge = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-500/20 text-green-300 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      high: 'bg-red-500/20 text-red-300 border-red-500/30',
      critical: 'bg-red-600/20 text-red-400 border-red-600/30'
    };
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[riskLevel as keyof typeof colors]}`;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || activity.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="text-xl font-medium">{user?.username || 'Hospital Admin'}</p>
              <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                Admin
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated</p>
              <p className="font-medium">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Users</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{dashboardMetrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Users</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{dashboardMetrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Security Events</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-destructive">{dashboardMetrics.highRiskEvents}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Risk Score</h3>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{dashboardMetrics.averageRiskScore.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground">System average</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Behavior analytics functions
  const refreshBehaviorData = async () => {
    try {
      // Fetch behavior data from backend API instead of localStorage
      const response = await fetch(`${API_BASE_URL}/api/behavior-tracking?limit=100`);
      if (response.ok) {
        const result = await response.json();
        console.log('Backend API response:', result);
        // Transform the backend data to match our interface
        const transformedData = result.data.map(record => {
          const riskScore = typeof record.risk_score === 'number' ? record.risk_score : parseFloat(record.risk_score) || 0;
          console.log('Transforming record:', record.username, 'risk_score:', record.risk_score, 'parsed:', riskScore);
          return {
          username: record.username,
          userId: record.user_id,
          email: record.email,
          roles: record.roles || [],
          ipAddress: record.ip_address,
          userAgent: record.user_agent,
          timestamp: new Date(record.timestamp),
          action: record.action,
          sessionId: record.session_id,
          sessionPeriod: record.session_period || 0,
          riskScore: riskScore,
          metadata: {
            realm: record.realm || 'demo',
            clientId: record.client_id || 'demo-client',
            tokenType: 'Bearer'
          }
          };
        });
        console.log('Transformed data:', transformedData);
        setBehaviorData(transformedData);
      } else {
        console.error('Failed to fetch behavior data from backend');
        // Fallback to localStorage data
        const localData = getBehaviorData();
        setBehaviorData(localData);
      }
    } catch (error) {
      console.error('Error fetching behavior data:', error);
      // Fallback to localStorage data
      const localData = getBehaviorData();
      setBehaviorData(localData);
    }
  };

  const handleClearBehaviorData = () => {
    if (window.confirm('Are you sure you want to clear all behavior data?')) {
      clearBehaviorData();
      setBehaviorData([]);
    }
  };

  const exportBehaviorData = () => {
    const dataStr = JSON.stringify(behaviorData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospital_behavior_data_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderUserActivity = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-purple-600 text-white p-6 rounded-xl">
          <h2 className="text-2xl font-bold">🔍 User Behavior Analytics</h2>
          <p className="text-purple-100">Data for ML Anomaly Detection Model</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{behaviorData.length}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {behaviorData.filter(d => d.riskScore === 0).length}
            </div>
            <div className="text-sm text-gray-600">Pending ML</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {behaviorData.filter(d => d.riskScore > 0 && d.riskScore < 0.7).length}
            </div>
            <div className="text-sm text-gray-600">Low-Medium Risk</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {behaviorData.filter(d => d.riskScore >= 0.7).length}
            </div>
            <div className="text-sm text-gray-600">High Risk</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={refreshBehaviorData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
          <button
            onClick={exportBehaviorData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            📥 Export JSON
          </button>
          <button
            onClick={handleClearBehaviorData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            🗑️ Clear Data
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {behaviorData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">No behavior data yet</h3>
              <p>Start using the application to collect data for ML analysis</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {behaviorData
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatTimestamp(item.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div>{item.username}</div>
                          <div className="text-xs text-gray-500">{item.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {item.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.ipAddress}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div>{item.sessionPeriod}m</div>
                          <div className="text-xs">{item.sessionId.slice(-8)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  item.riskScore === 0 ? 'bg-gray-500' :
                                  item.riskScore > 0.7 ? 'bg-red-500' : 
                                  item.riskScore > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${item.riskScore > 0 && typeof item.riskScore === 'number' ? item.riskScore * 100 : 10}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">
                              {item.riskScore > 0 ? 
                                (typeof item.riskScore === 'number' ? item.riskScore.toFixed(3) : item.riskScore) : 
                                'Pending ML'
                              }
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="bg-gray-50 min-h-screen -m-4 md:-m-8 p-4 md:p-8">
      <MLRiskDashboard />
    </div>
  );

  const renderBehaviorAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">Patterns Detected</h3>
            <Brain className="h-4 w-4 text-purple-300" />
          </div>
          <div className="text-2xl font-bold text-white">{patterns.length}</div>
          <p className="text-xs text-purple-300 mt-1">AI-powered detection</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">High Risk</h3>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {patterns.filter(p => p.riskScore >= 70).length}
          </div>
          <p className="text-xs text-purple-300 mt-1">Requires attention</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">ML Confidence</h3>
            <Zap className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {Math.round(patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length || 0)}%
          </div>
          <p className="text-xs text-purple-300 mt-1">Average accuracy</p>
        </div>
      </div>
    </div>
  );

  const renderRiskAssessment = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">Average Risk</h3>
            <Target className="h-4 w-4 text-purple-300" />
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(assessments.reduce((acc, a) => acc + a.overallRiskScore, 0) / assessments.length || 0)}%
          </div>
          <p className="text-xs text-purple-300 mt-1">System wide</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">Critical Risk</h3>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {assessments.filter(a => a.riskLevel === 'critical').length}
          </div>
          <p className="text-xs text-purple-300 mt-1">Immediate attention</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">High Risk</h3>
            <Shield className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {assessments.filter(a => a.riskLevel === 'high').length}
          </div>
          <p className="text-xs text-purple-300 mt-1">Monitor closely</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">Total Users</h3>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{assessments.length}</div>
          <p className="text-xs text-purple-300 mt-1">Under assessment</p>
        </div>
      </div>
    </div>
  );



  const handleLogout = async () => {
    // Enhanced logout tracking with profiling
    trackLogout();
    trackButtonClick('logout', 'header');
    await trackActionWithProfiling('admin_logout', { 
      context: 'unified_admin_dashboard',
      session_duration: Date.now() - performance.timing.navigationStart
    });
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Restored Original Header with Notification Bell */}
      <UnifiedHeader />
      
      <main className="flex-1 bg-white">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Hospital administration and monitoring overview
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'overview' && renderDashboard()}
              {activeTab === 'activity' && renderUserActivity()}
              {activeTab === 'behavior-profiles' && (
                <BehaviorProfileDashboard 
                  userId={user?.username} 
                  className="space-y-6"
                />
              )}
              {activeTab === 'analytics' && renderAnalytics()}
              {activeTab === 'risk' && renderRiskAssessment()}
              {activeTab === 'jit-approvals' && <JITApprovalPanel />}
              {activeTab === 'policy-violations' && <PolicyViolationsPanel />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UnifiedAdminDashboard;
