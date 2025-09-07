import React from 'react';
import { useAuth } from '../contexts/MockAuthContext';
import { AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminOnlyPageProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  requiredRole?: 'admin' | 'manager';
}

const AdminOnlyPage = ({ 
  children, 
  title, 
  description, 
  requiredRole = 'admin' 
}: AdminOnlyPageProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const hasRequiredRole = (userRoles: string[], requiredRole: string): boolean => {
    const roleHierarchy: { [key: string]: number } = {
      'user': 1, 'staff': 2, 'nurse': 3, 'doctor': 4, 'manager': 5, 'admin': 6
    };
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    const userMaxRoleLevel = Math.max(...userRoles.map(role => roleHierarchy[role] || 0));
    return userMaxRoleLevel >= requiredRoleLevel;
  };

  // Check if user has required permissions
  const hasAccess = isAuthenticated && 
                   user && 
                   user.roles && 
                   hasRequiredRole(user.roles, requiredRole);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          {/* Access Denied Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-red-500/30 shadow-2xl">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-4">
                Access Restricted
              </h2>

              {/* Message */}
              <div className="text-red-200 mb-6 space-y-2">
                <p className="font-medium">
                  This page requires {requiredRole.toUpperCase()} privileges.
                </p>
                <p className="text-sm text-red-300">
                  You need {requiredRole} access to view "{title}".
                </p>
              </div>

              {/* User Info */}
              {user && (
                <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">Current Access Level:</span>
                  </div>
                  <div className="text-sm text-purple-200">
                    <p>User: {user.username}</p>
                    <p>Roles: {user.roles?.join(', ') || 'None'}</p>
                    <p>Required: {requiredRole.toUpperCase()}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center justify-center space-x-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Admin Dashboard</span>
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors border border-white/20"
                >
                  Return to Home
                </button>
              </div>

              {/* Contact Admin */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-purple-300">
                  Need access? Contact your system administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has access, render the page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Page Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {description && (
                <p className="text-purple-200 mt-1">{description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-400">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">{requiredRole.toUpperCase()} Access</span>
              </div>
              <button 
                onClick={() => navigate('/admin')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
};

export default AdminOnlyPage;
