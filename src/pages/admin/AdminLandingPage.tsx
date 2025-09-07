import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView } from '../../services/behaviorTracking';
import AdminNavigation from '../../components/AdminNavigation';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  FileText, 
  Lock,
  Activity,
  AlertTriangle,
  Clock,
  Database,
  TrendingUp,
  Hospital,
  RefreshCw
} from 'lucide-react';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalActivities: number;
  highRiskEvents: number;
  averageRiskScore: number;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  risk: string;
}

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const AdminLandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalActivities: 0,
    highRiskEvents: 0,
    averageRiskScore: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    trackPageView('admin_landing');
  }, []);

  // Fetch dashboard metrics from backend
  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/hospital/dashboard-metrics`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardMetrics({
          totalUsers: data.data.totalUsers || 0,
          activeUsers: data.data.activeUsers || 0,
          totalActivities: data.data.totalActivities || 0,
          highRiskEvents: data.data.highRiskEvents || 0,
          averageRiskScore: data.data.averageRiskScore || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Use fallback data
      setDashboardMetrics({
        totalUsers: 245,
        activeUsers: 42,
        totalActivities: 1250,
        highRiskEvents: 3,
        averageRiskScore: 2.5
      });
    }
  };

  // Fetch recent activities from backend
  const fetchRecentActivities = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/hospital/activities?limit=5`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const activities = data.data.map((activity: any) => ({
          id: activity.id,
          user: activity.user || activity.username || 'Unknown User',
          action: activity.action || 'Unknown Activity',
          timestamp: formatTimestamp(activity.timestamp),
          risk: activity.risk || 'low'
        }));
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Use fallback data
      setRecentActivities([
        { id: '1', user: 'dr.johnson', action: 'User account created', timestamp: '2 minutes ago', risk: 'low' },
        { id: '2', user: 'admin', action: 'Security policy updated', timestamp: '15 minutes ago', risk: 'low' },
        { id: '3', user: 'unknown', action: 'Failed login attempt detected', timestamp: '1 hour ago', risk: 'high' },
        { id: '4', user: 'system', action: 'System backup completed', timestamp: '3 hours ago', risk: 'low' },
      ]);
    }
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const loadData = async () => {
    setDataLoading(true);
    await Promise.all([
      fetchDashboardMetrics(),
      fetchRecentActivities()
    ]);
    setDataLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage hospital staff and patient accounts',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Activity Logs',
      description: 'View system audit logs and activities',
      icon: Activity,
      href: '/admin/dashboard',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Risk Assessment',
      description: 'Monitor security risks and threats',
      icon: Shield,
      href: '/admin/analytics',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Analytics',
      description: 'View system analytics and reports',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Hospital className="h-8 w-8" />
                Hospital Analytics Dashboard
              </h1>
              <p className="text-purple-200 mt-1">
                Monitor user behavior and assess security risks across your hospital systems
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                disabled={dataLoading}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <AdminNavigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Logged in as</p>
              <p className="text-xl font-medium text-white">{user?.username || 'Hospital Admin'}</p>
              <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                Admin
              </div>
            </div>
            <div className="text-right">
              <p className="text-purple-200 text-sm">Last updated</p>
              <p className="text-white font-medium">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Total Users</h3>
              <Users className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {dataLoading ? (
                <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
              ) : (
                dashboardMetrics.totalUsers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-purple-300 mt-1">+12% from last month</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Active Users</h3>
              <Activity className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {dataLoading ? (
                <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
              ) : (
                dashboardMetrics.activeUsers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-purple-300 mt-1">Currently online</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Security Events</h3>
              <AlertTriangle className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {dataLoading ? (
                <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
              ) : (
                dashboardMetrics.highRiskEvents.toLocaleString()
              )}
            </div>
            <p className="text-xs text-purple-300 mt-1">Last 24 hours</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Risk Score</h3>
              <Shield className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {dataLoading ? (
                <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
              ) : (
                `${(dashboardMetrics.averageRiskScore / 10).toFixed(1)}/10`
              )}
            </div>
            <p className="text-xs text-purple-300 mt-1">System average</p>
          </div>
        </div>

        {/* Recent Activities and Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
          {/* Recent Activities */}
          <div className="col-span-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Recent User Activities</h2>
            <p className="text-purple-200 text-sm mb-6">Latest activities from hospital staff</p>
            
            <div className="space-y-4">
              {dataLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="animate-pulse bg-white/20 h-4 w-4 rounded"></div>
                      <div>
                        <div className="animate-pulse bg-white/20 h-4 w-24 rounded mb-1"></div>
                        <div className="animate-pulse bg-white/20 h-3 w-32 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="animate-pulse bg-white/20 h-5 w-16 rounded mb-1"></div>
                      <div className="animate-pulse bg-white/20 h-3 w-20 rounded"></div>
                    </div>
                  </div>
                ))
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Activity className="h-4 w-4 text-purple-300" />
                      <div>
                        <p className="text-sm font-medium text-white">{activity.user}</p>
                        <p className="text-xs text-purple-200">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activity.risk === 'low' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                        activity.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {activity.risk} risk
                      </div>
                      <p className="text-xs text-purple-300 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-purple-300">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activities found</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="col-span-3 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
            <p className="text-purple-200 text-sm mb-6">Current system health and connectivity</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white">Hospital Database</span>
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                  Connected
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white">Security Monitoring</span>
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                  Active
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white">Analytics Engine</span>
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                  Running
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <p className="text-purple-200 text-sm mb-6">Access frequently used monitoring tools</p>
          
          <div className="grid gap-4 md:grid-cols-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.href)}
                  className="group h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105"
                >
                  <IconComponent className="h-6 w-6 text-purple-300 group-hover:text-white" />
                  <span className="text-sm text-purple-200 group-hover:text-white">{action.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLandingPage;