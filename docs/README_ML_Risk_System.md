# ML Risk Prediction System

This document describes the AI-powered risk prediction system integrated into the Hospital Web Application.

## Overview

The ML Risk Prediction System uses an Isolation Forest algorithm to predict risk scores for user behavior in real-time. It analyzes patterns in user activity to identify potentially anomalous or risky behavior.

## Architecture

### Components

1. **Python ML Service** (`python_ml_service.py`)
   - Flask-based API service
   - Hosts the trained Isolation Forest model
   - Provides prediction endpoints
   - Runs on port 5001

2. **Risk Prediction Service** (`risk_prediction_service.py`)
   - Core ML logic and model training
   - Data preprocessing and feature engineering
   - Model persistence and loading

3. **Node.js ML Risk Service** (`backend/services/ml-risk-service.js`)
   - Bridge between Node.js backend and Python ML service
   - Database integration
   - Risk score updates

4. **ML Risk API Routes** (`backend/routes/ml-risk.js`)
   - REST API endpoints for ML functionality
   - Admin interfaces for model management

5. **ML Risk Dashboard** (`src/components/MLRiskDashboard.tsx`)
   - React component for admin interface
   - Real-time risk monitoring
   - Model management controls

## Features

### Data Processing Pipeline

The system follows the same preprocessing steps as described in your training code:

```python
# Convert timestamp to datetime
df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')

# Drop rows with invalid timestamps
df = df.dropna(subset=['timestamp'])

# Extract features from timestamp
df['hour'] = df['timestamp'].dt.hour
df['day_of_week'] = df['timestamp'].dt.dayofweek  # Monday=0, Sunday=6
df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
```

Additional features are extracted:
- `is_business_hours`: Whether the activity occurred during business hours (9 AM - 5 PM)
- `is_sensitive_action`: Whether the action involves sensitive data access
- `is_failed_action`: Whether the action failed or was unauthorized
- `session_length_category`: Categorized session duration (short/medium/long)

### Model Training

The Isolation Forest model is configured with:
- `n_estimators=100`: Number of trees in the forest
- `contamination=0.1`: Expected proportion of anomalies (10%)
- `random_state=42`: For reproducible results

### Risk Scoring

Risk scores are normalized to a 0-1 scale where:
- **0.0 - 0.4**: Low risk (green)
- **0.4 - 0.7**: Medium risk (yellow)
- **0.7 - 1.0**: High risk (red)

## API Endpoints

### ML Service Status
```
GET /api/ml-risk/status
```
Returns the status of the ML service and model training state.

### Update All Risk Scores
```
POST /api/ml-risk/update-all
```
Updates risk scores for all records in the database using the trained model.

### Train Model
```
POST /api/ml-risk/train
```
Trains the Isolation Forest model using the latest dataset.

### Single Prediction
```
POST /api/ml-risk/predict/single
Content-Type: application/json

{
  "username": "user123",
  "user_id": "user_123",
  "email": "user@hospital.com",
  "user_role": "nurse",
  "ip_address": "192.168.1.100",
  "device_type": "mobile",
  "timestamp": "2025-09-22T14:30:00",
  "action": "patient_record_access",
  "session_id": "sess_123",
  "session_period": 45
}
```

### High Risk Users
```
GET /api/ml-risk/high-risk-users?limit=50&days=7
```
Returns users with elevated risk scores.

### Risk Analytics
```
GET /api/ml-risk/analytics?days=7
```
Returns comprehensive risk analytics and trends.

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL database

### Python Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- pandas==2.1.3
- numpy==1.24.3
- scikit-learn==1.3.2
- joblib==1.3.2
- flask==3.0.0
- flask-cors==4.0.0
- python-dotenv==1.0.0

### Starting the Services

#### Option 1: Automatic Startup (Recommended)

**Windows:**
```cmd
start-ml-services.bat
```

**Linux/Mac:**
```bash
chmod +x start-ml-services.sh
./start-ml-services.sh
```

#### Option 2: Manual Startup

1. **Start Python ML Service:**
```bash
python python_ml_service.py
```

2. **Start Node.js Backend:**
```bash
cd backend
npm start
```

3. **Start React Frontend:**
```bash
npm start
```

## Usage

### Admin Interface

1. Navigate to `/admin/ml-risk` in the web application
2. View ML service status and model training state
3. Monitor risk score distribution and statistics
4. Review high-risk users and their activities
5. Update risk scores for all records
6. Train the model with new data

### Key Features in Admin Dashboard

- **Service Status**: Real-time status of ML service and model
- **Risk Distribution**: Visual breakdown of low/medium/high risk events
- **High Risk Users**: List of users requiring attention
- **Risk Analytics**: Time-series analysis and action-based risk patterns
- **Model Management**: Train model and update predictions

### Automated Risk Scoring

The system can automatically predict risk scores for new behavior records:

```javascript
// Create behavior with ML-predicted risk score
const response = await fetch('/api/ml-risk/behavior', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user123',
    userId: 'user_123',
    action: 'patient_record_access',
    sessionId: 'sess_123',
    // ... other fields
  })
});
```

## Model Performance

The Isolation Forest model is particularly effective for:
- **Unsupervised anomaly detection**: No labeled data required
- **Handling mixed data types**: Categorical and numerical features
- **Scalability**: Efficient with large datasets
- **Interpretability**: Feature importance analysis available

## Monitoring and Maintenance

### Regular Tasks

1. **Model Retraining**: Retrain periodically with new data
2. **Performance Monitoring**: Track prediction accuracy and false positive rates
3. **Data Quality**: Ensure clean, consistent input data
4. **Threshold Tuning**: Adjust risk level thresholds based on operational needs

### Troubleshooting

**ML Service Offline:**
- Check if Python service is running on port 5001
- Verify Python dependencies are installed
- Check logs for error messages

**Model Not Trained:**
- Run the training endpoint: `POST /api/ml-risk/train`
- Ensure dataset files are available
- Check for sufficient training data

**Prediction Errors:**
- Verify input data format matches training data
- Check for missing required fields
- Ensure categorical values exist in training set

## Security Considerations

- **Access Control**: ML endpoints require admin privileges
- **Data Privacy**: Sensitive user data is processed securely
- **Model Security**: Trained models are stored securely
- **API Authentication**: All endpoints use proper authentication

## Future Enhancements

- **Real-time Streaming**: Process events in real-time
- **Model Ensemble**: Combine multiple algorithms
- **Advanced Features**: User behavior patterns, time-series analysis
- **Explainable AI**: SHAP values for prediction explanations
- **Automated Alerts**: Real-time notifications for high-risk events

## Support

For technical support or questions about the ML Risk Prediction System, please refer to the main application documentation or contact the development team.
