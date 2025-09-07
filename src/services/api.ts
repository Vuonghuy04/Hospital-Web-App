import { mockUser } from '../contexts/MockAuthContext';
import { getToken, getUserInfo } from './keycloak';

export const logAction = async (action: string, resource: string) => {
  const userInfo = getUserInfo();
  const username = userInfo?.username || mockUser.username;
  
  console.log('🪵 LOG:', {
    user: username,
    action,
    resource,
    timestamp: new Date().toISOString(),
  });
};

export const sendJITRequest = async () => {
  const userInfo = getUserInfo();
  const username = userInfo?.username || mockUser.username;
  
  console.log('📤 Sending JIT Request for user:', username);
  
  // Example of how to include authentication token in API calls
  const token = getToken();
  if (token) {
    console.log('🔑 Including authentication token in request');
    // You can use this token for actual API calls
    // Example:
    // const response = await fetch('/api/jit-request', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ username, reason: 'Hospital access' })
    // });
  }
  
  return { status: "requested" };
};
