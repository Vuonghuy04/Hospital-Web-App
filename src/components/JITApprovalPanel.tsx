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
  Filter,
  User,
  Calendar,
  MessageSquare
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

const JITApprovalPanel: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<JITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<JITRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5002/api/jit?status=${filter}&limit=100`);
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
  }, [filter]);

  const handleApprove = async (request: JITRequest) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5002/api/jit/${request.request_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approverId: user?.username || 'unknown',
          approverUsername: user?.username || 'unknown'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the request in the list
        setRequests(prev => 
          prev.map(req => 
            req.id === request.id 
              ? { ...req, status: 'approved', approver_username: user?.username, approved_at: new Date().toISOString() }
              : req
          )
        );
        setSelectedRequest(null);
      } else {
        setError(data.error || 'Failed to approve request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (request: JITRequest) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5002/api/jit/${request.request_id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approverId: user?.username || 'unknown',
          approverUsername: user?.username || 'unknown',
          reason: rejectionReason.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the request in the list
        setRequests(prev => 
          prev.map(req => 
            req.id === request.id 
              ? { ...req, status: 'rejected', approver_username: user?.username, approved_at: new Date().toISOString() }
              : req
          )
        );
        setSelectedRequest(null);
        setRejectionReason('');
      } else {
        setError(data.error || 'Failed to reject request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'patient_record':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'prescription':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'finance':
        return <Lock className="h-5 w-5 text-red-500" />;
      case 'lab_results':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
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
          <h2 className="text-2xl font-bold text-gray-900">JIT Access Approvals</h2>
          <p className="text-gray-600">Review and approve Just-In-Time access requests</p>
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
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All Requests</option>
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
            {filter === 'pending' 
              ? "No pending requests to review."
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
                        <span className={getRoleBadge(request.requester_role)}>
                          {request.requester_role}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span><strong>Requester:</strong> {request.requester_username}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-4 w-4" />
                          <span><strong>Access:</strong> {request.access_level}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Resource ID:</strong> {request.resource_id}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {request.reason}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Requested: {formatDate(request.created_at)}</span>
                        </div>
                        
                        {request.approved_at && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Processed: {formatDate(request.approved_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={isProcessing}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          disabled={isProcessing}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'approved' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-green-800">Approved</div>
                        <div className="text-xs text-green-600">
                          by {request.approver_username}
                        </div>
                      </div>
                    )}
                    
                    {request.status === 'rejected' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-red-800">Rejected</div>
                        <div className="text-xs text-red-600">
                          by {request.approver_username}
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

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject Access Request</h3>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Request:</strong> {getResourceTypeLabel(selectedRequest.resource_type)} access by {selectedRequest.requester_username}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejection-reason"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  placeholder="Please provide a reason for rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason('');
                    setError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRequest)}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JITApprovalPanel;
