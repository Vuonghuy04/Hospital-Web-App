import { useState, useEffect } from 'react';
import { sendJITRequest } from '../services/api';
import { trackPageView, trackJITRequest } from '../services/behaviorTracking';

const JITRequestPage = () => {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [accessLevel, setAccessLevel] = useState('read');

  useEffect(() => {
    trackPageView('jit_request');
  }, []);

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      const res = await sendJITRequest();
      setStatus(res.status || 'requested');
      
      // Track JIT request submission
      await trackJITRequest(accessLevel);
    } catch (error) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <h1 className="text-2xl font-bold text-gray-900">Just-In-Time Access Request</h1>
            </div>
            <div className="text-sm text-gray-500">
              Secure access management
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About Just-In-Time Access</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Just-In-Time (JIT) access provides temporary permissions to view patient records when you don't have regular access. Requests are automatically approved for authorized personnel and logged for audit purposes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Access Request Form</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Access Level Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Access Level Required
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none">
                  <input
                    type="radio"
                    name="access-level"
                    value="read"
                    checked={accessLevel === 'read'}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">Read Only</span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">
                        View patient records and medical history
                      </span>
                    </span>
                  </span>
                  <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${
                    accessLevel === 'read' ? 'border-blue-500' : 'border-transparent'
                  }`} />
                </label>

                <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none">
                  <input
                    type="radio"
                    name="access-level"
                    value="write"
                    checked={accessLevel === 'write'}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">Read & Write</span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">
                        View and update patient information
                      </span>
                    </span>
                  </span>
                  <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${
                    accessLevel === 'write' ? 'border-blue-500' : 'border-transparent'
                  }`} />
                </label>

                <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none">
                  <input
                    type="radio"
                    name="access-level"
                    value="admin"
                    checked={accessLevel === 'admin'}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">Administrative</span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">
                        Full access including system settings
                      </span>
                    </span>
                  </span>
                  <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${
                    accessLevel === 'admin' ? 'border-blue-500' : 'border-transparent'
                  }`} />
                </label>
              </div>
            </div>

            {/* Reason for Access */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Access
              </label>
              <textarea
                id="reason"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Please provide a brief explanation of why you need access to this patient's records..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Duration
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">2 Hours</div>
                  <div className="text-sm text-gray-600">Standard duration</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">8 Hours</div>
                  <div className="text-sm text-gray-600">Extended access</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">24 Hours</div>
                  <div className="text-sm text-gray-600">Emergency access</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Your request will be logged for audit purposes
              </div>
              <button
                onClick={handleRequest}
                disabled={isLoading || !requestReason.trim()}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                  isLoading || !requestReason.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Display */}
        {status && (
          <div className={`mt-6 p-4 rounded-lg ${
            status === 'error' 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {status === 'error' ? (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  status === 'error' ? 'text-red-800' : 'text-green-800'
                }`}>
                  {status === 'error' ? 'Request Failed' : 'Request Successful'}
                </h3>
                <div className={`mt-2 text-sm ${
                  status === 'error' ? 'text-red-700' : 'text-green-700'
                }`}>
                  {status === 'error' 
                    ? 'There was an error processing your request. Please try again.' 
                    : `Your access request has been approved. You now have ${accessLevel} access for the next 2 hours.`
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JITRequestPage;
