# Hospital Web App - ML Dataset Documentation

## 🏥 Dataset Overview

This dataset contains mock user behavior data from a Hospital Web Application, designed for training Machine Learning models to predict user risk scores. The data closely matches the actual database schema used in the production system.

### 📊 Dataset Statistics
- **Records**: 5,000 behavior entries
- **Users**: 100 unique users across 8 roles
- **Time Period**: Last 30 days (simulated)
- **Actions**: 27 different user action types
- **IP Addresses**: 60 unique IPs across 12 geographic regions

## 🗂️ Database Schema

The dataset matches the actual PostgreSQL schema from the Hospital Web App:

```sql
CREATE TABLE user_behavior (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    roles TEXT[],
    ip_address VARCHAR(45) DEFAULT 'unknown',
    user_agent TEXT DEFAULT '',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    session_period INTEGER DEFAULT 0,
    risk_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    risk_level VARCHAR(20) DEFAULT 'low',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📋 Dataset Schema

### Core Features
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `username` | String | Unique username | `doctor_023` |
| `user_id` | String | User identifier | `doctor_023` |
| `email` | String | User email | `doctor_023@hospital.com` |
| `user_role` | String | User role/position | `doctor`, `nurse`, `admin` |
| `ip_address` | String | Source IP address | `210.5.32.146` |
| `hour` | Integer | Hour of day (0-23) | `14` |
| `device_type` | String | Device type | `desktop`, `mobile`, `tablet` |
| `action` | String | User action performed | `user_login`, `page_view_medical_records` |
| `session_period` | Integer | Session duration (minutes) | `45` |
| `timestamp` | DateTime | Action timestamp | `2025-09-20T14:30:00` |

### Target Variables
| Column | Type | Description | Range |
|--------|------|-------------|--------|
| `risk_score` | Float | Continuous risk score | `0.0 - 1.0` |
| `risk_level` | String | Categorical risk level | `low`, `medium`, `high`, `critical` |

### Additional ML Features
| Column | Type | Description |
|--------|------|-------------|
| `is_weekend` | Boolean | Weekend activity flag |
| `is_business_hours` | Boolean | Business hours (9 AM - 5 PM) |
| `is_sensitive_action` | Boolean | Sensitive page/action access |
| `is_failed_action` | Boolean | Failed or unauthorized action |
| `session_length_category` | String | `short`, `medium`, `long` |

## 👥 User Roles & Distribution

| Role | Count | Percentage | Base Risk | Description |
|------|-------|------------|-----------|-------------|
| `nurse` | ~1,500 | 30% | 20 | Medical staff - patient care |
| `doctor` | ~1,000 | 20% | 25 | Medical staff - diagnoses |
| `employee` | ~750 | 15% | 30 | General hospital staff |
| `accountant` | ~500 | 10% | 30 | Financial department |
| `guest` | ~500 | 10% | 40 | Temporary/visitor access |
| `contractor` | ~400 | 8% | 35 | External contractors |
| `manager` | ~250 | 5% | 30 | Management level |
| `admin` | ~80 | 2% | 30 | System administrators |

## 🎯 User Actions

### Medical Actions
- `user_login`, `user_logout`
- `page_view_medical_records`
- `access_patient_record`
- `page_view_prescriptions`
- `click_nav_medical_header`

### Administrative Actions
- `page_view_admin_dashboard`
- `navigate_to_admin`
- `access_audit_log`
- `page_view_dashboard`

### Financial Actions
- `page_view_financial_data`
- `access_financial_report`
- `click_nav_financial_header`

### Security Events
- `failed_login_attempt`
- `unauthorized_access_attempt`
- `suspicious_activity_detected`
- `policy_violation`
- `classified_data_access`

## 🔍 Risk Scoring Logic

### Base Risk Scores by Role
```python
BASE_RISK_SCORES = {
    'admin': 30, 'manager': 30, 'doctor': 25, 'nurse': 20,
    'contractor': 35, 'accountant': 30, 'employee': 30, 'guest': 40
}
```

### Risk Factors (Additional Risk Points)
- **Failed Login**: +15 points
- **Unusual Location**: +10 points (different IP than typical)
- **Unusual Device**: +10 points (new/different device)
- **Outside Business Hours**: +5 points (before 9 AM or after 5 PM)
- **Sensitive Page Access**: +10 points (for non-privileged users)
- **Suspicious Behavior**: +20 points
- **Classified Data Access**: Sets risk to 75 points

### Risk Level Categories
- **Low**: 0.0 - 0.25 (Green)
- **Medium**: 0.25 - 0.50 (Yellow)
- **High**: 0.50 - 0.75 (Orange)
- **Critical**: 0.75 - 1.0 (Red)

## 🌍 Geographic Distribution

### IP Address Ranges by Region
- **Vietnam**: `210.5.32.x`, `27.72.59.x`
- **Nigeria**: `41.203.72.x`, `105.112.96.x`
- **US**: `192.168.1.x`, `10.0.0.x`, `172.16.0.x`
- **UK**: `81.2.69.x`, `86.1.2.x`
- **Canada**: `24.114.123.x`, `99.240.1.x`
- **Australia**: `1.128.0.x`, `203.1.1.x`
- **Other regions**: Germany, France, Japan, Singapore, India, Brazil

## 🤖 Machine Learning Applications

### 1. Classification Tasks
**Objective**: Predict `risk_level` (4 classes)
- **Models**: Random Forest, XGBoost, Neural Networks
- **Metrics**: Accuracy, Precision, Recall, F1-Score
- **Use Case**: Real-time risk alerting

### 2. Regression Tasks
**Objective**: Predict `risk_score` (continuous 0-1)
- **Models**: Random Forest Regressor, Gradient Boosting, SVR
- **Metrics**: RMSE, MAE, R²
- **Use Case**: Fine-grained risk assessment

### 3. Anomaly Detection
**Objective**: Identify unusual behavior patterns
- **Models**: Isolation Forest, One-Class SVM, Autoencoders
- **Use Case**: Security threat detection

## 🛠️ Feature Engineering Suggestions

### Categorical Encoding
```python
# One-hot encoding for categorical features
categorical_features = ['user_role', 'device_type', 'action']

