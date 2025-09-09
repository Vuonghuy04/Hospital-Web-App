// PostgreSQL-based Behavior model
export default class Behavior {
  constructor(pool) {
    this.pool = pool;
  }

  // Create a new behavior record
  async create(behaviorData) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO user_behavior (
          username, user_id, email, roles, ip_address, user_agent, 
          action, session_id, session_period, risk_score, risk_level, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        behaviorData.username,
        behaviorData.userId,
        behaviorData.email || '',
        behaviorData.roles || [],
        behaviorData.ipAddress || 'unknown',
        behaviorData.userAgent || '',
        behaviorData.action,
        behaviorData.sessionId,
        behaviorData.sessionPeriod || 0,
        behaviorData.riskScore || 0.0,
        behaviorData.riskLevel || 'low',
        JSON.stringify(behaviorData.metadata || {})
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Find behavior records with filters
  async find(filter = {}, options = {}) {
    const client = await this.pool.connect();
    try {
      let whereClause = '';
      const values = [];
      let paramCount = 0;

      // Build WHERE clause
      if (filter.username) {
        whereClause += ` AND username = $${++paramCount}`;
        values.push(filter.username);
      }
      
      if (filter.userId) {
        whereClause += ` AND user_id = $${++paramCount}`;
        values.push(filter.userId);
      }
      
      if (filter.action) {
        whereClause += ` AND action ILIKE $${++paramCount}`;
        values.push(`%${filter.action}%`);
      }
      
      if (filter.riskLevel) {
        whereClause += ` AND risk_level = $${++paramCount}`;
        values.push(filter.riskLevel);
      }
      
      if (filter.startDate) {
        whereClause += ` AND timestamp >= $${++paramCount}`;
        values.push(filter.startDate);
      }
      
      if (filter.endDate) {
        whereClause += ` AND timestamp <= $${++paramCount}`;
        values.push(filter.endDate);
      }

      // Build query
      let query = `SELECT * FROM user_behavior WHERE 1=1 ${whereClause}`;
      
      // Add ordering
      query += ` ORDER BY timestamp DESC`;
      
      // Add pagination
      if (options.limit) {
        query += ` LIMIT $${++paramCount}`;
        values.push(options.limit);
      }
      
      if (options.skip) {
        query += ` OFFSET $${++paramCount}`;
        values.push(options.skip);
      }

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Count records with filters
  async count(filter = {}) {
    const client = await this.pool.connect();
    try {
      let whereClause = '';
      const values = [];
      let paramCount = 0;

      // Build WHERE clause (same logic as find)
      if (filter.username) {
        whereClause += ` AND username = $${++paramCount}`;
        values.push(filter.username);
      }
      
      if (filter.userId) {
        whereClause += ` AND user_id = $${++paramCount}`;
        values.push(filter.userId);
      }
      
      if (filter.action) {
        whereClause += ` AND action ILIKE $${++paramCount}`;
        values.push(`%${filter.action}%`);
      }
      
      if (filter.riskLevel) {
        whereClause += ` AND risk_level = $${++paramCount}`;
        values.push(filter.riskLevel);
      }
      
      if (filter.startDate) {
        whereClause += ` AND timestamp >= $${++paramCount}`;
        values.push(filter.startDate);
      }
      
      if (filter.endDate) {
        whereClause += ` AND timestamp <= $${++paramCount}`;
        values.push(filter.endDate);
      }

      const query = `SELECT COUNT(*) FROM user_behavior WHERE 1=1 ${whereClause}`;
      const result = await client.query(query, values);
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  // Get distinct values
  async distinct(field) {
    const client = await this.pool.connect();
    try {
      const query = `SELECT DISTINCT ${field} FROM user_behavior WHERE ${field} IS NOT NULL`;
      const result = await client.query(query);
      return result.rows.map(row => row[field]);
    } finally {
      client.release();
    }
  }

  // Delete records with filter
  async deleteMany(filter = {}) {
    const client = await this.pool.connect();
    try {
      let whereClause = '';
      const values = [];
      let paramCount = 0;

      // Build WHERE clause
      if (filter.username) {
        whereClause += ` AND username = $${++paramCount}`;
        values.push(filter.username);
      }
      
      if (filter.userId) {
        whereClause += ` AND user_id = $${++paramCount}`;
        values.push(filter.userId);
      }

      const query = `DELETE FROM user_behavior WHERE 1=1 ${whereClause}`;
      const result = await client.query(query, values);
      return { deletedCount: result.rowCount };
    } finally {
      client.release();
    }
  }

  // Get analytics data using aggregation
  async getAnalytics(matchFilter = {}, days = 7) {
    const client = await this.pool.connect();
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let whereClause = 'WHERE timestamp >= $1';
      const values = [startDate];
      let paramCount = 1;

      if (matchFilter.username) {
        whereClause += ` AND username = $${++paramCount}`;
        values.push(matchFilter.username);
      }

      const query = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT username) as unique_user_count,
          COUNT(DISTINCT session_id) as unique_session_count,
          ROUND(AVG(risk_score), 3) as avg_risk_score,
          COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk_count,
          COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk_count,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count
        FROM user_behavior 
        ${whereClause}
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Get top actions
  async getTopActions(matchFilter = {}, days = 7, limit = 10) {
    const client = await this.pool.connect();
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let whereClause = 'WHERE timestamp >= $1';
      const values = [startDate];
      let paramCount = 1;

      if (matchFilter.username) {
        whereClause += ` AND username = $${++paramCount}`;
        values.push(matchFilter.username);
      }

      const query = `
        SELECT 
          action,
          COUNT(*) as count
        FROM user_behavior 
        ${whereClause}
        GROUP BY action
        ORDER BY count DESC
        LIMIT $${++paramCount}
      `;
      values.push(limit);

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get user statistics
  async getUserStats() {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN user_id END) as active_users,
          COUNT(DISTINCT CASE WHEN timestamp < NOW() - INTERVAL '24 hours' THEN user_id END) as inactive_users,
          COUNT(DISTINCT CASE WHEN risk_level = 'high' OR risk_score >= 0.7 THEN user_id END) as high_risk_users
        FROM user_behavior
      `;

      const result = await client.query(query);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}