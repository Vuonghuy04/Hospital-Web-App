import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to get MongoDB collections
const getCollection = (collectionName) => {
  return mongoose.connection.db.collection(collectionName);
};

// Get all hospital users (aggregated from user_behavior)
router.get('/users', async (req, res) => {
  try {
    const userBehaviorCollection = getCollection('user_behavior');
    
    // Aggregate users from user_behavior to get unique users with their latest data
    const pipeline = [
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$userId",
          name: { $first: "$username" },
          email: { $first: "$email" },
          roles: { $first: "$roles" },
          lastActive: { $first: "$timestamp" },
          totalActivities: { $sum: 1 },
          avgRiskScore: { $avg: "$riskScore" },
          lastRiskLevel: { $first: "$riskLevel" },
          lastIpAddress: { $first: "$ipAddress" }
        }
      },
      {
        $project: {
          id: "$_id",
          name: "$name",
          email: "$email",
          department: {
            $cond: {
              if: { $in: ["admin", "$roles"] },
              then: "Administration",
              else: {
                $cond: {
                  if: { $in: ["doctor", "$roles"] },
                  then: "Medical",
                  else: {
                    $cond: {
                      if: { $in: ["nurse", "$roles"] },
                      then: "Nursing",
                      else: "General"
                    }
                  }
                }
              }
            }
          },
          role: {
            $cond: {
              if: { $in: ["admin", "$roles"] },
              then: "Admin",
              else: {
                $cond: {
                  if: { $in: ["manager", "$roles"] },
                  then: "Manager",
                  else: {
                    $cond: {
                      if: { $in: ["employee", "$roles"] },
                      then: "Employee",
                      else: "User"
                    }
                  }
                }
              }
            }
          },
          status: {
            $cond: {
              if: { $gte: ["$lastActive", { $subtract: [new Date(), 24 * 60 * 60 * 1000] }] },
              then: "active",
              else: "inactive"
            }
          },
          riskLevel: "$lastRiskLevel",
          riskScore: { $round: [{ $multiply: ["$avgRiskScore", 100] }, 0] },
          lastActive: "$lastActive",
          totalActivities: "$totalActivities"
        }
      },
      { $sort: { lastActive: -1 } }
    ];

    const users = await userBehaviorCollection.aggregate(pipeline).toArray();

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
      message: error.message
    });
  }
});

// Get user statistics
router.get('/users/stats', async (req, res) => {
  try {
    const userBehaviorCollection = getCollection('user_behavior');
    
    const pipeline = [
      {
        $group: {
          _id: "$userId",
          lastActive: { $max: "$timestamp" },
          avgRiskScore: { $avg: "$riskScore" },
          riskLevel: { $last: "$riskLevel" }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                { $gte: ["$lastActive", { $subtract: [new Date(), 24 * 60 * 60 * 1000] }] },
                1,
                0
              ]
            }
          },
          inactiveUsers: {
            $sum: {
              $cond: [
                { $lt: ["$lastActive", { $subtract: [new Date(), 24 * 60 * 60 * 1000] }] },
                1,
                0
              ]
            }
          },
          highRiskUsers: {
            $sum: {
              $cond: [
                { $eq: ["$riskLevel", "high"] },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    const result = await userBehaviorCollection.aggregate(pipeline).toArray();
    const stats = result[0] || {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      highRiskUsers: 0
    };

    // Remove the _id field
    delete stats._id;

    res.json({
      success: true,
      data: {
        total: stats.totalUsers,
        active: stats.activeUsers,
        inactive: stats.inactiveUsers,
        highRisk: stats.highRiskUsers
      }
    });
  } catch (error) {
    console.error('Error retrieving user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user statistics',
      message: error.message
    });
  }
});

// Get user activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 50, userId } = req.query;
    const userBehaviorCollection = getCollection('user_behavior');
    
    const filter = {};
    if (userId) {
      filter.userId = userId;
    }

    const activities = await userBehaviorCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    const formattedActivities = activities.map(activity => ({
      id: activity._id.toString(),
      userId: activity.userId,
      user: activity.username,
      username: activity.username,
      email: activity.email || '',
      roles: activity.roles || [],
      action: activity.action || 'Unknown activity',
      timestamp: activity.timestamp,
      riskScore: Math.round((activity.risk_score || 0) * 100), // Convert 0-1 scale to 0-100 scale
      risk: activity.riskLevel || 'low',
      riskLevel: activity.riskLevel || 'low',
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent || '',
      sessionId: activity.sessionId,
      sessionPeriod: activity.sessionPeriod || 0,
      metadata: activity.metadata || {},
      // Additional fields for better tracking
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error retrieving activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve activities',
      message: error.message
    });
  }
});

