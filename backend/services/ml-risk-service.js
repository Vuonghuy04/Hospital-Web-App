/**
 * ML Risk Service
 * Interfaces with Python ML service to predict and update risk scores
 */

import fetch from 'node-fetch';
import Behavior from '../models/Behavior.js';

const PYTHON_ML_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:5001';

class MLRiskService {
  constructor(pool) {
    this.pool = pool;
    this.behavior = new Behavior(pool);
  }

  /**
   * Check if Python ML service is available
   */
  async checkMLServiceHealth() {
    try {
      const response = await fetch(`${PYTHON_ML_SERVICE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          trained: data.model_trained,
          status: data
        };
      }
      
      return { available: false, error: 'Service not responding' };
    } catch (error) {
      console.error('ML Service health check failed:', error.message);
      return { available: false, error: error.message };
    }
  }

  /**
   * Predict risk score for a single record using ML service
   */
  async predictSingleRiskScore(recordData) {
    try {
      const response = await fetch(`${PYTHON_ML_SERVICE_URL}/predict/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
        timeout: 10000
      });

      if (response.ok) {
        const prediction = await response.json();
        return {
          success: true,
          riskScore: prediction.risk_score,
          riskLevel: prediction.risk_level,
          prediction
        };
      } else {
        const error = await response.json();
        console.error('ML prediction failed:', error);
        return {
          success: false,
          error: error.message || 'Prediction failed',
          fallbackScore: 0.5,
          fallbackLevel: 'medium'
        };
      }
    } catch (error) {
      console.error('Error calling ML service:', error);
      return {
        success: false,
        error: error.message,
        fallbackScore: 0.5,
        fallbackLevel: 'medium'
      };
    }
  }

  /**
   * Predict risk scores for multiple records
   */
  async predictBatchRiskScores(records) {
    try {
      const response = await fetch(`${PYTHON_ML_SERVICE_URL}/predict/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records }),
        timeout: 30000
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          predictions: result.predictions
        };
      } else {
        const error = await response.json();
        console.error('Batch prediction failed:', error);
        return {
          success: false,
          error: error.message || 'Batch prediction failed'
        };
      }
    } catch (error) {
      console.error('Error in batch prediction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update risk scores for all records in the database
   */
  async updateAllRiskScores() {
    try {
      console.log('🤖 Starting ML risk score update for all records...');
      
      // Check ML service availability
      const healthCheck = await this.checkMLServiceHealth();
      if (!healthCheck.available) {
        throw new Error(`ML service unavailable: ${healthCheck.error}`);
      }
      
      if (!healthCheck.trained) {
        throw new Error('ML model is not trained');
      }

      // Get all records from database
      const allRecords = await this.behavior.find({}, { limit: 10000 }); // Process in batches
      console.log(`📊 Found ${allRecords.length} records to process`);

      if (allRecords.length === 0) {
        return { success: true, message: 'No records to process', updated: 0 };
      }

      // Prepare records for ML prediction
      const mlRecords = allRecords.map(record => ({
        id: record.id,
        username: record.username,
        user_id: record.user_id,
        email: record.email,
        user_role: Array.isArray(record.roles) && record.roles.length > 0 
          ? record.roles[0] 
          : 'employee',
        ip_address: record.ip_address,
        device_type: this.inferDeviceType(record.user_agent),
        timestamp: record.timestamp,
        action: record.action,
        session_id: record.session_id,
        session_period: record.session_period || 30
      }));

      // Get predictions from ML service
      const predictionResult = await fetch(`${PYTHON_ML_SERVICE_URL}/predict/database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: mlRecords }),
        timeout: 60000 // 1 minute timeout for large batches
      });

      if (!predictionResult.ok) {
        const error = await predictionResult.json();
        throw new Error(`ML prediction failed: ${error.message}`);
      }

      const predictions = await predictionResult.json();
      console.log(`🎯 Received ${predictions.predictions.length} predictions`);

      // Update database with predictions
      let updated = 0;
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        for (const prediction of predictions.predictions) {
          if (prediction.id) {
            const updateQuery = `
              UPDATE user_behavior 
              SET risk_score = $1, risk_level = $2, updated_at = NOW()
              WHERE id = $3
            `;
            
            await client.query(updateQuery, [
              prediction.risk_score,
              prediction.risk_level,
              prediction.id
            ]);
            
            updated++;
          }
        }
        
        await client.query('COMMIT');
        console.log(`✅ Updated ${updated} records with new risk scores`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      return {
        success: true,
        message: `Successfully updated risk scores for ${updated} records`,
        updated,
        total: allRecords.length,
        predictions: predictions.predictions.length
      };

    } catch (error) {
      console.error('Error updating risk scores:', error);
      return {
        success: false,
        error: error.message,
        updated: 0
      };
    }
  }

  /**
   * Create a new behavior record with ML-predicted risk score
   */
  async createBehaviorWithMLRisk(behaviorData) {
    try {
      // Prepare data for ML prediction
      const mlData = {
        username: behaviorData.username,
        user_id: behaviorData.userId,
        email: behaviorData.email || '',
        user_role: Array.isArray(behaviorData.roles) && behaviorData.roles.length > 0 
          ? behaviorData.roles[0] 
          : 'employee',
        ip_address: behaviorData.ipAddress || 'unknown',
        device_type: this.inferDeviceType(behaviorData.userAgent),
        timestamp: new Date().toISOString(),
        action: behaviorData.action,
        session_id: behaviorData.sessionId,
        session_period: behaviorData.sessionPeriod || 30
      };

      // Get ML prediction
      const prediction = await this.predictSingleRiskScore(mlData);
      
      // Use ML prediction if available, otherwise use fallback
      const riskScore = prediction.success 
        ? prediction.riskScore 
        : prediction.fallbackScore || 0.5;
      const riskLevel = prediction.success 
        ? prediction.riskLevel 
        : prediction.fallbackLevel || 'medium';

      // Create behavior record with predicted risk score
      const finalBehaviorData = {
        ...behaviorData,
        riskScore,
        riskLevel,
        metadata: {
          ...behaviorData.metadata,
          mlPrediction: prediction.success,
          mlError: prediction.success ? null : prediction.error,
          predictionTimestamp: new Date().toISOString()
        }
      };

      const savedBehavior = await this.behavior.create(finalBehaviorData);
      
      console.log(`🤖 ML Risk prediction for ${behaviorData.username}: ${riskScore} (${riskLevel})`);
      
      return savedBehavior;

    } catch (error) {
      console.error('Error creating behavior with ML risk:', error);
      
      // Fallback: create record with default risk score
      const fallbackBehaviorData = {
        ...behaviorData,
        riskScore: 0.5,
        riskLevel: 'medium',
        metadata: {
          ...behaviorData.metadata,
          mlPrediction: false,
          mlError: error.message,
          fallback: true
        }
      };

      return await this.behavior.create(fallbackBehaviorData);
    }
  }

  /**
   * Get risk score statistics with ML predictions
   */
  async getRiskStatistics() {
    try {
      const client = await this.pool.connect();
      
      const query = `
        SELECT 
          COUNT(*) as total_records,
          AVG(risk_score) as avg_risk_score,
          COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk_count,
          COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk_count,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count,
          COUNT(CASE WHEN metadata->>'mlPrediction' = 'true' THEN 1 END) as ml_predictions,
          MAX(updated_at) as last_update
        FROM user_behavior
        WHERE timestamp >= NOW() - INTERVAL '7 days'
      `;
      
      const result = await client.query(query);
      client.release();
      
      const stats = result.rows[0];
      
      return {
        totalRecords: parseInt(stats.total_records),
        avgRiskScore: parseFloat(stats.avg_risk_score) || 0,
        riskDistribution: {
          low: parseInt(stats.low_risk_count),
          medium: parseInt(stats.medium_risk_count),
          high: parseInt(stats.high_risk_count)
        },
        mlPredictions: parseInt(stats.ml_predictions),
        lastUpdate: stats.last_update
      };
      
    } catch (error) {
      console.error('Error getting risk statistics:', error);
      return {
        totalRecords: 0,
        avgRiskScore: 0,
        riskDistribution: { low: 0, medium: 0, high: 0 },
        mlPredictions: 0,
        lastUpdate: null,
        error: error.message
      };
    }
  }

  /**
   * Train the ML model
   */
  async trainModel() {
    try {
      const response = await fetch(`${PYTHON_ML_SERVICE_URL}/train`, {
        method: 'POST',
        timeout: 120000 // 2 minutes timeout
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, result };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Error training model:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Infer device type from user agent
   */
  inferDeviceType(userAgent) {
    if (!userAgent) return 'desktop';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
}

export default MLRiskService;
