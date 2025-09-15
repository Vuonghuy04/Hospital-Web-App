import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/MockAuthContext';
import { 
  AlertTriangle, 
  Shield, 
  User, 
  Lock, 
  FileText,
  RefreshCw,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  Ban
} from 'lucide-react';

interface PolicyViolation {
  id: number;
  violation_id: string;
  user_id: string;
  username: string;
  user_role: string;
  violation_type: string;
  resource_type: string;
  resource_id: string;
  action_attempted: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

const PolicyViolationsPanel: React.FC = () => {
  const { user } = useAuth();
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      params.append('limit', '100');
      
      const response = await fetch(`http://localhost:5002/api/jit/violations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setViolations(data.data);
      } else {
        setError(data.error || 'Failed to fetch violations');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [filter, severityFilter]);

  const handleResolve = async (violation: PolicyViolation) => {
    try {
      const response = await fetch(`http://localhost:5002/api/jit/violations/${violation.violation_id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolvedBy: user?.username || 'unknown'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the violation in the list
        setViolations(prev => 
          prev.map(v => 
            v.id === violation.id 
              ? { ...v, status: 'resolved', resolved_by: user?.username, resolved_at: new Date().toISOString() }
              : v
          )
        );
      } else {
        setError(data.error || 'Failed to resolve violation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[severity as keyof typeof colors]}`;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-red-100 text-red-800 border-red-200',
      resolved: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`;
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'patient_record':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'prescription':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'finance':
        return <Lock className="h-4 w-4 text-red-500" />;
      case 'lab_results':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'patient_record':
        return 'Patient Record';
      case 'prescription':
        return 'Prescription';
      case 'finance':
        return 'Financial Data';
      case 'lab_results':
        return 'Lab Results';
      default:
        return 'Resource';
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-purple-100 text-purple-800 border-purple-200',
      doctor: 'bg-blue-100 text-blue-800 border-blue-200',
      nurse: 'bg-green-100 text-green-800 border-green-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[role as keyof typeof colors] || colors.user}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredViolations = violations.filter(violation => {
    if (filter !== 'all' && violation.status !== filter) return false;
    if (severityFilter !== 'all' && violation.severity !== severityFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading violations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Policy Violations</h2>
          <p className="text-gray-600">Monitor and manage security policy violations</p>
        </div>
        <button
          onClick={fetchViolations}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="open">Open Violations</option>
          <option value="resolved">Resolved</option>
          <option value="all">All Violations</option>
        </select>
        
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <span className="text-sm text-gray-500">
          {filteredViolations.length} of {violations.length} violations
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Violations List */}
      {filteredViolations.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No violations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'open' 
              ? "No open violations to review."
              : `No ${filter} violations found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredViolations.map((violation) => (
            <div
              key={violation.id}
              className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                violation.severity === 'critical' ? 'border-red-200' :
                violation.severity === 'high' ? 'border-red-200' :
                violation.severity === 'medium' ? 'border-yellow-200' :
                'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(violation.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {violation.violation_type.replace(/_/g, ' ').toUpperCase()}
                        </h3>
                        <span className={getSeverityBadge(violation.severity)}>
                          {violation.severity}
                        </span>
                        <span className={getStatusBadge(violation.status)}>
                          {violation.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span><strong>User:</strong> {violation.username}</span>
                        </div>
                        <span className={getRoleBadge(violation.user_role)}>
                          {violation.user_role}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          {getResourceIcon(violation.resource_type)}
                          <span><strong>Resource:</strong> {getResourceTypeLabel(violation.resource_type)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Ban className="h-4 w-4" />
                          <span><strong>Action:</strong> {violation.action_attempted}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Resource ID:</strong> {violation.resource_id}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {violation.reason}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Detected: {formatDate(violation.created_at)}</span>
                        </div>
                        
                        {violation.resolved_at && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Resolved: {formatDate(violation.resolved_at)}</span>
                          </div>
                        )}
                      </div>
                      
                      {violation.resolved_by && (
                        <div className="text-xs text-gray-500 mt-2">
                          <strong>Resolved by:</strong> {violation.resolved_by}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {violation.status === 'open' && (
                      <button
                        onClick={() => handleResolve(violation)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </button>
                    )}
                    
                    {violation.status === 'resolved' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-green-800">Resolved</div>
                        <div className="text-xs text-green-600">
                          by {violation.resolved_by}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PolicyViolationsPanel;
