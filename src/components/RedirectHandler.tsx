import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/MockAuthContext';

const RedirectHandler = () => {
  const { user, isAuthenticated, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 RedirectHandler - Current state:', {
      isAuthenticated,
      user: user ? { username: user.username, roles: user.roles } : null,
      pathname: location.pathname
    });
    
    // Only redirect if user is authenticated and has user data
    if (isAuthenticated && user && user.roles) {
      const redirectPath = getRedirectPath();
      
      console.log(`🎯 RedirectHandler - Current path: ${location.pathname}, Target path: ${redirectPath}`);
      
      // Force redirect if on homepage and target path is different
      if (location.pathname === '/' && redirectPath !== '/') {
        console.log(`🚀 RedirectHandler - FORCING REDIRECT: ${user.username} [${user.roles.join(', ')}] → ${redirectPath}`);
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100); // Small delay to ensure auth is fully loaded
      }
      // Don't redirect if user is already on the correct path
      else if (location.pathname === redirectPath) {
        console.log(`✅ RedirectHandler - User already on correct path: ${location.pathname}`);
      }
    } else {
      console.log('❌ RedirectHandler - Not redirecting because:', {
        authenticated: isAuthenticated,
        hasUser: !!user,
        hasRoles: user?.roles?.length > 0,
        currentPath: location.pathname
      });
    }
  }, [isAuthenticated, user, location.pathname, getRedirectPath, navigate]);

  return null; // This component doesn't render anything
};

export default RedirectHandler;
