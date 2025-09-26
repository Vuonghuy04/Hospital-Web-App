import express from 'express';
import MLRiskService from '../services/ml-risk-service.js';

const router = express.Router();

// POST /api/ml-risk/predict/single - Predict risk for single record
router.post('/predict/single', async (req, res) => {
  try {
    const mlRiskService = new MLRiskService(req.app.locals.pool);
    
    const recordData = req.body;
    if (!recordData) {
      return res.status(400).json({ 
        error: 'No data provided',
        message: 'Please provide record data for prediction'
      });
    }

    const prediction = await mlRiskService.predictSingleRiskScore(recordData);
    
    res.json({
      success: prediction.success,
      riskScore: prediction.riskScore || prediction.fallbackScore,
      riskLevel: prediction.riskLevel || prediction.fallbackLevel,
      mlPrediction: prediction.success,
      error: prediction.error || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in single risk prediction:', error);
    res.status(500).json({ 
      error: 'Prediction failed',
      message: error.message 
    });
  }
});

// POST /api/ml-risk/update-all - Update risk scores for all records
router.post('/update-all', async (req, res) => {
  try {
    const mlRiskService = new MLRiskService(req.app.locals.pool);
    
    console.log('🚀 Starting bulk risk score update...');
    const result = await mlRiskService.updateAllRiskScores();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        statistics: {
          updated: result.updated,
          total: result.total,
          predictions: result.predictions
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        updated: result.updated,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error in bulk risk update:', error);
    res.status(500).json({ 
      error: 'Bulk update failed',
      message: error.message 
    });
  }
});

// GET /api/ml-risk/status - Get ML service and model status
router.get('/status', async (req, res) => {
  try {
    const mlRiskService = new MLRiskService(req.app.locals.pool);
    
    const healthCheck = await mlRiskService.checkMLServiceHealth();
    const statistics = await mlRiskService.getRiskStatistics();
    
    res.json({
      mlService: {
        available: healthCheck.available,
        trained: healthCheck.trained,
        error: healthCheck.error || null,
        status: healthCheck.status || null
      },
      statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting ML risk status:', error);
    res.status(500).json({ 
      error: 'Failed to get status',
      message: error.message 
    });
  }
});

// POST /api/ml-risk/train - Train the ML model
router.post('/train', async (req, res) => {
  try {
    const mlRiskService = new MLRiskService(req.app.locals.pool);
    
    console.log('🎓 Starting ML model training...');
    const result = await mlRiskService.trainModel();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Model trained successfully',
        result: result.result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Model training failed',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error training model:', error);
    res.status(500).json({ 
      error: 'Training failed',
      message: error.message 
    });
  }
});

// POST /api/ml-risk/behavior - Create behavior record with ML risk prediction
router.post('/behavior', async (req, res) => {
  try {
    const mlRiskService = new MLRiskService(req.app.locals.pool);
    
    const behaviorData = {
      ...req.body,
      timestamp: new Date()
    };

    // Validate required fields
    const requiredFields = ['username', 'userId', 'action', 'sessionId'];
    for (const field of requiredFields) {
      if (!behaviorData[field]) {
        return res.status(400).json({ 
          error: `Missing required field: ${field}`,
          requiredFields: requiredFields
        });
      }
    }

    const savedBehavior = await mlRiskService.createBehaviorWithMLRisk(behaviorData);
    
    res.status(201).json({
      message: 'Behavior data stored with ML risk prediction',
      id: savedBehavior.id,
      riskScore: savedBehavior.risk_score,
      riskLevel: savedBehavior.risk_level,
      mlPrediction: savedBehavior.metadata?.mlPrediction || false,
      data: savedBehavior
    });

  } catch (error) {
    console.error('Error creating behavior with ML risk:', error);
    res.status(500).json({ 
      error: 'Failed to create behavior record',
      message: error.message 
    });
  }
});

// GET /api/ml-risk/high-risk-users - Get users with high risk scores
router.get('/high-risk-users', async (req, res) => {
  try {
    const { limit = 50, days = 7 } = req.query;
    const client = await req.app.locals.pool.connect();
    
    const query = `
      SELECT 
        username,
        user_id,
        AVG(risk_score) as avg_risk_score,
        MAX(risk_score) as max_risk_score,
        COUNT(*) as activity_count,
        MAX(timestamp) as last_activity,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_actions
      FROM user_behavior 
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
        AND username IS NOT NULL
      GROUP BY username, user_id
      HAVING AVG(risk_score) >= 0.6 OR COUNT(CASE WHEN risk_level = 'high' THEN 1 END) > 0
      ORDER BY avg_risk_score DESC, high_risk_actions DESC
      LIMIT $1
    `;
    
    const result = await client.query(query, [parseInt(limit)]);
    client.release();
    
    const highRiskUsers = result.rows.map(user => ({
      username: user.username,
      userId: user.user_id,
      avgRiskScore: parseFloat(user.avg_risk_score),
      maxRiskScore: parseFloat(user.max_risk_score),
      activityCount: parseInt(user.activity_count),
      highRiskActions: parseInt(user.high_risk_actions),
      lastActivity: user.last_activity,
      riskLevel: parseFloat(user.avg_risk_score) >= 0.7 ? 'high' : 'medium'
    }));
    
    res.json({
      highRiskUsers,
      count: highRiskUsers.length,
      period: `Last ${days} days`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting high risk users:', error);
    res.status(500).json({ 
      error: 'Failed to get high risk users',
      message: error.message 
    });
  }
});

// GET /api/ml-risk/analytics - Get risk analytics dashboard data
router.get('/analytics', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const client = await req.app.locals.pool.connect();
    
    // Risk distribution over time
    const timeSeriesQuery = `
      SELECT 
        DATE(timestamp) as date,
        AVG(risk_score) as avg_risk_score,
        COUNT(*) as total_events,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_events
      FROM user_behavior 
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(timestamp)
      ORDER BY date
    `;
    
    // Risk by action type
    const actionRiskQuery = `
      SELECT 
        action,
        AVG(risk_score) as avg_risk_score,
        COUNT(*) as frequency,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count
      FROM user_behavior 
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY action
      ORDER BY avg_risk_score DESC
      LIMIT 20
    `;
    
    // Overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_events,
        AVG(risk_score) as avg_risk_score,
        COUNT(DISTINCT username) as unique_users,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk_count,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN metadata->>'mlPrediction' = 'true' THEN 1 END) as ml_predictions
      FROM user_behavior 
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
    `;
    
    const [timeSeriesResult, actionRiskResult, statsResult] = await Promise.all([
      client.query(timeSeriesQuery),
      client.query(actionRiskQuery),
      client.query(statsQuery)
    ]);
    
    client.release();
    
    const timeSeries = timeSeriesResult.rows.map(row => ({
      date: row.date,
      avgRiskScore: parseFloat(row.avg_risk_score),
      totalEvents: parseInt(row.total_events),
      highRiskEvents: parseInt(row.high_risk_events)
    }));
    
    const actionRisk = actionRiskResult.rows.map(row => ({
      action: row.action,
      avgRiskScore: parseFloat(row.avg_risk_score),
      frequency: parseInt(row.frequency),
      highRiskCount: parseInt(row.high_risk_count)
    }));
    
    const stats = statsResult.rows[0];
    const overallStats = {
      totalEvents: parseInt(stats.total_events),
      avgRiskScore: parseFloat(stats.avg_risk_score) || 0,
      uniqueUsers: parseInt(stats.unique_users),
      riskDistribution: {
        low: parseInt(stats.low_risk_count),
        medium: parseInt(stats.medium_risk_count),
        high: parseInt(stats.high_risk_count)
      },
      mlPredictions: parseInt(stats.ml_predictions)
    };
    
    res.json({
      timeSeries,
      actionRisk,
      overallStats,
      period: `Last ${days} days`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting risk analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics',
      message: error.message 
    });
  }
});

export default router;
