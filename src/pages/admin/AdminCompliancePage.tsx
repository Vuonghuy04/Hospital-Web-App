import React, { useState, useEffect } from 'react';
import AdminNavigation from '../../components/AdminNavigation';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  Download,
  Filter,
  Search,
  Eye,
  XCircle
} from 'lucide-react';
import complianceService from '../../services/complianceService';
import { ComplianceRule, ComplianceViolation, ComplianceMetrics, ComplianceReport } from '../../types/compliance';

const AdminCompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    category: ''
  });
  const [reportData, setReportData] = useState<ComplianceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      const [rulesData, violationsData, metricsData] = await Promise.all([
        complianceService.getComplianceRules(),
        complianceService.getComplianceViolations(),
        complianceService.getComplianceMetrics()
      ]);
      
      setRules(rulesData);
      setViolations(violationsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViolationStatusUpdate = async (violationId: number, status: string) => {
    try {
      await complianceService.updateViolationStatus(violationId.toString(), status, 'admin');
      setViolations(prev => prev.map(v => 
        v.id === violationId 
          ? { ...v, status: status as any, resolved_at: status === 'resolved' ? new Date().toISOString() : undefined }
          : v
      ));
    } catch (error) {
      console.error('Error updating violation status:', error);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const report = await complianceService.generateComplianceReport({
        start: reportPeriod.start,
        end: reportPeriod.end
      });
      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportData) return;
    
    const reportContent = `
COMPLIANCE REPORT
================
Title: ${reportData.title}
Period: ${reportData.period.start} to ${reportData.period.end}
Generated: ${new Date(reportData.generatedAt).toLocaleString()}

SUMMARY
=======
Total Violations: ${reportData.summary.totalViolations}
Critical: ${reportData.summary.criticalViolations}
High: ${reportData.summary.highViolations}
Medium: ${reportData.summary.mediumViolations}
Low: ${reportData.summary.lowViolations}
Resolved: ${reportData.summary.resolvedViolations}
Open: ${reportData.summary.openViolations}

CATEGORIES
==========
${Object.entries(reportData.categories).map(([category, data]) => 
  `${category}: ${data.violations} violations (${data.resolved} resolved, ${data.open} open)`
).join('\n')}

TOP VIOLATORS
=============
${reportData.topViolators.map((violator, index) => 
  `${index + 1}. ${violator.username} (${violator.role}): ${violator.violations} violations`
).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${reportData.period.start}-to-${reportData.period.end}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-100 border-green-200';
      case 'acknowledged': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'open': return 'text-red-600 bg-red-100 border-red-200';
      case 'false_positive': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const filteredViolations = violations.filter(violation => {
    if (filters.status && violation.status !== filters.status) return false;
    if (filters.severity && violation.severity !== filters.severity) return false;
    if (filters.category) {
      const rule = rules.find(r => r.id === violation.ruleId);
      if (!rule || rule.category !== filters.category) return false;
    }
    return true;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'violations', label: 'Violations', icon: AlertTriangle },
    { id: 'rules', label: 'Rules', icon: Shield },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading compliance data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <a href="/admin" className="text-blue-600 hover:text-blue-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Compliance Reporting</h1>
                <p className="text-gray-600">Monitor and manage compliance violations and rules</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Manager Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            {/* Compliance Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
                  <Shield className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.overallScore}/100</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.overallScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.securityScore}/100</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.securityScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>
                  <Eye className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.privacyScore}/100</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.privacyScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Violations */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Violations</h3>
              <div className="space-y-3">
                {violations.slice(0, 5).map((violation) => (
                  <div key={violation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        violation.severity === 'critical' ? 'bg-red-500' :
                        violation.severity === 'high' ? 'bg-orange-500' :
                        violation.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{violation.description}</p>
                        <p className="text-xs text-gray-500">{violation.username} • {new Date(violation.detectedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(violation.severity)}`}>
                      {violation.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
              <div className="space-y-2">
                {metrics.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === 'violations' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="security">Security</option>
                    <option value="privacy">Privacy</option>
                    <option value="access">Access</option>
                    <option value="data">Data</option>
                    <option value="audit">Audit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Violations List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredViolations.map((violation) => (
                      <tr key={violation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{violation.violation_type}</p>
                            <p className="text-xs text-gray-500">{violation.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-gray-900">{violation.username}</p>
                            <p className="text-xs text-gray-500">{violation.user_role}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(violation.severity)}`}>
                            {violation.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(violation.status)}`}>
                            {violation.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(violation.detected_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {violation.status === 'open' && (
                              <button
                                onClick={() => handleViolationStatusUpdate(violation.id, 'acknowledged')}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Acknowledge
                              </button>
                            )}
                            {violation.status !== 'resolved' && (
                              <button
                                onClick={() => handleViolationStatusUpdate(violation.id, 'resolved')}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(rule.severity)}`}>
                      {rule.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{rule.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">{rule.category}</span>
                    <div className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Compliance Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={reportPeriod.start}
                    onChange={(e) => setReportPeriod(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={reportPeriod.end}
                    onChange={(e) => setReportPeriod(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button 
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {reportLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
                {reportData && (
                  <button 
                    onClick={handleDownloadReport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Report</span>
                  </button>
                )}
              </div>
            </div>

            {/* Report Results */}
            {reportData && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{reportData.title}</h3>
                  <div className="text-sm text-gray-500">
                    Generated: {new Date(reportData.generatedAt).toLocaleString()}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{reportData.summary.criticalViolations}</div>
                    <div className="text-sm text-red-600">Critical</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">{reportData.summary.highViolations}</div>
                    <div className="text-sm text-orange-600">High</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">{reportData.summary.mediumViolations}</div>
                    <div className="text-sm text-yellow-600">Medium</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{reportData.summary.lowViolations}</div>
                    <div className="text-sm text-blue-600">Low</div>
                  </div>
                </div>

                {/* Categories Breakdown */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Violations by Category</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(reportData.categories).map(([category, data]) => (
                      <div key={category} className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-medium text-gray-900">{category}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {data.violations} total • {data.resolved} resolved • {data.open} open
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(data.resolved / data.violations) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Violators */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Violators</h4>
                  <div className="space-y-2">
                    {reportData.topViolators.map((violator, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{violator.username}</div>
                            <div className="text-sm text-gray-500">{violator.role}</div>
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{violator.violations}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminCompliancePage;
