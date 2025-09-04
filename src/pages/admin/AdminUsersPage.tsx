import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView } from '../../services/behaviorTracking';
import UnifiedHeader from '../../components/UnifiedHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Loader2, 
  Lock, 
  RefreshCw,
  Users,
  Search,
  Filter
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  riskLevel: 'low' | 'medium' | 'high';
  lastActive: string;
  loginCount: number;
  createdAt: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  highRisk: number;
}

const AdminUsersPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    highRisk: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    trackPageView('admin_users_page');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Generate sample users data
      const sampleUsers: User[] = [
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@hospital.com',
          department: 'Cardiology',
          role: 'doctor',
          status: 'active',
          riskLevel: 'low',
          lastActive: '2024-01-15 10:30:00',
          loginCount: 245,
          createdAt: '2023-06-15'
        },
        {
          id: '2',
          name: 'Nurse Emily Chen',
          email: 'emily.chen@hospital.com',
          department: 'Emergency',
          role: 'nurse',
          status: 'active',
          riskLevel: 'medium',
          lastActive: '2024-01-15 09:15:00',
          loginCount: 189,
          createdAt: '2023-08-20'
        },
        {
          id: '3',
          name: 'John Smith',
          email: 'john.smith@hospital.com',
          department: 'IT',
          role: 'admin',
          status: 'active',
          riskLevel: 'high',
          lastActive: '2024-01-15 11:45:00',
          loginCount: 567,
          createdAt: '2023-03-10'
        },
        {
          id: '4',
          name: 'Dr. Michael Brown',
          email: 'michael.brown@hospital.com',
          department: 'Surgery',
          role: 'doctor',
          status: 'inactive',
          riskLevel: 'low',
          lastActive: '2024-01-10 16:20:00',
          loginCount: 98,
          createdAt: '2023-09-05'
        },
        {
          id: '5',
          name: 'Lisa Davis',
          email: 'lisa.davis@hospital.com',
          department: 'Pharmacy',
          role: 'pharmacist',
          status: 'suspended',
          riskLevel: 'high',
          lastActive: '2024-01-08 14:30:00',
          loginCount: 45,
          createdAt: '2023-11-12'
        }
      ];

      setUsers(sampleUsers);
      
      // Calculate stats
      const statsData: UserStats = {
        total: sampleUsers.length,
        active: sampleUsers.filter(u => u.status === 'active').length,
        inactive: sampleUsers.filter(u => u.status === 'inactive').length,
        highRisk: sampleUsers.filter(u => u.riskLevel === 'high').length
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'suspended': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isAuthenticated || !user || !user.roles?.some(role => ['admin', 'manager'].includes(role))) {
    return (
      <div className="flex min-h-screen flex-col">
        <UnifiedHeader />
        <main className="flex-1 bg-white">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center rounded-lg border bg-card text-card-foreground shadow-sm p-8 max-w-md mx-4">
              <Shield className="h-16 w-16 mx-auto mb-6 text-destructive" />
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-muted-foreground">
                You need admin privileges to view hospital users.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <UnifiedHeader />
        <main className="flex-1 bg-white">
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            </div>
          </div>
        </main>
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
                <Users className="h-8 w-8" />
                <span>Hospital Users</span>
              </h2>
              <p className="text-muted-foreground">
                Manage and monitor hospital staff and user accounts
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={loadData}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Registered accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
                <p className="text-xs text-muted-foreground">
                  Security concern
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Search & Filter</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users, emails, departments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Complete list of hospital staff and user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {sortField === 'name' && (
                            sortDirection === 'asc' ? 
                            <ArrowUpCircle className="h-3 w-3" /> : 
                            <ArrowDownCircle className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('department')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Department</span>
                          {sortField === 'department' && (
                            sortDirection === 'asc' ? 
                            <ArrowUpCircle className="h-3 w-3" /> : 
                            <ArrowDownCircle className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('lastActive')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Last Active</span>
                          {sortField === 'lastActive' && (
                            sortDirection === 'asc' ? 
                            <ArrowUpCircle className="h-3 w-3" /> : 
                            <ArrowDownCircle className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Login Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(user.status)}
                            <span className="capitalize text-sm">{user.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRiskBadgeVariant(user.riskLevel)} className="capitalize">
                            {user.riskLevel} Risk
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.lastActive).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {user.loginCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminUsersPage;