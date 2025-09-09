import express from 'express';
import Behavior from '../models/Behavior.js';

const router = express.Router();

// POST / - Store user behavior data
router.post('/', async (req, res) => {
  try {
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

    // Create new behavior record using PostgreSQL
    const behavior = new Behavior(req.app.locals.pool);
    const savedBehavior = await behavior.create(behaviorData);
    
    console.log(`📊 Behavior tracked: ${behaviorData.username} - ${behaviorData.action}`);
    
    res.status(201).json({
      message: 'Behavior data stored successfully',
      id: savedBehavior.id,
      data: savedBehavior
    });

  } catch (error) {
    console.error('Error storing behavior data:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ 
        error: 'Duplicate entry',
        details: error.message
      });
    }
    
    res.status(500).json({ error: 'Failed to store behavior data' });
  }
});

// GET / - Retrieve user behavior data
router.get('/', async (req, res) => {
  try {
    const { 
      username, 
      limit = 100, 
      skip = 0, 
      startDate, 
      endDate,
      riskLevel,
      action 
    } = req.query;
    
    // Build query filter
    const filter = {};
    if (username) filter.username = username;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (action) filter.action = action;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);

    // Query with PostgreSQL
    const behavior = new Behavior(req.app.locals.pool);
    const behaviorData = await behavior.find(filter, {
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    const totalCount = await behavior.count(filter);

    res.json({
      data: behaviorData,
      count: behaviorData.length,
      totalCount: totalCount,
      filter: filter,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalCount > (parseInt(skip) + behaviorData.length)
      }
    });

  } catch (error) {
    console.error('Error retrieving behavior data:', error);
    res.status(500).json({ error: 'Failed to retrieve behavior data' });
  }
});

// GET /analytics - Get analytics summary
router.get('/analytics', async (req, res) => {
  try {
    const { username, days = 7 } = req.query;
    
    const matchFilter = {};
    if (username) matchFilter.username = username;

    // Use PostgreSQL aggregation
    const behavior = new Behavior(req.app.locals.pool);
    const analytics = await behavior.getAnalytics(matchFilter, parseInt(days));
    const topActions = await behavior.getTopActions(matchFilter, parseInt(days), 10);
    
    res.json({
      analytics: {
        totalEvents: parseInt(analytics.total_events) || 0,
        uniqueUserCount: parseInt(analytics.unique_user_count) || 0,
        uniqueSessionCount: parseInt(analytics.unique_session_count) || 0,
        avgRiskScore: parseFloat(analytics.avg_risk_score) || 0,
        riskDistribution: {
          low: parseInt(analytics.low_risk_count) || 0,
          medium: parseInt(analytics.medium_risk_count) || 0,
          high: parseInt(analytics.high_risk_count) || 0
        },
        topActions: topActions.map(action => ({
          action: action.action,
          count: parseInt(action.count)
        }))
      },
      period: `Last ${days} days`,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retrieving analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// DELETE / - Clear behavior data (for testing)
router.delete('/', async (req, res) => {
  try {
    const { username, confirm } = req.query;
    
    // Safety check
    if (confirm !== 'true') {
      return res.status(400).json({ 
        error: 'Deletion confirmation required',
        message: 'Add ?confirm=true to confirm deletion'
      });
    }
    
    const filter = username ? { username } : {};
    const behavior = new Behavior(req.app.locals.pool);
    const result = await behavior.deleteMany(filter);
    
    console.log(`🗑️ Deleted ${result.deletedCount} behavior records`);
    
    res.json({
      message: `Deleted ${result.deletedCount} behavior records`,
      deletedCount: result.deletedCount,
      filter: filter
    });

  } catch (error) {
    console.error('Error deleting behavior data:', error);
    res.status(500).json({ error: 'Failed to delete behavior data' });
  }
});

// GET /stats - Quick statistics
router.get('/stats', async (req, res) => {
  try {
    const behavior = new Behavior(req.app.locals.pool);
    const totalRecords = await behavior.count();
    const behaviorData = await behavior.find({}, { limit: 1 });
    const uniqueUsers = await behavior.distinct('username');
    const uniqueSessions = await behavior.distinct('session_id');
    
    res.json({
      totalRecords,
      uniqueUsers: uniqueUsers.length,
      uniqueSessions: uniqueSessions.length,
      latestRecord: behaviorData[0] || null,
      tableName: 'user_behavior',
      databaseName: 'hospital_analytics'
    });
    
  } catch (error) {
    console.error('Error retrieving stats:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

export default router;