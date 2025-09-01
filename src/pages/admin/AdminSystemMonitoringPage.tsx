import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Database,
  Shield,
  Wifi,
  HardDrive,
  Cpu,
  Monitor,
  Heart,
  Zap,
  Eye,
  Settings
} from "lucide-react"

// Hospital system status data
const hospitalSystems = [
  {
    id: "sys-001",
    name: "Electronic Medical Records (EMR)",
    status: "operational",
    uptime: "99.98%",
    lastCheck: "2025-05-07 14:30:15",
    responseTime: "245ms",
    activeUsers: 156,
    criticalAlerts: 0,
    warningAlerts: 2,
    systemLoad: 68,
    memoryUsage: 72,
    diskUsage: 45
  },
  {
    id: "sys-002",
    name: "Patient Monitoring Systems",
    status: "operational",
    uptime: "99.95%",
    lastCheck: "2025-05-07 14:29:45",
    responseTime: "98ms",
    activeUsers: 89,
    criticalAlerts: 0,
    warningAlerts: 1,
    systemLoad: 45,
    memoryUsage: 58,
    diskUsage: 32
  },
  {
    id: "sys-003",
    name: "Pharmacy Management System",
    status: "degraded",
    uptime: "98.76%",
    lastCheck: "2025-05-07 14:28:22",
    responseTime: "1.2s",
    activeUsers: 23,
    criticalAlerts: 1,
    warningAlerts: 4,
    systemLoad: 85,
    memoryUsage: 91,
    diskUsage: 78
  },
  {
    id: "sys-004",
    name: "Laboratory Information System",
    status: "operational",
    uptime: "99.89%",
    lastCheck: "2025-05-07 14:30:00",
    responseTime: "312ms",
    activeUsers: 34,
    criticalAlerts: 0,
    warningAlerts: 0,
    systemLoad: 52,
    memoryUsage: 64,
    diskUsage: 41
  },
  {
    id: "sys-005",
    name: "Radiology PACS",
    status: "maintenance",
    uptime: "97.23%",
    lastCheck: "2025-05-07 14:15:33",
    responseTime: "N/A",
    activeUsers: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    systemLoad: 0,
    memoryUsage: 0,
    diskUsage: 67
  },
  {
    id: "sys-006",
    name: "Billing and Finance System",
    status: "down",
    uptime: "95.12%",
    lastCheck: "2025-05-07 12:45:18",
    responseTime: "N/A",
    activeUsers: 0,
    criticalAlerts: 3,
    warningAlerts: 2,
    systemLoad: 0,
    memoryUsage: 0,
    diskUsage: 89
  }
]

// Medical device monitoring data
const medicalDevices = [
  {
    id: "dev-001",
    name: "MRI Scanner - Room 201",
    type: "Imaging Equipment",
    status: "operational",
    lastMaintenance: "2025-04-15",
    nextMaintenance: "2025-07-15",
    utilizationRate: 78,
    alerts: 0,
    location: "Radiology Department"
  },
  {
    id: "dev-002",
    name: "CT Scanner - Room 203",
    type: "Imaging Equipment",
    status: "operational",
    lastMaintenance: "2025-03-22",
    nextMaintenance: "2025-06-22",
    utilizationRate: 82,
    alerts: 1,
    location: "Radiology Department"
  },
  {
    id: "dev-003",
    name: "Ventilator Bank - ICU",
    type: "Life Support",
    status: "operational",
    lastMaintenance: "2025-05-01",
    nextMaintenance: "2025-05-15",
    utilizationRate: 65,
    alerts: 0,
    location: "Intensive Care Unit"
  },
  {
    id: "dev-004",
    name: "Infusion Pump Array",
    type: "Medication Delivery",
    status: "warning",
    lastMaintenance: "2025-04-28",
    nextMaintenance: "2025-05-28",
    utilizationRate: 91,
    alerts: 3,
    location: "General Ward"
  },
  {
    id: "dev-005",
    name: "Cardiac Monitor Network",
    type: "Patient Monitoring",
    status: "operational",
    lastMaintenance: "2025-05-05",
    nextMaintenance: "2025-06-05",
    utilizationRate: 88,
    alerts: 0,
    location: "Cardiology Department"
  }
]

// Security monitoring data
const securityMetrics = [
  {
    category: "Access Control",
    metric: "Failed Login Attempts",
    value: 12,
    threshold: 50,
    status: "normal",
    trend: "stable"
  },
  {
    category: "Network Security",
    metric: "Suspicious Network Traffic",
    value: 3,
    threshold: 10,
    status: "normal",
    trend: "decreasing"
  },
  {
    category: "Data Protection",
    metric: "Unauthorized Data Access Attempts",
    value: 2,
    threshold: 5,
    status: "normal",
    trend: "stable"
  },
  {
    category: "Endpoint Security",
    metric: "Malware Detections",
    value: 1,
    threshold: 3,
    status: "normal",
    trend: "stable"
  },
  {
    category: "Compliance",
    metric: "Policy Violations",
    value: 7,
    threshold: 15,
    status: "warning",
    trend: "increasing"
  }
]

