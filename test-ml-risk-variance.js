/**
 * Test script to verify ML model is producing varied risk scores
 * Run: node test-ml-risk-variance.js
 */

const ML_SERVICE_URL = 'http://localhost:5001';

// Test scenarios with different expected risk levels
const testScenarios = [
  {
    name: 'Low Risk - Routine Nurse Activity',
    data: {
      username: 'nurse_test',
      user_id: 'nurse_001',
      user_role: 'nurse',
      ip_address: '192.168.1.100',
      device_type: 'desktop',
      timestamp: '2025-10-16T14:30:00',
      action: 'access_patient_record',
      session_id: 'sess_001',
      session_period: 45
    },
    expectedRange: { min: 0.15, max: 0.35 }
  },
  {
    name: 'Medium Risk - Off-Hours Access',
    data: {
      username: 'doctor_test',
      user_id: 'doctor_001',
      user_role: 'doctor',
      ip_address: '192.168.1.50',
      device_type: 'mobile',
      timestamp: '2025-10-16T22:30:00',
      action: 'access_patient_record',
      session_id: 'sess_002',
      session_period: 120
    },
    expectedRange: { min: 0.35, max: 0.65 }
  },
  {
    name: 'High Risk - Admin Config Change at Night',
    data: {
      username: 'admin_test',
      user_id: 'admin_001',
      user_role: 'admin',
      ip_address: '10.0.0.50',
      device_type: 'new',
      timestamp: '2025-10-16T02:30:00',
      action: 'admin_config_change',
      session_id: 'sess_003',
      session_period: 180
    },
    expectedRange: { min: 0.60, max: 0.90 }
  },
  {
    name: 'Very High Risk - Guest Financial Export',
    data: {
      username: 'guest_suspicious',
      user_id: 'guest_999',
      user_role: 'guest',
      ip_address: '203.0.113.50',
      device_type: 'unknown',
      timestamp: '2025-10-16T23:30:00',
      action: 'export_financial_data',
      session_id: 'sess_004',
      session_period: 5
    },
    expectedRange: { min: 0.50, max: 0.95 }
  },
  {
    name: 'Low Risk - User Dashboard View',
    data: {
      username: 'user_test',
      user_id: 'user_001',
      user_role: 'user',
      ip_address: '192.168.1.200',
      device_type: 'desktop',
      timestamp: '2025-10-16T10:00:00',
      action: 'page_view_dashboard',
      session_id: 'sess_005',
      session_period: 20
    },
    expectedRange: { min: 0.15, max: 0.35 }
  }
];

async function testMLRiskScores() {
  console.log('🧪 Testing ML Model Risk Score Variance\n');
  console.log('=' .repeat(80));

  let allPassed = true;
  const results = [];

  for (const scenario of testScenarios) {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/predict/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenario.data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Prediction failed');
      }

      const result = await response.json();
      const riskScore = result.risk_score;
      const riskLevel = result.risk_level;
      
      const inRange = riskScore >= scenario.expectedRange.min && 
                      riskScore <= scenario.expectedRange.max;
      const status = inRange ? '✅ PASS' : '❌ FAIL';
      
      if (!inRange) allPassed = false;

      console.log(`\n${status} ${scenario.name}`);
      console.log(`   Risk Score: ${riskScore.toFixed(3)} (${riskLevel})`);
      console.log(`   Expected Range: ${scenario.expectedRange.min} - ${scenario.expectedRange.max}`);
      console.log(`   Factors: ${scenario.data.user_role} | ${scenario.data.action} | ${scenario.data.device_type}`);
      
      results.push({
        scenario: scenario.name,
        score: riskScore,
        level: riskLevel,
        passed: inRange
      });

    } catch (error) {
      console.log(`\n❌ FAIL ${scenario.name}`);
      console.log(`   Error: ${error.message}`);
      allPassed = false;
      
      results.push({
        scenario: scenario.name,
        score: null,
        level: 'error',
        passed: false,
        error: error.message
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Test Summary\n');
  
  // Calculate variance
  const scores = results.filter(r => r.score !== null).map(r => r.score);
  if (scores.length > 0) {
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    
    console.log(`Total Tests: ${testScenarios.length}`);
    console.log(`Passed: ${results.filter(r => r.passed).length}`);
    console.log(`Failed: ${results.filter(r => !r.passed).length}`);
    console.log(`\nScore Distribution:`);
    console.log(`   Min:      ${minScore.toFixed(3)}`);
    console.log(`   Max:      ${maxScore.toFixed(3)}`);
    console.log(`   Average:  ${avgScore.toFixed(3)}`);
    console.log(`   Variance: ${variance.toFixed(3)}`);
    console.log(`   Range:    ${(maxScore - minScore).toFixed(3)}`);
    
    if (variance < 0.01) {
      console.log('\n⚠️  WARNING: Very low variance detected!');
      console.log('   The model may still be returning uniform scores.');
      allPassed = false;
    } else if (maxScore - minScore < 0.15) {
      console.log('\n⚠️  WARNING: Low score range!');
      console.log('   Risk scores should have more variation.');
      allPassed = false;
    } else {
      console.log('\n✅ Good variance! Model is producing diverse risk scores.');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}\n`);
  
  return allPassed;
}

// Run tests
testMLRiskScores()
  .then(passed => {
    process.exit(passed ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });

