const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'hospital_user',
  host: 'localhost',
  database: 'hospital_analytics',
  password: 'hospital_password',
  port: 5432,
});

async function populateDashboardData() {
  const client = await pool.connect();
  
  try {
    console.log('Populating dashboard data...');
    
    // The user_behavior table already exists, no need to create it
    
    // Clear existing data
    await client.query('DELETE FROM user_behavior');
    
    // Generate sample data for the last 30 days
    const users = [
      { id: 'user-1', username: 'dr.johnson', role: 'doctor' },
      { id: 'user-2', username: 'nurse.smith', role: 'nurse' },
      { id: 'user-3', username: 'admin', role: 'admin' },
      { id: 'user-4', username: 'dr.wilson', role: 'doctor' },
      { id: 'user-5', username: 'nurse.davis', role: 'nurse' },
      { id: 'user-6', username: 'contractor.john', role: 'contractor' },
      { id: 'user-7', username: 'accountant.mary', role: 'accountant' },
      { id: 'user-8', username: 'dr.brown', role: 'doctor' },
      { id: 'user-9', username: 'nurse.taylor', role: 'nurse' },
      { id: 'user-10', username: 'admin.sarah', role: 'admin' }
    ];
    
    const actions = [
      'login', 'logout', 'view_patient_record', 'update_medication', 
      'access_lab_results', 'schedule_appointment', 'view_financial_data',
      'update_patient_info', 'access_pharmacy', 'view_audit_logs'
    ];
    
    const resources = [
      'patient_records', 'medication_system', 'lab_system', 
      'scheduling_system', 'financial_system', 'pharmacy_system',
      'audit_system', 'user_management'
    ];
    
    const riskLevels = ['low', 'medium', 'high', 'critical'];
    
    // Generate data for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const insertQuery = `
      INSERT INTO user_behavior (user_id, username, action, ip_address, user_agent, timestamp, risk_level, risk_score, session_id, metadata, email, roles)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;
    
    let totalRecords = 0;
    
    // Generate 1000+ records over 30 days
    for (let i = 0; i < 1200; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const riskScore = Math.random();
      
      // Random timestamp within the last 30 days
      const randomTime = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      
      const values = [
        user.id,
        user.username,
        action,
        `192.168.1.${Math.floor(Math.random() * 255)}`,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        randomTime,
        riskLevel,
        riskScore,
        `session-${Math.random().toString(36).substr(2, 9)}`,
        JSON.stringify({ role: user.role, department: 'healthcare', resource: resource }),
        `${user.username}@hospital.com`,
        [user.role]
      ];
      
      await client.query(insertQuery, values);
      totalRecords++;
      
      if (totalRecords % 100 === 0) {
        console.log(`Inserted ${totalRecords} records...`);
      }
    }
    
    console.log(`Successfully populated ${totalRecords} records in user_behavior table`);
    
    // Verify the data
    const countResult = await client.query('SELECT COUNT(*) FROM user_behavior');
    console.log(`Total records in database: ${countResult.rows[0].count}`);
    
    // Show sample metrics
    const metricsResult = await client.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN user_id END) as active_users,
        COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN 1 END) as total_activities,
        COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '7 days' AND (risk_level = 'high' OR risk_level = 'critical' OR risk_score >= 0.7) THEN 1 END) as high_risk_events,
        ROUND(AVG(risk_score) * 100) as average_risk_score
      FROM user_behavior
    `);
    
    console.log('Sample dashboard metrics:');
    console.log(`Total Users: ${metricsResult.rows[0].total_users}`);
    console.log(`Active Users: ${metricsResult.rows[0].active_users}`);
    console.log(`Total Activities (24h): ${metricsResult.rows[0].total_activities}`);
    console.log(`High Risk Events (7d): ${metricsResult.rows[0].high_risk_events}`);
    console.log(`Average Risk Score: ${metricsResult.rows[0].average_risk_score}%`);
    
  } catch (error) {
    console.error('Error populating dashboard data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

populateDashboardData();
