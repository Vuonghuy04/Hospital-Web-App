import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RecordPage from './pages/RecordPage';
import JITRequestPage from './pages/JITRequestPage';
import JITRequestable from './pages/JITRequestable';
import DatabaseViewerPage from './pages/DatabaseViewerPage';
import { AuthProvider } from './contexts/MockAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLandingPage from './pages/admin/AdminLandingPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAccessControlPage from './pages/admin/AdminAccessControlPage';
import AdminSecurityPoliciesPage from './pages/admin/AdminSecurityPoliciesPage';
import AdminIncidentResponsePage from './pages/admin/AdminIncidentResponsePage';
import AdminSystemMonitoringPage from './pages/admin/AdminSystemMonitoringPage';
import AdminRoute from './components/AdminRoute';
import UserDashboardPage from './pages/user/UserDashboardPage';
import ErrorBoundary from './components/ErrorBoundary';
import AdminUserActivityPage from './pages/admin/AdminUserActivityPage';
import AdminBehaviorAnalysisPage from './pages/admin/AdminBehaviorAnalysisPage';
import AdminRiskAssessmentPage from './pages/admin/AdminRiskAssessmentPage';
import UnifiedAdminDashboard from './pages/admin/UnifiedAdminDashboard';
import AuditPage from './pages/admin/AuditPage';
import UserOnlyRoute from './components/UserOnlyRoute';
import MedicalRecordsPage from './pages/user/MedicalRecordsPage';
import AppointmentsPage from './pages/user/AppointmentsPage';
import UnifiedHeader from './components/UnifiedHeader';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/records/:id" element={
            <ProtectedRoute>
              <RecordPage />
            </ProtectedRoute>
          } />
          <Route path="/jit-request" element={
            <ProtectedRoute>
              <JITRequestPage />
            </ProtectedRoute>
          } />
          <Route path="/jit-requestable" element={
            <ProtectedRoute>
              <JITRequestable />
            </ProtectedRoute>
          } />
          <Route path="/database" element={
            <ProtectedRoute>
              <DatabaseViewerPage />
            </ProtectedRoute>
          } />
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="manager">
                <UnifiedAdminDashboard />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          {/* Audit Route - Direct to Activity Tab */}
          <Route path="/audit" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <UnifiedAdminDashboard />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AuditPage />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="manager">
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminUsersPage />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminLayout>
                  <AdminAnalyticsPage />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/access-control" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminLayout>
                  <AdminAccessControlPage />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/security-policies" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminLayout>
                  <AdminSecurityPoliciesPage />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/incident-response" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminLayout>
                  <AdminIncidentResponsePage />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/system-monitoring" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminLayout>
                  <AdminSystemMonitoringPage />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          {/* New Admin Pages */}
          <Route path="/admin/user-activity" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminUserActivityPage />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/behavior-analysis" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminBehaviorAnalysisPage />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/risk-assessment" element={
            <ProtectedRoute>
              <AdminRoute requiredRole="admin">
                <AdminRiskAssessmentPage />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          {/* User Dashboard Routes */}
          <Route path="/:username" element={
            <ProtectedRoute>
              <UserDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/:username/records" element={
            <ProtectedRoute>
              <UserOnlyRoute>
                <MedicalRecordsPage />
              </UserOnlyRoute>
            </ProtectedRoute>
          } />
          <Route path="/:username/appointments" element={
            <ProtectedRoute>
              <UserOnlyRoute>
                <AppointmentsPage />
              </UserOnlyRoute>
            </ProtectedRoute>
          } />
          <Route path="/:username/prescriptions" element={
            <ProtectedRoute>
              <UserOnlyRoute>
                <div className="min-h-screen bg-gray-50">
                  <UnifiedHeader />
                  <div className="max-w-4xl mx-auto p-8">
                    <div className="bg-white rounded-lg shadow p-8">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Prescriptions</h1>
                      <p className="text-gray-600">Your prescription management system - Coming Soon</p>
                    </div>
                  </div>
                </div>
              </UserOnlyRoute>
            </ProtectedRoute>
          } />
          <Route path="/:username/lab-results" element={
            <ProtectedRoute>
              <UserOnlyRoute>
                <div className="min-h-screen bg-gray-50">
                  <UnifiedHeader />
                  <div className="max-w-4xl mx-auto p-8">
                    <div className="bg-white rounded-lg shadow p-8">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Lab Results</h1>
                      <p className="text-gray-600">Your laboratory test results - Coming Soon</p>
                    </div>
                  </div>
                </div>
              </UserOnlyRoute>
            </ProtectedRoute>
          } />
          <Route path="/:username/health" element={
            <ProtectedRoute>
              <UserOnlyRoute>
                <div className="min-h-screen bg-gray-50">
                  <UnifiedHeader />
                  <div className="max-w-4xl mx-auto p-8">
                    <div className="bg-white rounded-lg shadow p-8">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Health Monitoring</h1>
                      <p className="text-gray-600">Your health monitoring dashboard - Coming Soon</p>
                    </div>
                  </div>
                </div>
              </UserOnlyRoute>
            </ProtectedRoute>
          } />
          <Route path="/:username/settings" element={
            <ProtectedRoute>
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold">Profile Settings</h2>
                <p>User settings page coming soon...</p>
              </div>
            </ProtectedRoute>
          } />
          </Routes>
          <AnalyticsDashboard />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
