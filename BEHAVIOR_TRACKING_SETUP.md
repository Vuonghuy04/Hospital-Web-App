# 🔍 User Behavior Tracking & ML Analytics Setup

This guide explains how to set up user behavior tracking for your hospital web app to collect data for ML-based anomaly detection.

## 📊 Data Schema

The system tracks comprehensive user behavior data with this schema:

```json
{
  "username": "doctor.tran",
  "userId": "doctor.tran",
  "email": "doctor.tran@hospital.com",
  "roles": ["doctor", "senior_staff"],
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "action": "record_access_123",
  "sessionId": "session_1705312200123_abc123def",
  "sessionPeriod": 15,
  "riskLevel": "low",
  "riskScore": 0.234,
  "metadata": {
    "realm": "demo",
    "clientId": "demo-client",
    "tokenType": "Bearer"
  }
}
```

## 🚀 Quick Start (Frontend Only)

**Current Implementation:** Data is stored locally in browser for immediate testing.

1. **Start your app**: `npm start`
2. **Use the application**: Login, navigate pages, access records
3. **View analytics**: Click the "📊 Analytics" button (bottom right)
4. **Export data**: Use the "Export JSON" button in analytics dashboard

## 🏗️ Full Production Setup (with MongoDB)

### 1. Frontend Configuration

Create `.env.local` file:
```env
# Keycloak Configuration
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=demo
REACT_APP_KEYCLOAK_CLIENT_ID=demo-client

# MongoDB Configuration
REACT_APP_MONGO_URI=mongodb+srv://vqh04092004:admin@cluster0.nnhndae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
REACT_APP_MONGO_DATABASE=hospital_analytics

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend-example

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3001
MONGO_URI=mongodb+srv://vqh04092004:admin@cluster0.nnhndae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGO_DATABASE=hospital_analytics
EOF

# Start the backend server
npm run dev
```

### 3. Update Frontend to Use Backend

Uncomment the API call in `src/services/behaviorTracking.ts`:

```javascript
// Replace the localStorage storage with actual API call
const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/behavior-tracking`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  },
  body: JSON.stringify(data),
});
```

## 📈 Tracked Behaviors

The system automatically tracks these user actions:

### **Authentication Events**
- `login` - User successfully authenticates
- `logout` - User logs out of the system

### **Navigation Events**
- `page_view_home` - Visit homepage
- `page_view_record` - Visit patient records page
- `page_view_jit_request` - Visit JIT request page
- `page_view_jit_admin` - Visit JIT admin panel

### **Data Access Events**
- `record_access_123` - Access specific patient record
- `jit_request_read` - Submit JIT access request
- `jit_approve_456` - Approve JIT request
- `jit_deny_789` - Deny JIT request

### **Custom Events**
Use `trackUserAction(action, details)` for custom tracking:
```javascript
import { trackUserAction } from '../services/behaviorTracking';

// Example: Track document download
await trackUserAction('document_download', 'patient_123_lab_results.pdf');

// Example: Track search query
await trackUserAction('search_query', 'patient hypertension');
```

## 🔍 Analytics Dashboard Features

### **Real-time Monitoring**
- Total events tracked
- Risk level distribution (Low/Medium/High)
- Recent user activities
- Session tracking

### **Data Export**
- Export to JSON for ML model training
- Filter by user, date range, risk level
- Real-time refresh capabilities

### **Risk Scoring**
- **Low Risk (0.0-0.3)**: Normal behavior patterns
- **Medium Risk (0.3-0.7)**: Unusual but not alarming
- **High Risk (0.7-1.0)**: Potentially anomalous behavior

## 🎯 ML Model Integration

### **Data Collection Pipeline**
1. **Frontend** tracks user actions
2. **Backend API** validates and stores in MongoDB
3. **ML Pipeline** processes data for anomaly detection
4. **Risk Scores** fed back to update user profiles

### **MongoDB Collections**
```
hospital_analytics/
├── user_behavior/     # Main behavior tracking data
├── risk_profiles/     # User risk profiles (future)
└── ml_predictions/    # ML model outputs (future)
```

### **API Endpoints**

#### Store Behavior Data
```bash
POST /api/behavior-tracking
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "doctor.tran",
  "action": "record_access_123",
  "sessionId": "session_123",
  ...
}
```

#### Retrieve Analytics
```bash
GET /api/behavior-analytics?days=7&username=doctor.tran
Authorization: Bearer <token>

Response:
{
  "analytics": {
    "totalEvents": 156,
    "uniqueUserCount": 12,
    "avgRiskScore": 0.234,
    "riskDistribution": {
      "low": 120,
      "medium": 30,
      "high": 6
    }
  }
}
```

## 🔒 Security Considerations

### **Data Privacy**
- All data transmission encrypted (HTTPS)
- JWT token authentication required
- IP addresses and user agents collected for security analysis
- Compliance with healthcare data regulations

### **Data Retention**
- Behavior data retained for 90 days (configurable)
- Anonymized data for long-term ML training
- User consent tracking for data collection

## 🧠 ML Model Training Data

### **Feature Engineering**
The collected data provides these features for ML models:

- **Temporal**: Time of access, session duration, frequency patterns
- **Behavioral**: Action sequences, navigation patterns, access frequency
- **Environmental**: IP address changes, device fingerprinting
- **Risk Indicators**: Failed access attempts, unusual data access patterns

### **Anomaly Detection Use Cases**
- **Account Takeover**: Unusual login patterns or locations
- **Insider Threats**: Excessive data access or unusual hours
- **Data Exfiltration**: Large volume downloads or access patterns
- **Role Violations**: Access to unauthorized patient records

## 📊 Dashboard Usage

### **View Current Data**
1. Click "📊 Analytics" button (bottom right)
2. Review summary statistics
3. Examine individual behavior records
4. Filter by risk level or time period

### **Export for ML Training**
1. Click "📥 Export JSON" in dashboard
2. Use exported data for model training
3. Schedule regular exports for continuous learning

### **Clear Test Data**
1. Click "🗑️ Clear Data" for testing
2. Confirms before deletion
3. Use for development/testing only

## 🔧 Troubleshooting

### **Common Issues**

1. **No behavior data appearing**
   - Check browser console for errors
   - Verify Keycloak authentication is working
   - Ensure localStorage is enabled

2. **MongoDB connection failed**
   - Verify connection string in .env
   - Check MongoDB Atlas network access
   - Ensure IP address is whitelisted

3. **Analytics dashboard empty**
   - Use the app to generate behavior data
   - Click "🔄 Refresh" in dashboard
   - Check browser localStorage for data

### **Debug Information**
Enable debug logging by opening browser console and running:
```javascript
// View stored behavior data
console.log('Behavior Data:', localStorage.getItem('hospital_behavior_data'));

// Clear all data
localStorage.removeItem('hospital_behavior_data');
```

## 📞 Support

For technical support or questions about the behavior tracking system:
1. Check browser console for error messages
2. Verify all environment variables are set correctly
3. Test API endpoints using tools like Postman
4. Review MongoDB Atlas logs for connection issues

---

🏥 **Ready to track user behavior for ML-powered anomaly detection!** 