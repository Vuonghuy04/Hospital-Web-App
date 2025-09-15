import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/MockAuthContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Shield, 
  FileText, 
  Lock,
  RefreshCw,
  Filter
} from 'lucide-react';

interface JITRequest {
  id: number;
  request_id: string;
  requester_username: string;
  requester_role: string;
  resource_type: string;
  resource_id: string;
  access_level: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approver_username?: string;
  approved_at?: string;
  expires_at: string;
  created_at: string;
}

const JITRequestList: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<JITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5002/api/jit?requesterId=${user?.username}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      } else {
        setError(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.username]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Access Requests</h2>
          <p className="text-gray-600">Track your Just-In-Time access requests</p>
        </div>
        <button
          onClick={fetchRequests}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
        <span className="text-sm text-gray-500">
          {filteredRequests.length} of {requests.length} requests
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? "You haven't made any access requests yet."
              : `No ${filter} requests found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getResourceIcon(request.resource_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {getResourceTypeLabel(request.resource_type)}
                        </h3>
                        <span className={getStatusBadge(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Resource ID:</strong> {request.resource_id}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Access Level:</strong> {request.access_level}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {request.reason}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Requested: {formatDate(request.created_at)}</span>
                        </div>
                        
                        {request.approved_at && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Approved: {formatDate(request.approved_at)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Expires: {formatDate(request.expires_at)}</span>
                        </div>
                      </div>
                      
                      {request.approver_username && (
                        <div className="text-xs text-gray-500 mt-2">
                          <strong>Approved by:</strong> {request.approver_username}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {request.status === 'approved' && !isExpired(request.expires_at) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-green-800">Access Granted</div>
                        <div className="text-xs text-green-600">
                          Valid until {formatDate(request.expires_at)}
                        </div>
                      </div>
                    )}
                    
                    {request.status === 'approved' && isExpired(request.expires_at) && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-800">Access Expired</div>
                        <div className="text-xs text-gray-600">
                          Expired on {formatDate(request.expires_at)}
                        </div>
                      </div>
                    )}
                    
                    {request.status === 'pending' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-yellow-800">Pending Approval</div>
                        <div className="text-xs text-yellow-600">
                          Waiting for approval
                        </div>
                      </div>
                    )}
                    
                    {request.status === 'rejected' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-red-800">Access Denied</div>
                        <div className="text-xs text-red-600">
                          Request was rejected
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

export default JITRequestList;
