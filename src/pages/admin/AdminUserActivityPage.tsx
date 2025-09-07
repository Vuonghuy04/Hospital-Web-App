import React, { useState, useEffect } from 'react';
import AdminOnlyPage from '../../components/AdminOnlyPage';
import AdminNavigation from '../../components/AdminNavigation';
import { 
  Activity, 
  Users, 
  Clock, 
  Shield, 
  RefreshCw,
  Search,
  Filter,
  Eye
} from 'lucide-react';

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

const AdminUserActivityPage = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const generateMockActivities = (): UserActivity[] => {
      const users = ['dr.johnson', 'nurse.smith', 'admin', 'dr.wilson', 'nurse.davis'];
      const actions = ['login', 'logout', 'view_patient_record', 'update_medication', 'access_lab_results', 'schedule_appointment'];
      const resources = ['patient_records', 'medication_system', 'lab_system', 'scheduling_system', 'user_management'];
      const statuses: ('success' | 'failed' | 'warning')[] = ['success', 'failed', 'warning'];
      const riskLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

      return Array.from({ length: 50 }, (_, i) => ({
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
    };

    const loadActivities = () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setActivities(generateMockActivities());
        setLoading(false);
      }, 1000);
    };

    loadActivities();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadActivities, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

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
      high: 'bg-red-500/20 text-red-300 border-red-500/30'
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

  return (
    <AdminOnlyPage 
      title="User Activity" 
      description="Real-time monitoring of all user activities across hospital systems"
      requiredRole="admin"
    >
      <AdminNavigation />
      
      <div className="space-y-6">
        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Total Activities</h3>
              <Activity className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">{activities.length}</div>
            <p className="text-xs text-purple-300 mt-1">Last 24 hours</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Active Users</h3>
              <Users className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {new Set(activities.map(a => a.username)).size}
            </div>
            <p className="text-xs text-purple-300 mt-1">Unique users</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Failed Actions</h3>
              <Shield className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {activities.filter(a => a.status === 'failed').length}
            </div>
            <p className="text-xs text-purple-300 mt-1">Security events</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">High Risk</h3>
              <Shield className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">
              {activities.filter(a => a.riskLevel === 'high').length}
            </div>
            <p className="text-xs text-purple-300 mt-1">Requires attention</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
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

              {/* Filter */}
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

            <div className="flex items-center space-x-4">
              {/* Auto Refresh Toggle */}
              <label className="flex items-center space-x-2 text-purple-200">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">Auto-refresh</span>
              </label>

              {/* Manual Refresh */}
              <button
                onClick={() => window.location.reload()}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Real-time Activity Log</h2>
            <p className="text-purple-200 text-sm mt-1">
              Showing {filteredActivities.length} of {activities.length} activities
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="animate-pulse bg-white/20 h-4 rounded"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-purple-300">
                      No activities found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity) => (
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
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-400 hover:text-blue-300 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminOnlyPage>
  );
};

export default AdminUserActivityPage;
