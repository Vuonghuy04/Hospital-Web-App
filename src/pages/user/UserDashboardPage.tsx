import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView } from '../../services/behaviorTracking';
import { trackActionWithProfiling } from '../../services/behaviorProfiler';
import UnifiedHeader from '../../components/UnifiedHeader';

const UserDashboardPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    trackPageView(`user_dashboard_${username}`);
    // Enhanced behavior tracking for user dashboard access
    trackActionWithProfiling('user_dashboard_access', {
      target_user: username,
      role: user?.roles?.[0] || 'user',
      context: 'user_dashboard_page'
    });
  }, [username, user]);

  // Verify user can access this page
  if (!isAuthenticated || !user || user.username !== username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-4">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You can only access your own dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <UnifiedHeader />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Welcome, {user.firstName || user.username}
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Your personal healthcare dashboard - Access your medical records and manage your healthcare needs.
          </p>
          <div className="mt-4 flex justify-center">
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span 
                  key={role}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* User Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* My Medical Records */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white">
                    <span className="text-xl">📋</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">My Medical Records</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                View your personal medical history, test results, and treatment records.
              </p>
              <Link 
                to={`/${username}/records`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                View My Records
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>

          {/* My Appointments */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-green-500 text-white">
                    <span className="text-xl">📅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">My Appointments</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Schedule, view, and manage your upcoming medical appointments.
              </p>
              <Link 
                to={`/${username}/appointments`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
              >
                My Appointments
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>

          {/* My Prescriptions */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-500 text-white">
                    <span className="text-xl">💊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">My Prescriptions</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Track your medications, refills, and prescription history.
              </p>
              <Link 
                to={`/${username}/prescriptions`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
              >
                My Prescriptions
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-yellow-500 text-white">
                    <span className="text-xl">🧪</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Access your laboratory results, imaging studies, and diagnostic reports.
              </p>
              <Link 
                to={`/${username}/test-results`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 transition-colors duration-200"
              >
                View Results
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>

          {/* Health Summary */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-red-500 text-white">
                    <span className="text-xl">❤️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Health Summary</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Overview of your health status, vital signs, and wellness metrics.
              </p>
              <Link 
                to={`/${username}/health-summary`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
              >
                Health Overview
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-500 text-white">
                    <span className="text-xl">⚙️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Update your personal information, contact details, and preferences.
              </p>
              <Link 
                to={`/${username}/settings`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
              >
                Settings
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">3</div>
            <div className="text-sm text-gray-600 mt-1">Upcoming Appointments</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600">2</div>
            <div className="text-sm text-gray-600 mt-1">Active Prescriptions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">1</div>
            <div className="text-sm text-gray-600 mt-1">Pending Test Results</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
