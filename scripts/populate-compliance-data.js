const { Pool } = require('pg');

const pool = new Pool({
  user: 'hospital_user',
  host: 'localhost',
  database: 'hospital_analytics',
  password: 'hospital_password',
  port: 5432,
});

async function populateComplianceData() {
  const client = await pool.connect();
  try {
    console.log('Populating compliance data...');

    // Create compliance tables
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

    // Clear existing data
    await client.query('DELETE FROM compliance_violations');
    await client.query('DELETE FROM compliance_rules');

    // Insert compliance rules
    const rules = [
      {
        rule_id: 'SEC-001',
        name: 'Unauthorized Access Attempt',
        description: 'User attempted to access resources outside their role permissions',
        category: 'Security',
        severity: 'high'
      },
      {
        rule_id: 'SEC-002',
        name: 'Suspicious Login Pattern',
        description: 'Multiple failed login attempts or unusual login times detected',
        category: 'Security',
        severity: 'medium'
      },
      {
        rule_id: 'PRIV-001',
        name: 'Patient Data Access Outside Hours',
        description: 'Patient records accessed outside normal business hours without justification',
        category: 'Privacy',
        severity: 'high'
      },
      {
        rule_id: 'PRIV-002',
        name: 'Excessive Data Export',
        description: 'Large amounts of patient data exported in single session',
        category: 'Privacy',
        severity: 'critical'
      },
      {
        rule_id: 'ACC-001',
        name: 'Privilege Escalation Attempt',
        description: 'User attempted to modify their own permissions or access admin functions',
        category: 'Access Control',
        severity: 'critical'
      },
      {
        rule_id: 'ACC-002',
        name: 'Shared Account Usage',
        description: 'Multiple users detected using same account credentials',
        category: 'Access Control',
        severity: 'high'
      },
      {
        rule_id: 'DATA-001',
        name: 'Data Modification Without Approval',
        description: 'Critical patient data modified without proper authorization',
        category: 'Data Management',
        severity: 'high'
      },
      {
        rule_id: 'DATA-002',
        name: 'Incomplete Audit Trail',
        description: 'System actions performed without proper logging',
        category: 'Data Management',
        severity: 'medium'
      },
      {
        rule_id: 'AUDIT-001',
        name: 'Failed Audit Log Access',
        description: 'Unauthorized attempts to access or modify audit logs',
        category: 'Audit',
        severity: 'critical'
      },
      {
        rule_id: 'AUDIT-002',
        name: 'Missing Audit Events',
        description: 'System events not properly logged or missing from audit trail',
        category: 'Audit',
        severity: 'medium'
      }
    ];

    for (const rule of rules) {
      await client.query(`
        INSERT INTO compliance_rules (rule_id, name, description, category, severity, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [rule.rule_id, rule.name, rule.description, rule.category, rule.severity, true]);
    }

    console.log(`Inserted ${rules.length} compliance rules`);

    // Insert compliance violations
    // Get real users from the database
    const realUsersResult = await client.query(`
      SELECT DISTINCT user_id, username, email, roles 
      FROM user_behavior 
      ORDER BY username
    `);
    
    const users = realUsersResult.rows.map(row => ({
      id: row.user_id,
      username: row.username,
      role: row.roles[0] || 'user',
      email: row.email
    }));
    
    console.log(`Found ${users.length} real users:`, users.map(u => u.username).join(', '));

    const violationTypes = [
      'Unauthorized Access Attempt',
      'Suspicious Login Pattern',
      'Patient Data Access Outside Hours',
      'Excessive Data Export',
      'Privilege Escalation Attempt',
      'Shared Account Usage',
      'Data Modification Without Approval',
      'Incomplete Audit Trail',
      'Failed Audit Log Access',
      'Missing Audit Events'
    ];

    const severities = ['critical', 'high', 'medium', 'low'];
    const statuses = ['open', 'acknowledged', 'resolved', 'false_positive'];

    // Get real user behavior data to create realistic violations
    const behaviorResult = await client.query(`
      SELECT user_id, username, roles, action, risk_level, risk_score, timestamp, metadata
      FROM user_behavior 
      WHERE risk_level IN ('high', 'critical') OR risk_score > 0.7
      ORDER BY timestamp DESC
      LIMIT 200
    `);
    
    console.log(`Found ${behaviorResult.rows.length} high-risk activities to convert to violations`);

    const violations = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Create violations based on real high-risk activities
    for (let i = 0; i < Math.min(behaviorResult.rows.length, 100); i++) {
      const behavior = behaviorResult.rows[i];
      const user = users.find(u => u.id === behavior.user_id);
      if (!user) continue;
      
      const rule = rules[Math.floor(Math.random() * rules.length)];
      const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
      
      // Map risk levels to violation severity
      let severity = 'medium';
      if (behavior.risk_level === 'critical' || behavior.risk_score > 0.8) {
        severity = 'critical';
      } else if (behavior.risk_level === 'high' || behavior.risk_score > 0.6) {
        severity = 'high';
      } else if (behavior.risk_score > 0.4) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const detectedAt = new Date(behavior.timestamp);
      
      const violation = {
        violation_id: `violation-${Date.now()}-${i}`,
        rule_id: rule.rule_id,
        user_id: user.id,
        username: user.username,
        user_role: user.role,
        violation_type: violationType,
        description: `${violationType} detected for user ${user.username} - ${behavior.action} with risk score ${behavior.risk_score}`,
        severity: severity,
        status: status,
        detected_at: detectedAt,
        resolved_at: status === 'resolved' ? new Date(detectedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
        resolved_by: status === 'resolved' ? 'admin' : null,
        evidence: JSON.stringify({
          ip_address: behavior.metadata?.ip_address || `192.168.1.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          session_id: `session-${Math.random().toString(36).substr(2, 9)}`,
          resource: behavior.metadata?.resource || 'patient_records',
          original_action: behavior.action,
          risk_score: behavior.risk_score
        }),
        remediation: JSON.stringify({
          steps: ['Review access logs', 'Verify user permissions', 'Update security policies'],
          assigned_to: 'security_team',
          priority: severity === 'critical' ? 'immediate' : 'normal'
        })
      };

      violations.push(violation);
    }

    for (const violation of violations) {
      await client.query(`
        INSERT INTO compliance_violations (
          violation_id, rule_id, user_id, username, user_role, violation_type,
          description, severity, status, detected_at, resolved_at, resolved_by,
          evidence, remediation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        violation.violation_id,
        violation.rule_id,
        violation.user_id,
        violation.username,
        violation.user_role,
        violation.violation_type,
        violation.description,
        violation.severity,
        violation.status,
        violation.detected_at,
        violation.resolved_at,
        violation.resolved_by,
        violation.evidence,
        violation.remediation
      ]);
    }

    console.log(`Inserted ${violations.length} compliance violations`);

    // Get summary statistics
    const statsResult = await client.query(`
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

    console.log('Compliance data summary:', statsResult.rows[0]);

    const categoryStats = await client.query(`
      SELECT 
        r.category,
        COUNT(v.id) as violations,
        COUNT(CASE WHEN v.status = 'resolved' THEN 1 END) as resolved
      FROM compliance_rules r
      LEFT JOIN compliance_violations v ON r.rule_id = v.rule_id
      GROUP BY r.category
      ORDER BY violations DESC
    `);

    console.log('Violations by category:');
    categoryStats.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.violations} violations (${row.resolved} resolved)`);
    });

  } catch (error) {
    console.error('Error populating compliance data:', error);
  } finally {
    client.release();
  }
}

populateComplianceData().then(() => {
  console.log('Compliance data population completed');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
