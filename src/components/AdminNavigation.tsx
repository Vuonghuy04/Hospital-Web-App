import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Activity, 
  Brain, 
  Shield, 
  Database,
  Bot
} from 'lucide-react';

const AdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: BarChart3,
      description: 'Main admin dashboard overview'
    },
    {
      name: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
      description: 'System analytics and reports'
    },
    {
      name: 'Hospital Users',
      path: '/admin/users',
      icon: Users,
      description: 'Manage hospital staff and patients'
    },
    {
      name: 'User Activity',
      path: '/admin/user-activity',
      icon: Activity,
      description: 'Real-time user activity monitoring'
    },
    {
      name: 'Behavior Analysis',
      path: '/admin/behavior-analysis',
      icon: Brain,
      description: 'ML-powered behavior analysis'
    },
    {
      name: 'Risk Assessment',
      path: '/admin/risk-assessment',
      icon: Shield,
      description: 'Security risk evaluation'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`
                  flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors duration-200 whitespace-nowrap
                  ${active 
                    ? 'border-blue-400 text-white' 
                    : 'border-transparent text-purple-200 hover:text-white hover:border-purple-300'
                  }
                `}
              >
                <IconComponent className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminNavigation;
