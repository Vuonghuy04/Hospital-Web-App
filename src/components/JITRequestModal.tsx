import React, { useState } from 'react';
import { useAuth } from '../contexts/MockAuthContext';
import { X, Shield, AlertTriangle, Clock, User, FileText, Lock } from 'lucide-react';

interface JITRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  onRequestSubmitted: (request: any) => void;
}

const JITRequestModal: React.FC<JITRequestModalProps> = ({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceName,
  onRequestSubmitted
}) => {
  const { user } = useAuth();
  const [accessLevel, setAccessLevel] = useState('read');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for access');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5002/api/jit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceType,
          resourceId,
          accessLevel,
          reason: reason.trim(),
          requesterId: user?.username || 'unknown',
          requesterUsername: user?.username || 'unknown',
          requesterRole: user?.roles?.[0] || 'user'
        }),
      });

      const data = await response.json();

      if (data.success) {
        onRequestSubmitted(data.data);
        onClose();
        setReason('');
        setAccessLevel('read');
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'patient_record':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'prescription':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'finance':
        return <Lock className="h-5 w-5 text-red-500" />;
      case 'lab_results':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'patient_record':
        return 'Patient Record';
      case 'prescription':
        return 'Prescription';
      case 'finance':
        return 'Financial Data';
      case 'lab_results':
        return 'Lab Results';
      default:
        return 'Resource';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getResourceIcon(resourceType)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Request Access to {getResourceTypeLabel(resourceType)}
              </h2>
              <p className="text-sm text-gray-600">{resourceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Access Level Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Access Level Required
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                accessLevel === 'read' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="access-level"
                  value="read"
                  checked={accessLevel === 'read'}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    accessLevel === 'read' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {accessLevel === 'read' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Read Only</div>
                    <div className="text-xs text-gray-500">View information only</div>
                  </div>
                </div>
              </label>

              <label className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                accessLevel === 'write' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="access-level"
                  value="write"
                  checked={accessLevel === 'write'}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    accessLevel === 'write' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {accessLevel === 'write' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Read & Write</div>
                    <div className="text-xs text-gray-500">View and modify information</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Access Duration
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '1', label: '1 Hour', desc: 'Quick access' },
                { value: '2', label: '2 Hours', desc: 'Standard' },
                { value: '8', label: '8 Hours', desc: 'Extended' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                    duration === option.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={option.value}
                    checked={duration === option.value}
                    onChange={(e) => setDuration(e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-center w-full">
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reason for Access */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Access *
            </label>
            <textarea
              id="reason"
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Please provide a detailed explanation of why you need access to this resource..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Requesting as: {user?.username || 'Unknown User'}
                </div>
                <div className="text-xs text-gray-500">
                  Role: {user?.roles?.[0] || 'User'} • Duration: {duration} hour{duration !== '1' ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting || !reason.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JITRequestModal;
