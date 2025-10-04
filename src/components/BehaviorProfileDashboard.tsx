import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  User, 
  Shield, 
  TrendingUp, 
  Clock, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Brain,
  Users,
  Target,
  BarChart3
} from 'lucide-react';
import { behaviorProfiler, BehaviorProfile, BehaviorAnomaly } from '../services/behaviorProfiler';

interface BehaviorProfileDashboardProps {
  userId?: string;
  className?: string;
}

const BehaviorProfileDashboard: React.FC<BehaviorProfileDashboardProps> = ({ 
  userId, 
  className = "" 
}) => {
  const [profile, setProfile] = useState<BehaviorProfile | null>(null);
  const [profileSummary, setProfileSummary] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<BehaviorAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Load profile data
      const profileData = await behaviorProfiler.getProfile(userId);
      const summary = await behaviorProfiler.getProfileSummary(userId);
      const anomalyData = await behaviorProfiler.getAllAnomalies(userId);
      
      setProfile(profileData);
      setProfileSummary(summary);
      setAnomalies(anomalyData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string | number) => {
    if (typeof riskLevel === 'number') {
      if (riskLevel > 0.7) return 'bg-red-500';
      if (riskLevel > 0.4) return 'bg-yellow-500';
      return 'bg-green-500';
    }
    
    switch (riskLevel) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!profile && !profileSummary) {
    return (
      <div className={`${className} text-center py-8`}>
        <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Profile Data</h3>
        <p className="text-gray-500">
          {userId ? 'Profile data is being generated...' : 'Please select a user to view their behavior profile.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Profile Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profileSummary?.riskScore?.toFixed(2) || '0.00'}
            </div>
            <div className="flex items-center mt-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${getRiskLevelColor(profileSummary?.riskScore || 0)}`}></div>
              <p className="text-xs text-muted-foreground">
                {profileSummary?.riskLevel || 'Unknown'} risk level
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((profileSummary?.consistencyScore || 0) * 100)}%
            </div>
            <Progress 
              value={(profileSummary?.consistencyScore || 0) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {profileSummary?.anomalyCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active anomalies detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profileSummary?.sessionDuration || 0}m
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Username:</span>
                  <span className="text-sm">{profile?.username || profileSummary?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Role:</span>
                  <Badge variant="outline">{profile?.role || 'Unknown'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Baseline Status:</span>
                  <div className="flex items-center gap-2">
                    {profile?.baseline.established ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm">
                      {profile?.baseline.established ? 'Established' : 'In Progress'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge className={getRiskLevelColor(profileSummary?.riskScore || 0)}>
                    {profileSummary?.riskLevel || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Peer Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Peer Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Role Consistency</span>
                    <span>{Math.round((profile?.peerAnalysis.consistencyScore || 0) * 100)}%</span>
                  </div>
                  <Progress value={(profile?.peerAnalysis.consistencyScore || 0) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risk Percentile</span>
                    <span>{profile?.peerAnalysis.riskRanking || 50}th</span>
                  </div>
                  <Progress value={profile?.peerAnalysis.riskRanking || 50} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Outlier Score:</span>
                  <span className="text-sm">{(profile?.peerAnalysis.outlierScore || 0).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temporal Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Temporal Patterns
                </CardTitle>
                <CardDescription>Activity patterns by time</CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.baseline.established ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Peak Hours</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.baseline.peakActivityHours.map(hour => (
                          <Badge key={hour} variant="secondary">
                            {hour}:00
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Typical Hours</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.baseline.typicalHours.slice(0, 8).map(hour => (
                          <Badge key={hour} variant="outline">
                            {hour}:00
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Average Session</h4>
                      <p className="text-sm text-muted-foreground">
                        {profile.baseline.averageSessionDuration} minutes
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Collecting data to establish temporal patterns...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Access Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Access Patterns
                </CardTitle>
                <CardDescription>Resource access behavior</CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.patterns.accessPatterns.length ? (
                  <div className="space-y-3">
                    {profile.patterns.accessPatterns.slice(0, 5).map((pattern, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{pattern.resourceType}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {pattern.frequency}x
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getRiskLevelColor(pattern.riskLevel)}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No access patterns established yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <div className="space-y-4">
            {anomalies.length > 0 ? (
              anomalies.map((anomaly, index) => (
                <Alert key={index} className={getSeverityColor(anomaly.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{anomaly.description}</p>
                          <p className="text-xs opacity-75">
                            {formatTime(anomaly.timestamp)} • Confidence: {Math.round(anomaly.confidence * 100)}%
                          </p>
                        </div>
                        <Badge variant="outline" className={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      {anomaly.context && (
                        <details className="text-xs">
                          <summary className="cursor-pointer">Context</summary>
                          <pre className="mt-1 p-2 bg-black/5 rounded text-xs overflow-auto">
                            {JSON.stringify(anomaly.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Anomalies Detected</h3>
                  <p className="text-muted-foreground text-center">
                    User behavior appears normal and consistent with established patterns.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Profile Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Health</span>
                    <Badge 
                      className={
                        (profileSummary?.consistencyScore || 0) > 0.7 ? 'bg-green-500' :
                        (profileSummary?.consistencyScore || 0) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }
                    >
                      {(profileSummary?.consistencyScore || 0) > 0.7 ? 'Good' :
                       (profileSummary?.consistencyScore || 0) > 0.4 ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Behavioral Consistency</span>
                      <span>{Math.round((profileSummary?.consistencyScore || 0) * 100)}%</span>
                    </div>
                    <Progress value={(profileSummary?.consistencyScore || 0) * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Data Quality</span>
                      <span>{profile?.baseline.established ? '100%' : '50%'}</span>
                    </div>
                    <Progress value={profile?.baseline.established ? 100 : 50} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!profile?.baseline.established && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        Continue monitoring to establish behavioral baseline.
                      </p>
                    </div>
                  )}
                  {(profileSummary?.anomalyCount || 0) > 5 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        High anomaly count detected. Consider reviewing recent activities.
                      </p>
                    </div>
                  )}
                  {(profileSummary?.riskScore || 0) > 0.6 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">
                        Elevated risk score. Additional security measures recommended.
                      </p>
                    </div>
                  )}
                  {(profileSummary?.consistencyScore || 0) > 0.8 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        Excellent behavioral consistency. Profile is well-established.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadProfileData}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default BehaviorProfileDashboard;
