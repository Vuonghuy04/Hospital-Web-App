# 🛡️ OPA (Open Policy Agent) Integration Guide

## Overview

This guide explains how to integrate OPA Rego policies into your Hospital Web App for advanced authorization, risk-based access control, and HIPAA compliance enforcement.

## 🎯 Why Use OPA Rego in Your Hospital App?

### Current Limitations
Your app currently has authorization logic scattered across:
- Keycloak for authentication
- Backend route middleware
- Frontend components
- Database queries

### Benefits of OPA Integration

1. **Centralized Policy Management**
   - All authorization logic in one place
   - Version controlled policies
   - Easy to test and audit

2. **Dynamic Context-Aware Access Control**
   - Consider ML risk scores
   - Time-based policies (business hours)
   - Location-based restrictions
   - Behavior pattern analysis

3. **Separation of Concerns**
   - Decouple authorization from business logic
   - Policy updates without code changes
   - Clear security boundaries

4. **HIPAA Compliance**
   - Enforce minimum necessary principle
   - Automatic audit requirements
   - Break-glass emergency access
   - Patient consent validation

5. **ML-Integrated Security**
   - Real-time risk-based decisions
   - Behavior anomaly detection
   - Adaptive session durations
   - Dynamic permission adjustments

## 📋 Prerequisites

- Docker and Docker Compose installed
- Your Hospital Web App running
- Basic understanding of Rego language (optional, examples provided)

## 🚀 Quick Start

### Step 1: Add OPA to Docker Compose

Add OPA service to your existing `deployment/docker/docker-compose.yml`:

```yaml
services:
  # ... existing services ...

  opa:
    image: openpolicyagent/opa:latest-envoy
    container_name: hospital-opa
    ports:
      - "8181:8181"
    command:
      - "run"
      - "--server"
      - "--log-level=info"
      - "/policies"
    volumes:
      - ../../opa/policies:/policies:ro
    networks:
      - hospital-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8181/health"]
      interval: 10s
      timeout: 5s
      retries: 3
```

### Step 2: Start OPA Service

```bash
# Windows PowerShell
cd "E:\Capstone Project\APP\Hospital-Web-App"
docker compose -f deployment/docker/docker-compose.yml up -d opa

# Verify OPA is running
curl http://localhost:8181/health
```

### Step 3: Install Node.js Dependencies

Add to `backend/package.json`:

```json
{
  "dependencies": {
    "node-fetch": "^3.3.2"
  }
}
```

Then install:

```bash
cd backend
npm install
```

### Step 4: Update Backend Server

Add OPA middleware to your routes in `backend/server.js`:

```javascript
import opaMiddleware from './middleware/opa.js';

// Example: Protect patient records with OPA
app.use('/api/patients', 
  authMiddleware, 
  opaMiddleware.authorize('healthcare/authorization')
);
```

### Step 5: Test OPA Policies

Test a policy directly:

```bash
# Test healthcare authorization policy
curl -X POST http://localhost:8181/v1/data/healthcare/authorization \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "roles": ["doctor"],
        "risk_score": 0.3
      },
      "resource": {
        "type": "patient_record",
        "sensitivity": "high"
      },
      "action": "read"
    }
  }'
```

## 📚 Policy Examples

### 1. Basic Authorization

```rego
package healthcare.authorization

default allow := false

# Doctors can read patient records during business hours
allow if {
    input.user.roles[_] == "doctor"
    input.resource.type == "patient_record"
    input.action == "read"
    is_business_hours
    input.user.risk_score < 0.5
}
```

### 2. ML Risk-Based Access

```rego
package healthcare.risk

default allow := false

allow if {
    input.user.ml_risk_score < 0.5
    input.resource.sensitivity != "critical"
}

# Require MFA for elevated risk
requires_mfa if {
    input.user.ml_risk_score >= 0.3
}
```

### 3. JIT Access Control

```rego
package healthcare.jit

default allow_request := false

allow_request if {
    input.user.risk_score < 0.7
    input.user.policy_violations_last_30_days < 3
}

max_duration_hours := 4 if {
    input.requester.risk_score < 0.3
}
```

## 🔧 Integration Patterns

### Pattern 1: Route-Level Protection

```javascript
// Protect entire route
router.use('/api/sensitive-data', 
  authMiddleware,
  authorize('healthcare/authorization')
);

// All endpoints under /api/sensitive-data now protected
router.get('/:id', async (req, res) => {
  // If we reach here, OPA allowed access
  const data = await getData(req.params.id);
  res.json(data);
});
```

### Pattern 2: Endpoint-Specific Policies

```javascript
// Different policies for different actions
router.get('/patients/:id',
  authMiddleware,
  authorize('healthcare/authorization'),
  getPatient
);

router.delete('/patients/:id',
  authMiddleware,
  riskBasedAccess(),  // Check ML risk
  hipaaCompliance(),  // Check HIPAA rules
  authorize('healthcare/authorization'),
  deletePatient
);
```

### Pattern 3: Dynamic UI Permissions

```javascript
// Frontend gets permissions from backend
const permissions = await fetch('/api/user/permissions');

// UI adapts based on OPA policies
if (permissions.can_export) {
  showExportButton();
}

if (permissions.requires_mfa) {
  promptForMFA();
}
```

### Pattern 4: Context-Enriched Decisions

```javascript
router.get('/records/:id',
  authMiddleware,
  async (req, res, next) => {
    // Enrich request with ML risk score
    req.user.ml_risk_score = await getMLRiskScore(req.user.id);
    req.user.behavior = await getBehaviorMetrics(req.user.id);
    next();
  },
  riskBasedAccess(),
  getRecord
);
```

## 📊 Policy Testing

