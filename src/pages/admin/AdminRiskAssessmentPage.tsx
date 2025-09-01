import React, { useState, useEffect } from 'react';
import AdminOnlyPage from '../../components/AdminOnlyPage';
import AdminNavigation from '../../components/AdminNavigation';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  Activity,
  Clock,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';

interface RiskAssessment {
  id: string;
  userId: string;
  username: string;
  overallRiskScore: number;
  riskFactors: {
    timeBasedRisk: number;
    accessPatternRisk: number;
    locationRisk: number;
    behaviorRisk: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAssessment: string;
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    change: number;
  };
  recommendations: string[];
}

const AdminRiskAssessmentPage = () => {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('all');

  useEffect(() => {
    const generateMockAssessments = (): RiskAssessment[] => {
      const users = ['dr.johnson', 'nurse.smith', 'dr.wilson', 'nurse.davis', 'admin', 'dr.brown', 'nurse.wilson'];
      const riskLevels: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
      const trends: ('increasing' | 'decreasing' | 'stable')[] = ['increasing', 'decreasing', 'stable'];

      return users.map((username, i) => {
        const overallRisk = Math.floor(Math.random() * 100);
        const riskLevel = overallRisk >= 85 ? 'critical' : 
                         overallRisk >= 70 ? 'high' : 
                         overallRisk >= 40 ? 'medium' : 'low';

        return {
          id: `assessment-${i}`,
          userId: `user-${i}`,
          username,
          overallRiskScore: overallRisk,
          riskFactors: {
            timeBasedRisk: Math.floor(Math.random() * 100),
            accessPatternRisk: Math.floor(Math.random() * 100),
            locationRisk: Math.floor(Math.random() * 100),
            behaviorRisk: Math.floor(Math.random() * 100),
          },
          riskLevel,
          lastAssessment: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          trends: {
            direction: trends[Math.floor(Math.random() * trends.length)],
            change: Math.floor(Math.random() * 20) - 10 // -10 to +10
          },
          recommendations: [
            'Review access permissions',
            'Monitor login patterns',
            'Implement additional authentication',
            'Restrict access hours',
            'Enable location-based alerts'
          ].slice(0, Math.floor(Math.random() * 3) + 1)
        };
      });
    };

    setLoading(true);
    setTimeout(() => {
      setAssessments(generateMockAssessments());
      setLoading(false);
    }, 1000);
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'low': return 'text-green-400 bg-green-400/20 border-green-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-400" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-green-400 transform rotate-180" />;
      case 'stable': return <Activity className="h-4 w-4 text-yellow-400" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredAssessments = selectedUser === 'all' 
    ? assessments 
    : assessments.filter(a => a.username === selectedUser);

  const criticalUsers = assessments.filter(a => a.riskLevel === 'critical').length;
  const highRiskUsers = assessments.filter(a => a.riskLevel === 'high').length;
  const averageRisk = Math.round(assessments.reduce((acc, a) => acc + a.overallRiskScore, 0) / assessments.length || 0);

  return (
    <AdminOnlyPage 
      title="Risk Assessment" 
      description="Comprehensive security risk evaluation and monitoring"
      requiredRole="admin"
    >
      <AdminNavigation />
      
      <div className="space-y-6">
        {/* Risk Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Average Risk</h3>
              <Target className="h-4 w-4 text-purple-300" />
            </div>
            <div className="text-2xl font-bold text-white">{averageRisk}%</div>
            <p className="text-xs text-purple-300 mt-1">System wide</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Critical Risk</h3>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">{criticalUsers}</div>
            <p className="text-xs text-purple-300 mt-1">Immediate attention</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">High Risk</h3>
              <Shield className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">{highRiskUsers}</div>
            <p className="text-xs text-purple-300 mt-1">Monitor closely</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-200">Total Users</h3>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">{assessments.length}</div>
            <p className="text-xs text-purple-300 mt-1">Under assessment</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Risk Assessment Dashboard</h2>
              <p className="text-purple-200 text-sm">Comprehensive security risk evaluation for all hospital users</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                {assessments.map(assessment => (
                  <option key={assessment.username} value={assessment.username}>
                    {assessment.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
              Risk Level Distribution
            </h3>
            
            <div className="space-y-4">
              {['low', 'medium', 'high', 'critical'].map((level) => {
                const count = assessments.filter(a => a.riskLevel === level).length;
                const percentage = assessments.length > 0 ? (count / assessments.length) * 100 : 0;
                
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white capitalize flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        {level} Risk
                      </span>
                      <span className="text-sm text-purple-300">{count} users ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          level === 'critical' ? 'bg-red-500' :
                          level === 'high' ? 'bg-red-400' :
                          level === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Risk Factors */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              Top Risk Factors
            </h3>
            
            <div className="space-y-4">
              {['timeBasedRisk', 'accessPatternRisk', 'locationRisk', 'behaviorRisk'].map((factor) => {
                const averageFactor = Math.round(
                  assessments.reduce((acc, a) => acc + a.riskFactors[factor as keyof typeof a.riskFactors], 0) / assessments.length || 0
                );
                
                return (
                  <div key={factor} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white capitalize">
                        {factor.replace('Risk', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm text-purple-300">{averageFactor}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          averageFactor >= 70 ? 'bg-red-500' :
                          averageFactor >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${averageFactor}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Risk Assessment Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">User Risk Assessments</h2>
            <p className="text-purple-200 text-sm mt-1">
              Showing {filteredAssessments.length} of {assessments.length} users
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Overall Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Trend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Time Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Access Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Location Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Behavior Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Last Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="animate-pulse bg-white/20 h-4 rounded"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-purple-300">
                      No risk assessments found
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {assessment.username}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(assessment.riskLevel)}`}>
                          {assessment.riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-white/20 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                assessment.overallRiskScore >= 85 ? 'bg-red-500' :
                                assessment.overallRiskScore >= 70 ? 'bg-red-400' :
                                assessment.overallRiskScore >= 40 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${assessment.overallRiskScore}%` }}
                            />
                          </div>
                          <span className="text-white font-medium">{assessment.overallRiskScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(assessment.trends.direction)}
                          <span className={`text-xs ${
                            assessment.trends.direction === 'increasing' ? 'text-red-400' :
                            assessment.trends.direction === 'decreasing' ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {assessment.trends.change > 0 ? '+' : ''}{assessment.trends.change}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {assessment.riskFactors.timeBasedRisk}%
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {assessment.riskFactors.accessPatternRisk}%
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {assessment.riskFactors.locationRisk}%
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {assessment.riskFactors.behaviorRisk}%
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-300">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(assessment.lastAssessment).toLocaleString()}</span>
                        </div>
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

export default AdminRiskAssessmentPage;
