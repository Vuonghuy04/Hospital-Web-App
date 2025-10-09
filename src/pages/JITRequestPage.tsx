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
  const [resourceStatuses, setResourceStatuses] = useState<{[key: string]: any}>({});

  useEffect(() => {
    trackPageView('jit_request');
    checkResourceStatuses();
  }, [user]);

  const checkResourceStatuses = async () => {
    if (!user) {
      console.log('❌ No user found in checkResourceStatuses');
      return;
    }

    console.log('🔍 Checking resource statuses for user:', user.username);

    const resources = [
      { type: 'patient_record', id: `patient-${user.username}`, name: `Patient ${user.username} Medical Record` },
      { type: 'prescription', id: `prescriptions-${user.username}`, name: `Prescriptions for ${user.username}` },
      { type: 'lab_results', id: `lab-${user.username}`, name: `Lab Results for ${user.username}` }
    ];

    const statuses: {[key: string]: any} = {};

    for (const resource of resources) {
      try {
        console.log(`🔍 Checking ${resource.type}/${resource.id} for user ${user.username}`);
        
        // Check for approved requests
        const approvedResponse = await fetch(
          `http://localhost:5002/api/jit?requesterId=${user.username}&resourceType=${resource.type}&resourceId=${resource.id}&status=approved&limit=1`
        );
        const approvedData = await approvedResponse.json();
        
        console.log(`📊 Approved response for ${resource.type}:`, approvedData);

        if (approvedData.success && approvedData.data.length > 0) {
          const request = approvedData.data[0];
          const expiresAt = new Date(request.expires_at);
          const now = new Date();
          
          if (expiresAt > now) {
            statuses[`${resource.type}-${resource.id}`] = {
              status: 'approved',
              request: request,
              expiresAt: expiresAt
            };
            continue;
          }
        }

        // Check for pending requests
        const pendingResponse = await fetch(
          `http://localhost:5002/api/jit?requesterId=${user.username}&resourceType=${resource.type}&resourceId=${resource.id}&status=pending&limit=1`
        );
        const pendingData = await pendingResponse.json();
        
        console.log(`📊 Pending response for ${resource.type}:`, pendingData);

        if (pendingData.success && pendingData.data.length > 0) {
          statuses[`${resource.type}-${resource.id}`] = {
            status: 'pending',
            request: pendingData.data[0]
          };
        } else {
          statuses[`${resource.type}-${resource.id}`] = {
            status: 'none'
          };
        }
      } catch (error) {
        console.error(`Error checking status for ${resource.type}-${resource.id}:`, error);
        statuses[`${resource.type}-${resource.id}`] = {
          status: 'error'
        };
      }
    }

    console.log('📊 Final resource statuses:', statuses);
    setResourceStatuses(statuses);
  };

  const handleRequestAccess = (resourceType: string, resourceId: string, resourceName: string) => {
    setSelectedResource({ type: resourceType, id: resourceId, name: resourceName });
    setShowRequestModal(true);
  };

  const handleRequestSubmitted = (request: any) => {
    console.log('JIT request submitted:', request);
    // Refresh the resource statuses
    checkResourceStatuses();
    // Refresh the request list if we're on that tab
    if (activeTab === 'my-requests') {
      // The JITRequestList component will handle refreshing
    }
  };

  const getResourceStatus = (resourceType: string, resourceId: string) => {
    return resourceStatuses[`${resourceType}-${resourceId}`] || { status: 'none' };
  };

  const renderResourceStatus = (resourceType: string, resourceId: string, resourceName: string) => {
    const status = getResourceStatus(resourceType, resourceId);
    
    switch (status.status) {
      case 'approved':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Access Granted
                </p>
                <p className="text-xs text-green-600">
                  Expires: {status.expiresAt.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Request Pending
                </p>
                <p className="text-xs text-yellow-600">
                  Requested: {new Date(status.request.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Error checking status
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
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
                  
                  {/* Status Display */}
                  {renderResourceStatus('patient_record', `patient-${user?.username}`, `Patient ${user?.username} Medical Record`)}
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Example:</strong> Patient ID: patient-{user?.username}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Access:</strong> Read/Write
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Duration:</strong> 2-8 hours
                    </div>
                  </div>
                  
                  {getResourceStatus('patient_record', `patient-${user?.username}`).status === 'none' && (
                    <button
                      onClick={() => handleRequestAccess('patient_record', `patient-${user?.username}`, `Patient ${user?.username} Medical Record`)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Request Access
                    </button>
                  )}
                  
                  {getResourceStatus('patient_record', `patient-${user?.username}`).status === 'pending' && (
                    <button
                      onClick={checkResourceStatuses}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Check Status
                    </button>
                  )}
                  
                  {getResourceStatus('patient_record', `patient-${user?.username}`).status === 'approved' && (
                    <button
                      onClick={checkResourceStatuses}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Refresh Status
                    </button>
                  )}
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
                  
                  {/* Status Display */}
                  {renderResourceStatus('prescription', `prescriptions-${user?.username}`, `Prescriptions for ${user?.username}`)}
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Example:</strong> Prescription ID: prescriptions-{user?.username}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Access:</strong> Read/Write
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Duration:</strong> 1-4 hours
                    </div>
                  </div>
                  
                  {getResourceStatus('prescription', `prescriptions-${user?.username}`).status === 'none' && (
                    <button
                      onClick={() => handleRequestAccess('prescription', `prescriptions-${user?.username}`, `Prescriptions for ${user?.username}`)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Request Access
                    </button>
                  )}
                  
                  {getResourceStatus('prescription', `prescriptions-${user?.username}`).status === 'pending' && (
                    <button
                      onClick={checkResourceStatuses}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Check Status
                    </button>
                  )}
                  
                  {getResourceStatus('prescription', `prescriptions-${user?.username}`).status === 'approved' && (
                    <button
                      onClick={checkResourceStatuses}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Refresh Status
                    </button>
                  )}
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
                  
                  {/* Status Display */}
                  {renderResourceStatus('lab_results', `lab-${user?.username}`, `Lab Results for ${user?.username}`)}
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Example:</strong> Lab ID: lab-{user?.username}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Access:</strong> Read Only
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Duration:</strong> 1-2 hours
                    </div>
                  </div>
                  
                  {getResourceStatus('lab_results', `lab-${user?.username}`).status === 'none' && (
                    <button
                      onClick={() => handleRequestAccess('lab_results', `lab-${user?.username}`, `Lab Results for ${user?.username}`)}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Request Access
                    </button>
                  )}
                  
                  {getResourceStatus('lab_results', `lab-${user?.username}`).status === 'pending' && (
                    <button
                      onClick={checkResourceStatuses}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Check Status
                    </button>
                  )}
                  
                  {getResourceStatus('lab_results', `lab-${user?.username}`).status === 'approved' && (
                    <button
                      onClick={checkResourceStatuses}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Refresh Status
                    </button>
                  )}
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