### Unit Tests for Policies

Create `opa/policies/test_authorization.rego`:

```rego
package healthcare.authorization

test_doctor_can_read_patient_records {
    allow with input as {
        "user": {"roles": ["doctor"], "risk_score": 0.2},
        "resource": {"type": "patient_record"},
        "action": "read"
    }
}

test_high_risk_user_denied {
    not allow with input as {
        "user": {"roles": ["doctor"], "risk_score": 0.9},
        "resource": {"type": "patient_record"},
        "action": "read"
    }
}
```

Run tests:

```bash
docker exec hospital-opa opa test /policies
```

## 🔍 Monitoring & Debugging

### View OPA Logs

```bash
docker logs hospital-opa -f
```

### Query Decision Logs

```bash
# Get all decision logs
curl http://localhost:8181/v1/data/system/diagnostics
```

### Enable Debug Mode

Update docker-compose.yml:

```yaml
command:
  - "run"
  - "--server"
  - "--log-level=debug"  # Change to debug
  - "/policies"
```

## 🎯 Use Cases for Your Hospital App

### 1. **Patient Record Access**

**Problem**: Doctors should only access records of their assigned patients.

**Solution**:
```rego
allow if {
    input.user.roles[_] == "doctor"
    input.resource.type == "patient_record"
    input.resource.patient_id in input.user.assigned_patients
}
```

### 2. **Time-Based Financial Access**

**Problem**: Financial data should only be accessed during business hours.

**Solution**:
```rego
deny contains msg if {
    input.resource.type == "financial_data"
    not is_business_hours
    not input.user.roles[_] == "manager"
    msg := "Financial data access restricted to business hours"
}
```

### 3. **Risk-Adjusted Session Duration**

**Problem**: High-risk users should have shorter sessions.

**Solution**:
```rego
max_session_duration_minutes := 30 if {
    input.user.ml_risk_score >= 0.7
}

max_session_duration_minutes := 480 if {
    input.user.ml_risk_score < 0.3
}
```

### 4. **JIT Access with Auto-Revocation**

**Problem**: Temporary access should be automatically revoked if risk increases.

**Solution**:
```rego
should_revoke_access if {
    input.grant.user.risk_score > 0.8
}

should_revoke_access if {
    input.grant.user.suspicious_activity_detected
}
```

### 5. **HIPAA Minimum Necessary**

**Problem**: Users should only access the minimum necessary PHI.

**Solution**:
```rego
accessible_fields contains field if {
    input.user.roles[_] == "billing_specialist"
    field := ["name", "date_of_birth", "insurance_info"]
}

accessible_fields contains field if {
    input.user.id in input.patient.care_team
    field := input.data.all_fields[_]  # Full access for care team
}
```

## 🚦 Migration Strategy

### Phase 1: Parallel Run (Week 1-2)
- Deploy OPA alongside existing authorization
- Log OPA decisions without enforcing
- Compare OPA decisions with current logic
- Identify discrepancies

### Phase 2: Soft Enforcement (Week 3-4)
- Enforce OPA for non-critical endpoints
- Keep existing checks as fallback
- Monitor for issues
- Tune policies based on real traffic

### Phase 3: Full Migration (Week 5-6)
- Enforce OPA for all endpoints
- Remove redundant authorization code
- Full audit and compliance validation
- Performance optimization

### Phase 4: Advanced Features (Week 7+)
- Add ML risk integration
- Implement dynamic policies
- Add policy versioning
- Set up policy bundles

## 📈 Performance Considerations

### Caching
```javascript
// Cache OPA decisions for 5 minutes
const cache = new Map();

async function queryCachedOPA(policy, input) {
  const key = `${policy}:${JSON.stringify(input)}`;
  
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < 300000) {
      return cached.result;
    }
  }
  
  const result = await queryOPA(policy, input);
  cache.set(key, { result, timestamp: Date.now() });
  return result;
}
```

### Batch Decisions
```javascript
// Check multiple permissions at once
const permissions = await queryOPA('healthcare/authorization/batch', {
  user: req.user,
  resources: ['patient_records', 'financial_data', 'audit_logs']
});
```

## 🔐 Security Best Practices

1. **Fail Closed**: Always deny on errors
2. **Explicit Deny**: Use deny rules for clarity
3. **Audit Everything**: Log all policy decisions
4. **Test Policies**: Write comprehensive tests
5. **Version Control**: Track policy changes in Git
6. **Principle of Least Privilege**: Default deny
7. **Regular Reviews**: Audit policies quarterly

## 📚 Resources

- [OPA Documentation](https://www.openpolicyagent.org/docs/)
- [Rego Playground](https://play.openpolicyagent.org/)
- [Policy Examples](https://github.com/open-policy-agent/library)
- [Best Practices](https://www.openpolicyagent.org/docs/latest/policy-language/)

## 🆘 Troubleshooting

### OPA Not Responding
```bash
# Check if OPA is running
docker ps | grep hospital-opa

# Check OPA health
curl http://localhost:8181/health

# View logs
docker logs hospital-opa
```

### Policy Syntax Errors
```bash
# Validate policy syntax
docker exec hospital-opa opa check /policies
```

### Performance Issues
```bash
# Profile policy execution
docker exec hospital-opa opa eval \
  --profile \
  --data /policies \
  'data.healthcare.authorization.allow'
```

## 📞 Next Steps

1. Review the provided policy files in `opa/policies/`
2. Start OPA with `docker-compose up -d opa`
3. Test policies with curl or Postman
4. Add OPA middleware to one route
5. Monitor and iterate
6. Gradually expand to all routes

---

**Need Help?** Check the logs, review the policies, and test incrementally!

