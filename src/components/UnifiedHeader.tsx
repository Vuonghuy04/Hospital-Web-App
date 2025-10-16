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
  BarChart3,
  User,
  Pill,
  ClipboardList,
  LogOut,
  Activity,
  Brain,
  Target,
  CheckCircle,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

const UnifiedHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const handleLogout = () => {
    trackLogout();
    trackButtonClick('logout', 'header');
    logout();
    navigate('/');
  };

  const isAdmin = user?.roles?.some(role => ['admin', 'manager'].includes(role));
  
  console.log('🔧 UnifiedHeader - User:', user);
  console.log('🔧 UnifiedHeader - IsAuthenticated:', isAuthenticated);
  console.log('🔧 UnifiedHeader - IsAdmin:', isAdmin);

  // Define navigation item types
  interface NavItem {
    name: string;
    path: string;
    icon: any;
    subItems?: NavItem[];
  }

  // Admin navigation items with sub-navigation
  const adminNavItems: NavItem[] = [
    { 
      name: 'Dashboard', 
      path: '/admin', 
      icon: Shield,
      subItems: [
        { name: 'Overview', path: '/admin', icon: BarChart3 },
        { name: 'User Activity', path: '/admin/activity', icon: Activity },
        { name: 'Behavior Profiles', path: '/admin/behavior-profiles', icon: Brain },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'Risk Assessment', path: '/admin/risk-assessment', icon: Target },
        { name: 'Compliance Reporting', path: '/admin/compliance', icon: CheckCircle },
        { name: 'JIT Approvals', path: '/admin/jit-approvals', icon: CheckCircle },
        { name: 'Policy Violations', path: '/admin/policy-violations', icon: AlertTriangle }
      ]
    },
    { name: 'Audit Logs', path: '/admin/activity', icon: Database },
  ];

  // User navigation items (patient/doctor/nurse focused)
  const userNavItems: NavItem[] = [
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
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isActive = window.location.pathname === item.path || 
                (hasSubItems && item.subItems?.some(subItem => window.location.pathname === subItem.path));
              
              return (
                <div key={item.path} className="relative dropdown-container">
                  {hasSubItems ? (
                    <button
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer ${
                        isActive 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.name}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => {
                        trackNavigationChange(window.location.pathname, item.path);
                        trackButtonClick(`nav_${item.name.toLowerCase().replace(/\s+/g, '_')}`, 'header');
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        isActive 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )}
                  
                  {/* Dropdown Menu */}
                  {hasSubItems && activeDropdown === item.name && (
                    <div 
                      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    >
                      {item.subItems?.map((subItem) => {
                        const SubIconComponent = subItem.icon;
                        const isSubActive = window.location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => {
                              trackNavigationChange(window.location.pathname, subItem.path);
                              trackButtonClick(`nav_${subItem.name.toLowerCase().replace(/\s+/g, '_')}`, 'header_dropdown');
                              setActiveDropdown(null);
                            }}
                            className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                              isSubActive 
                                ? 'text-blue-600 bg-blue-50' 
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            <SubIconComponent className="h-4 w-4" />
                            <span>{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* JIT Notifications */}
                {console.log('🔧 UnifiedHeader - About to render JITNotificationCenter')}
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
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                
                return (
                  <div key={item.path}>
                    <Link
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
                    
                    {/* Mobile Sub-navigation */}
                    {hasSubItems && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems?.map((subItem) => {
                          const SubIconComponent = subItem.icon;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => {
                                trackNavigationChange(window.location.pathname, subItem.path);
                                trackButtonClick(`mobile_nav_${subItem.name.toLowerCase().replace(/\s+/g, '_')}`, 'mobile_header_sub');
                              }}
                              className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors text-xs font-medium bg-gray-100 px-3 py-1 rounded"
                            >
                              <SubIconComponent className="h-3 w-3" />
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
