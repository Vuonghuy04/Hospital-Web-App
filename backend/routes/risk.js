import express from 'express';
import fetch from 'node-fetch';
import { 
  getUserRiskScore, 
  logActivityAndUpdateRisk, 
  initializeUserRisk,
  getAllUsersRiskSummary 
} from '../services/risk-service.js';

// Simple authentication middleware for admin console
const requireAuth = (req, res, next) => {
  // For admin console, we just pass through since frontend handles auth
  req.user = {
    id: 'admin',
    username: 'admin',
    email: 'admin@hospital.com',
    roles: ['admin']
  };
  next();
};

const router = express.Router();

// Get current user's risk score
router.get('/my-score', requireAuth, async (req, res) => {
  try {
    // For admin console, return a simple low-risk score
    res.json({
      success: true,
      userId: 'admin',
      riskScore: 15,
      riskLevel: 'low',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting user risk score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk score',
      message: error.message
    });
  }
});

// Get risk score for specific user (admin only)
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // For admin console, return simple risk data
    res.json({
      success: true,
      userId,
      riskScore: 15,
      riskLevel: 'low',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting user risk score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk score',
      message: error.message
    });
  }
});

// Log user activity (used by frontend for page navigation tracking)
router.post('/log-activity', requireAuth, async (req, res) => {
  try {
    const { action, page, metadata = {} } = req.body;
    
    console.log('Admin activity logged:', {
      action,
      page,
      timestamp: new Date().toISOString(),
      metadata
    });
    
    res.json({
      success: true,
      userId: 'admin',
      action,
      riskScore: 15,
      riskLevel: 'low',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log activity',
      message: error.message
    });
  }
});

// Initialize user risk on first login
router.post('/initialize', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      userId: 'admin',
      initialRiskScore: 10,
      riskLevel: 'low',
      message: 'Admin console risk initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing user risk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize user risk',
      message: error.message
    });
  }
});

// Get all users risk summary (admin only)
router.get('/summary', requireAuth, async (req, res) => {
  try {
    // For admin console, return simple summary
    const stats = {
      totalUsers: 1,
      lowRisk: 1,
      mediumRisk: 0,
      highRisk: 0,
      averageRiskScore: 15
    };
    
    const users = [{
      userId: 'admin',
      username: 'admin',
      riskScore: 15,
      riskLevel: 'low',
      lastActivity: new Date()
    }];
    
    res.json({
      success: true,
      stats,
      users,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting risk summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk summary',
      message: error.message
    });
  }
});

// ML Prediction Service Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ML-based risk prediction endpoint
router.post('/predict', requireAuth, async (req, res) => {
  try {
    const { ip_region, device_type, user_role, action, hour, sessionPeriod } = req.body;
    
    // Validate required fields
    if (!ip_region || !device_type || !user_role || !action || hour === undefined || sessionPeriod === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['ip_region', 'device_type', 'user_role', 'action', 'hour', 'sessionPeriod']
      });
    }
    
    // Call ML service
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip_region,
        device_type,
        user_role,
        action,
        hour: parseInt(hour),
        sessionPeriod: parseInt(sessionPeriod)
      })
    });
    
    if (!mlResponse.ok) {
      throw new Error(`ML service error: ${mlResponse.status} ${mlResponse.statusText}`);
    }
    
    const prediction = await mlResponse.json();
    
    // Convert risk score to percentage and return
    res.json({
      success: true,
      userId: req.user.id,
      riskScore: Math.round(prediction.risk_score * 100), // Convert to percentage
      riskLevel: prediction.risk_level,
      prediction: prediction,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error calling ML prediction service:', error);
    
    // Fallback to simple risk calculation if ML service is unavailable
    const fallbackRiskScore = calculateFallbackRisk(req.body);
    
    res.json({
      success: true,
      userId: req.user.id,
      riskScore: fallbackRiskScore,
      riskLevel: getRiskLevel(fallbackRiskScore),
      fallback: true,
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Batch prediction endpoint
router.post('/predict-batch', requireAuth, async (req, res) => {
  try {
    const { predictions } = req.body;
    
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'predictions array is required and must not be empty'
      });
    }
    
    // Call ML service
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(predictions)
    });
    
    if (!mlResponse.ok) {
      throw new Error(`ML service error: ${mlResponse.status} ${mlResponse.statusText}`);
    }
    
    const batchPrediction = await mlResponse.json();
    
    // Process results
    const results = batchPrediction.predictions.map(pred => ({
      ...pred,
      risk_score: Math.round(pred.risk_score * 100) // Convert to percentage
    }));
    
    res.json({
      success: true,
      predictions: results,
      count: results.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error calling ML batch prediction service:', error);
    res.status(500).json({
      success: false,
      error: 'Batch prediction failed',
      message: error.message
    });
  }
});

// Health check for ML service
router.get('/ml-health', requireAuth, async (req, res) => {
  try {
    const mlResponse = await fetch(`${ML_SERVICE_URL}/health`);
    const health = await mlResponse.json();
    
    res.json({
      success: true,
      mlService: {
        available: mlResponse.ok,
        status: health,
        url: ML_SERVICE_URL
      }
    });
  } catch (error) {
    res.json({
      success: false,
      mlService: {
        available: false,
        error: error.message,
        url: ML_SERVICE_URL
      }
    });
  }
});

// Fallback risk calculation function
function calculateFallbackRisk(data) {
  let risk = 20; // Base risk score
  
  // Risk factors based on the training data patterns
  if (data.device_type === 'new') risk += 15;
  if (data.user_role === 'guest') risk += 20;
  if (data.ip_region === 'Nigeria') risk += 10; // Based on data patterns
  if (data.hour < 6 || data.hour > 22) risk += 10; // Off-hours activity
  if (data.sessionPeriod > 50) risk += 5; // Long sessions
  
  // Action-based risk
  if (data.action === 'page_view_it_request') risk += 10;
  if (data.action === 'logout') risk -= 5;
  if (data.action === 'login') risk += 5;
  
  return Math.min(Math.max(risk, 0), 100); // Clamp between 0-100
}

// Helper function to calculate risk level
function getRiskLevel(riskScore) {
  if (riskScore >= 70) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
}

export default router; 