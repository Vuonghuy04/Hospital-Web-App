import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { 
  Hospital, 
  Users, 
  Activity, 
  Shield, 
  AlertTriangle, 
  BarChart3,
  TrendingUp,
  Clock,
  Database
} from "lucide-react"
import { getDashboardMetrics, getRecentActivities } from "../../lib/user-service"

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalActivities: number;
  highRiskEvents: number;
  averageRiskScore: number;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  risk: string;
}

export default function AdminDashboardPage() {
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalActivities: 0,
    highRiskEvents: 0,
    averageRiskScore: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  useEffect(() => {
    // Fetch real data from hospital MongoDB
    const loadData = async () => {
      setDataLoading(true)
      try {
        const [metrics, activities] = await Promise.all([
          getDashboardMetrics(),
          getRecentActivities(5)
        ])
        
        setDashboardMetrics(metrics)
        
        // Format activities
        const formattedActivities = activities.map((activity: any) => ({
          id: activity.id,
          user: activity.user || activity.username || 'Unknown User',
          action: activity.action || 'Unknown Activity',
          timestamp: formatTimestamp(activity.timestamp),
          risk: activity.risk || 'low'
        }))
        setRecentActivities(formattedActivities)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
  }, [])


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Hospital Analytics Dashboard</h2>
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hospital className="h-5 w-5" />
            Welcome to Hospital Analytics
          </CardTitle>
          <CardDescription>
            Monitor user behavior and assess security risks across your hospital systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="font-medium">Hospital Admin</p>
              <Badge variant="destructive" className="mt-1">Admin</Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated</p>
              <p className="font-medium">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                dashboardMetrics.totalUsers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                dashboardMetrics.activeUsers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                dashboardMetrics.highRiskEvents.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                `${(dashboardMetrics.averageRiskScore / 10).toFixed(1)}/10`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              System average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent User Activities</CardTitle>
            <CardDescription>
              Latest activities from hospital staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dataLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="animate-pulse bg-gray-200 h-4 w-4 rounded"></div>
                      <div>
                        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded mb-1"></div>
                        <div className="animate-pulse bg-gray-200 h-3 w-32 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="animate-pulse bg-gray-200 h-5 w-16 rounded mb-1"></div>
                      <div className="animate-pulse bg-gray-200 h-3 w-20 rounded"></div>
                    </div>
                  </div>
                ))
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={activity.risk === 'low' ? 'secondary' : activity.risk === 'medium' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {activity.risk} risk
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activities found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and connectivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Hospital Database</span>
                </div>
                <Badge variant="secondary">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Security Monitoring</span>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Analytics Engine</span>
                </div>
                <Badge variant="secondary">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access frequently used monitoring tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">User Management</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => window.location.href = '/admin/audit'}
            >
              <Activity className="h-6 w-6" />
              <span className="text-sm">Activity Logs</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => window.location.href = '/admin/risk-scores'}
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm">Risk Assessment</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => window.location.href = '/admin/analytics'}
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
