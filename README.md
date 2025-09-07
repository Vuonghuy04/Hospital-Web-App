# 🏥 Hospital Web Application

A comprehensive full-stack hospital management system with React frontend, Node.js backend, MongoDB database, Keycloak authentication, and Kubernetes micro-segmentation security.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (for cloning the repository)

### 1. Clone the Repository
```bash
git clone https://github.com/Vuonghuy04/Hospital-Web-App.git
cd Hospital-Web-App
```

### 2. Start the Application
```bash
# Make the startup script executable
chmod +x start-hospital-app.sh

# Start all services
./start-hospital-app.sh
```

**Or manually with Docker Compose:**
```bash
docker compose up -d --build
```

### 3. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **Backend API** | http://localhost:5002 | Node.js API server |
| **Keycloak** | http://localhost:8080 | Authentication server |
| **MongoDB** | localhost:27017 | Database (internal) |

### 4. Setup Hospital Users
```bash
# Run the user setup script
./setup-hospital-users.sh
```

This creates the following users:
- **admin** / **admin** - Administrator with full access
- **duc** / **duc** - Doctor (Hospital Side group)
- **dung** / **dung** - Nurse (Hospital Side group)  
- **huy** / **huy** - Contractor (Finance Group)
- **dat** / **dat** - Accountant (Finance Group)

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Port**: 3000
- **Framework**: React 18 with TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Authentication**: Keycloak integration
- **Features**: Role-based dashboards, analytics, user management

### Backend (Node.js + Express)
- **Port**: 5002
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: Keycloak middleware
- **Features**: RESTful API, behavior tracking, audit logging

### Database (MongoDB)
- **Port**: 27017 (internal)
- **Database**: hospital_analytics
- **Features**: User behavior tracking, audit logs, analytics data

### Authentication (Keycloak)
- **Port**: 8080
- **Realm**: demo
- **Client**: demo-client
- **Features**: SSO, RBAC, user management

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)
- **Admin**: Full system access, user management, analytics
- **Doctor**: Patient records, medical data access
- **Nurse**: Patient care, basic records access
- **Contractor**: Limited financial data access
- **Accountant**: Financial and billing data access

### Groups
- **Hospital Side**: Medical staff (doctors, nurses)
- **Finance Group**: Financial staff (contractors, accountants)

## 🛡️ Security Features

### Micro-segmentation (Kubernetes)
- **Network Policies**: Calico CNI for network isolation
- **Service Mesh**: Linkerd for mTLS and traffic management
- **Test Environment**: Micro-segmentation UI dashboard

### Audit & Monitoring
- **Behavior Tracking**: User activity monitoring
- **Audit Logs**: Comprehensive logging system
- **Security Analytics**: Risk assessment and incident response

## 🐳 Docker Services

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `hospital-frontend` | Custom React build | 3000:3000 | Frontend application |
| `hospital-backend` | Custom Node.js build | 5002:5002 | Backend API server |
| `hospital-keycloak` | quay.io/keycloak/keycloak:26.2.5 | 8080:8080 | Authentication server |
| `hospital-mongo` | mongo:6 | 27017:27017 | Database server |

## 🔧 Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
npm install
npm start
```

### Environment Variables
Create a `.env` file in the project root:
```env
MONGO_URI=mongodb://mongo:27017/hospital_analytics
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=demo
KEYCLOAK_CLIENT_ID=demo-client
```

## ☸️ Kubernetes Deployment

### Micro-segmentation Setup
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Test micro-segmentation
./k8s/test-micro-segmentation.sh

# Access micro-segmentation UI
kubectl port-forward -n micro-segmentation-ui svc/network-policy-visualizer-service 8081:80
```

### Network Policies
- **Default Deny**: All traffic blocked by default
- **DNS Allow**: DNS resolution permitted
- **Frontend-Backend**: Controlled communication
- **Database Access**: Restricted to backend only

## 📊 Features

### Admin Dashboard
- User management and analytics
- Security monitoring and incident response
- System health and performance metrics
- Audit logs and behavior analysis

### User Dashboards
- Role-specific information display
- Medical records (doctors/nurses)
- Financial data (accountants/contractors)
- Appointment scheduling

### Security
- Multi-factor authentication via Keycloak
- Network micro-segmentation
- Comprehensive audit logging
- Real-time behavior tracking

## 🚨 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

**Docker issues:**
```bash
# Clean up Docker
docker system prune -a

# Rebuild containers
docker compose down
docker compose up -d --build
```

**Keycloak not starting:**
```bash
# Check Keycloak logs
docker compose logs hospital-keycloak

# Wait for Keycloak to fully initialize (can take 2-3 minutes)
```

**Database connection issues:**
```bash
# Check MongoDB logs
docker compose logs hospital-mongo

# Verify connection
curl http://localhost:5002/api/health
```

## 📝 API Endpoints

### Health Check
- `GET /api/health` - Backend health status
- `GET /api/database-viewer` - Database information

### Hospital Management
- `GET /api/hospital/users` - User management
- `GET /api/hospital/activities` - User activities
- `GET /api/hospital/dashboard-metrics` - Dashboard data

### Behavior Tracking
- `POST /api/behavior-tracking` - Track user behavior
- `GET /api/behavior-tracking` - Retrieve behavior data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker Compose
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker logs: `docker compose logs <service>`
3. Create an issue on GitHub

---

**Built with ❤️ for healthcare security and management**