# Label encoding for high-cardinality features
high_cardinality = ['ip_address', 'username']
```

### Temporal Features
```python
# Extract additional time features
df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
df['month'] = pd.to_datetime(df['timestamp']).dt.month
df['is_night_shift'] = (df['hour'] < 6) | (df['hour'] > 22)
```

### Aggregated Features
```python
# User behavior patterns
user_stats = df.groupby('user_id').agg({
    'risk_score': ['mean', 'max', 'std'],
    'session_period': ['mean', 'max'],
    'action': 'count'
}).reset_index()
```

### IP-based Features
```python
# Geographic risk features
df['ip_region'] = df['ip_address'].map(ip_to_region_mapping)
df['is_trusted_ip'] = df['ip_address'].isin(trusted_ips)
```

## 📈 Model Performance Expectations

### Baseline Models
- **Random Forest**: ~85-90% accuracy for classification
- **XGBoost**: ~87-92% accuracy for classification
- **Neural Network**: ~88-93% accuracy for classification

### Key Success Metrics
- **Precision for High/Critical Risk**: >90% (minimize false positives)
- **Recall for High/Critical Risk**: >85% (catch real threats)
- **False Positive Rate**: <5% (avoid alert fatigue)

## 🚀 Getting Started

### 1. Load the Dataset
```python
import pandas as pd
df = pd.read_csv('hospital_behavior_dataset_20250920_164513.csv')
```

### 2. Basic Analysis
```python
python simple_analysis.py
```

### 3. Train a Model
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Prepare features
X = df[['user_role', 'ip_address', 'hour', 'device_type', 'action', 'session_period']]
y = df['risk_level']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model (after proper preprocessing)
# ... feature encoding ...
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_encoded, y_train)
```

## 📁 Files Included

- `hospital_behavior_dataset_20250920_164513.csv` - Main dataset
- `generate_mock_data.py` - Data generation script
- `simple_analysis.py` - Basic analysis script
- `database_schema.sql` - Database schema
- `README_ML_Dataset.md` - This documentation

## 🔒 Data Privacy & Security

- **Synthetic Data**: All data is artificially generated
- **No PII**: No real personal information included
- **Educational Use**: Designed for ML training and research
- **GDPR Compliant**: No actual user data involved

## 🤝 Contributing

To generate additional data or modify the schema:
1. Edit `generate_mock_data.py`
2. Run with desired parameters: `python generate_mock_data.py --records 10000`
3. Analyze with: `python simple_analysis.py`

## 📞 Support

For questions about the dataset or ML implementation:
- Check the Hospital Web App documentation
- Review the risk scoring logic in `backend/services/risk-service.js`
- Analyze patterns with the provided analysis scripts
