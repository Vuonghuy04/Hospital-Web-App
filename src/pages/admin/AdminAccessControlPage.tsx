import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Checkbox } from "../../components/ui/checkbox"
import { Textarea } from "../../components/ui/textarea"
import { Label } from "../../components/ui/label"
import {
  Lock,
  FileText,
  Network,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Shield,
  AlertTriangle,
  Activity
} from "lucide-react"

// Demo policies data for hospital
const hospitalPolicies = [
  {
    id: "policy-1",
    name: "Patient Data Access Control",
    description: "Controls access to patient medical records and PHI",
    status: "Active",
    type: "HIPAA Compliance",
    resources: ["Patient Database", "EMR System", "Lab Results"],
    subjects: ["Doctors", "Nurses", "Medical Staff"],
    conditions: ["Working Hours", "Hospital Network", "MFA Required"],
    lastUpdated: "2025-05-01",
    createdBy: "Dr. Smith",
  },
  {
    id: "policy-2",
    name: "Pharmacy System Access",
    description: "Restricts access to prescription and medication data",
    status: "Active",
    type: "Access Control",
    resources: ["Pharmacy Database", "Prescription System", "Drug Inventory"],
    subjects: ["Pharmacists", "Pharmacy Technicians"],
    conditions: ["Licensed Personnel", "Audit Logging", "Time Restrictions"],
    lastUpdated: "2025-04-28",
    createdBy: "PharmD Johnson",
  },
  {
    id: "policy-3",
    name: "Administrative System Access",
    description: "Controls access to hospital administrative systems",
    status: "Active",
    type: "Access Control",
    resources: ["HR System", "Financial System", "Billing System"],
    subjects: ["Administrators", "Finance Team", "HR Staff"],
    conditions: ["Business Hours", "Corporate Network", "Supervisor Approval"],
    lastUpdated: "2025-04-25",
    createdBy: "Admin Wilson",
  },
  {
    id: "policy-4",
    name: "Emergency Access Protocol",
    description: "Break-glass access for emergency situations",
    status: "Active",
    type: "Emergency Access",
    resources: ["All Patient Systems", "Critical Care Systems", "Emergency Records"],
    subjects: ["Emergency Staff", "On-call Physicians"],
    conditions: ["Emergency Declared", "Post-access Review", "Incident Logging"],
    lastUpdated: "2025-04-20",
    createdBy: "Dr. Emergency",
  },
]

// Demo network segments for hospital
const hospitalSegments = [
  {
    id: "segment-1",
    name: "Patient Care Network",
    description: "Network segment for patient care systems",
    status: "Active",
    resources: 25,
    policies: 12,
    lastUpdated: "2025-05-02",
  },
  {
    id: "segment-2",
    name: "Administrative Network",
    description: "Isolated network for administrative functions",
    status: "Active",
    resources: 15,
    policies: 8,
    lastUpdated: "2025-04-28",
  },
  {
    id: "segment-3",
    name: "Medical Equipment Network",
    description: "IoT network for medical devices and equipment",
    status: "Active",
    resources: 30,
    policies: 15,
    lastUpdated: "2025-04-25",
  },
  {
    id: "segment-4",
    name: "Guest Network",
    description: "Isolated network for patients and visitors",
    status: "Active",
    resources: 5,
    policies: 3,
    lastUpdated: "2025-04-20",
  },
]

// Demo audit logs for hospital
const hospitalAuditLogs = [
  {
    id: "log-1",
    timestamp: "2025-05-07 14:23:45",
    user: "Dr. Smith",
    action: "Patient Record Access",
    resource: "Patient ID: 12345",
    status: "Success",
    details: "Accessed patient record during scheduled appointment",
  },
  {
    id: "log-2",
    timestamp: "2025-05-07 13:15:22",
    user: "Nurse Johnson",
    action: "Medication Administration",
    resource: "Pharmacy System",
    status: "Success",
    details: "Administered prescribed medication to patient",
  },
  {
    id: "log-3",
    timestamp: "2025-05-07 12:45:10",
    user: "Admin User",
    action: "Policy Update",
    resource: "Patient Data Access Control",
    status: "Success",
    details: "Updated access conditions to include biometric verification",
  },
  {
    id: "log-4",
    timestamp: "2025-05-07 11:30:33",
    user: "Dr. Wilson",
    action: "Emergency Access",
    resource: "Critical Patient Records",
    status: "Success",
    details: "Emergency break-glass access during cardiac arrest response",
  },
  {
    id: "log-5",
    timestamp: "2025-05-07 10:15:19",
    user: "Temp Staff",
    action: "Unauthorized Access Attempt",
    resource: "Financial System",
    status: "Denied",
    details: "Access denied due to insufficient privileges and expired credentials",
  },
]

