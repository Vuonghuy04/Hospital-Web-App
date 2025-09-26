import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  RefreshCw, 
  Brain, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Shield,
  Database,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface MLServiceStatus {
  mlService: {
    available: boolean;
    trained: boolean;
    error: string | null;
  };
  statistics: {
    totalRecords: number;
    avgRiskScore: number;
    riskDistribution: {
      low: number;
      medium: number;
      high: number;
    };
    mlPredictions: number;
    lastUpdate: string | null;
  };
}

interface HighRiskUser {
  username: string;
  userId: string;
  avgRiskScore: number;
  maxRiskScore: number;
  activityCount: number;
  highRiskActions: number;
  lastActivity: string;
  riskLevel: string;
}

interface RiskAnalytics {
  timeSeries: Array<{
    date: string;
    avgRiskScore: number;
    totalEvents: number;
    highRiskEvents: number;
  }>;
  actionRisk: Array<{
    action: string;
    avgRiskScore: number;
    frequency: number;
    highRiskCount: number;
  }>;
  overallStats: {
    totalEvents: number;
    avgRiskScore: number;
    uniqueUsers: number;
    riskDistribution: {
      low: number;
      medium: number;
      high: number;
    };
    mlPredictions: number;
  };
}

const MLRiskDashboard: React.FC = () => {
  const [status, setStatus] = useState<MLServiceStatus | null>(null);
  const [highRiskUsers, setHighRiskUsers] = useState<HighRiskUser[]>([]);
  const [analytics, setAnalytics] = useState<RiskAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the same API base URL pattern as other components
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml-risk/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        throw new Error('Failed to fetch ML service status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchHighRiskUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml-risk/high-risk-users?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setHighRiskUsers(data.highRiskUsers);
      }
    } catch (err) {
      console.error('Error fetching high risk users:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml-risk/analytics?days=7`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const updateAllRiskScores = async () => {
    setUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml-risk/update-all`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully updated risk scores for ${data.statistics.updated} records!`);
        await fetchStatus();
        await fetchHighRiskUsers();
        await fetchAnalytics();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const trainModel = async () => {
    setTraining(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml-risk/train`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Model trained successfully!');
        await fetchStatus();
      } else {
        throw new Error(data.error || 'Training failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchStatus(),
        fetchHighRiskUsers(),
        fetchAnalytics()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'text-red-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading && !status) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading ML Risk Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ML Risk Assessment Dashboard</h1>
          <p className="text-gray-600">AI-powered risk scoring and behavior analysis</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={refreshData}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {status?.mlService.trained && (
            <Button
              onClick={updateAllRiskScores}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Brain className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
              Update All Risk Scores
            </Button>
          )}
          {!status?.mlService.trained && (
            <Button
              onClick={trainModel}
              disabled={training}
              className="bg-green-600 hover:bg-green-700"
            >
              <Brain className={`h-4 w-4 mr-2 ${training ? 'animate-spin' : ''}`} />
              Train Model
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* ML Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML Service</CardTitle>
            {status?.mlService.available ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.mlService.available ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-gray-600">
              Model: {status?.mlService.trained ? 'Trained' : 'Not Trained'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.statistics.totalRecords.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-600">
              ML Predictions: {status?.statistics.mlPredictions || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(status?.statistics.avgRiskScore || 0)}`}>
              {(status?.statistics.avgRiskScore || 0).toFixed(3)}
            </div>
            <p className="text-xs text-gray-600">
              Last 7 days average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {status?.statistics.riskDistribution.high || 0}
            </div>
            <p className="text-xs text-gray-600">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Current risk level distribution across all records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Low Risk</Badge>
                  <span className="text-sm text-gray-600">
                    {status.statistics.riskDistribution.low} records
                  </span>
                </div>
                <div className="w-32">
                  <Progress 
                    value={(status.statistics.riskDistribution.low / status.statistics.totalRecords) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Medium Risk</Badge>
                  <span className="text-sm text-gray-600">
                    {status.statistics.riskDistribution.medium} records
                  </span>
                </div>
                <div className="w-32">
                  <Progress 
                    value={(status.statistics.riskDistribution.medium / status.statistics.totalRecords) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive">High Risk</Badge>
                  <span className="text-sm text-gray-600">
                    {status.statistics.riskDistribution.high} records
                  </span>
                </div>
                <div className="w-32">
                  <Progress 
                    value={(status.statistics.riskDistribution.high / status.statistics.totalRecords) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">High Risk Users</TabsTrigger>
          <TabsTrigger value="analytics">Risk Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                High Risk Users
              </CardTitle>
              <CardDescription>
                Users with elevated risk scores requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {highRiskUsers.length > 0 ? (
                <div className="space-y-4">
                  {highRiskUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">{user.username}</div>
                        <div className="text-sm text-gray-600">
                          ID: {user.userId} • {user.activityCount} activities
                        </div>
                        <div className="text-xs text-gray-500">
                          Last activity: {new Date(user.lastActivity).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getRiskColor(user.avgRiskScore)}`}>
                            {user.avgRiskScore.toFixed(3)}
                          </div>
                          <div className="text-xs text-gray-600">
                            Max: {user.maxRiskScore.toFixed(3)}
                          </div>
                        </div>
                        
                        <Badge variant={getRiskBadgeVariant(user.riskLevel)}>
                          {user.riskLevel}
                        </Badge>
                        
                        {user.highRiskActions > 0 && (
                          <div className="text-center">
                            <div className="text-sm font-semibold text-red-600">
                              {user.highRiskActions}
                            </div>
                            <div className="text-xs text-gray-600">
                              high risk
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No high-risk users detected</p>
                  <p className="text-sm">All users are operating within normal risk parameters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Risk Analytics Overview</CardTitle>
                  <CardDescription>Last 7 days risk analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analytics.overallStats.totalEvents.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analytics.overallStats.uniqueUsers}</div>
                      <div className="text-sm text-gray-600">Unique Users</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getRiskColor(analytics.overallStats.avgRiskScore)}`}>
                        {analytics.overallStats.avgRiskScore.toFixed(3)}
                      </div>
                      <div className="text-sm text-gray-600">Avg Risk Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analytics.overallStats.mlPredictions}</div>
                      <div className="text-sm text-gray-600">ML Predictions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Risky Actions</CardTitle>
                  <CardDescription>Actions with highest average risk scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.actionRisk.slice(0, 10).map((action, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{action.action}</div>
                          <div className="text-sm text-gray-600">
                            {action.frequency} occurrences • {action.highRiskCount} high risk
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${getRiskColor(action.avgRiskScore)}`}>
                          {action.avgRiskScore.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {status?.statistics.lastUpdate && (
        <div className="flex items-center justify-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          Last updated: {new Date(status.statistics.lastUpdate).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default MLRiskDashboard;
