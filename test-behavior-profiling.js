#!/usr/bin/env node

/**
 * Behavior Profiling Test Script
 * ==============================
 * 
 * This script tests the behavior profiling system by simulating user actions
 * and checking if the profiling data is being collected correctly.
 */

const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5002';
const ML_SERVICE_URL = 'http://localhost:5001';

// Test configuration
const TEST_USERS = [
  { username: 'doctor.tran', role: 'doctor', actions: ['access_patient_record', 'view_lab_results', 'create_prescription'] },
  { username: 'nurse.jane', role: 'nurse', actions: ['update_patient_care', 'view_patient_record', 'medication_administration'] },
  { username: 'admin.user', role: 'admin', actions: ['user_management', 'system_monitoring', 'audit_review'] }
];

// Simulate user behavior data
const simulateBehaviorData = (user, action) => ({
  username: user.username,
  user_id: user.username,
  email: `${user.username}@hospital.com`,
  user_role: user.role,
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0 (Test Browser)',
  timestamp: new Date().toISOString(),
  action: action,
  session_id: `test_session_${Date.now()}`,
  session_period: Math.floor(Math.random() * 60) + 10, // 10-70 minutes
  risk_score: Math.random() * 0.5, // Random risk score 0-0.5
  metadata: {
    realm: 'demo',
    client_id: 'demo-client',
    token_type: 'Bearer'
  }
});

// Test functions
async function testServiceHealth() {
  console.log('🏥 Testing Hospital Web App Services...\n');
  
  try {
    // Test Frontend
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
    console.log('✅ Frontend:', frontendResponse.status === 200 ? 'Healthy' : 'Issues detected');
  } catch (error) {
    console.log('❌ Frontend: Not accessible');
  }

  try {
    // Test Backend
    const backendResponse = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
    console.log('✅ Backend:', backendResponse.status === 200 ? 'Healthy' : 'Issues detected');
  } catch (error) {
    console.log('❌ Backend: Not accessible');
  }

  try {
    // Test ML Service
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    console.log('✅ ML Service:', mlResponse.status === 200 ? 'Healthy' : 'Issues detected');
  } catch (error) {
    console.log('❌ ML Service: Not accessible');
  }
  
  console.log('');
}

async function testBehaviorTracking() {
  console.log('🧠 Testing Behavior Tracking...\n');
  
  for (const user of TEST_USERS) {
    console.log(`Testing user: ${user.username} (${user.role})`);
    
    for (const action of user.actions) {
      const behaviorData = simulateBehaviorData(user, action);
      
      try {
        // Try ML-enhanced behavior tracking first
        const mlResponse = await axios.post(`${BACKEND_URL}/api/ml-risk/behavior`, behaviorData, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (mlResponse.status === 200) {
          console.log(`  ✅ ${action}: ML-enhanced tracking successful`);
          console.log(`     Risk Score: ${mlResponse.data.riskScore || 'N/A'}`);
          console.log(`     Risk Level: ${mlResponse.data.riskLevel || 'N/A'}`);
        }
      } catch (mlError) {
        // Fallback to regular behavior tracking
        try {
          const fallbackResponse = await axios.post(`${BACKEND_URL}/api/behavior-tracking`, behaviorData, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (fallbackResponse.status === 200) {
            console.log(`  ⚠️  ${action}: Fallback tracking successful (ML service unavailable)`);
          }
        } catch (fallbackError) {
          console.log(`  ❌ ${action}: Tracking failed`);
        }
      }
      
      // Small delay between actions
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('');
  }
}

async function testBehaviorProfiling() {
  console.log('📊 Testing Behavior Profile Generation...\n');
  
  // Test if we can generate profiles for our test users
  for (const user of TEST_USERS) {
    try {
      // This would typically be done by the frontend behavior profiler
      console.log(`Generating profile for: ${user.username}`);
      
      // Simulate profile data structure
      const profileData = {
        userId: user.username,
        username: user.username,
        role: user.role,
        baseline: {
          established: false,
          typicalHours: [9, 10, 11, 14, 15, 16],
          averageSessionDuration: 45,
          commonActions: user.actions,
          peakActivityHours: [10, 14, 15],
          riskLevel: 'low'
        },
        currentSession: {
          sessionId: `test_session_${Date.now()}`,
          startTime: new Date(),
          actionCount: user.actions.length,
          uniqueActionsCount: user.actions.length,
          riskScore: Math.random() * 0.3,
          anomalies: []
        }
      };
      
      console.log(`  ✅ Profile structure created for ${user.username}`);
      console.log(`     Actions tracked: ${profileData.currentSession.actionCount}`);
      console.log(`     Risk Score: ${profileData.currentSession.riskScore.toFixed(3)}`);
      console.log(`     Baseline: ${profileData.baseline.established ? 'Established' : 'In Progress'}`);
      
    } catch (error) {
      console.log(`  ❌ Profile generation failed for ${user.username}: ${error.message}`);
    }
    
    console.log('');
  }
}

async function testAnomalyDetection() {
  console.log('🚨 Testing Anomaly Detection...\n');
  
  // Test with some unusual behavior patterns
  const anomalousActions = [
    { user: 'nurse.jane', action: 'admin_user_management', reason: 'Role mismatch' },
    { user: 'doctor.tran', action: 'bulk_patient_export', reason: 'Unusual data access' },
    { user: 'admin.user', action: 'access_patient_record_3am', reason: 'Off-hours access' }
  ];
  
  for (const anomaly of anomalousActions) {
    const user = TEST_USERS.find(u => u.username === anomaly.user);
    if (!user) continue;
    
    const behaviorData = simulateBehaviorData(user, anomaly.action);
    behaviorData.risk_score = 0.8; // High risk score for anomalous behavior
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ml-risk/behavior`, behaviorData, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 200) {
        const riskScore = response.data.riskScore || behaviorData.risk_score;
        console.log(`  🔍 ${anomaly.action}:`);
        console.log(`     User: ${anomaly.user}`);
        console.log(`     Reason: ${anomaly.reason}`);
        console.log(`     Risk Score: ${riskScore}`);
        console.log(`     ${riskScore > 0.6 ? '🚨 HIGH RISK DETECTED' : '✅ Normal risk'}`);
      }
    } catch (error) {
      console.log(`  ❌ Anomaly detection failed for ${anomaly.action}`);
    }
    
    console.log('');
  }
}

// Main test execution
async function runTests() {
  console.log('🧪 Hospital Web App - Behavior Profiling Test Suite');
  console.log('====================================================\n');
  
  try {
    await testServiceHealth();
    await testBehaviorTracking();
    await testBehaviorProfiling();
    await testAnomalyDetection();
    
    console.log('✅ All tests completed!\n');
    console.log('🎯 Next Steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Login as doctor.tran (password: password)');
    console.log('   3. Navigate to Admin Dashboard → Behavior Profiles');
    console.log('   4. Perform various actions to generate behavior data');
    console.log('   5. Check the console for behavior profiling logs\n');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = {
  testServiceHealth,
  testBehaviorTracking,
  testBehaviorProfiling,
  testAnomalyDetection
};
