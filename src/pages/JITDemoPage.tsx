import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/MockAuthContext';
import { runDemoScenarios, DEMO_SCENARIOS } from '../services/policyEnforcement';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  User,
  FileText,
  Lock
} from 'lucide-react';

interface DemoResult {
  name: string;
  userRole: string;
  resourceType: string;
  action: string;
  expectedResult: string;
  actualResult: string;
  violationCreated: boolean;
  message: string;
  description: string;
}

const JITDemoPage: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<DemoResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const runDemo = async () => {
    if (!user) return;
    
    setIsRunning(true);
    setCompleted(false);
    
    try {
      const demoResults = await runDemoScenarios(user.username, user.username);
      setResults(demoResults);
      setCompleted(true);
    } catch (error) {
      console.error('Demo failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getResultIcon = (expected: string, actual: string) => {
    if (expected === actual) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getResultBadge = (expected: string, actual: string) => {
    if (expected === actual) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'patient_record':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'prescription':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'finance':
        return <Lock className="h-4 w-4 text-red-500" />;
      case 'lab_results':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
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

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-purple-100 text-purple-800 border-purple-200',
      doctor: 'bg-blue-100 text-blue-800 border-blue-200',
      nurse: 'bg-green-100 text-green-800 border-green-200',
      accountant: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[role as keyof typeof colors] || colors.user}`;
  };

  const getExpectedResultBadge = (result: string) => {
    const colors = {
      allowed: 'bg-green-100 text-green-800 border-green-200',
      denied: 'bg-red-100 text-red-800 border-red-200',
      requires_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[result as keyof typeof colors]}`;
  };

  const passedTests = results.filter(r => r.expectedResult === r.actualResult).length;
  const totalTests = results.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <a href="/jit-request" className="text-blue-600 hover:text-blue-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">JIT Access Control Demo</h1>
                <p className="text-gray-600">Test policy enforcement and access control scenarios</p>
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
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">JIT Access Control Demo</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This demo tests various access control scenarios to verify that the JIT system properly enforces security policies. Each scenario will attempt access and show whether it's allowed, denied, or requires approval.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Run Demo Scenarios</h2>
              <p className="text-sm text-gray-600">
                Test {DEMO_SCENARIOS.length} different access control scenarios
              </p>
            </div>
            <button
              onClick={runDemo}
              disabled={isRunning}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Running Demo...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Run Demo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {completed && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Demo Results</h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">{passedTests}</span> of <span className="font-medium">{totalTests}</span> tests passed
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  passedTests === totalTests 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {passedTests === totalTests ? 'All Tests Passed' : 'Some Tests Failed'}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(passedTests / totalTests) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Demo Scenarios */}
        <div className="space-y-4">
          {DEMO_SCENARIOS.map((scenario, index) => {
            const result = results.find(r => r.name === scenario.name);
            const isPassed = result && result.expectedResult === result.actualResult;
            
            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-sm border p-6 ${
                  result ? (isPassed ? 'border-green-200' : 'border-red-200') : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {result ? getResultIcon(scenario.expectedResult, result.actualResult) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {scenario.name}
                        </h3>
                        {result && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getResultBadge(scenario.expectedResult, result.actualResult)}`}>
                            {isPassed ? 'PASSED' : 'FAILED'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span className={getRoleBadge(scenario.userRole)}>
                            {scenario.userRole}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getResourceIcon(scenario.resourceType)}
                          <span>{getResourceTypeLabel(scenario.resourceType)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-4 w-4" />
                          <span>{scenario.action}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {scenario.description}
                      </p>
                      
                      {result && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Expected:</span>
                              <span className={`ml-2 ${getExpectedResultBadge(scenario.expectedResult)}`}>
                                {scenario.expectedResult.replace('_', ' ')}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Actual:</span>
                              <span className={`ml-2 ${getExpectedResultBadge(result.actualResult)}`}>
                                {result.actualResult.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Message:</span> {result.message}
                          </div>
                          
                          {result.violationCreated && (
                            <div className="flex items-center space-x-1 text-sm text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Policy violation created</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Demo Instructions</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Click "Run Demo" to test all access control scenarios</li>
                  <li>Each scenario will attempt access based on the user role and resource type</li>
                  <li>Green checkmarks indicate scenarios that behaved as expected</li>
                  <li>Red X marks indicate scenarios that didn't behave as expected</li>
                  <li>Policy violations are automatically created for denied access attempts</li>
                  <li>Check the "Policy Violations" tab in the admin dashboard to see created violations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JITDemoPage;
