import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/MockAuthContext';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  FileText,
  Shield,
  Lock
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
  created_at: string;
  expires_at: string;
}

interface PolicyViolation {
  id: number;
  violation_id: string;
  username: string;
  user_role: string;
  violation_type: string;
  resource_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  created_at: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const JITNotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const notifications = [];

      // Debug logging
      console.log('🔔 JIT Notifications - Current user:', user);
      console.log('🔔 JIT Notifications - User roles:', user.roles);
      console.log('🔔 JIT Notifications - Is admin?', user.roles?.includes('admin'));
      console.log('🔔 JIT Notifications - Is manager?', user.roles?.includes('manager'));
      console.log('🔔 JIT Notifications - Is doctor?', user.roles?.includes('doctor'));

      // Check if user is admin/manager - show pending approvals
      if (user.roles?.includes('admin') || user.roles?.includes('manager') || user.roles?.includes('doctor')) {
        console.log('🔔 Fetching pending JIT requests for admin/manager/doctor...');
        const response = await fetch(`${API_BASE_URL}/api/jit?status=pending&limit=10`);
        const data = await response.json();
        
        console.log('🔔 JIT API Response:', data);
        
        if (data.success) {
          console.log('🔔 Found', data.data.length, 'pending JIT requests');
          data.data.forEach((request: JITRequest) => {
            notifications.push({
              id: `request-${request.id}`,
              type: 'approval_needed',
              title: 'JIT Approval Needed',
              message: `${request.requester_username} (${request.requester_role}) requests access to ${getResourceTypeLabel(request.resource_type)}`,
              timestamp: request.created_at,
              data: request,
              severity: 'medium'
            });
          });
        } else {
          console.log('🔔 JIT API failed:', data.error);
        }
      }

      // Check for policy violations (admin only)
      if (user.roles?.includes('admin')) {
        console.log('🔔 Fetching policy violations for admin...');
        const violationsResponse = await fetch(`${API_BASE_URL}/api/jit/violations?status=open&limit=5`);
        const violationsData = await violationsResponse.json();
        
        console.log('🔔 Policy violations response:', violationsData);
        
        if (violationsData.success) {
          console.log('🔔 Found', violationsData.data.length, 'policy violations');
          violationsData.data.forEach((violation: PolicyViolation) => {
            notifications.push({
              id: `violation-${violation.id}`,
              type: 'policy_violation',
              title: 'Policy Violation',
              message: `${violation.username} (${violation.user_role}) violated policy accessing ${getResourceTypeLabel(violation.resource_type)}`,
              timestamp: violation.created_at,
              data: violation,
              severity: violation.severity
            });
          });
        } else {
          console.log('🔔 Policy violations API failed:', violationsData.error);
        }
      }

      // Check user's own requests status
      console.log('🔔 Fetching user own requests...');
      const myRequestsResponse = await fetch(`${API_BASE_URL}/api/jit?requesterId=${user.username}&status=approved&limit=5`);
      const myRequestsData = await myRequestsResponse.json();
      
      console.log('🔔 User requests response:', myRequestsData);
      
      if (myRequestsData.success) {
        console.log('🔔 Found', myRequestsData.data.length, 'user requests');
        myRequestsData.data.forEach((request: JITRequest) => {
          notifications.push({
            id: `my-request-${request.id}`,
            type: 'request_approved',
            title: 'Access Granted',
            message: `Your request for ${getResourceTypeLabel(request.resource_type)} has been approved`,
            timestamp: request.approved_at || request.created_at,
            data: request,
            severity: 'low'
          });
        });
      } else {
        console.log('🔔 User requests API failed:', myRequestsData.error);
      }

      console.log('🔔 Total notifications found:', notifications.length);
      setNotifications(notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('🔔 Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'high':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-200 text-green-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'approval_needed':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'policy_violation':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'request_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter(n => n.severity === 'medium' || n.severity === 'high' || n.severity === 'critical').length;

  console.log('🔔 JITNotificationCenter render - Loading:', loading, 'User:', user, 'Notifications:', notifications.length);

  if (loading) {
    console.log('🔔 JITNotificationCenter - Rendering loading state');
    return (
      <div className="relative">
        <button className="p-2 text-gray-400 hover:text-gray-600">
          <Bell className="h-6 w-6" />
        </button>
      </div>
    );
  }

  console.log('🔔 JITNotificationCenter - Rendering main state, unreadCount:', unreadCount);

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      notification.severity === 'medium' || notification.severity === 'high' || notification.severity === 'critical'
                        ? 'bg-blue-50'
                        : ''
                    }`}
                    onClick={() => {
                      if (notification.type === 'approval_needed') {
                        window.location.href = '/admin#jit-approvals';
                      } else if (notification.type === 'policy_violation') {
                        window.location.href = '/admin#policy-violations';
                      }
                      setShowNotifications(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(notification.severity)}`}>
                            {getSeverityIcon(notification.severity)}
                            <span className="ml-1">{notification.severity}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                window.location.href = '/jit-request';
                setShowNotifications(false);
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
            >
              View all requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JITNotificationCenter;
