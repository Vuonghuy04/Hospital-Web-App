import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Clock,
  User,
  Globe,
  Database,
  FileText,
  Lock,
  Users,
  BarChart3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface EnhancedAuditEvent {
  id: string;
  event_id: string;
  timestamp: string;
  user_id: string;
  username: string;
  email: string;
  roles: string[];
  action: string;
  resource?: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  session_id: string;
  session_duration: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  error_message?: string;
  metadata: any;
  compliance_flags: {
    hipaaRelevant: boolean;
    dataAccess: boolean;
    adminAction: boolean;
    securityEvent: boolean;
    patientDataAccess: boolean;
  };
}

interface AuditStats {
  totalEvents: number;
  uniqueUsers: number;
  failedEvents: number;
  criticalEvents: number;
  highRiskEvents: number;
  hipaaEvents: number;
  patientDataEvents: number;
  adminEvents: number;
  securityEvents: number;
  averageRiskScore: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const EnhancedAuditDashboard: React.FC = () => {
  const [events, setEvents] = useState<EnhancedAuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    riskLevel: '',
    startDate: '',
    endDate: '',
    complianceFlag: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Fetch audit events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`${API_BASE_URL}/api/audit?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching audit events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [pagination.page, filters]);

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get compliance flag icons
  const getComplianceIcon = (flag: string, value: boolean) => {
    if (!value) return null;
    
    switch (flag) {
      case 'hipaaRelevant': return <Shield className="h-3 w-3 text-blue-600" />;
      case 'dataAccess': return <Database className="h-3 w-3 text-purple-600" />;
      case 'adminAction': return <Users className="h-3 w-3 text-red-600" />;
      case 'securityEvent': return <Lock className="h-3 w-3 text-orange-600" />;
      case 'patientDataAccess': return <FileText className="h-3 w-3 text-green-600" />;
      default: return null;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format session duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Audit Dashboard</h2>
          <p className="text-gray-600">Comprehensive activity tracking across all accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => { fetchEvents(); fetchStats(); }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalEvents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">HIPAA Events</p>
                <p className="text-2xl font-bold text-purple-600">{stats.hipaaEvents}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter user ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter action"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Flag</label>
            <select
              value={filters.complianceFlag}
              onChange={(e) => setFilters(prev => ({ ...prev, complianceFlag: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Events</option>
              <option value="hipaaRelevant">HIPAA Relevant</option>
              <option value="dataAccess">Data Access</option>
              <option value="adminAction">Admin Action</option>
              <option value="securityEvent">Security Event</option>
              <option value="patientDataAccess">Patient Data Access</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Audit Events</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading events...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.event_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{formatTimestamp(event.timestamp)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.username}</div>
                          <div className="text-sm text-gray-500">{event.user_id}</div>
                          <div className="text-xs text-gray-400">{event.roles?.join(', ')}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.action}</div>
                      {event.error_message && (
                        <div className="text-xs text-red-600 mt-1">{event.error_message}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.resource && (
                        <div>
                          <div className="font-medium">{event.resource}</div>
                          {event.resource_id && (
                            <div className="text-xs text-gray-500">ID: {event.resource_id}</div>
                          )}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(event.risk_level)}`}>
                          {event.risk_level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{Math.round(event.risk_score)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {event.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm ${event.success ? 'text-green-600' : 'text-red-600'}`}>
                          {event.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {Object.entries(event.compliance_flags).map(([flag, value]) => 
                          getComplianceIcon(flag, value)
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>{event.ip_address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(event.session_duration)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total events)
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAuditDashboard;