// Get security events (high-risk activities)
router.get('/security-events', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const userBehaviorCollection = getCollection('user_behavior');
    
    const securityEvents = await userBehaviorCollection
      .find({
        $or: [
          { riskLevel: "high" },
          { riskLevel: "critical" },
          { riskScore: { $gte: 0.7 } }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    const formattedEvents = securityEvents.map(event => ({
      id: event._id.toString(),
      userId: event.userId,
      username: event.username,
      action: event.action || 'Security event',
      timestamp: event.timestamp,
      riskScore: Math.round((event.riskScore || 0) * 100),
      riskLevel: event.riskLevel || 'high',
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata || {}
    }));

    res.json({
      success: true,
      data: formattedEvents
    });
  } catch (error) {
    console.error('Error retrieving security events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security events',
      message: error.message
    });
  }
});

// Get risk assessment for specific user
router.get('/risk-assessment/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userBehaviorCollection = getCollection('user_behavior');
    
    const pipeline = [
      { $match: { userId: userId } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$userId",
          username: { $first: "$username" },
          email: { $first: "$email" },
          currentRiskScore: { $first: "$riskScore" },
          currentRiskLevel: { $first: "$riskLevel" },
          avgRiskScore: { $avg: "$riskScore" },
          totalActivities: { $sum: 1 },
          lastActivity: { $first: "$timestamp" },
          riskHistory: { $push: { timestamp: "$timestamp", riskScore: "$riskScore", action: "$action" } }
        }
      }
    ];

    const result = await userBehaviorCollection.aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userRisk = result[0];
    
    res.json({
      success: true,
      data: {
        userId: userRisk._id,
        username: userRisk.username,
        email: userRisk.email,
        currentRiskScore: Math.round((userRisk.currentRiskScore || 0) * 100),
        currentRiskLevel: userRisk.currentRiskLevel,
        averageRiskScore: Math.round((userRisk.avgRiskScore || 0) * 100),
        totalActivities: userRisk.totalActivities,
        lastActivity: userRisk.lastActivity,
        riskHistory: userRisk.riskHistory.slice(0, 20) // Last 20 activities
      }
    });
  } catch (error) {
    console.error('Error retrieving risk assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve risk assessment',
      message: error.message
    });
  }
});

// Get high-risk users
router.get('/high-risk-users', async (req, res) => {
  try {
    const userBehaviorCollection = getCollection('user_behavior');
    
    const pipeline = [
      {
        $match: {
          $or: [
            { riskLevel: "high" },
            { riskLevel: "critical" },
            { riskScore: { $gte: 0.7 } }
          ]
        }
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$userId",
          username: { $first: "$username" },
          email: { $first: "$email" },
          riskScore: { $first: "$riskScore" },
          riskLevel: { $first: "$riskLevel" },
          lastActivity: { $first: "$timestamp" },
          totalHighRiskActivities: { $sum: 1 }
        }
      },
      { $sort: { riskScore: -1 } }
    ];

    const highRiskUsers = await userBehaviorCollection.aggregate(pipeline).toArray();

    const formattedUsers = highRiskUsers.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      riskScore: Math.round((user.riskScore || 0) * 100),
      riskLevel: user.riskLevel,
      lastActivity: user.lastActivity,
      totalHighRiskActivities: user.totalHighRiskActivities
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error retrieving high-risk users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve high-risk users',
      message: error.message
    });
  }
});

// Get dashboard metrics
router.get('/dashboard-metrics', async (req, res) => {
  try {
    const userBehaviorCollection = getCollection('user_behavior');
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get various metrics
    const totalUsers = await userBehaviorCollection.distinct('userId').then(users => users.length);
    const activeUsers = await userBehaviorCollection.distinct('userId', { timestamp: { $gte: oneDayAgo } }).then(users => users.length);
    const totalActivities = await userBehaviorCollection.countDocuments({ timestamp: { $gte: oneDayAgo } });
    const highRiskEvents = await userBehaviorCollection.countDocuments({ 
      timestamp: { $gte: oneWeekAgo },
      $or: [
        { riskLevel: "high" },
        { riskLevel: "critical" },
        { riskScore: { $gte: 0.7 } }
      ]
    });

    // Calculate average risk score
    const riskPipeline = [
      { $group: { _id: null, avgRisk: { $avg: "$riskScore" } } }
    ];
    const riskResult = await userBehaviorCollection.aggregate(riskPipeline).toArray();
    const avgRiskScore = riskResult[0]?.avgRisk || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalActivities,
        highRiskEvents,
        averageRiskScore: Math.round(avgRiskScore * 100),
        uptime: "99.9%", // Mock uptime
        lastUpdate: new Date()
      }
    });
  } catch (error) {
    console.error('Error retrieving dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard metrics',
      message: error.message
    });
  }
});

export default router; 