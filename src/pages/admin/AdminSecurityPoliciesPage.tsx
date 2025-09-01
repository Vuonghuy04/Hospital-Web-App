import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  Lock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"

// Demo security policies data for hospital
const hospitalSecurityPolicies = [
  {
    id: "policy-1",
    name: "HIPAA Privacy Rule Compliance",
    description: "Comprehensive privacy protection for patient health information",
    status: "Active",
    type: "Privacy Compliance",
    priority: "Critical",
    lastUpdated: "2025-05-01",
    owner: "Chief Privacy Officer",
    affectedSystems: ["EMR", "Patient Portal", "Billing System"],
    complianceFramework: "HIPAA"
  },
  {
    id: "policy-2",
    name: "Medical Device Security Policy",
    description: "Security requirements for connected medical devices and IoT equipment",
    status: "Active",
    type: "Device Security",
    priority: "High",
    lastUpdated: "2025-04-28",
    owner: "Biomedical Engineering",
    affectedSystems: ["MRI Systems", "Patient Monitors", "Infusion Pumps"],
    complianceFramework: "FDA Guidelines"
  },
  {
    id: "policy-3",
    name: "Emergency Access Protocol",
    description: "Break-glass access procedures for medical emergencies",
    status: "Active",
    type: "Emergency Access",
    priority: "Critical",
    lastUpdated: "2025-04-25",
    owner: "Emergency Services",
    affectedSystems: ["All Patient Systems", "Emergency Records"],
    complianceFramework: "Joint Commission"
  },
  {
    id: "policy-4",
    name: "Third-Party Vendor Access",
    description: "Security controls for vendor access to hospital systems",
    status: "Under Review",
    type: "Vendor Management",
    priority: "Medium",
    lastUpdated: "2025-04-20",
    owner: "IT Security",
    affectedSystems: ["Vendor Portal", "Support Systems"],
    complianceFramework: "NIST"
  },
  {
    id: "policy-5",
    name: "Data Retention and Disposal",
    description: "Secure data lifecycle management and disposal procedures",
    status: "Active",
    type: "Data Management",
    priority: "High",
    lastUpdated: "2025-04-15",
    owner: "Data Protection Officer",
    affectedSystems: ["All Data Systems", "Archive Systems"],
    complianceFramework: "HIPAA, State Laws"
  },
  {
    id: "policy-6",
    name: "Incident Response Protocol",
    description: "Procedures for responding to security incidents and breaches",
    status: "Active",
    type: "Incident Response",
    priority: "Critical",
    lastUpdated: "2025-04-10",
    owner: "CISO",
    affectedSystems: ["All Systems"],
    complianceFramework: "HIPAA Breach Rule"
  },
]

// Policy templates for quick creation
const policyTemplates = [
  {
    id: "template-1",
    name: "HIPAA Security Rule Template",
    description: "Comprehensive template for HIPAA Security Rule compliance",
    category: "Compliance Template",
    icon: Shield
  },
  {
    id: "template-2",
    name: "Medical Device Cybersecurity",
    description: "Security framework for medical device management",
    category: "Device Security Template",
    icon: Lock
  },
  {
    id: "template-3",
    name: "Remote Access Security",
    description: "Secure remote access policies for healthcare workers",
    category: "Access Template",
    icon: Users
  },
  {
    id: "template-4",
    name: "Data Breach Response Plan",
    description: "Step-by-step breach response and notification procedures",
    category: "Incident Template",
    icon: AlertTriangle
  }
]

export default function AdminSecurityPoliciesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const filteredPolicies = hospitalSecurityPolicies.filter((policy) => {
    const matchesSearch = searchQuery === "" || 
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.owner.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedType === null || policy.type === selectedType
    const matchesStatus = selectedStatus === null || policy.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "Under Review":
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
      case "Inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case "Draft":
        return <Badge className="bg-blue-100 text-blue-800">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      case "High":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case "Low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Policies Management</h2>
          <p className="text-muted-foreground">
            Manage hospital security policies, compliance frameworks, and regulatory requirements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </div>
      </div>

      {/* Admin-only warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Restricted Administrative Area</h3>
            <p className="text-sm text-amber-700">
              Security policy management requires administrator privileges. All changes are logged and audited.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Policy Templates</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {policyTemplates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <template.icon className="h-5 w-5" />
                  {template.name}
                </CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{template.category}</Badge>
                  <Button variant="outline" size="sm">Use Template</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Current Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Current Security Policies</CardTitle>
          <CardDescription>Active and draft security policies for hospital operations</CardDescription>
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
            </div>

            {showFilters && (
              <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Policy Type</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedType || ""}
                    onChange={(e) => setSelectedType(e.target.value || null)}
                  >
                    <option value="">All Types</option>
                    <option value="Privacy Compliance">Privacy Compliance</option>
                    <option value="Device Security">Device Security</option>
                    <option value="Emergency Access">Emergency Access</option>
                    <option value="Vendor Management">Vendor Management</option>
                    <option value="Data Management">Data Management</option>
                    <option value="Incident Response">Incident Response</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedStatus || ""}
                    onChange={(e) => setSelectedStatus(e.target.value || null)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>{getPriorityBadge(policy.priority)}</TableCell>
                    <TableCell>{policy.owner}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{policy.complianceFramework}</Badge>
                    </TableCell>
                    <TableCell>{policy.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Policy Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hospitalSecurityPolicies.length}</div>
            <p className="text-xs text-muted-foreground">+2 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hospitalSecurityPolicies.filter(p => p.status === 'Active').length}
            </div>
            <p className="text-xs text-muted-foreground">83% of total policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hospitalSecurityPolicies.filter(p => p.priority === 'Critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hospitalSecurityPolicies.filter(p => p.status === 'Under Review').length}
            </div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
