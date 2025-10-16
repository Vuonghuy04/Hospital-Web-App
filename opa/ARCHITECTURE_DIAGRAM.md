# 🏗️ OPA Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HOSPITAL WEB APP                             │
│                      (Your Existing System)                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Frontend       │      │   Keycloak       │      │   ML Service     │
│   React App      │◄────►│   (Auth)         │      │   (Risk Scores)  │
│   Port 3000      │      │   Port 8080      │      │   Port 5001      │
└────────┬─────────┘      └──────────────────┘      └────────┬─────────┘
         │                                                    │
         │ HTTP Request                                       │
         │                                                    │
         ▼                                                    │
┌─────────────────────────────────────────────────────────┐  │
│                    Backend API                           │  │
│                    Node.js / Express                     │  │
│                    Port 5002                             │  │
│                                                          │  │
│  ┌────────────────────────────────────────────────────┐ │  │
│  │          OPA Middleware Layer                      │ │  │
│  │                                                    │ │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │ │  │
│  │  │authorize │  │jitAccess │  │riskBasedAccess│   │ │  │
│  │  │()        │  │()        │  │()             │   │ │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │ │  │
│  │       │             │                │           │ │  │
│  │       └─────────────┴────────────────┘           │ │  │
│  │                     │                            │ │  │
│  └─────────────────────┼────────────────────────────┘ │  │
│                        │                              │  │
│                        │ Policy Query                 │  │
│                        ▼                              │  │
│         ┌─────────────────────────────┐              │  │
│         │  OPA Client (HTTP)          │              │  │
│         │  - Build input              │              │  │
│         │  - Query policies           │◄─────────────┘  │
│         │  - Evaluate decisions       │   ML Risk Score │
│         └──────────┬──────────────────┘                 │
│                    │                                    │
└────────────────────┼────────────────────────────────────┘
                     │
                     │ HTTP: POST /v1/data/{policy}
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    OPA Service                          │
│              (Policy Decision Point)                    │
│                  Port 8181                              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Policy Engine                         │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  healthcare/authorization                  │ │  │
│  │  │  - Role-based access                       │ │  │
│  │  │  - Time-based restrictions                 │ │  │
│  │  │  - Risk-based decisions                    │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  healthcare/jit                            │ │  │
│  │  │  - Request validation                      │ │  │
│  │  │  - Approval logic                          │ │  │
│  │  │  - Duration limits                         │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  healthcare/risk                           │ │  │
│  │  │  - ML risk integration                     │ │  │
│  │  │  - Behavior anomaly detection              │ │  │
│  │  │  - Dynamic session management              │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  healthcare/hipaa                          │ │  │
│  │  │  - PHI access rules                        │ │  │
│  │  │  - Minimum necessary                       │ │  │
│  │  │  - Emergency access                        │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Decision: {allow: true/false, deny: [...], ...}       │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Return decision
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                      │
│                    Port 5432                             │
│  - user_behavior (ML training)                          │
│  - enhanced_audit_events (audit trail)                  │
└─────────────────────────────────────────────────────────┘
```

---

## Request Flow Example

### Example 1: Doctor Accessing Patient Record

```
1. Frontend → Backend
   GET /api/patients/123/records
   Authorization: Bearer {keycloak-token}

2. Backend Middleware Chain
   ├─ authMiddleware (Keycloak)
   │  └─ Validates JWT token
   │  └─ Extracts user info (roles, email, etc.)
   │
   ├─ authorize('healthcare/authorization')
   │  │
   │  ├─ Build OPA Input:
   │  │  {
   │  │    user: {
   │  │      id: "user123",
   │  │      roles: ["doctor"],
   │  │      risk_score: 0.3,
   │  │      location: {country: "US", ip: "10.0.0.1"}
   │  │    },
   │  │    resource: {
   │  │      type: "patient_record",
   │  │      id: "123",
   │  │      sensitivity: "high"
   │  │    },
   │  │    action: "read",
   │  │    context: {
   │  │      time: 1697456789000,
   │  │      user_agent: "Mozilla/5.0..."
   │  │    }
   │  │  }
   │  │
   │  ├─ Query OPA:
   │  │  POST http://localhost:8181/v1/data/healthcare/authorization
   │  │
   │  └─ OPA Policy Evaluation:
   │     ├─ Check: user.roles[_] == "doctor" ✓
   │     ├─ Check: resource.type == "patient_record" ✓
   │     ├─ Check: is_business_hours ✓
   │     ├─ Check: risk_score < 0.5 ✓
   │     └─ Result: {allow: true, requires_enhanced_audit: true}
   │
   └─ Continue to route handler
      └─ Fetch patient records
      └─ Return to frontend

