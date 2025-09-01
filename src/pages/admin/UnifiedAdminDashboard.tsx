import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView } from '../../services/behaviorTracking';
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
  Zap
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

const UnifiedAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    trackPageView('unified_admin_dashboard');
  }, []);

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
  const formatTimestamp = (timestamp: string) => {
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

  const renderUserActivity = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
              <input
                type="text"
                placeholder="Search users, actions, resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Real-time Activity Log (Audit)</h2>
          <p className="text-purple-200 text-sm mt-1">
            Showing {filteredActivities.length} of {activities.length} activities
          </p>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-white/5 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredActivities.slice(0, 50).map((activity) => (
                <tr key={activity.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-purple-300" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    {activity.username}
                  </td>
                  <td className="px-6 py-4 text-sm text-purple-200">
                    {activity.action.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-purple-200">
                    {activity.resource.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-purple-300 font-mono">
                    {activity.ipAddress}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={getStatusBadge(activity.status)}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={getRiskBadge(activity.riskLevel)}>
                      {activity.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">Total Actions</h3>
            <Activity className="h-4 w-4 text-purple-300" />
          </div>
          <div className="text-2xl font-bold text-white">{activities.length}</div>
          <p className="text-xs text-purple-300 mt-1">All user & admin actions</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">Admin Actions</h3>
            <Shield className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {activities.filter(a => a.username === 'admin').length}
          </div>
          <p className="text-xs text-purple-300 mt-1">Admin activities</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">Failed Actions</h3>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {activities.filter(a => a.status === 'failed').length}
          </div>
          <p className="text-xs text-purple-300 mt-1">Security alerts</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-200">High Risk</h3>
            <Target className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {activities.filter(a => a.riskLevel === 'high').length}
          </div>
          <p className="text-xs text-purple-300 mt-1">Risk monitoring</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
              <input
                type="text"
                placeholder="Search users, actions, resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Audit Log */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Complete System Audit Log</h2>
          <p className="text-purple-200 text-sm mt-1">
            All user and admin activities - Showing {filteredActivities.length} of {activities.length} actions
          </p>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-white/5 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">User Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredActivities.slice(0, 100).map((activity) => {
                const isAdmin = activity.username === 'admin';
                const isDoctor = activity.username.includes('dr.');
                const isNurse = activity.username.includes('nurse.');
                
                return (
                  <tr key={activity.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-purple-300" />
                        <span>{formatTimestamp(activity.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isAdmin ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        isDoctor ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        isNurse ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {isAdmin ? 'Admin' : isDoctor ? 'Doctor' : isNurse ? 'Nurse' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {activity.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-purple-200">
                      {activity.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-purple-200">
                      {activity.resource.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-purple-300 font-mono">
                      {activity.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getStatusBadge(activity.status)}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getRiskBadge(activity.riskLevel)}>
                        {activity.riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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



  return (
    <div className="flex min-h-screen flex-col">
      <UnifiedHeader />
      <main className="flex-1 bg-gray-50">
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

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            </div>
          ) : (
            renderDashboard()
          )}
        </div>
      </main>
    </div>
  );
};

export default UnifiedAdminDashboard;
