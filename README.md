# 🏥 Hospital Web Application

A comprehensive healthcare management system with advanced security features, machine learning-powered behavior analysis, and just-in-time access control.

## 🚀 Quick Start

```bash
# Start the application
./scripts/start-hospital-app.sh

# Or manually with Docker Compose
docker-compose -f deployment/docker/docker-compose.yml up --build -d
```

## 📁 Project Structure

```
Hospital-Web-App/
├── 📂 src/                          # Frontend React application
│   ├── components/                  # Reusable UI components
│   ├── pages/                       # Application pages
│   ├── contexts/                    # React contexts
│   ├── services/                    # API and service layer
│   └── lib/                         # Utilities and helpers
├── 📂 backend/                      # Node.js API server
│   ├── routes/                      # API endpoints
│   ├── services/                    # Business logic
│   ├── models/                      # Data models
│   └── middleware/                  # Express middleware
├── 📂 ml-service/                   # Python ML service
│   ├── python_ml_service.py         # Flask ML API
│   └── risk_prediction_service.py   # Risk analysis engine
├── 📂 data/                         # Data storage
│   ├── datasets/                    # Training datasets
│   └── models/                      # ML model files
├── 📂 config/                       # Configuration files
│   ├── database/                    # Database schemas
│   └── keycloak/                    # Authentication config
├── 📂 deployment/                   # Deployment configurations
│   ├── docker/                      # Docker Compose files
│   └── k8s/                         # Kubernetes manifests
├── 📂 scripts/                      # Utility scripts
├── 📂 docs/                         # Documentation
└── 📂 public/                       # Static assets
```

## 🌐 Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React web application |
| Backend API | 5002 | Node.js REST API |
| ML Service | 5001 | Python ML predictions |
| Keycloak | 8080 | Authentication server |
| PostgreSQL | 5432 | Database |

## 🔐 User Roles & Access

- **Admin**: Full system access, user management, system monitoring
- **Manager**: Administrative functions, analytics, risk assessment
- **Doctor/Nurse**: Patient records, medical data, appointments
- **Patient**: Personal dashboard, medical records, appointments

## 🛠️ Features

- **Authentication**: Keycloak-based SSO with role-based access
- **Just-in-Time Access**: Temporary privilege escalation system
- **ML Risk Analysis**: Behavior-based anomaly detection
- **Audit Logging**: Comprehensive activity tracking
- **Real-time Monitoring**: Live system health and user activity
- **Responsive Design**: Modern UI with Tailwind CSS

## 🏃‍♂️ Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for ML service development)

### Local Setup
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install ML service dependencies
cd ml-service && pip install -r requirements.txt
```

## 📚 Documentation

- [ML Risk System](docs/README_ML_Risk_System.md)
- [Dataset Information](docs/README_ML_Dataset.md)
- [Automatic ML Predictions](docs/README_Automatic_ML_Predictions.md)

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://hospital_user:hospital_password@postgres:5432/hospital_analytics

# Services
PYTHON_ML_SERVICE_URL=http://ml-service:5001

# Keycloak
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=demo
REACT_APP_KEYCLOAK_CLIENT_ID=demo-client
```

## 🚀 Deployment

### Docker Compose (Recommended)
```bash
docker-compose -f deployment/docker/docker-compose.yml up -d
```

### Kubernetes
```bash
kubectl apply -f deployment/k8s/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
