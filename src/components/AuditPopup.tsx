import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Download, Trash2, Search, Clock } from 'lucide-react';
import { fetchAuditEvents, subscribeToAuditUpdates, fetchAuditMetrics, AuditEvent } from '../services/auditService';

// Remove duplicate interface since it's imported from auditService

interface AuditPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditPopup: React.FC<AuditPopupProps> = ({ isOpen, onClose }) => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    pendingML: 0,
    lowMediumRisk: 0,
    highRisk: 0
  });

  // Fetch real-time audit data
  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [eventsResult, metricsResult] = await Promise.all([
        fetchAuditEvents({}, 1, 100),
        fetchAuditMetrics()
      ]);
      
      setAuditEvents(eventsResult.events);
      setMetrics(metricsResult);
    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription when popup opens
  useEffect(() => {
    if (isOpen) {
      loadAuditData();
      
      // Subscribe to real-time updates every 15 seconds
      const unsubscribe = subscribeToAuditUpdates((events) => {
        setAuditEvents(events);
      }, 15000);
      
      return unsubscribe;
    }
  }, [isOpen]);

  const handleRefresh = () => {
    loadAuditData();
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(auditEvents, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all audit data?')) {
      setAuditEvents([]);
    }
  };

  const filteredEvents = auditEvents.filter(event => 
    event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">User Behavior Analytics</h2>
              <p className="text-purple-100 text-sm">Data for ML Anomaly Detection Model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.totalEvents}</div>
              <div className="text-gray-600 text-sm">Total Events</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{metrics.pendingML}</div>
              <div className="text-gray-600 text-sm">Pending ML</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{metrics.lowMediumRisk}</div>
              <div className="text-gray-600 text-sm">Low-Medium Risk</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{metrics.highRisk}</div>
              <div className="text-gray-600 text-sm">High Risk</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleClearData}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Data</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event, index) => (
                <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900">{event.timestamp}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{event.user}</div>
                    <div className="text-gray-500 text-xs">{event.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {event.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{event.ipAddress}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-pre-line">{event.session}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center w-2 h-2 rounded-full ${
                      event.risk === 'High Risk' ? 'bg-red-500' :
                      event.risk === 'Medium Risk' ? 'bg-yellow-500' :
                      event.risk === 'Low Risk' ? 'bg-green-500' :
                      'bg-gray-400'
                    }`}></span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{event.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditPopup;
