import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { Badge } from "./ui/badge"
import { 
  Menu, 
  Shield, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  Bell,
  Network,
  Activity,
  Hospital,
  Brain
} from "lucide-react"
// TODO: Replace with proper auth service
const auth = {
  isAuthenticated: () => true,
  getCurrentUser: () => ({ name: 'Admin User', username: 'admin' }),
  getUserRoles: () => ['admin'],
  logout: () => console.log('Logout clicked')
};

export function TopNavbar() {
  const [user, setUser] = useState<any>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])

  useEffect(() => {
    if (auth.isAuthenticated()) {
      const currentUser = auth.getCurrentUser()
      const roles = auth.getUserRoles()
      setUser(currentUser)
      setUserRoles(roles)
    }
  }, [])

  const handleLogout = () => {
    auth.logout()
  }

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Hospital className="h-6 w-6" />
              <span>Hospital Analytics</span>
            </Link>
            
            <Link to="/admin" className="hover:text-foreground">
              Dashboard
            </Link>
            
            <Link to="/admin/analytics" className="text-muted-foreground hover:text-foreground">
              Analytics
            </Link>

            <Link to="/admin/users" className="text-muted-foreground hover:text-foreground">
              Hospital Users
            </Link>

            <Link to="/admin/audit" className="text-muted-foreground hover:text-foreground">
              User Activity
            </Link>

            <Link to="/admin/behavior-analysis" className="text-muted-foreground hover:text-foreground">
              Behavior Analysis
            </Link>

            <Link to="/admin/risk-assessment" className="text-muted-foreground hover:text-foreground">
              Risk Assessment
            </Link>

            <Link to="/admin/compliance" className="text-muted-foreground hover:text-foreground">
              Compliance Reporting
            </Link>


          </nav>
        </SheetContent>
      </Sheet>
      
      {/* Logo and title - Desktop */}
      <Link to="/admin" className="flex items-center gap-2">
        <Hospital className="h-6 w-6" />
        <span className="font-bold hidden sm:inline-block">Hospital Analytics Admin Console</span>
      </Link>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium flex-1">
        <Link to="/admin/dashboard" className="text-foreground hover:text-foreground/80 transition-colors">
          Dashboard
        </Link>
        
        <Link to="/admin/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
          Analytics
        </Link>


        <Link to="/admin/audit" className="text-muted-foreground hover:text-foreground transition-colors">
          User Activity
        </Link>

        <Link to="/admin/behavioral-monitoring" className="text-muted-foreground hover:text-foreground transition-colors">
          Behavior Analysis
        </Link>

        <Link to="/admin/risk-scores" className="text-muted-foreground hover:text-foreground transition-colors">
          Risk Assessment
        </Link>

        <Link to="/admin/compliance" className="text-muted-foreground hover:text-foreground transition-colors">
          Compliance Reporting
        </Link>


      </nav>

      {/* User info and actions */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden md:flex items-center gap-2">
            <div className="text-sm">
              <div className="font-medium">{user.name || user.username}</div>
              <div className="text-muted-foreground text-xs flex gap-1">
                <Badge variant="destructive" className="text-xs">
                  Admin
                </Badge>
              </div>
            </div>
          </div>
        )}
        
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/profile">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Link>
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  )
}
