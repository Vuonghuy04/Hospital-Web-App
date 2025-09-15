import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/MockAuthContext';
import { trackPageView } from '../services/behaviorTracking';
import JITRequestModal from '../components/JITRequestModal';
import JITRequestList from '../components/JITRequestList';
import JITApprovalPanel from '../components/JITApprovalPanel';
import PolicyViolationsPanel from '../components/PolicyViolationsPanel';
import { 
  Shield, 
  FileText, 
  Lock, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  Settings
} from 'lucide-react';

const JITRequestPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('request');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    trackPageView('jit_request');
  }, []);

  const handleRequestAccess = (resourceType: string, resourceId: string, resourceName: string) => {
    setSelectedResource({ type: resourceType, id: resourceId, name: resourceName });
    setShowRequestModal(true);
  };

  const handleRequestSubmitted = (request: any) => {
    console.log('JIT request submitted:', request);
    // Refresh the request list if we're on that tab
    if (activeTab === 'my-requests') {
      // The JITRequestList component will handle refreshing
    }
  };

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('manager');
  const isDoctor = user?.roles?.includes('doctor');

  const tabs = [
    { id: 'request', label: 'Request Access', icon: Shield },
    { id: 'my-requests', label: 'My Requests', icon: Clock },
    ...(isAdmin ? [{ id: 'approvals', label: 'Approvals', icon: CheckCircle }] : []),
    ...(isAdmin ? [{ id: 'violations', label: 'Policy Violations', icon: AlertTriangle }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Just-In-Time Access Control</h1>
                <p className="text-gray-600">Secure, temporary access management for healthcare resources</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">{user?.username || 'User'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'request' && (
            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">About Just-In-Time Access</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>JIT access provides temporary permissions to healthcare resources when you don't have regular access. Requests are automatically approved for authorized personnel and logged for audit purposes.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Access Examples */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Patient Records */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Patient Records</h3>
                      <p className="text-sm text-gray-600">Access patient medical history</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Example:</strong> Patient ID: P-12345
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Access:</strong> Read/Write
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Duration:</strong> 2-8 hours
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequestAccess('patient_record', 'P-12345', 'Patient P-12345 Medical Record')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Request Access
                  </button>
                </div>

                {/* Prescriptions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Prescriptions</h3>
                      <p className="text-sm text-gray-600">View and edit prescriptions</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Example:</strong> Prescription ID: RX-78901
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Access:</strong> Read/Write
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Duration:</strong> 1-4 hours
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequestAccess('prescription', 'RX-78901', 'Prescription RX-78901')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Request Access
                  </button>
                </div>

                {/* Lab Results */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Lab Results</h3>
                      <p className="text-sm text-gray-600">Access laboratory test results</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Example:</strong> Lab ID: LAB-45678
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Access:</strong> Read Only
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Duration:</strong> 1-2 hours
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequestAccess('lab_results', 'LAB-45678', 'Lab Results LAB-45678')}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Request Access
                  </button>
                </div>

                {/* Finance Data (Restricted) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-60">
                  <div className="flex items-center space-x-3 mb-4">
                    <Lock className="h-8 w-8 text-red-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Financial Data</h3>
                      <p className="text-sm text-gray-600">Access financial records</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Example:</strong> Finance ID: FIN-99999
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Access:</strong> Restricted
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Duration:</strong> N/A
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed"
                  >
                    Access Denied
                  </button>
                </div>

                {/* Demo Scenarios */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Demo Scenarios</h3>
                      <p className="text-sm text-gray-600">Test different access scenarios</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><strong>Nurse → Finance:</strong> Should be denied</p>
                    <p><strong>Accountant → Prescription:</strong> Should be denied</p>
                    <p><strong>Nurse → Prescription Edit:</strong> Requires approval</p>
                    <p><strong>Doctor → Patient Record:</strong> Auto-approved</p>
                  </div>
                  <a
                    href="/jit-demo"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Run Demo Tests
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my-requests' && <JITRequestList />}
          {activeTab === 'approvals' && isAdmin && <JITApprovalPanel />}
          {activeTab === 'violations' && isAdmin && <PolicyViolationsPanel />}
        </div>
      </div>

      {/* JIT Request Modal */}
      {showRequestModal && selectedResource && (
        <JITRequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedResource(null);
          }}
          resourceType={selectedResource.type}
          resourceId={selectedResource.id}
          resourceName={selectedResource.name}
          onRequestSubmitted={handleRequestSubmitted}
        />
      )}
    </div>
  );
};

export default JITRequestPage;
