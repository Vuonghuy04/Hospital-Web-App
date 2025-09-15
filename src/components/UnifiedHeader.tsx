import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/MockAuthContext';
import { trackButtonClick, trackNavigationChange, trackLogout } from '../services/behaviorTracking';
import JITNotificationCenter from './JITNotificationCenter';
import { 
  Hospital, 
  Home, 
  FileText, 
  Calendar, 
  Database, 
  Shield, 
  Users, 
  BarChart3,
  User,
  Pill,
  ClipboardList,
  LogOut
} from 'lucide-react';

const UnifiedHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    trackLogout();
    trackButtonClick('logout', 'header');
    logout();
    navigate('/');
  };

  const isAdmin = user?.roles?.some(role => ['admin', 'manager'].includes(role));

  // Admin navigation items
  const adminNavItems = [
    { name: 'Dashboard', path: '/admin', icon: Shield },
    { name: 'Audit Logs', path: '/admin/audit', icon: Database },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Security', path: '/admin/risk', icon: Shield },
  ];

  // User navigation items (patient/doctor/nurse focused)
  const userNavItems = [
    { name: 'Dashboard', path: `/${user?.username}`, icon: Home },
    { name: 'Records', path: `/${user?.username}/records`, icon: FileText },
    { name: 'Appointments', path: `/${user?.username}/appointments`, icon: Calendar },
    { name: 'Prescriptions', path: `/${user?.username}/prescriptions`, icon: Pill },
    { name: 'Lab Results', path: `/${user?.username}/lab-results`, icon: ClipboardList },
    { name: 'Financial', path: `/${user?.username}/financial`, icon: Database },
  ];

  const navigationItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 text-gray-900 hover:text-blue-600 transition-colors">
            <Hospital className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Hospital Web App</span>
          </Link>

          {/* Navigation - Cleaner Design */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    trackNavigationChange(window.location.pathname, item.path);
                    trackButtonClick(`nav_${item.name.toLowerCase().replace(/\s+/g, '_')}`, 'header');
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* JIT Notifications */}
                <JITNotificationCenter />
                
                {/* User Info */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 font-medium">{user.username}</span>
                  </div>
                  {/* Role Badge - Only show if admin */}
                  {isAdmin && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                      ADMIN
                    </span>
                  )}
                </div>
                
                {/* Logout Button - Always Visible */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-gray-200 py-3">
          <div className="space-y-3">
            {/* Mobile User Info */}
            {isAuthenticated && user && (
              <div className="md:hidden flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">{user.username}</span>
                  {isAdmin && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Mobile Navigation Links */}
            <nav className="grid grid-cols-2 gap-2">
              {navigationItems.slice(0, 4).map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      trackNavigationChange(window.location.pathname, item.path);
                      trackButtonClick(`mobile_nav_${item.name.toLowerCase().replace(/\s+/g, '_')}`, 'mobile_header');
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;
