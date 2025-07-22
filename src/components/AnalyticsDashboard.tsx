import { useState, useEffect } from 'react';
import { getBehaviorData, clearBehaviorData } from '../services/behaviorTracking';

interface BehaviorData {
  username: string;
  userId: string;
  email: string;
  roles: string[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  action: string;
  sessionId: string;
  sessionPeriod: number;
  riskLevel: string;
  riskScore: number;
  metadata: {
    realm: string;
    clientId: string;
    tokenType: string;
  };
}

const AnalyticsDashboard = () => {
  const [behaviorData, setBehaviorData] = useState<BehaviorData[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const data = getBehaviorData();
    setBehaviorData(data);
  }, [isVisible]);

  const refreshData = () => {
    const data = getBehaviorData();
    setBehaviorData(data);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all behavior data?')) {
      clearBehaviorData();
      setBehaviorData([]);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const exportData = () => {
    const dataStr = JSON.stringify(behaviorData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospital_behavior_data_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm"
      >
        📊 Analytics
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🔍 User Behavior Analytics</h2>
              <p className="text-purple-100">Data for ML Anomaly Detection Model</p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-purple-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{behaviorData.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {behaviorData.filter(d => d.riskLevel === 'low').length}
              </div>
              <div className="text-sm text-gray-600">Low Risk</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {behaviorData.filter(d => d.riskLevel === 'medium').length}
              </div>
              <div className="text-sm text-gray-600">Medium Risk</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {behaviorData.filter(d => d.riskLevel === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Risk</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={refreshData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              📥 Export JSON
            </button>
            <button
              onClick={handleClearData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🗑️ Clear Data
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto max-h-96">
          {behaviorData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">No behavior data yet</h3>
              <p>Start using the application to collect data for ML analysis</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {behaviorData
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatTimestamp(item.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{item.username}</div>
                        <div className="text-xs text-gray-500">{item.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {item.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.ipAddress}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div>{item.sessionPeriod}m</div>
                        <div className="text-xs">{item.sessionId.slice(-8)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(item.riskLevel)}`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                item.riskScore > 0.7 ? 'bg-red-500' : 
                                item.riskScore > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${item.riskScore * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{item.riskScore}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 