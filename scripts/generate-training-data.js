#!/usr/bin/env node

/**
 * Generate Training Data for ML Model
 * 
 * This script exports behavior data from the database to create
 * a CSV file for training the Isolation Forest model.
 */

import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pkg;

// Database configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'hospital_admin',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'hospital_db',
  password: process.env.POSTGRES_PASSWORD || 'hospital_secure_2024',
  port: process.env.POSTGRES_PORT || 5432,
});

async function generateTrainingData() {
  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    
    // Query to get all behavior data
    const query = `
      SELECT 
        username,
        user_id,
        email,
        roles,
        ip_address,
        user_agent,
        timestamp,
        action,
        session_id,
        session_period,
        risk_score,
        risk_level
      FROM user_behavior 
      ORDER BY timestamp DESC
    `;
    
    console.log('📊 Fetching behavior data...');
    const result = await client.query(query);
    client.release();
    
    console.log(`✅ Found ${result.rows.length} behavior records`);
    
    if (result.rows.length === 0) {
      console.log('❌ No data found. Please ensure there are behavior records in the database.');
      return;
    }
    
    // Convert to CSV format
    const csvHeaders = [
      'username',
      'user_id', 
      'email',
      'user_role',
      'ip_address',
      'device_type',
      'timestamp',
      'action',
      'session_id',
      'session_period'
    ].join(',');
    
    const csvRows = result.rows.map(row => {
      // Infer device type from user agent
      const deviceType = inferDeviceType(row.user_agent);
      
      // Get primary role
      const userRole = Array.isArray(row.roles) && row.roles.length > 0 
        ? row.roles[0] 
        : 'employee';
      
      return [
        escapeCSV(row.username),
        escapeCSV(row.user_id),
        escapeCSV(row.email || ''),
        escapeCSV(userRole),
        escapeCSV(row.ip_address),
        escapeCSV(deviceType),
        escapeCSV(row.timestamp.toISOString()),
        escapeCSV(row.action),
        escapeCSV(row.session_id),
        row.session_period || 30
      ].join(',');
    });
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hospital_behavior_dataset_${timestamp}.csv`;
    const filepath = path.join('.', filename);
    
    // Write CSV file
    fs.writeFileSync(filepath, csvContent);
    console.log(`✅ Training data exported to: ${filename}`);
    console.log(`📈 Records: ${result.rows.length}`);
    
    // Also copy to ml-service directory for Docker
    const mlServicePath = path.join('.', 'ml-service', filename);
    fs.writeFileSync(mlServicePath, csvContent);
    console.log(`✅ Copy created in ml-service directory`);
    
    return filename;
    
  } catch (error) {
    console.error('❌ Error generating training data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

function inferDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Run the script
generateTrainingData()
  .then((filename) => {
    console.log('🎉 Training data generation completed!');
    console.log(`📁 File: ${filename}`);
    console.log('🤖 Now you can retrain the ML model with this data');
  })
  .catch((error) => {
    console.error('💥 Failed to generate training data:', error);
    process.exit(1);
  });