3. Audit Log Created
   Enhanced audit entry (PHI access logged)
```

---

### Example 2: High-Risk User Attempting Financial Data Export

```
1. Frontend → Backend
   POST /api/financial-data/export
   Authorization: Bearer {keycloak-token}

2. Backend Middleware Chain
   ├─ authMiddleware ✓
   │
   ├─ riskBasedAccess()
   │  │
   │  ├─ Get ML Risk Score:
   │  │  GET http://localhost:5001/predict-risk
   │  │  Response: {risk_score: 0.85, anomaly: true}
   │  │
   │  ├─ Build OPA Input:
   │  │  {
   │  │    user: {
   │  │      ml_risk_score: 0.85,
   │  │      behavior: {anomaly_detected: true}
   │  │    },
   │  │    resource: {type: "financial_data"},
   │  │    action: "export"
   │  │  }
   │  │
   │  ├─ Query OPA:
   │  │  POST http://localhost:8181/v1/data/healthcare/risk
   │  │
   │  └─ OPA Policy Evaluation:
   │     ├─ Check: ml_risk_score < 0.5 ✗ (0.85 > 0.5)
   │     ├─ Check: behavior_anomaly_detected ✓ (true)
   │     ├─ Check: should_trigger_alert ✓
   │     └─ Result: {
   │           allow: false,
   │           deny: ["Risk score too high for export"],
   │           should_trigger_alert: true,
   │           alert_severity: "high",
   │           recommended_action: "block_access"
   │         }
   │
   └─ 403 Forbidden
      └─ Return error to frontend
      └─ Trigger security alert
      └─ Log violation attempt

3. Security Alert Triggered
   Alert sent to security team
   Audit log created with violation details
```

---

## Data Flow Diagram

```
┌──────────┐
│  User    │
│ (Doctor) │
└────┬─────┘
     │
     │ 1. Request + JWT Token
     ▼
┌─────────────────┐
│   Frontend      │
│   React App     │
└────┬────────────┘
     │
     │ 2. API Call
     ▼
┌─────────────────────────────────────────────────┐
│          Backend API (Node.js)                  │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  3. Authentication Middleware           │   │
│  │     (Keycloak JWT Validation)           │   │
│  └────────────┬────────────────────────────┘   │
│               │                                 │
│               ▼                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  4. OPA Authorization Middleware        │   │
│  │                                         │   │
│  │  ┌──────────────────────────────────┐  │   │
│  │  │ a) Get ML Risk Score             │  │   │
│  │  │    └─> ML Service                │  │   │
│  │  │         └─> Risk: 0.3            │  │   │
│  │  └──────────────────────────────────┘  │   │
│  │                                         │   │
│  │  ┌──────────────────────────────────┐  │   │
│  │  │ b) Build Policy Input            │  │   │
│  │  │    - User context                │  │   │
│  │  │    - Resource info               │  │   │
│  │  │    - Action type                 │  │   │
│  │  │    - Risk score                  │  │   │
│  │  └──────────────────────────────────┘  │   │
│  │                                         │   │
│  │  ┌──────────────────────────────────┐  │   │
│  │  │ c) Query OPA                     │  │   │
│  │  │    POST /v1/data/policy          │  │   │
│  │  └──────────────┬───────────────────┘  │   │
│  └─────────────────┼──────────────────────┘   │
│                    │                           │
└────────────────────┼───────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────┐
│              OPA Service                       │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  5. Policy Evaluation                   │  │
│  │                                         │  │
│  │  Rule 1: Check roles         ✓         │  │
│  │  Rule 2: Check risk score    ✓         │  │
│  │  Rule 3: Check time          ✓         │  │
│  │  Rule 4: Check location      ✓         │  │
│  │  Rule 5: Check resource      ✓         │  │
│  │                                         │  │
│  │  Result: {                              │  │
│  │    allow: true,                         │  │
│  │    requires_mfa: false,                 │  │
│  │    requires_enhanced_audit: true,       │  │
│  │    max_session_duration: 480            │  │
│  │  }                                      │  │
│  └─────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────┘
                     │
                     │ 6. Decision
                     ▼
