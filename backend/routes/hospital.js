import express from 'express';

const router = express.Router();

// Helper function to get PostgreSQL client
const getClient = async (pool) => {
  return await pool.connect();
};

// Get all hospital users (aggregated from user_behavior)
router.get('/users', async (req, res) => {
  try {
    const client = await getClient(req.app.locals.pool);
    
    // Aggregate users from user_behavior to get unique users with their latest data
    const query = `
      SELECT 
        user_id as id,
        username as name,
        email,
        roles,
        MAX(timestamp) as last_active,
        COUNT(*) as total_activities,
        AVG(risk_score) as avg_risk_score,
        (ARRAY_AGG(risk_level ORDER BY timestamp DESC))[1] as last_risk_level,
        (ARRAY_AGG(ip_address ORDER BY timestamp DESC))[1] as last_ip_address,
        CASE 
          WHEN 'admin' = ANY(roles) THEN 'Administration'
          WHEN 'doctor' = ANY(roles) THEN 'Medical'
          WHEN 'nurse' = ANY(roles) THEN 'Nursing'
          ELSE 'General'
        END as department,
        CASE 
          WHEN 'admin' = ANY(roles) THEN 'Admin'
          WHEN 'manager' = ANY(roles) THEN 'Manager'
          WHEN 'employee' = ANY(roles) THEN 'Employee'
          ELSE 'User'
        END as role,
        CASE 
          WHEN MAX(timestamp) >= NOW() - INTERVAL '24 hours' THEN 'active'
          ELSE 'inactive'
        END as status,
        ROUND(AVG(risk_score) * 100) as risk_score
      FROM user_behavior 
      GROUP BY user_id, username, email, roles
      ORDER BY last_active DESC
    `;

    const result = await client.query(query);
    client.release();

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
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
    const client = await getClient(req.app.locals.pool);
    
    const query = `
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN user_id END) as active_users,
        COUNT(DISTINCT CASE WHEN timestamp < NOW() - INTERVAL '24 hours' THEN user_id END) as inactive_users,
        COUNT(DISTINCT CASE WHEN risk_level = 'high' OR risk_score >= 0.7 THEN user_id END) as high_risk_users
      FROM user_behavior
    `;

    const result = await client.query(query);
    client.release();

    res.json({
      success: true,
      data: {
        total: parseInt(result.rows[0].total_users),
        active: parseInt(result.rows[0].active_users),
        inactive: parseInt(result.rows[0].inactive_users),
        highRisk: parseInt(result.rows[0].high_risk_users)
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
    const client = await getClient(req.app.locals.pool);
    
    let query = `
      SELECT 
        id,
        user_id as user_id,
        username,
        email,
        roles,
        action,
        timestamp,
        ROUND(risk_score * 100) as risk_score,
        risk_level,
        ip_address,
        user_agent,
        session_id,
        session_period,
        metadata,
        created_at,
        updated_at
      FROM user_behavior
    `;
    
    const values = [];
    let paramCount = 0;
    
    if (userId) {
      query += ` WHERE user_id = $${++paramCount}`;
      values.push(userId);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${++paramCount}`;
    values.push(parseInt(limit));

    const result = await client.query(query, values);
    client.release();

    const formattedActivities = result.rows.map(activity => ({
      id: activity.id.toString(),
      userId: activity.user_id,
      user: activity.username,
      username: activity.username,
      email: activity.email || '',
      roles: activity.roles || [],
      action: activity.action || 'Unknown activity',
      timestamp: activity.timestamp,
      riskScore: activity.risk_score,
      risk: activity.risk_level || 'low',
      riskLevel: activity.risk_level || 'low',
      ipAddress: activity.ip_address,
      userAgent: activity.user_agent || '',
      sessionId: activity.session_id,
      sessionPeriod: activity.session_period || 0,
      metadata: activity.metadata || {},
      createdAt: activity.created_at,
      updatedAt: activity.updated_at
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
    const client = await getClient(req.app.locals.pool);
    
    const query = `
      SELECT 
        id,
        user_id,
        username,
        action,
        timestamp,
        ROUND(risk_score * 100) as risk_score,
        risk_level,
        ip_address,
        user_agent,
        metadata
      FROM user_behavior
      WHERE risk_level = 'high' OR risk_level = 'critical' OR risk_score >= 0.7
      ORDER BY timestamp DESC
      LIMIT $1
    `;

    const result = await client.query(query, [parseInt(limit)]);
    client.release();

    const formattedEvents = result.rows.map(event => ({
      id: event.id.toString(),
      userId: event.user_id,
      username: event.username,
      action: event.action || 'Security event',
      timestamp: event.timestamp,
      riskScore: event.risk_score,
      riskLevel: event.risk_level || 'high',
      ipAddress: event.ip_address,
      userAgent: event.user_agent,
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
    const client = await getClient(req.app.locals.pool);
    
    const query = `
      SELECT 
        user_id,
        username,
        email,
        (ARRAY_AGG(risk_score ORDER BY timestamp DESC))[1] as current_risk_score,
        (ARRAY_AGG(risk_level ORDER BY timestamp DESC))[1] as current_risk_level,
        AVG(risk_score) as avg_risk_score,
        COUNT(*) as total_activities,
        MAX(timestamp) as last_activity,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'timestamp', timestamp,
            'riskScore', risk_score,
            'action', action
          ) ORDER BY timestamp DESC
        ) as risk_history
      FROM user_behavior 
      WHERE user_id = $1
      GROUP BY user_id, username, email
    `;

    const result = await client.query(query, [userId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userRisk = result.rows[0];
    
    res.json({
      success: true,
      data: {
        userId: userRisk.user_id,
        username: userRisk.username,
        email: userRisk.email,
        currentRiskScore: Math.round((userRisk.current_risk_score || 0) * 100),
        currentRiskLevel: userRisk.current_risk_level,
        averageRiskScore: Math.round((userRisk.avg_risk_score || 0) * 100),
        totalActivities: userRisk.total_activities,
        lastActivity: userRisk.last_activity,
        riskHistory: userRisk.risk_history.slice(0, 20) // Last 20 activities
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
    const client = await getClient(req.app.locals.pool);
    
    const query = `
      SELECT 
        user_id,
        username,
        email,
        (ARRAY_AGG(risk_score ORDER BY timestamp DESC))[1] as risk_score,
        (ARRAY_AGG(risk_level ORDER BY timestamp DESC))[1] as risk_level,
        MAX(timestamp) as last_activity,
        COUNT(*) as total_high_risk_activities
      FROM user_behavior
      WHERE risk_level = 'high' OR risk_level = 'critical' OR risk_score >= 0.7
      GROUP BY user_id, username, email
      ORDER BY risk_score DESC
    `;

    const result = await client.query(query);
    client.release();

    const formattedUsers = result.rows.map(user => ({
      id: user.user_id,
      username: user.username,
      email: user.email,
      riskScore: Math.round((user.risk_score || 0) * 100),
      riskLevel: user.risk_level,
      lastActivity: user.last_activity,
      totalHighRiskActivities: user.total_high_risk_activities
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
    const client = await getClient(req.app.locals.pool);
    
    const query = `
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN user_id END) as active_users,
        COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN 1 END) as total_activities,
        COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '7 days' AND (risk_level = 'high' OR risk_level = 'critical' OR risk_score >= 0.7) THEN 1 END) as high_risk_events,
        ROUND(AVG(risk_score) * 100) as average_risk_score
      FROM user_behavior
    `;

    const result = await client.query(query);
    client.release();

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(result.rows[0].total_users),
        activeUsers: parseInt(result.rows[0].active_users),
        totalActivities: parseInt(result.rows[0].total_activities),
        highRiskEvents: parseInt(result.rows[0].high_risk_events),
        averageRiskScore: parseInt(result.rows[0].average_risk_score),
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