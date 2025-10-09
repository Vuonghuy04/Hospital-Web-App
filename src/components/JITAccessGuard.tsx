import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/MockAuthContext';
import JITRequestModal from './JITRequestModal';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface JITAccessGuardProps {
  children: React.ReactNode;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  requiredRole?: string;
  requiredAction?: 'read' | 'write';
  fallbackComponent?: React.ReactNode;
}

interface JITAccess {
  hasAccess: boolean;
  requiresApproval: boolean;
  pendingRequest?: any;
  approvedRequest?: any;
}

const JITAccessGuard: React.FC<JITAccessGuardProps> = ({
  children,
  resourceType,
  resourceId,
  resourceName,
  requiredRole,
  requiredAction = 'read',
  fallbackComponent
}) => {
  const { user } = useAuth();
  const [access, setAccess] = useState<JITAccess>({ hasAccess: false, requiresApproval: false });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user has access to this resource
  const checkAccess = async () => {
    if (!user) {
      setAccess({ hasAccess: false, requiresApproval: false });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check if user has a valid approved JIT request for this resource
      const response = await fetch(
        `http://localhost:5002/api/jit?requesterId=${user.username}&resourceType=${resourceType}&resourceId=${resourceId}&status=approved&limit=1`
      );
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const request = data.data[0];
        const expiresAt = new Date(request.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          // User has valid access
          setAccess({ 
            hasAccess: true, 
            requiresApproval: false, 
            approvedRequest: request 
          });
        } else {
          // Access expired → prompt user to request access again
          setAccess({ hasAccess: false, requiresApproval: true });
        }
      } else {
        // Check if user has pending request
        const pendingResponse = await fetch(
          `http://localhost:5002/api/jit?requesterId=${user.username}&resourceType=${resourceType}&resourceId=${resourceId}&status=pending&limit=1`
        );
        const pendingData = await pendingResponse.json();
        
        if (pendingData.success && pendingData.data.length > 0) {
          setAccess({ 
            hasAccess: false, 
            requiresApproval: true, 
            pendingRequest: pendingData.data[0] 
          });
        } else {
          // Check if user has role-based access
          const hasRoleAccess = checkRoleBasedAccess(user.roles || [], resourceType, requiredRole);
          
          if (hasRoleAccess) {
            setAccess({ hasAccess: true, requiresApproval: false });
          } else {
            setAccess({ hasAccess: false, requiresApproval: true });
          }
        }
      }
    } catch (err) {
      setError('Failed to check access permissions');
      setAccess({ hasAccess: false, requiresApproval: false });
    } finally {
      setLoading(false);
    }
  };

  // Check if user's role allows access
  const checkRoleBasedAccess = (userRoles: string[], resourceType: string, requiredRole?: string): boolean => {
    if (requiredRole && !userRoles.includes(requiredRole)) {
      return false;
    }

    // Define role-based access rules (must match backend auto-approval rules)
    const accessRules: { [key: string]: string[] } = {
      'admin': ['patient_record', 'prescription', 'finance', 'lab_results', 'user_management'],
      'manager': ['patient_record', 'prescription', 'lab_results', 'user_management'],
      'doctor': ['patient_record', 'prescription', 'lab_results'], // Medical data auto-approved for doctors
      'nurse': ['patient_record'], // Only patient records are auto-approved for nurses
      'accountant': ['finance'], // Financial data auto-approved for accountants
      'user': [] // Regular users need approval for everything
    };

    for (const role of userRoles) {
      if (accessRules[role]?.includes(resourceType)) {
        return true;
      }
    }

    return false;
  };

  useEffect(() => {
    checkAccess();
  }, [user, resourceType, resourceId]);

  const handleRequestAccess = () => {
    setShowRequestModal(true);
  };

  const handleRequestSubmitted = (request: any) => {
    setAccess({ 
      hasAccess: false, 
      requiresApproval: true, 
      pendingRequest: request 
    });
    setShowRequestModal(false);
  };

  const handleRefreshAccess = () => {
    checkAccess();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking access permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Access Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button
              onClick={handleRefreshAccess}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User has access - show the protected content
  if (access.hasAccess) {
    return (
      <div>
        {access.approvedRequest && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Access granted via JIT request
                </p>
                <p className="text-xs text-green-600">
                  Expires: {new Date(access.approvedRequest.expires_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }

  // User needs approval - show request interface
  if (access.requiresApproval) {
    if (access.pendingRequest) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <Clock className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Access Request Pending</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Your request to access <strong>{resourceName}</strong> is pending approval.</p>
                <p className="mt-1">Requested: {new Date(access.pendingRequest.created_at).toLocaleString()}</p>
                <p>Reason: {access.pendingRequest.reason}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleRefreshAccess}
                  className="text-sm text-yellow-600 hover:text-yellow-800 underline"
                >
                  Check status
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <Shield className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Access Required</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>You need permission to access <strong>{resourceName}</strong>.</p>
              <p className="mt-1">This resource requires Just-In-Time (JIT) access approval.</p>
            </div>
            <div className="mt-4">
              <button
                onClick={handleRequestAccess}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Shield className="h-4 w-4 mr-2" />
                Request Access
              </button>
            </div>
          </div>
        </div>

        {showRequestModal && (
          <JITRequestModal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
            resourceType={resourceType}
            resourceId={resourceId}
            resourceName={resourceName}
            onRequestSubmitted={handleRequestSubmitted}
          />
        )}
      </div>
    );
  }

  // User doesn't have access and can't request it
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex">
        <Lock className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>You don't have permission to access <strong>{resourceName}</strong>.</p>
            <p className="mt-1">Contact your administrator for access.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JITAccessGuard;
