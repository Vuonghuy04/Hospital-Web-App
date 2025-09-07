import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import behaviorRouter from './routes/behavior.js';
import hospitalRouter from './routes/hospital.js';
import riskRouter from './routes/risk.js';
import authMiddleware from './middleware/auth.js';

(async function(){
  dotenv.config();
  
  // Fixed password encoding: admin@ becomes admin%40
  const MONGO_URI = "mongodb+srv://vqh04092004:admin@cluster0.nnhndae.mongodb.net/hospital_analytics";

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    });
    console.log("✅ MongoDB connected to hospital_analytics database");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    
    // Provide helpful error messages
    if (err.message.includes('SSL') || err.message.includes('authentication')) {
      console.log('💡 Connection Tips:');
      console.log('   1. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('   2. Verify your MongoDB credentials');
      console.log('   3. Check your network firewall settings');
    }
    
    process.exit(1);
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

  // Routes
  app.use("/api/behavior-tracking", behaviorRouter);
  app.use("/api/hospital", hospitalRouter); // Hospital admin routes
  app.use("/api/risk", riskRouter); // Risk assessment routes
  
  // Root endpoint for quick checks
  app.get('/', (req, res) => {
    res.json({
      service: 'hospital-backend',
      message: 'Backend is running',
      time: new Date().toISOString()
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      mongodb: mongoose.connection.db?.databaseName || 'unknown'
    });
  });

  // Database viewer endpoint
  app.get('/api/database-viewer', async (req, res) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      // Get all collections
      const collections = await db.listCollections().toArray();
      const databaseInfo = {
        databaseName: db.databaseName,
        collections: [],
        totalCollections: collections.length,
        timestamp: new Date().toISOString()
      };

      // Get data from each collection
      for (const collection of collections) {
        const collectionName = collection.name;
        const count = await db.collection(collectionName).countDocuments();
        const sampleDocs = await db.collection(collectionName).find({}).limit(5).toArray();
        
        databaseInfo.collections.push({
          name: collectionName,
          documentCount: count,
          sampleDocuments: sampleDocs,
          indexes: await db.collection(collectionName).indexes()
        });
      }

      res.json(databaseInfo);
    } catch (error) {
      console.error('Database viewer error:', error);
      res.status(500).json({ error: 'Failed to fetch database info', details: error.message });
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`🏥 Hospital Web App Backend`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Behavior API available at http://localhost:${PORT}/api/behavior-tracking`);
    console.log(`🏥 Hospital Admin API available at http://localhost:${PORT}/api/hospital`);
    console.log(`⚠️ Risk Assessment API available at http://localhost:${PORT}/api/risk`);
    console.log(`💊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ Database viewer: http://localhost:${PORT}/api/database-viewer`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 Shutting down gracefully...');
    server.close(() => {
      mongoose.connection.close();
      process.exit(0);
    });
  });

})(); 