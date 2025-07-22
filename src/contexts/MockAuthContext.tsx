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
          if (userInfo) {
            const userData = {
              username: userInfo.username,
              email: userInfo.email,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              roles: userInfo.roles,
            };
            
            setUser(userData);
            setIsAuthenticated(true);
            
            // Cache auth state
            sessionStorage.setItem('hospital_user', JSON.stringify(userData));
            sessionStorage.setItem('hospital_authenticated', 'true');
            
            console.log('User authenticated:', userInfo);
            
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

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
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