┌────────────────────────────────────────────────┐
│          Backend API (cont.)                   │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  7. Process Decision                    │  │
│  │     - If allow: continue                │  │
│  │     - If deny: return 403               │  │
│  │     - Set session duration              │  │
│  │     - Trigger audit if required         │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  8. Route Handler                       │  │
│  │     - Fetch data from database          │  │
│  │     - Apply field filtering (if needed) │  │
│  │     - Return response                   │  │
│  └─────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────┘
                     │
                     │ 9. Response
                     ▼
┌─────────────────────────────────────────────┐
│          Frontend                           │
│  - Receive data                             │
│  - Update UI                                │
│  - Show session expiry timer (if provided)  │
└─────────────────────────────────────────────┘
```

---

## Component Interactions

### 1. **Authorization Flow**

```
Frontend Request
      ↓
[Keycloak JWT] → Validate Token → Extract User Info
      ↓
[OPA Middleware] → Build Input → Query OPA → Evaluate Policy
      ↓
Decision: Allow/Deny
      ↓
[Route Handler] → Fetch Data → Filter Fields → Response
```

### 2. **JIT Access Request Flow**

```
User Requests JIT Access
      ↓
[JIT Middleware] → Query healthcare/jit policy
      ↓
OPA Evaluates:
  - User risk score
  - Resource sensitivity
  - Recent violations
  - Current active grants
      ↓
Decision:
  - allow_request: true/false
  - max_duration_hours: 2-24
  - requires_manager_approval: true/false
      ↓
If allowed:
  - Create request in database
  - Auto-approve if criteria met
  - Notify manager if approval needed
```

### 3. **Risk-Based Access Flow**

```
User Action Triggered
      ↓
[Get ML Risk Score] → ML Service API
      ↓
[Risk Middleware] → Build Input with Risk Data
      ↓
Query healthcare/risk policy
      ↓
OPA Evaluates:
  - Risk level (low/medium/high/critical)
  - Behavior anomalies
  - Session duration limits
  - MFA requirements
  - Allowed actions
      ↓
Apply Dynamic Restrictions:
  - Adjust session duration
  - Require MFA if needed
  - Block high-risk actions
  - Trigger alerts if necessary
```

---

## Integration Points

### 1. **Existing System → OPA**
- **Trigger**: Every API request
- **Data Flow**: Request context → OPA input
- **Decision**: Allow/Deny + metadata

### 2. **ML Service → OPA**
- **Trigger**: Risk-based policy evaluation
- **Data Flow**: User behavior → Risk score → OPA input
- **Decision**: Dynamic access adjustments

### 3. **OPA → Audit System**
- **Trigger**: Policy decisions
- **Data Flow**: Decision + context → Audit log
- **Result**: Complete audit trail

### 4. **OPA → Frontend**
- **Trigger**: Permission queries
- **Data Flow**: User context → Permissions object
- **Result**: Dynamic UI rendering

---

## Key Benefits of This Architecture

1. **🔒 Centralized Security**: All authorization logic in OPA
2. **🤖 ML Integration**: Real-time risk assessment
3. **⚡ Fast**: Microsecond policy evaluation
4. **🔄 Flexible**: Update policies without code changes
5. **📊 Observable**: Every decision logged
6. **🧪 Testable**: Policies can be unit tested
7. **📈 Scalable**: Handles high request volumes
8. **🛡️ Defense in Depth**: Multiple policy layers

---

## Policy Decision Matrix

| User Risk | Resource Sensitivity | Time | Location | Action | Decision |
|-----------|---------------------|------|----------|--------|----------|
| Low (0.2) | Medium | Business Hours | Hospital | Read | ✅ Allow (8h session) |
| Medium (0.5) | High | Business Hours | VPN | Read | ✅ Allow (4h session, MFA required) |
| High (0.7) | High | Business Hours | Hospital | Write | ❌ Deny (Risk too high) |
| Low (0.2) | Critical | After Hours | Hospital | Read | ❌ Deny (Time restriction) |
| Low (0.2) | Low | Business Hours | Foreign | Export | ❌ Deny (Location restriction) |
| Critical (0.9) | Any | Any | Any | Any | ❌ Deny + Alert |

---

This architecture provides **enterprise-grade security** with **context-aware decisions**, **ML integration**, and **HIPAA compliance** built right in! 🚀

