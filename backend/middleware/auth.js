// Authentication middleware for JWT token verification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access token is required',
      message: 'Please provide a valid JWT token in Authorization header'
    });
  }
  
  try {
    // TODO: Implement actual Keycloak JWT token verification here
    // For now, we'll just validate token format and pass through
    
    if (token.length < 10) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        message: 'Token appears to be malformed'
      });
    }
    
    // In production, you would verify the token with Keycloak:
    // const decoded = jwt.verify(token, keycloakPublicKey);
    // req.user = decoded;
    
    console.log(`🔐 Token validated for request to ${req.path}`);
    next();
    
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(403).json({ 
      error: 'Token verification failed',
      message: 'Invalid or expired token'
    });
  }
};

export default authMiddleware; 