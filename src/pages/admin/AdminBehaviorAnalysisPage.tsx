import React, { useState, useEffect } from 'react';
import AdminOnlyPage from '../../components/AdminOnlyPage';
import AdminNavigation from '../../components/AdminNavigation';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Users,
  Activity,
  Shield,
  BarChart3,
  Zap
} from 'lucide-react';

interface BehaviorPattern {
  id: string;
  userId: string;
  username: string;
  pattern: string;
  confidence: number;
  riskScore: number;
  anomalyType: 'time_pattern' | 'access_pattern' | 'location_pattern' | 'behavior_change';
  description: string;
  detectedAt: string;
  status: 'monitoring' | 'investigating' | 'resolved';
}

const AdminBehaviorAnalysisPage = () => {
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  useEffect(() => {
    const generateMockPatterns = (): BehaviorPattern[] => {
      const users = ['dr.johnson', 'nurse.smith', 'dr.wilson', 'nurse.davis', 'admin'];
      const anomalyTypes: ('time_pattern' | 'access_pattern' | 'location_pattern' | 'behavior_change')[] = 
        ['time_pattern', 'access_pattern', 'location_pattern', 'behavior_change'];
      const statuses: ('monitoring' | 'investigating' | 'resolved')[] = ['monitoring', 'investigating', 'resolved'];

      return Array.from({ length: 20 }, (_, i) => ({
        id: `pattern-${i}`,
        userId: `user-${i}`,
        username: users[Math.floor(Math.random() * users.length)],
        pattern: `Unusual ${anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)].replace('_', ' ')}`,
        confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
        riskScore: Math.floor(Math.random() * 100),
        anomalyType: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
        description: [
          'User accessing systems outside normal hours',
          'Unusual access pattern to patient records',
          'Login from new geographic location',
          'Significant change in daily activity volume',
          'Accessing resources not typically used',
          'Multiple failed authentication attempts'
        ][Math.floor(Math.random() * 6)],
        detectedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      }));
    };

    setLoading(true);
    setTimeout(() => {
      setPatterns(generateMockPatterns());
      setLoading(false);
    }, 1000);
  }, [selectedTimeframe]);

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'time_pattern': return <Activity className="h-4 w-4" />;
      case 'access_pattern': return <Shield className="h-4 w-4" />;
      case 'location_pattern': return <Users className="h-4 w-4" />;
      case 'behavior_change': return <TrendingUp className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      monitoring: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      investigating: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      resolved: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`;
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return 'text-red-400';
    if (riskScore >= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  const highRiskPatterns = patterns.filter(p => p.riskScore >= 70);
  const activeInvestigations = patterns.filter(p => p.status === 'investigating');

  return (
    <AdminOnlyPage 
      title="Behavior Analysis" 
      description="AI-powered behavioral pattern analysis and anomaly detection"
      requiredRole="admin"
    >
      <AdminNavigation />
      
      <div className="space-y-6">
        {/* Analysis Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Patterns Detected</h3>
              <Brain className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">{patterns.length}</div>
            <p className="text-xs text-purple-300 mt-1">Last 24 hours</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">High Risk</h3>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">{highRiskPatterns.length}</div>
            <p className="text-xs text-purple-300 mt-1">Requires attention</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Investigating</h3>
              <Shield className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">{activeInvestigations.length}</div>
            <p className="text-xs text-purple-300 mt-1">Active cases</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">ML Confidence</h3>
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {Math.round(patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length || 0)}%
            </div>
            <p className="text-xs text-purple-300 mt-1">Average accuracy</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Behavioral Analysis Dashboard</h2>
              <p className="text-purple-200 text-sm">AI-powered detection of unusual user behavior patterns</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Behavior Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pattern Analysis Chart */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
              Pattern Distribution
            </h3>
            
            <div className="space-y-4">
              {['time_pattern', 'access_pattern', 'location_pattern', 'behavior_change'].map((type) => {
                const count = patterns.filter(p => p.anomalyType === type).length;
                const percentage = patterns.length > 0 ? (count / patterns.length) * 100 : 0;
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white capitalize flex items-center">
                        {getAnomalyIcon(type)}
                        <span className="ml-2">{type.replace('_', ' ')}</span>
                      </span>
                      <span className="text-sm text-purple-300">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent High-Risk Patterns */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
              High-Risk Patterns
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {highRiskPatterns.slice(0, 5).map((pattern) => (
                <div key={pattern.id} className="bg-white/5 rounded-lg p-3 border border-red-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {getAnomalyIcon(pattern.anomalyType)}
                      <span className="text-sm font-medium text-white">{pattern.username}</span>
                    </div>
                    <span className={`text-sm font-bold ${getRiskColor(pattern.riskScore)}`}>
                      {pattern.riskScore}%
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 mb-2">{pattern.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={getStatusBadge(pattern.status)}>
                      {pattern.status}
                    </span>
                    <span className="text-xs text-purple-300">
                      {new Date(pattern.detectedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {highRiskPatterns.length === 0 && (
                <div className="text-center py-8 text-purple-300">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No high-risk patterns detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Patterns Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Detected Behavioral Patterns</h2>
            <p className="text-purple-200 text-sm mt-1">
              AI-powered analysis of user behavior anomalies
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Pattern Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="animate-pulse bg-white/20 h-4 rounded"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : patterns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-purple-300">
                      No behavioral patterns detected
                    </td>
                  </tr>
                ) : (
                  patterns.map((pattern) => (
                    <tr key={pattern.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {pattern.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        <div className="flex items-center space-x-2">
                          {getAnomalyIcon(pattern.anomalyType)}
                          <span className="capitalize">{pattern.anomalyType.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {pattern.description}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-white/20 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                pattern.riskScore >= 80 ? 'bg-red-500' :
                                pattern.riskScore >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${pattern.riskScore}%` }}
                            />
                          </div>
                          <span className={`font-medium ${getRiskColor(pattern.riskScore)}`}>
                            {pattern.riskScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-400 font-medium">
                        {pattern.confidence}%
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={getStatusBadge(pattern.status)}>
                          {pattern.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-300">
                        {new Date(pattern.detectedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminOnlyPage>
  );
};

export default AdminBehaviorAnalysisPage;
