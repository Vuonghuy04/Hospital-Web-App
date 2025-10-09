import express from 'express';

const router = express.Router();

// Helper function to get PostgreSQL client
const getClient = async (pool) => {
  return await pool.connect();
};

// Store enhanced audit event
router.post('/', async (req, res) => {
  try {
    const {
      id,
      timestamp,
      userId,
      username,
      email,
      roles,
      action,
      resource,
      resourceId,
      ipAddress,
      userAgent,
      sessionId,
      sessionDuration,
      riskScore,
      riskLevel,
      success,
      errorMessage,
      metadata,
      complianceFlags
    } = req.body;

    const client = await getClient(req.app.locals.pool);
    
    const query = `
      INSERT INTO enhanced_audit_events (
        event_id, timestamp, user_id, username, email, roles, action, resource, 
        resource_id, ip_address, user_agent, session_id, session_duration, 
        risk_score, risk_level, success, error_message, metadata, compliance_flags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `;
    
    const values = [
      id,
      new Date(timestamp),
      userId,
      username,
      email,
      roles || [],
      action,
      resource || null,
      resourceId || null,
      ipAddress,
      userAgent,
      sessionId,
      sessionDuration,
      riskScore,
      riskLevel,
      success,
      errorMessage || null,
      JSON.stringify(metadata || {}),
      JSON.stringify(complianceFlags || {})
    ];
    
    await client.query(query, values);
    client.release();
    
    res.json({
      success: true,
      message: 'Audit event stored successfully',
      eventId: id
    });
  } catch (error) {
    console.error('Error storing enhanced audit event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store audit event',
      message: error.message
    });
  }
});

// Get enhanced audit events with filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      riskLevel,
      startDate,
      endDate,
      category,
      complianceFlag
    } = req.query;
    
    const client = await getClient(req.app.locals.pool);
    
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;
    
    if (userId) {
      paramCount++;
      whereConditions.push(`user_id = $${paramCount}`);
      queryParams.push(userId);
    }
    
    if (action) {
      paramCount++;
      whereConditions.push(`action ILIKE $${paramCount}`);
      queryParams.push(`%${action}%`);
    }
    
    if (riskLevel) {
      paramCount++;
      whereConditions.push(`risk_level = $${paramCount}`);
      queryParams.push(riskLevel);
    }
    
    if (startDate) {
      paramCount++;
      whereConditions.push(`timestamp >= $${paramCount}`);
      queryParams.push(new Date(startDate));
    }
    
    if (endDate) {
      paramCount++;
      whereConditions.push(`timestamp <= $${paramCount}`);
      queryParams.push(new Date(endDate));
    }
    
    if (complianceFlag) {
      paramCount++;
      whereConditions.push(`compliance_flags->>'${complianceFlag}' = 'true'`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM enhanced_audit_events ${whereClause}`;
    const countResult = await client.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    paramCount++;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT * FROM enhanced_audit_events 
      ${whereClause}
      ORDER BY timestamp DESC 
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    queryParams.push(parseInt(limit), offset);
    const result = await client.query(dataQuery, queryParams);
    client.release();
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error retrieving enhanced audit events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit events',
      message: error.message
    });
  }
});

// Get audit statistics
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const client = await getClient(req.app.locals.pool);
    
    let dateFilter = '';
    let queryParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE timestamp BETWEEN $1 AND $2';
      queryParams = [new Date(startDate), new Date(endDate)];
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_events,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_events,
        COUNT(CASE WHEN compliance_flags->>'hipaaRelevant' = 'true' THEN 1 END) as hipaa_events,
        COUNT(CASE WHEN compliance_flags->>'patientDataAccess' = 'true' THEN 1 END) as patient_data_events,
        COUNT(CASE WHEN compliance_flags->>'adminAction' = 'true' THEN 1 END) as admin_events,
        COUNT(CASE WHEN compliance_flags->>'securityEvent' = 'true' THEN 1 END) as security_events,
        ROUND(AVG(risk_score), 2) as avg_risk_score
      FROM enhanced_audit_events 
      ${dateFilter}
    `;
    
    const result = await client.query(query, queryParams);
    client.release();
    
    res.json({
      success: true,
      data: {
        totalEvents: parseInt(result.rows[0].total_events),
        uniqueUsers: parseInt(result.rows[0].unique_users),
        failedEvents: parseInt(result.rows[0].failed_events),
        criticalEvents: parseInt(result.rows[0].critical_events),
        highRiskEvents: parseInt(result.rows[0].high_risk_events),
        hipaaEvents: parseInt(result.rows[0].hipaa_events),
        patientDataEvents: parseInt(result.rows[0].patient_data_events),
        adminEvents: parseInt(result.rows[0].admin_events),
        securityEvents: parseInt(result.rows[0].security_events),
        averageRiskScore: parseFloat(result.rows[0].avg_risk_score) || 0
      }
    });
  } catch (error) {
    console.error('Error retrieving audit statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit statistics',
      message: error.message
    });
  }
});

// Get user activity summary
router.get('/user/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const client = await getClient(req.app.locals.pool);
    
    const query = `
      SELECT 
        user_id,
        username,
        email,
        COUNT(*) as total_events,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_events,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_events,
        ROUND(AVG(risk_score), 2) as avg_risk_score,
        MAX(timestamp) as last_activity,
        ARRAY_AGG(DISTINCT action ORDER BY action) as unique_actions,
        ARRAY_AGG(DISTINCT resource ORDER BY resource) as accessed_resources
      FROM enhanced_audit_events 
      WHERE user_id = $1 
        AND timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY user_id, username, email
    `;
    
    const result = await client.query(query, [userId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No activity found for this user'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error retrieving user activity summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user activity summary',
      message: error.message
    });
  }
});

// Get compliance report
router.get('/compliance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const client = await getClient(req.app.locals.pool);
    
    let dateFilter = '';
    let queryParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE timestamp BETWEEN $1 AND $2';
      queryParams = [new Date(startDate), new Date(endDate)];
    }
    
    const query = `
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_events,
        COUNT(CASE WHEN compliance_flags->>'hipaaRelevant' = 'true' THEN 1 END) as hipaa_events,
        COUNT(CASE WHEN compliance_flags->>'patientDataAccess' = 'true' THEN 1 END) as patient_data_events,
        COUNT(CASE WHEN compliance_flags->>'adminAction' = 'true' THEN 1 END) as admin_events,
        COUNT(CASE WHEN compliance_flags->>'securityEvent' = 'true' THEN 1 END) as security_events,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_events,
        ROUND(AVG(risk_score), 2) as avg_risk_score
      FROM enhanced_audit_events 
      ${dateFilter}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    const result = await client.query(query, queryParams);
    client.release();
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error retrieving compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compliance report',
      message: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Enhanced audit service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