export default function AdminSystemMonitoringPage() {
  const [activeTab, setActiveTab] = useState("systems")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Operational
          </Badge>
        )
      case "degraded":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="mr-1 h-3 w-3" /> Degraded
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Settings className="mr-1 h-3 w-3" /> Maintenance
          </Badge>
        )
      case "down":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="mr-1 h-3 w-3" /> Down
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertTriangle className="mr-1 h-3 w-3" /> Warning
          </Badge>
        )
      case "normal":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Normal
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUtilizationColor = (usage: number) => {
    if (usage >= 90) return "text-red-600"
    if (usage >= 75) return "text-orange-600"
    if (usage >= 50) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hospital System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of critical hospital systems, medical devices, and security metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Live View
          </Button>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Admin-only monitoring warning */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Monitor className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">System Operations Center</h3>
            <p className="text-sm text-blue-700">
              This dashboard provides real-time monitoring of critical hospital infrastructure. Administrator access required.
            </p>
          </div>
        </div>
      </div>

      {/* Overall System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Systems Operational</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {hospitalSystems.filter(s => s.status === 'operational').length}/{hospitalSystems.length}
            </div>
            <p className="text-xs text-muted-foreground">83% system availability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {hospitalSystems.reduce((sum, s) => sum + s.criticalAlerts, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hospitalSystems.reduce((sum, s) => sum + s.activeUsers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.49%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="systems">Hospital Systems</TabsTrigger>
          <TabsTrigger value="devices">Medical Devices</TabsTrigger>
          <TabsTrigger value="security">Security Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="systems">
          <Card>
            <CardHeader>
              <CardTitle>Critical Hospital Systems Status</CardTitle>
              <CardDescription>Real-time monitoring of core hospital information systems</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Active Users</TableHead>
                    <TableHead>System Load</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>Alerts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitalSystems.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell>
                        <div className="font-medium">{system.name}</div>
                        <div className="text-sm text-muted-foreground">Last check: {system.lastCheck}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(system.status)}</TableCell>
                      <TableCell className={getUtilizationColor(parseFloat(system.uptime))}>
                        {system.uptime}
                      </TableCell>
                      <TableCell>{system.responseTime}</TableCell>
                      <TableCell>{system.activeUsers}</TableCell>
                      <TableCell className={getUtilizationColor(system.systemLoad)}>
                        {system.systemLoad}%
                      </TableCell>
                      <TableCell className={getUtilizationColor(system.memoryUsage)}>
                        {system.memoryUsage}%
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {system.criticalAlerts > 0 && (
                            <Badge variant="destructive">{system.criticalAlerts} Critical</Badge>
                          )}
                          {system.warningAlerts > 0 && (
                            <Badge variant="secondary">{system.warningAlerts} Warning</Badge>
                          )}
                          {system.criticalAlerts === 0 && system.warningAlerts === 0 && (
                            <Badge variant="outline">None</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Medical Device Monitoring</CardTitle>
              <CardDescription>Status and maintenance tracking for critical medical equipment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Last Maintenance</TableHead>
                    <TableHead>Next Maintenance</TableHead>
                    <TableHead>Alerts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicalDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground">{device.id}</div>
                      </TableCell>
                      <TableCell>{device.type}</TableCell>
                      <TableCell>{getStatusBadge(device.status)}</TableCell>
                      <TableCell>{device.location}</TableCell>
                      <TableCell className={getUtilizationColor(device.utilizationRate)}>
                        {device.utilizationRate}%
                      </TableCell>
                      <TableCell>{device.lastMaintenance}</TableCell>
                      <TableCell>{device.nextMaintenance}</TableCell>
                      <TableCell>
                        {device.alerts > 0 ? (
                          <Badge variant="secondary">{device.alerts}</Badge>
                        ) : (
                          <Badge variant="outline">None</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring Dashboard</CardTitle>
              <CardDescription>Real-time security metrics and threat monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Security Category</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityMetrics.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{metric.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{metric.metric}</TableCell>
                        <TableCell className={metric.value >= metric.threshold ? "text-red-600" : "text-green-600"}>
                          {metric.value}
                        </TableCell>
                        <TableCell>{metric.threshold}</TableCell>
                        <TableCell>{getStatusBadge(metric.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            metric.trend === "increasing" ? "text-red-600" :
                            metric.trend === "decreasing" ? "text-green-600" : "text-gray-600"
                          }>
                            {metric.trend}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
