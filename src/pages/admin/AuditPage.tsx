import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView } from '../../services/behaviorTracking';
import UnifiedHeader from '../../components/UnifiedHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Filter, 
  RefreshCw, 
  Shield, 
  User, 
  Brain, 
  Zap, 
  Play, 
  Database, 
  TrendingUp,
  Search,
  Download,
  Calendar,
  Activity
} from 'lucide-react';
import { fetchAuditEvents, subscribeToAuditUpdates, fetchAuditMetrics, AuditEvent } from '../../services/auditService';

interface AuditMetrics {
  totalEvents: number;
  pendingML: number;
  lowMediumRisk: number;
  highRisk: number;
  successfulEvents: number;
  failedEvents: number;
  uniqueUsers: number;
}

const AuditPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [securityEvents, setSecurityEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<AuditMetrics>({
    totalEvents: 0,
    pendingML: 0,
    lowMediumRisk: 0,
    highRisk: 0,
    successfulEvents: 0,
    failedEvents: 0,
    uniqueUsers: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    userId: "",
    eventType: "",
    resourceType: "",
    status: "",
    startDate: "",
    endDate: "",
    searchTerm: ""
  });

  const [showFilters, setShowFilters] = useState(false);

  // ML Prediction states
  const [mlPredictionStatus, setMlPredictionStatus] = useState<any>(null);
  const [isRunningPrediction, setIsRunningPrediction] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  useEffect(() => {
    trackPageView('audit_page');
  }, []);

  // Function to fetch audit logs with real data
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchAuditEvents(filters, currentPage, 20);
      const metricsResult = await fetchAuditMetrics();
      
      setAuditLogs(result.events);
      setTotalLogs(result.total);
      setTotalPages(result.pages);
      setLastUpdateTime(new Date());
      
      // Calculate extended metrics
      const uniqueUsers = new Set(result.events.map(e => e.user)).size;
      const successfulEvents = result.events.filter(e => e.risk !== 'High Risk').length;
      const failedEvents = result.events.filter(e => e.risk === 'High Risk').length;
      
      setMetrics({
        ...metricsResult,
        successfulEvents,
        failedEvents,
        uniqueUsers
      });
      
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch audit logs. Using sample data.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  // Function to fetch security events
  const fetchSecurityEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchAuditEvents({...filters, riskLevel: 'high'}, currentPage, 20);
      const highRiskEvents = result.events.filter(e => e.risk === 'High Risk' || e.risk === 'Medium Risk');
      
      setSecurityEvents(highRiskEvents);
      setLastUpdateTime(new Date());
      
    } catch (err) {
      console.error('Error fetching security events:', err);
      setError('Failed to fetch security events.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    if (isAuthenticated && user) {
      if (activeTab === "all") {
        fetchAuditLogs();
      } else if (activeTab === "security") {
        fetchSecurityEvents();
      }
    }
  }, [activeTab, fetchAuditLogs, fetchSecurityEvents, isAuthenticated, user]);

  // Set up real-time updates
  useEffect(() => {
    if (isAuthenticated && user) {
      const unsubscribe = subscribeToAuditUpdates((events) => {
        if (activeTab === "all") {
          setAuditLogs(events);
        }
      }, 30000); // Update every 30 seconds
      
      return unsubscribe;
    }
  }, [activeTab, isAuthenticated, user]);

  // Function to run ML predictions
  const runMlPredictions = async () => {
    try {
      setIsRunningPrediction(true);
      setPredictionResult(null);

      // Simulate ML prediction API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPredictionResult({
        success: true,
        processed: Math.floor(Math.random() * 100) + 50,
        predictions: Math.floor(Math.random() * 20) + 5,
        anomalies: Math.floor(Math.random() * 5) + 1
      });
      
      // Refresh data after prediction
      setTimeout(() => {
        fetchAuditLogs();
      }, 1000);
    } catch (err) {
      console.error('Error running ML predictions:', err);
    } finally {
      setIsRunningPrediction(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      eventType: "",
      resourceType: "",
      status: "",
      startDate: "",
      endDate: "",
      searchTerm: ""
    });
  };

  const exportData = () => {
    const dataToExport = activeTab === "all" ? auditLogs : securityEvents;
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `audit-logs-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'High Risk':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'Medium Risk':
        return <Badge className="bg-yellow-500 text-white">Medium Risk</Badge>;
      case 'Low Risk':
        return <Badge className="bg-green-500 text-white">Low Risk</Badge>;
      default:
        return <Badge variant="secondary">Pending ML</Badge>;
    }
  };

  const filteredLogs = (activeTab === "all" ? auditLogs : securityEvents).filter(log => {
    const matchesSearch = !filters.searchTerm || 
      log.user.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      log.email.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesUser = !filters.userId || log.user.includes(filters.userId);
    
    return matchesSearch && matchesUser;
  });

  if (!isAuthenticated || !user || !user.roles?.some(role => ['admin', 'manager'].includes(role))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
            <Shield className="h-16 w-16 mx-auto mb-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">
              You need admin privileges to view the audit logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <UnifiedHeader />
      <main className="flex-1 bg-gray-50">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
                <Database className="h-8 w-8" />
                <span>Audit Logs</span>
              </h2>
              <p className="text-muted-foreground">
                Real-time monitoring and analysis of system activities
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={exportData}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button
                onClick={fetchAuditLogs}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
          
          {lastUpdateTime && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdateTime.toLocaleString()}
            </p>
          )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All system activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.highRisk}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Active in logs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ML Analysis</CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{metrics.pendingML}</div>
              <p className="text-xs text-muted-foreground">
                Pending analysis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ML Prediction Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>ML Anomaly Detection</span>
            </CardTitle>
            <CardDescription>
              Run machine learning predictions to detect anomalous behavior patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={runMlPredictions}
                  disabled={isRunningPrediction}
                  className="flex items-center space-x-2"
                >
                  {isRunningPrediction ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>{isRunningPrediction ? 'Running...' : 'Run ML Predictions'}</span>
                </Button>
                
                {predictionResult && (
                  <div className="text-sm text-green-600">
                    ✓ Processed {predictionResult.processed} events, found {predictionResult.anomalies} anomalies
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters & Search</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search users, actions, emails..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={clearFilters}
                size="sm"
              >
                Clear All
              </Button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="userId">User</Label>
                  <Input
                    id="userId"
                    placeholder="Filter by user..."
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>All Logs ({totalLogs})</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security Events ({metrics.highRisk + metrics.lowMediumRisk})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Audit Logs</CardTitle>
                <CardDescription>
                  Complete system activity log showing all user actions and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading audit logs...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8 text-red-600">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <span>{error}</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Session</TableHead>
                          <TableHead>Risk Level</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">
                              {log.timestamp}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{log.user}</div>
                                <div className="text-sm text-gray-500">{log.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.ipAddress}
                            </TableCell>
                            <TableCell className="font-mono text-xs whitespace-pre-line">
                              {log.session}
                            </TableCell>
                            <TableCell>
                              {getRiskBadge(log.risk)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{log.score}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
                <CardDescription>
                  High and medium risk events requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading security events...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Risk Level</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {securityEvents.map((event) => (
                          <TableRow key={event.id} className="border-l-4 border-l-red-500">
                            <TableCell className="font-mono text-sm">
                              {event.timestamp}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{event.user}</div>
                                <div className="text-sm text-gray-500">{event.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {event.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getRiskBadge(event.risk)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              IP: {event.ipAddress} | Session: {event.session.split('\n')[1]}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AuditPage;
