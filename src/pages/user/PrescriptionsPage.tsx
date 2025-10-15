import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView, trackButtonClick } from '../../services/behaviorTracking';
import UnifiedHeader from '../../components/UnifiedHeader';
import JITAccessGuard from '../../components/JITAccessGuard';
import JITRequestModal from '../../components/JITRequestModal';
import { 
  Pill, 
  Calendar, 
  User, 
  Heart, 
  AlertTriangle, 
  Activity,
  Download,
  Eye,
  Lock,
  Plus,
  Edit,
  Shield
} from 'lucide-react';

interface Prescription {
  id: string;
  date: string;
  medication: string;
  dosage: string;
  frequency: string;
  doctor: string;
  status: 'active' | 'completed' | 'cancelled';
  refills: number;
  notes: string;
}

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showJITModal, setShowJITModal] = useState(false);

  useEffect(() => {
    trackPageView('prescriptions');
  }, []);

  useEffect(() => {
    // Generate mock prescriptions
    const mockPrescriptions: Prescription[] = [
      {
        id: '1',
        date: '2024-08-25',
        medication: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        doctor: 'Dr. Sarah Johnson',
        status: 'active',
        refills: 3,
        notes: 'For blood pressure management'
      },
      {
        id: '2',
        date: '2024-08-20',
        medication: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        doctor: 'Dr. Michael Chen',
        status: 'active',
        refills: 2,
        notes: 'For diabetes management'
      },
      {
        id: '3',
        date: '2024-08-15',
        medication: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily',
        doctor: 'Dr. Sarah Johnson',
        status: 'active',
        refills: 1,
        notes: 'For cholesterol management'
      },
      {
        id: '4',
        date: '2024-07-30',
        medication: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'Three times daily',
        doctor: 'Dr. Robert Wilson',
        status: 'completed',
        refills: 0,
        notes: '10-day course for bacterial infection'
      }
    ];

    setTimeout(() => {
      setPrescriptions(mockPrescriptions);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Heart className="h-4 w-4 text-green-500" />;
      case 'completed': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Pill className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleEditRequest = (prescription: Prescription) => {
    // Check if user has edit permissions
    const userRoles = user?.roles || [];
    const isDoctor = userRoles.includes('doctor');
    const isAdmin = userRoles.includes('admin') || userRoles.includes('manager');
    
    if (isDoctor || isAdmin) {
      // User has edit permissions - show edit modal
      setSelectedPrescription(prescription);
      setShowEditModal(true);
    } else {
      // User needs JIT approval for edit access
      setSelectedPrescription(prescription);
      setShowJITModal(true);
    }
  };

  const handleJITRequestSubmitted = (request: any) => {
    console.log('JIT edit request submitted:', request);
    setShowJITModal(false);
    setSelectedPrescription(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <UnifiedHeader />
      
      <JITAccessGuard
        resourceType="prescription"
        resourceId={`prescriptions-${user?.username}`}
        resourceName={`Prescriptions for ${user?.username}`}
        requiredAction="read"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Pill className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
            </div>
            <p className="text-gray-600">
              Your current and past medication prescriptions - Patient: {user?.username}
            </p>
          </div>

          {/* Patient Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Prescription Information</h2>
                  <p className="text-gray-600">Name: {user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-600">Username: {user?.username}</p>
                  <p className="text-gray-600">Email: {user?.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-green-600 mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">HIPAA Protected</span>
                </div>
                <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Current Prescriptions</h2>
                  <p className="text-gray-600 mt-1">
                    Showing {prescriptions.length} prescriptions - Only you and your healthcare providers can access this information
                  </p>
                </div>
                <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Request New Prescription</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))
              ) : prescriptions.length > 0 ? (
                prescriptions.map((prescription) => (
                  <div key={prescription.id} className="p-6 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(prescription.status)}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{prescription.medication}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(prescription.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{prescription.doctor}</span>
                            </div>
                            <div className="text-gray-500">
                              {prescription.dosage} • {prescription.frequency}
                            </div>
                          </div>
                          <p className="text-gray-700 mt-2">{prescription.notes}</p>
                          {prescription.status === 'active' && (
                            <p className="text-sm text-green-600 mt-1">
                              {prescription.refills} refills remaining
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={getStatusBadge(prescription.status)}>
                          {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                        </span>
                        <button 
                          onClick={() => {
                            trackButtonClick('view_prescription', 'prescriptions');
                          }}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleEditRequest(prescription)}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => {
                            trackButtonClick('download_prescription', 'prescriptions');
                          }}
                          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No prescriptions found</p>
                  <p className="text-sm">Your prescriptions will appear here once they are prescribed by your doctor.</p>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-900">Privacy & Security</h3>
                <p className="text-sm text-green-800 mt-1">
                  Your prescription information is protected by HIPAA regulations. Only you and authorized healthcare providers 
                  can access this information. Prescription modifications require doctor approval.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* JIT Request Modal for Edit Access */}
        {showJITModal && selectedPrescription && (
          <JITRequestModal
            isOpen={showJITModal}
            onClose={() => {
              setShowJITModal(false);
              setSelectedPrescription(null);
            }}
            resourceType="prescription"
            resourceId={`prescription-${selectedPrescription.id}`}
            resourceName={`Edit Prescription: ${selectedPrescription.medication}`}
            onRequestSubmitted={handleJITRequestSubmitted}
          />
        )}

        {/* Edit Modal (for users with edit permissions) */}
        {showEditModal && selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Edit className="h-6 w-6 text-green-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Edit Prescription
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPrescription(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medication
                    </label>
                    <input
                      type="text"
                      value={selectedPrescription.medication}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      readOnly
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={selectedPrescription.dosage}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., 10mg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={selectedPrescription.frequency}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., Once daily"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={selectedPrescription.notes}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter prescription notes..."
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <Shield className="h-4 w-4" />
                    <span>You have edit permissions for this prescription</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedPrescription(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert('Prescription updated successfully! (This is a demo)');
                      setShowEditModal(false);
                      setSelectedPrescription(null);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </JITAccessGuard>
    </div>
  );
};

export default PrescriptionsPage;
