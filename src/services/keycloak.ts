import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'demo',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'demo-client',
};

// Create Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Initialize Keycloak
export const initKeycloak = async (): Promise<boolean> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso', // Check if user is already logged in
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256', // Use PKCE for security
    });
    
    console.log('Keycloak initialized. Authenticated:', authenticated);
    return authenticated;
  } catch (error) {
    console.error('Failed to initialize Keycloak:', error);
    return false;
  }
};

// Login function
export const login = () => {
  keycloak.login({
    redirectUri: window.location.origin,
  });
};

// Logout function
export const logout = () => {
  // Use the root path as redirect URI for better compatibility
  const redirectUri = `${window.location.origin}/`;
  console.log('Logging out with redirect URI:', redirectUri);
  
  keycloak.logout({
    redirectUri: redirectUri,
  });
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!keycloak.authenticated;
};

// Get user info
export const getUserInfo = () => {
  if (keycloak.tokenParsed) {
    return {
      username: keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.sub,
      email: keycloak.tokenParsed.email,
      firstName: keycloak.tokenParsed.given_name,
      lastName: keycloak.tokenParsed.family_name,
      roles: keycloak.tokenParsed.realm_access?.roles || [],
    };
  }
  return null;
};

// Get access token
export const getToken = (): string | undefined => {
  return keycloak.token;
};

// Update token if it's about to expire
export const updateToken = async (minValidity = 5): Promise<boolean> => {
  try {
    const refreshed = await keycloak.updateToken(minValidity);
    if (refreshed) {
      console.log('Token refreshed');
    }
    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
};

// Token refresh callback
keycloak.onTokenExpired = () => {
  console.log('Token expired, attempting to refresh...');
  updateToken();
};

export default keycloak; 