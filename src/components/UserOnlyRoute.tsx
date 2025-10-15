import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/MockAuthContext';

interface UserOnlyRouteProps {
  children: ReactNode;
}

/**
 * UserOnlyRoute - Allows access to patient content pages for:
 * - Patients (users)
 * - Doctors
 * - Nurses
 * - Accountants (for financial data)
 * 
 * Blocks ONLY system admins and managers from accessing patient-specific pages
 */
const UserOnlyRoute = ({ children }: UserOnlyRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Check if user is ONLY admin or manager (not doctor/nurse/accountant)
  const isSystemAdmin = user.roles?.some(role => ['admin', 'manager'].includes(role));
  const isMedicalStaff = user.roles?.some(role => ['doctor', 'nurse', 'accountant', 'user'].includes(role));
  
  // Block ONLY if they are admin/manager AND NOT medical staff
  if (isSystemAdmin && !isMedicalStaff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white p-4">
        <div className="text-center bg-blue-800 bg-opacity-70 p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-6xl mb-6">🚫</div>
          <h2 className="text-3xl font-bold mb-4">System Admin Access Restricted</h2>
          <p className="text-blue-100 mb-4">
            This page is for patient care and medical staff only.
          </p>
          <p className="text-blue-100 text-sm mb-6">
            As a system administrator, you have access to the admin dashboard for system management.
          </p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => window.location.href = '/admin'}
              className="bg-white text-blue-800 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Admin Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Homepage
            </button>
          </div>
          <p className="text-blue-200 text-xs mt-8">
            System admins are restricted from patient-specific pages. Medical staff can access patient data.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UserOnlyRoute;
