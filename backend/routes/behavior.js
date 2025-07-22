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

    // Create new behavior record using Mongoose
    const behavior = new Behavior(behaviorData);
    const savedBehavior = await behavior.save();
    
    console.log(`📊 Behavior tracked: ${behaviorData.username} - ${behaviorData.action}`);
    
    res.status(201).json({
      message: 'Behavior data stored successfully',
      id: savedBehavior._id,
      data: savedBehavior
    });

  } catch (error) {
    console.error('Error storing behavior data:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
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
    if (action) filter.action = { $regex: action, $options: 'i' }; // Case insensitive search
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Query with Mongoose
    const behaviorData = await Behavior
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean(); // Return plain objects for better performance

    const totalCount = await Behavior.countDocuments(filter);

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
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const matchFilter = { timestamp: { $gte: startDate } };
    if (username) matchFilter.username = username;

    // Use Mongoose aggregation pipeline
    const analytics = await Behavior.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          uniqueUsers: { $addToSet: '$username' },
          avgRiskScore: { $avg: '$riskScore' },
          riskLevels: { $push: '$riskLevel' },
          actions: { $push: '$action' },
          sessionIds: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          totalEvents: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          uniqueSessionCount: { $size: '$sessionIds' },
          avgRiskScore: { $round: ['$avgRiskScore', 3] },
          riskDistribution: {
            low: {
              $size: {
                $filter: {
                  input: '$riskLevels',
                  cond: { $eq: ['$$this', 'low'] }
                }
              }
            },
            medium: {
              $size: {
                $filter: {
                  input: '$riskLevels',
                  cond: { $eq: ['$$this', 'medium'] }
                }
              }
            },
            high: {
              $size: {
                $filter: {
                  input: '$riskLevels',
                  cond: { $eq: ['$$this', 'high'] }
                }
              }
            }
          },
          topActions: {
            $slice: [
              {
                $map: {
                  input: { $setUnion: ['$actions'] },
                  as: 'action',
                  in: {
                    action: '$$action',
                    count: {
                      $size: {
                        $filter: {
                          input: '$actions',
                          cond: { $eq: ['$$this', '$$action'] }
                        }
                      }
                    }
                  }
                }
              },
              10
            ]
          }
        }
      }
    ]);
    
    res.json({
      analytics: analytics[0] || {
        totalEvents: 0,
        uniqueUserCount: 0,
        uniqueSessionCount: 0,
        avgRiskScore: 0,
        riskDistribution: { low: 0, medium: 0, high: 0 },
        topActions: []
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
    const result = await Behavior.deleteMany(filter);
    
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
    const totalRecords = await Behavior.countDocuments();
    const latestRecord = await Behavior.findOne().sort({ timestamp: -1 });
    const uniqueUsers = await Behavior.distinct('username');
    const uniqueSessions = await Behavior.distinct('sessionId');
    
    res.json({
      totalRecords,
      uniqueUsers: uniqueUsers.length,
      uniqueSessions: uniqueSessions.length,
      latestRecord,
      collectionName: Behavior.collection.name,
      databaseName: Behavior.db.name
    });
    
  } catch (error) {
    console.error('Error retrieving stats:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

export default router; 