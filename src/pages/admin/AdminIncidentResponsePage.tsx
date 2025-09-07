import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { AlertTriangle, FileText, Filter, Search, Shield, CheckCircle, XCircle, AlertCircle, Activity, Clock } from "lucide-react"

export default function AdminIncidentResponsePage() {
  const [activeTab, setActiveTab] = useState("incidents")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")

  // Hospital-specific incident data
  const hospitalIncidentsData = [
    {
      id: "INC-2025-001",
      title: "Unauthorized Access to Patient Records",
      severity: "high",
      status: "investigating",
      assignee: "Security Team",
      created: "2025-05-07 08:23:45",
      updated: "2025-05-07 09:15:22",
      description: "Attempted unauthorized access to patient medical records from external IP",
      affectedUsers: ["dr.smith", "nurse.johnson"],
      affectedSystems: ["EMR System", "Patient Database"],
      source: "Access Control Logs",
      patientImpact: "Potential PHI exposure",
      complianceImpact: "HIPAA breach investigation required"
    },
    {
      id: "INC-2025-002",
      title: "Medical Device Malware Detection",
      severity: "critical",
      status: "mitigating",
      assignee: "Biomedical Engineering",
      created: "2025-05-07 10:15:30",
      updated: "2025-05-07 11:30:15",
      description: "Malware detected on MRI control system, device isolated",
      affectedUsers: ["radiology.team"],
      affectedSystems: ["MRI System", "PACS"],
      source: "Endpoint Protection",
      patientImpact: "MRI services temporarily suspended",
      complianceImpact: "FDA reporting required"
    },
    {
      id: "INC-2025-003",
      title: "Phishing Attack Targeting Staff",
      severity: "medium",
      status: "resolved",
      assignee: "IT Security",
      created: "2025-05-06 14:22:10",
      updated: "2025-05-06 16:45:33",
      description: "Phishing campaign targeting nursing staff with fake login pages",
      affectedUsers: ["nursing.staff"],
      affectedSystems: ["Email System", "Staff Portal"],
      source: "Email Gateway",
      patientImpact: "No patient data accessed",
      complianceImpact: "Staff training required"
    },
    {
      id: "INC-2025-004",
      title: "Ransomware Attack on Billing System",
      severity: "critical",
      status: "open",
      assignee: "CISO",
      created: "2025-05-05 22:15:45",
      updated: "2025-05-07 08:30:12",
      description: "Ransomware encrypted billing system database, backup recovery in progress",
      affectedUsers: ["billing.department", "finance.team"],
      affectedSystems: ["Billing System", "Financial Database"],
      source: "System Monitoring",
      patientImpact: "Billing delays expected",
      complianceImpact: "HHS breach notification required"
    },
    {
      id: "INC-2025-005",
      title: "USB Device Policy Violation",
      severity: "low",
      status: "closed",
      assignee: "HR Department",
      created: "2025-05-04 13:45:22",
      updated: "2025-05-04 15:20:18",
      description: "Unauthorized USB device connected to workstation in pharmacy",
      affectedUsers: ["pharmacy.tech"],
      affectedSystems: ["Pharmacy Workstation"],
      source: "DLP System",
      patientImpact: "No impact identified",
      complianceImpact: "Policy reminder sent"
    },
  ]

  // Hospital-specific playbooks
  const hospitalPlaybooksData = [
    {
      id: "PB-001",
      title: "HIPAA Breach Response",
      description: "Comprehensive response plan for potential HIPAA breaches and PHI exposure",
      lastUpdated: "2025-04-15",
      owner: "Privacy Officer",
      status: "active",
      category: "Privacy Incident"
    },
    {
      id: "PB-002",
      title: "Medical Device Security Incident",
      description: "Response procedures for compromised medical devices and equipment",
      lastUpdated: "2025-04-22",
      owner: "Biomedical Engineering",
      status: "active",
      category: "Device Security"
    },
    {
      id: "PB-003",
      title: "Ransomware Response for Healthcare",
      description: "Specialized ransomware response for hospital critical systems",
      lastUpdated: "2025-05-01",
      owner: "CISO",
      status: "active",
      category: "Malware Response"
    },
    {
      id: "PB-004",
      title: "Emergency System Access",
      description: "Break-glass procedures during security incidents affecting patient care",
      lastUpdated: "2025-03-28",
      owner: "Emergency Services",
      status: "active",
      category: "Emergency Access"
    },
  ]

  // Hospital-specific reports
  const hospitalReportsData = [
    {
      id: "RPT-2025-Q2-001",
      title: "Healthcare Security Incident Summary - Q2 2025",
      type: "Quarterly",
      generated: "2025-05-01",
      status: "final",
      category: "Executive Summary"
    },
    {
      id: "RPT-HIPAA-001",
      title: "HIPAA Compliance Incident Report",
      type: "Compliance",
      generated: "2025-05-03",
      status: "draft",
      category: "Regulatory"
    },
    {
      id: "RPT-INC-002",
      title: "Medical Device Security Assessment",
      type: "Post-Incident",
      generated: "2025-05-07",
      status: "in progress",
      category: "Technical Analysis"
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hospital Incident Response</h2>
          <p className="text-muted-foreground">
            Manage and respond to healthcare security incidents with HIPAA compliance
          </p>
        </div>
        <Button>Create New Incident</Button>
      </div>

      {/* Critical admin-only warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Critical Security Operations Center</h3>
            <p className="text-sm text-red-700">
              This area contains sensitive incident data and response procedures. Access is restricted to authorized security personnel and administrators only.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="incidents" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
            <TabsTrigger value="playbooks">Response Playbooks</TabsTrigger>
            <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Healthcare Security Incidents</CardTitle>
              <CardDescription>Current security incidents affecting hospital operations and patient data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="mitigating">Mitigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-7 bg-muted p-2 text-xs font-medium">
                  <div>ID</div>
                  <div>Title</div>
                  <div>Severity</div>
                  <div>Status</div>
                  <div>Patient Impact</div>
                  <div>Assignee</div>
                  <div></div>
                </div>
                <div className="divide-y">
                  {hospitalIncidentsData
                    .filter(
                      (incident) =>
                        (statusFilter === "all" || incident.status === statusFilter) &&
                        (severityFilter === "all" || incident.severity === severityFilter) &&
                        (searchQuery === "" ||
                          incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          incident.id.toLowerCase().includes(searchQuery.toLowerCase())),
                    )
                    .map((incident) => (
                      <div key={incident.id} className="grid grid-cols-7 items-center p-2 text-sm">
                        <div className="font-medium">{incident.id}</div>
                        <div className="truncate">{incident.title}</div>
                        <div>
                          <Badge
                            variant={
                              incident.severity === "low"
                                ? "outline"
                                : incident.severity === "medium"
                                  ? "secondary"
                                  : incident.severity === "high"
                                    ? "destructive"
                                    : "destructive"
                            }
                          >
                            {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <Badge
                            variant={
                              incident.status === "resolved" || incident.status === "closed"
                                ? "outline"
                                : incident.status === "investigating"
                                  ? "secondary"
                                  : incident.status === "mitigating"
                                    ? "secondary"
                                    : "default"
                            }
                          >
                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="truncate text-xs">{incident.patientImpact}</div>
                        <div className="truncate">{incident.assignee}</div>
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hospital-specific incident metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Incident Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                      <span className="text-sm">Critical</span>
                    </div>
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                      <span className="text-sm">High</span>
                    </div>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Medium</span>
                    </div>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Low</span>
                    </div>
                    <span className="text-sm font-medium">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Patient Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Service Disruption</span>
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PHI Exposure Risk</span>
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">No Impact</span>
                    <span className="text-sm font-medium">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Compliance Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">HIPAA Reporting</span>
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">FDA Notification</span>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Staff Training</span>
                    <span className="text-sm font-medium">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Detection</span>
                    <span className="text-sm font-medium">12 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Response</span>
                    <span className="text-sm font-medium">28 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Resolution</span>
                    <span className="text-sm font-medium">3.8 hrs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Incident Response Playbooks</CardTitle>
              <CardDescription>HIPAA-compliant procedures for healthcare security incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search playbooks..." className="pl-8" />
                </div>
                <Button>Create Playbook</Button>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-5 bg-muted p-2 text-xs font-medium">
                  <div>ID</div>
                  <div>Title</div>
                  <div>Category</div>
                  <div>Last Updated</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {hospitalPlaybooksData.map((playbook) => (
                    <div key={playbook.id} className="grid grid-cols-5 items-center p-2 text-sm">
                      <div className="font-medium">{playbook.id}</div>
                      <div className="truncate">{playbook.title}</div>
                      <div>
                        <Badge variant="outline">{playbook.category}</Badge>
                      </div>
                      <div>{playbook.lastUpdated}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant={playbook.status === "active" ? "outline" : "secondary"}>
                          {playbook.status.charAt(0).toUpperCase() + playbook.status.slice(1)}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Incident Reports</CardTitle>
              <CardDescription>Compliance and regulatory incident reports for healthcare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search reports..." className="pl-8" />
                </div>
                <Button>Generate Report</Button>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-5 bg-muted p-2 text-xs font-medium">
                  <div>ID</div>
                  <div>Title</div>
                  <div>Type</div>
                  <div>Generated</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {hospitalReportsData.map((report) => (
                    <div key={report.id} className="grid grid-cols-5 items-center p-2 text-sm">
                      <div className="font-medium">{report.id}</div>
                      <div className="truncate">{report.title}</div>
                      <div>{report.type}</div>
                      <div>{report.generated}</div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            report.status === "final" ? "outline" : report.status === "draft" ? "secondary" : "default"
                          }
                        >
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
