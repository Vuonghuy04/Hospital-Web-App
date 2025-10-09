import dotenv from 'dotenv';
import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import behaviorRouter from './routes/behavior.js';
import behaviorProfilesRouter from './routes/behavior-profiles.js';
import hospitalRouter from './routes/hospital.js';
import riskRouter from './routes/risk.js';
import jitRouter from './routes/jit.js';
import mlRiskRouter from './routes/ml-risk.js';
import enhancedAuditRouter from './routes/enhanced-audit.js';
import authMiddleware from './middleware/auth.js';

const { Pool } = pkg;

(async function(){
  dotenv.config();
  
  // PostgreSQL connection configuration
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://hospital_user:hospital_password@localhost:5432/hospital_analytics";
  
  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false, // Set to true for production with SSL
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });

  // Test database connection
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected to hospital_analytics database");
    
    // Create tables if they don't exist
    await createTables(client);
    
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
    process.exit(1);
  }

  // Function to create necessary tables
  async function createTables(client) {
    try {
      // Create user_behavior table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_behavior (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          email VARCHAR(255) DEFAULT '',
          roles TEXT[],
          ip_address VARCHAR(45) DEFAULT 'unknown',
          user_agent TEXT DEFAULT '',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          action VARCHAR(255) NOT NULL,
          session_id VARCHAR(255) NOT NULL,
          session_period INTEGER DEFAULT 0,
          risk_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
          risk_level VARCHAR(20) DEFAULT 'low',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_behavior_username_timestamp 
        ON user_behavior(username, timestamp DESC)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id 
        ON user_behavior(user_id)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_behavior_session_id 
        ON user_behavior(session_id)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp 
        ON user_behavior(timestamp DESC)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_behavior_risk_score 
        ON user_behavior(risk_score DESC)
      `);

      // Create enhanced audit events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS enhanced_audit_events (
          id SERIAL PRIMARY KEY,
          event_id VARCHAR(255) UNIQUE NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          roles TEXT[],
          action VARCHAR(255) NOT NULL,
          resource VARCHAR(255),
          resource_id VARCHAR(255),
          ip_address VARCHAR(45),
          user_agent TEXT,
          session_id VARCHAR(255),
          session_duration INTEGER DEFAULT 0,
          risk_score DECIMAL(5,2) DEFAULT 0.0,
          risk_level VARCHAR(20) DEFAULT 'low',
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          metadata JSONB DEFAULT '{}',
          compliance_flags JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for enhanced audit events
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_enhanced_audit_user_id 
        ON enhanced_audit_events(user_id)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_enhanced_audit_timestamp 
        ON enhanced_audit_events(timestamp)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_enhanced_audit_action 
        ON enhanced_audit_events(action)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_enhanced_audit_risk_level 
        ON enhanced_audit_events(risk_level)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_enhanced_audit_user_timestamp 
        ON enhanced_audit_events(user_id, timestamp DESC)
      `);

      console.log("✅ Database tables created/verified successfully");
    } catch (error) {
      console.error("❌ Error creating tables:", error);
      throw error;
    }
  }

  const PORT = process.env.PORT || 5002;
  const app = express();
  
  // Middleware - Allow both frontend ports for development
  const allowedOrigins = [
    'http://localhost:3000', // Hospital web app
    'http://localhost:3001', // Admin console (if running separately)
    'http://localhost:3002'
  ];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }));
  app.use(express.json());

  // Make pool available to routes
  app.locals.pool = pool;

  // Routes
  app.use("/api/behavior-tracking", behaviorRouter);
  app.use("/api/behavior-profiles", behaviorProfilesRouter); // Behavior profile management
  app.use("/api/hospital", hospitalRouter); // Hospital admin routes
  app.use("/api/risk", riskRouter); // Risk assessment routes
  app.use("/api/jit", jitRouter); // JIT access control routes
  app.use("/api/ml-risk", mlRiskRouter); // ML-based risk prediction routes
  app.use("/api/audit", enhancedAuditRouter); // Enhanced audit logging routes
  
  // Root endpoint for quick checks
  app.get('/', (req, res) => {
    res.json({
      service: 'hospital-backend',
      message: 'Backend is running',
      database: 'PostgreSQL',
      time: new Date().toISOString()
    });
  });

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        postgresql: 'hospital_analytics',
        current_time: result.rows[0].current_time
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      });
    }
  });

  // Database viewer endpoint
  app.get('/api/database-viewer', async (req, res) => {
    try {
      const client = await pool.connect();
      
      // Get table information
      const tablesResult = await client.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      const databaseInfo = {
        databaseName: 'hospital_analytics',
        tables: [],
        totalTables: tablesResult.rows.length,
        timestamp: new Date().toISOString()
      };

      // Get data from each table
      for (const table of tablesResult.rows) {
        const tableName = table.table_name;
        const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        const count = parseInt(countResult.rows[0].count);
        
        const sampleResult = await client.query(`SELECT * FROM ${tableName} LIMIT 5`);
        
        databaseInfo.tables.push({
          name: tableName,
          rowCount: count,
          sampleRows: sampleResult.rows,
          columnCount: table.column_count
        });
      }

      client.release();
      res.json(databaseInfo);
    } catch (error) {
      console.error('Database viewer error:', error);
      res.status(500).json({ error: 'Failed to fetch database info', details: error.message });
    }
  });

  const server = app.listen(PORT, async () => {
    console.log(`🏥 Hospital Web App Backend`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Behavior API available at http://localhost:${PORT}/api/behavior-tracking`);
    console.log(`🏥 Hospital Admin API available at http://localhost:${PORT}/api/hospital`);
    console.log(`⚠️ Risk Assessment API available at http://localhost:${PORT}/api/risk`);
    console.log(`🤖 ML Risk Prediction API available at http://localhost:${PORT}/api/ml-risk`);
    console.log(`💊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ Database viewer: http://localhost:${PORT}/api/database-viewer`);
    console.log(`🐍 Python ML Service: ${process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:5001'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 Shutting down gracefully...');
    server.close(() => {
      pool.end();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🔄 Shutting down gracefully...');
    server.close(() => {
      pool.end();
      process.exit(0);
    });
  });

})();