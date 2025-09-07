import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initKeycloak, login as keycloakLogin, logout as keycloakLogout, isAuthenticated as isKeycloakAuthenticated, getUserInfo } from '../services/keycloak';
import { trackLogin, trackLogout } from '../services/behaviorTracking';

// User interface
interface User {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  getRedirectPath: () => string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Check for cached auth state to prevent flash
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cachedUser = sessionStorage.getItem('hospital_user');
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check session storage for previous auth state
    const cachedAuth = sessionStorage.getItem('hospital_authenticated');
    return cachedAuth === 'true';
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Keycloak on app start
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing Keycloak...');
        
        // If we have cached auth state, extend loading time slightly for smooth transition
        if (isAuthenticated) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const authenticated = await initKeycloak();
        
        if (authenticated) {
          const userInfo = getUserInfo();
          console.log('🔍 Raw user info from Keycloak:', userInfo);
          console.log('🔍 Raw roles from Keycloak:', userInfo?.roles);
          console.log('🔍 Role count:', userInfo?.roles?.length || 0);
          
          if (userInfo) {
            const userData = {
              username: userInfo.username,
              email: userInfo.email,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              roles: userInfo.roles,
            };
            
            console.log('🔍 Processed user data:', userData);
            console.log('🔍 User roles in userData:', userData.roles);
            console.log('🔍 Username:', userData.username);
            
            setUser(userData);
            setIsAuthenticated(true);
            
            // Cache auth state
            sessionStorage.setItem('hospital_user', JSON.stringify(userData));
            sessionStorage.setItem('hospital_authenticated', 'true');
            
            console.log('User authenticated and cached:', userData);
            
            // Track login/session verification
            await trackLogin();
          }
        } else {
          // Clear cached auth state if not authenticated
          setUser(null);
          setIsAuthenticated(false);
          sessionStorage.removeItem('hospital_user');
          sessionStorage.removeItem('hospital_authenticated');
          console.log('User not authenticated');
        }
      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        // Clear cached auth state on error
        setUser(null);
        setIsAuthenticated(false);
        sessionStorage.removeItem('hospital_user');
        sessionStorage.removeItem('hospital_authenticated');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const login = () => {
    console.log("Redirecting to Keycloak login...");
    keycloakLogin();
  };

  const logout = async () => {
    console.log("Logging out from Keycloak...");
    
    // Track logout before clearing state
    await trackLogout();
    
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear cached auth state
    sessionStorage.removeItem('hospital_user');
    sessionStorage.removeItem('hospital_authenticated');
    
    keycloakLogout();
  };

  const getRedirectPath = (): string => {
    console.log('getRedirectPath called with user:', user);
    
    if (!user || !user.roles) {
      console.log('getRedirectPath: No user or roles, returning /');
      return '/';
    }

    // Role hierarchy for redirect logic
    const roleHierarchy: { [key: string]: number } = {
      'user': 1,
      'staff': 2,
      'nurse': 3,
      'doctor': 4,
      'manager': 5,
      'admin': 6
    };

    // Get the highest role level
    const roleLevels = user.roles.map(role => roleHierarchy[role] || 0);
    const userRoleLevel = Math.max(...roleLevels);
    
    console.log('getRedirectPath: User roles:', user.roles);
    console.log('getRedirectPath: Role levels:', roleLevels);
    console.log('getRedirectPath: Max role level:', userRoleLevel);
    
    // Admin users go to admin dashboard
    if (userRoleLevel >= 6) {
      console.log('getRedirectPath: Admin user, redirecting to /admin');
      return '/admin';
    }
    // Managers go to admin dashboard
    else if (userRoleLevel >= 5) {
      console.log('getRedirectPath: Manager user, redirecting to /admin');
      return '/admin';
    }
    // Regular users go to their personal dashboard
    else {
      const userPath = `/${user.username}`;
      console.log(`getRedirectPath: Regular user, redirecting to ${userPath}`);
      return userPath;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    getRedirectPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Mock user for backward compatibility with existing API calls
export const mockUser = {
  username: "doctor.tran",
  role: "doctor",
};

// Keep the old context for any existing usage
export const MockAuthContext = createContext(mockUser);
export const useMockUser = () => useContext(MockAuthContext);
