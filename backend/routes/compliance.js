import express from 'express';

const router = express.Router();

// Helper function to get PostgreSQL client
const getClient = async (pool) => {
  return await pool.connect();
};

// Create compliance tables if they don't exist
const createComplianceTables = async (client) => {
  try {
    // Compliance rules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_rules (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Compliance violations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_violations (
        id SERIAL PRIMARY KEY,
        violation_id VARCHAR(255) UNIQUE NOT NULL,
        rule_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        user_role VARCHAR(255) NOT NULL,
        violation_type VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        resolved_by VARCHAR(255),
        evidence JSONB DEFAULT '{}',
        remediation JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_compliance_violations_rule_id 
      ON compliance_violations(rule_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_compliance_violations_user_id 
      ON compliance_violations(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_compliance_violations_status 
      ON compliance_violations(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity 
      ON compliance_violations(severity)
    `);

  } catch (error) {
    console.error('Error creating compliance tables:', error);
    throw error;
  }
};

// Initialize tables
const initializeTables = async (req) => {
  const client = await getClient(req.app.locals.pool);
  try {
    await createComplianceTables(client);
  } finally {
    client.release();
  }
};

// GET /api/compliance/rules - Get all compliance rules
router.get('/rules', async (req, res) => {
  try {
    await initializeTables(req);
    const client = await getClient(req.app.locals.pool);
    
    const result = await client.query(`
      SELECT * FROM compliance_rules 
      ORDER BY created_at DESC
    `);
    
    client.release();
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching compliance rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance rules',
      message: error.message
    });
  }
});

// GET /api/compliance/violations - Get compliance violations with filters
router.get('/violations', async (req, res) => {
  try {
    await initializeTables(req);
    const client = await getClient(req.app.locals.pool);
    
    const { status, severity, category, userId, startDate, endDate } = req.query;
    
    let query = `
      SELECT v.*, r.name as rule_name, r.category as rule_category
      FROM compliance_violations v
      LEFT JOIN compliance_rules r ON v.rule_id = r.rule_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND v.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (severity) {
      query += ` AND v.severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }
    
    if (category) {
      query += ` AND r.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (userId) {
      query += ` AND v.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }
    
    if (startDate) {
      query += ` AND v.detected_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND v.detected_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    query += ` ORDER BY v.detected_at DESC`;
    
    const result = await client.query(query, params);
    client.release();
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching compliance violations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance violations',
      message: error.message
    });
  }
});

// GET /api/compliance/metrics - Get compliance metrics
router.get('/metrics', async (req, res) => {
  try {
    await initializeTables(req);
    const client = await getClient(req.app.locals.pool);
    
    // Get overall metrics
    const metricsResult = await client.query(`
      SELECT 
        COUNT(*) as total_violations,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_violations,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_violations,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_violations,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_violations,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_violations,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_violations
      FROM compliance_violations
    `);
    
    // Get category breakdown
    const categoryResult = await client.query(`
      SELECT 
        r.category,
        COUNT(v.id) as violations,
        COUNT(CASE WHEN v.status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN v.status = 'open' THEN 1 END) as open
      FROM compliance_rules r
      LEFT JOIN compliance_violations v ON r.rule_id = v.rule_id
      GROUP BY r.category
    `);
    
    // Get top violators
    const violatorsResult = await client.query(`
      SELECT 
        username,
        user_role,
        COUNT(*) as violations
      FROM compliance_violations
      GROUP BY username, user_role
      ORDER BY violations DESC
      LIMIT 5
    `);
    
    // Get daily trends (last 7 days)
    const trendsResult = await client.query(`
      SELECT 
        DATE(detected_at) as date,
        COUNT(*) as violations
      FROM compliance_violations
      WHERE detected_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(detected_at)
      ORDER BY date
    `);
    
    const metrics = metricsResult.rows[0];
    const categories = categoryResult.rows.reduce((acc, row) => {
      acc[row.category] = {
        violations: parseInt(row.violations),
        resolved: parseInt(row.resolved),
        open: parseInt(row.open)
      };
      return acc;
    }, {});
    
    // Calculate scores (higher is better)
    const totalViolations = parseInt(metrics.total_violations);
    const criticalViolations = parseInt(metrics.critical_violations);
    const highViolations = parseInt(metrics.high_violations);
    const mediumViolations = parseInt(metrics.medium_violations);
    const lowViolations = parseInt(metrics.low_violations);
    const resolvedViolations = parseInt(metrics.resolved_violations);
    
    const overallScore = Math.max(0, 100 - (criticalViolations * 20) - (highViolations * 10) - (mediumViolations * 5) - (lowViolations * 2));
    const securityScore = Math.max(0, 100 - (categories.security?.violations || 0) * 15);
    const privacyScore = Math.max(0, 100 - (categories.privacy?.violations || 0) * 15);
    const accessScore = Math.max(0, 100 - (categories.access?.violations || 0) * 10);
    const dataScore = Math.max(0, 100 - (categories.data?.violations || 0) * 20);
    const auditScore = Math.max(0, 100 - (categories.audit?.violations || 0) * 20);
    
    // Generate recommendations
    const recommendations = [];
    if (criticalViolations > 0) {
      recommendations.push('Address critical violations immediately to prevent security breaches');
    }
    if (highViolations > 2) {
      recommendations.push('Implement stricter monitoring for high-risk activities');
    }
    if (resolvedViolations / totalViolations < 0.8) {
      recommendations.push('Improve violation resolution process to reduce backlog');
    }
    if (categories.security?.violations > 0) {
      recommendations.push('Review and strengthen security policies and procedures');
    }
    if (categories.privacy?.violations > 0) {
      recommendations.push('Enhance data privacy controls and user training');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue current compliance practices and regular monitoring');
    }
    
    client.release();
    
    res.json({
      success: true,
      data: {
        overallScore: Math.round(overallScore),
        securityScore: Math.round(securityScore),
        privacyScore: Math.round(privacyScore),
        accessScore: Math.round(accessScore),
        dataScore: Math.round(dataScore),
        auditScore: Math.round(auditScore),
        lastUpdated: new Date().toISOString(),
        trends: trendsResult.rows.map(row => ({
          score: Math.max(60, 100 - row.violations * 5),
          date: row.date
        })),
        recommendations,
        summary: {
          totalViolations,
          criticalViolations,
          highViolations,
          mediumViolations,
          lowViolations,
          resolvedViolations,
          openViolations: parseInt(metrics.open_violations)
        },
        categories,
        topViolators: violatorsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching compliance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance metrics',
      message: error.message
    });
  }
});

// PATCH /api/compliance/violations/:id - Update violation status
router.patch('/violations/:id', async (req, res) => {
  try {
    await initializeTables(req);
    const client = await getClient(req.app.locals.pool);
    
    const { id } = req.params;
    const { status, resolvedBy } = req.body;
    
    const updateFields = ['status = $1'];
    const params = [status];
    let paramCount = 2;
    
    if (resolvedBy) {
      updateFields.push(`resolved_by = $${paramCount}`);
      params.push(resolvedBy);
      paramCount++;
    }
    
    if (status === 'resolved') {
      updateFields.push(`resolved_at = CURRENT_TIMESTAMP`);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const result = await client.query(`
      UPDATE compliance_violations 
      SET ${updateFields.join(', ')}
      WHERE violation_id = $${paramCount}
      RETURNING *
    `, [...params, id]);
    
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating violation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update violation status',
      message: error.message
    });
  }
});

// POST /api/compliance/reports - Generate compliance report
router.post('/reports', async (req, res) => {
  try {
    await initializeTables(req);
    const client = await getClient(req.app.locals.pool);
    
    const { start, end } = req.body;
    
    // Get violations in date range
    const violationsResult = await client.query(`
      SELECT v.*, r.name as rule_name, r.category as rule_category
      FROM compliance_violations v
      LEFT JOIN compliance_rules r ON v.rule_id = r.rule_id
      WHERE v.detected_at >= $1 AND v.detected_at <= $2
      ORDER BY v.detected_at DESC
    `, [start, end]);
    
    const violations = violationsResult.rows;
    
    // Calculate report data
    const summary = {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      highViolations: violations.filter(v => v.severity === 'high').length,
      mediumViolations: violations.filter(v => v.severity === 'medium').length,
      lowViolations: violations.filter(v => v.severity === 'low').length,
      resolvedViolations: violations.filter(v => v.status === 'resolved').length,
      openViolations: violations.filter(v => v.status === 'open').length
    };
    
    const categories = violations.reduce((acc, violation) => {
      const category = violation.rule_category || 'unknown';
      if (!acc[category]) {
        acc[category] = { violations: 0, resolved: 0, open: 0 };
      }
      acc[category].violations++;
      if (violation.status === 'resolved') {
        acc[category].resolved++;
      } else {
        acc[category].open++;
      }
      return acc;
    }, {});
    
    const topViolators = violations.reduce((acc, violation) => {
      const existing = acc.find(v => v.username === violation.username);
      if (existing) {
        existing.violations++;
      } else {
        acc.push({
          username: violation.username,
          role: violation.user_role,
          violations: 1
        });
      }
      return acc;
    }, []).sort((a, b) => b.violations - a.violations).slice(0, 5);
    
    client.release();
    
    res.json({
      success: true,
      data: {
        id: `report-${Date.now()}`,
        title: `Compliance Report - ${start} to ${end}`,
        period: { start, end },
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        summary,
        categories,
        topViolators,
        trends: {
          daily: violations.map(v => ({
            date: new Date(v.detected_at).toISOString().split('T')[0],
            violations: 1
          })),
          weekly: []
        }
      }
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
      message: error.message
    });
  }
});

export default router;