export default function AdminAccessControlPage() {
  const [activeTab, setActiveTab] = useState("policies")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPolicyType, setSelectedPolicyType] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isAddPolicyDialogOpen, setIsAddPolicyDialogOpen] = useState(false)

  // Filter policies based on search query and filters
  const filteredPolicies = hospitalPolicies.filter((policy) => {
    const matchesSearch =
      searchQuery === "" ||
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedPolicyType === null || policy.type === selectedPolicyType
    const matchesStatus = selectedStatus === null || policy.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Active
          </Badge>
        )
      case "Inactive":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            <Clock className="mr-1 h-3 w-3" /> Inactive
          </Badge>
        )
      case "Success":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Success
          </Badge>
        )
      case "Denied":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="mr-1 h-3 w-3" /> Denied
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Access Control Management</h2>
          <p className="text-muted-foreground">
            Manage hospital access policies, network segmentation, and security controls
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      {/* Alert for admin-only access */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Administrator Access Required</h3>
            <p className="text-sm text-red-700">
              This page contains sensitive security controls and is restricted to hospital administrators only.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="policies">Access Policies</TabsTrigger>
          <TabsTrigger value="segments">Network Segmentation</TabsTrigger>
          <TabsTrigger value="audit">Security Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Access Control Policies</CardTitle>
              <CardDescription>Manage HIPAA-compliant access policies for hospital systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search policies..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Dialog open={isAddPolicyDialogOpen} onOpenChange={setIsAddPolicyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Policy
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Create New Access Policy</DialogTitle>
                        <DialogDescription>Define a new access control policy for hospital systems</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="policy-name" className="text-right">
                            Policy Name
                          </Label>
                          <Input id="policy-name" placeholder="Lab Results Access Policy" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="policy-description" className="text-right">
                            Description
                          </Label>
                          <Textarea
                            id="policy-description"
                            placeholder="Controls access to laboratory test results and diagnostic data"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="policy-type" className="text-right">
                            Policy Type
                          </Label>
                          <Select>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select policy type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hipaa-compliance">HIPAA Compliance</SelectItem>
                              <SelectItem value="access-control">Access Control</SelectItem>
                              <SelectItem value="emergency-access">Emergency Access</SelectItem>
                              <SelectItem value="data-protection">Data Protection</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddPolicyDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsAddPolicyDialogOpen(false)}>Create Policy</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {showFilters && (
                  <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="policy-type-filter">Policy Type</Label>
                      <Select
                        value={selectedPolicyType || ""}
                        onValueChange={(value) => setSelectedPolicyType(value === "" ? null : value)}
                      >
                        <SelectTrigger id="policy-type-filter">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="HIPAA Compliance">HIPAA Compliance</SelectItem>
                          <SelectItem value="Access Control">Access Control</SelectItem>
                          <SelectItem value="Emergency Access">Emergency Access</SelectItem>
                          <SelectItem value="Data Protection">Data Protection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status-filter">Status</Label>
                      <Select
                        value={selectedStatus || ""}
                        onValueChange={(value) => setSelectedStatus(value === "" ? null : value)}
                      >
                        <SelectTrigger id="status-filter">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resources</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPolicies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <div className="font-medium">{policy.name}</div>
                          <div className="text-sm text-muted-foreground">{policy.description}</div>
                        </TableCell>
                        <TableCell>{policy.type}</TableCell>
                        <TableCell>{getStatusBadge(policy.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {policy.resources.map((resource, index) => (
                              <Badge key={index} variant="outline">
                                {resource}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {policy.subjects.map((subject, index) => (
                              <Badge key={index} variant="outline">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{policy.lastUpdated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Network Segmentation</CardTitle>
              <CardDescription>Manage network segments for medical devices and systems</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Policies</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitalSegments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell>
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-sm text-muted-foreground">{segment.description}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(segment.status)}</TableCell>
                      <TableCell>{segment.resources}</TableCell>
                      <TableCell>{segment.policies}</TableCell>
                      <TableCell>{segment.lastUpdated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Security Audit Logs</CardTitle>
              <CardDescription>Monitor and analyze access control activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitalAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
