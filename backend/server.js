import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import behaviorRouter from './routes/behavior.js';
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

  const PORT = process.env.PORT || 5000;
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/api/behavior-tracking", behaviorRouter);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      mongodb: mongoose.connection.db?.databaseName || 'unknown'
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Behavior API available at http://localhost:${PORT}/api/behavior-tracking`);
    console.log(`💊 Health check: http://localhost:${PORT}/api/health`);
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