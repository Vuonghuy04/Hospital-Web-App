import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPageView } from '../services/behaviorTracking';
import RedirectHandler from '../components/RedirectHandler';
import { useAuth } from '../contexts/MockAuthContext';

const HomePage = () => {
  const { user, isAuthenticated, getRedirectPath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView('home');
  }, []);

  // Debug function to manually trigger redirect
  const handleManualRedirect = () => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath();
      console.log('Manual redirect triggered:', { user: user.username, roles: user.roles, redirectPath });
      navigate(redirectPath);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <RedirectHandler />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Debug Section for All Users */}
          {isAuthenticated && user && (
            <div className={`mb-8 p-4 border rounded-lg ${
              user.roles?.some(role => ['admin', 'manager'].includes(role))
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-medium ${
                    user.roles?.some(role => ['admin', 'manager'].includes(role))
                      ? 'text-red-800'
                      : 'text-blue-800'
                  }`}>
                    {user.roles?.some(role => ['admin', 'manager'].includes(role))
                      ? '🛡️ Admin User Detected'
                      : '👤 User Authenticated'}
                  </h3>
                  <p className={`text-sm ${
                    user.roles?.some(role => ['admin', 'manager'].includes(role))
                      ? 'text-red-700'
                      : 'text-blue-700'
                  }`}>
                    User: {user.username} | Roles: [{user.roles.join(', ')}] | Expected redirect: {getRedirectPath()}
                  </p>
                </div>
                <button 
                  onClick={handleManualRedirect}
                  className={`px-4 py-2 text-white rounded-md text-sm transition-colors ${
                    user.roles?.some(role => ['admin', 'manager'].includes(role))
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {user.roles?.some(role => ['admin', 'manager'].includes(role)) 
                    ? 'Go to Admin Panel' 
                    : 'Go to My Dashboard'}
                </button>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Healthcare Management
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Access patient records and manage just-in-time access requests with our secure healthcare platform.
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Patient Records Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">Patient Records</h3>
                    <p className="text-gray-600">View and manage patient information</p>
                  </div>
                </div>
                <a 
                  href="/records/123" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  View Patient Record #123
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* JIT Access Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⏱️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">Just-In-Time Access</h3>
                    <p className="text-gray-600">Request temporary access permissions</p>
                  </div>
                </div>
                <a 
                  href="/jit-request" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Request Access
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Admin Panel Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⚙️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">Admin Dashboard</h3>
                    <p className="text-gray-600">Hospital analytics and user management</p>
                  </div>
                </div>
                <a 
                  href="/admin/dashboard" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  Admin Dashboard
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">150+</div>
              <div className="text-gray-600">Active Patients</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-green-600">24/7</div>
              <div className="text-gray-600">Access Available</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default HomePage;
  