# 🏥 Hospital Web App - Setup Complete

## ✅ Setup Summary

All services have been successfully set up and are running!

### 📊 Service Status

| Service | Status | Port | Health |
|---------|--------|------|--------|
| **Frontend** | ✅ Running | 3000 | Healthy |
| **Backend API** | ✅ Running | 5002 | Healthy |
| **ML Service** | ✅ Running | 5001 | Healthy |
| **Keycloak** | ✅ Running | 8080 | Ready |
| **PostgreSQL** | ✅ Running | 5432 | Connected |

## 🔐 User Accounts

All user accounts have been created in Keycloak:

| Username | Password | Role | Group |
|----------|----------|------|-------|
| **admin** | admin | Administrator + Manager | Hospital Side |
| **duc** | duc | Doctor | Hospital Side |
| **dung** | dung | Nurse | Hospital Side |
| **huy** | huy | Contractor | Finance Group |
| **dat** | dat | Accountant | Finance Group |

## 🌐 Access URLs

### Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5002
- **ML Service**: http://localhost:5001

### Management
- **Keycloak Admin Console**: http://localhost:8080/admin
  - Admin Username: `admin`
  - Admin Password: `admin`

### Health Checks
- Backend Health: http://localhost:5002/api/health
- ML Service Health: http://localhost:5001/health
- Database Viewer: http://localhost:5002/api/database-viewer

## 🚀 Quick Start

### Login to the Application
1. Open http://localhost:3000 in your browser
2. Use any of the credentials above (e.g., `admin` / `admin`)
3. You'll be redirected to Keycloak for authentication
4. After login, you'll be redirected back to the application

### Testing Different Roles
- **Admin**: Full access to all features including:
  - User Management
  - System Analytics
  - Risk Assessment
  - Audit Logs
  - ML Risk Dashboard
  - JIT Access Control

- **Medical Staff (duc/dung)**: Access to:
  - Patient Records
  - Medical Data
  - Appointments

- **Finance Staff (huy/dat)**: Access to:
  - Financial Data
  - Billing Information

## 📦 Docker Commands

### View Logs
```bash
# All services
docker compose -f deployment/docker/docker-compose.yml logs -f

# Specific service
docker compose -f deployment/docker/docker-compose.yml logs -f backend
docker compose -f deployment/docker/docker-compose.yml logs -f ml-service
docker compose -f deployment/docker/docker-compose.yml logs -f keycloak
```

### Check Status
```bash
docker compose -f deployment/docker/docker-compose.yml ps
```

### Restart Services
```bash
# Restart all
docker compose -f deployment/docker/docker-compose.yml restart

# Restart specific service
docker compose -f deployment/docker/docker-compose.yml restart backend
```

### Stop Services
```bash
docker compose -f deployment/docker/docker-compose.yml down
```

### Start Services Again
```bash
docker compose -f deployment/docker/docker-compose.yml up -d
```

## 🔧 Configuration

### Environment Variables
The application uses the following environment variables (already configured in Docker Compose):

**Backend:**
- `DATABASE_URL`: PostgreSQL connection string
- `PYTHON_ML_SERVICE_URL`: ML service URL
- `PORT`: Backend port (5002)

**Frontend:**
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_KEYCLOAK_URL`: Keycloak URL
- `REACT_APP_KEYCLOAK_REALM`: demo
- `REACT_APP_KEYCLOAK_CLIENT_ID`: demo-client

**Database:**
- `POSTGRES_DB`: hospital_analytics
- `POSTGRES_USER`: hospital_user
- `POSTGRES_PASSWORD`: hospital_password

## 🎯 Key Features

### 1. Authentication & Authorization
- Keycloak-based SSO
- Role-based access control (RBAC)
- Multi-group support

### 2. Behavior Tracking & ML
- Real-time user behavior monitoring
- ML-powered anomaly detection
- Risk scoring and profiling
- Automatic model training

### 3. Just-in-Time (JIT) Access
- Temporary privilege escalation
- Request/Approval workflow
- Time-limited access grants

### 4. Enhanced Audit System
- Comprehensive activity logging
- Compliance tracking
- Risk-based event classification

### 5. Admin Dashboard
- User management
- System analytics
- Risk assessment
- Incident response

## 📝 Database

The PostgreSQL database has been automatically initialized with:
- `user_behavior` table for behavior tracking
- `enhanced_audit_events` table for audit logging
- Appropriate indexes for performance

## 🤖 ML Service

The ML service is running and ready. It will:
- Automatically train models when sufficient data is collected
- Provide real-time risk predictions
- Profile user behavior patterns

**Note**: The model needs initial data to train. As users interact with the system, behavior data will be collected and the model will be trained automatically.

## 🐛 Troubleshooting

### Port Already in Use
If you see port conflicts:
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5002
netstat -ano | findstr :5001
netstat -ano | findstr :8080

# Kill the process or change the port in docker-compose.yml
```

### Service Not Starting
```bash
# Check logs
docker compose -f deployment/docker/docker-compose.yml logs [service-name]

# Rebuild and restart
docker compose -f deployment/docker/docker-compose.yml down
docker compose -f deployment/docker/docker-compose.yml up -d --build
```

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker compose -f deployment/docker/docker-compose.yml logs postgres

# Verify database connection
docker exec -it hospital-postgres psql -U hospital_user -d hospital_analytics
```

### Keycloak Not Ready
Keycloak can take 1-2 minutes to fully initialize. Wait a bit and refresh.

## 📚 Next Steps

1. **Explore the Application**: Login with different user accounts to see role-based access
2. **Generate Activity**: Interact with the system to generate behavior data
3. **Check Analytics**: View the admin dashboard for system analytics
4. **Test ML Features**: Once data is collected, the ML service will provide risk predictions
5. **Try JIT Access**: Request temporary access to restricted resources

## 🆘 Support

For issues or questions:
1. Check the logs: `docker compose logs -f`
2. Review the documentation in the `/docs` folder
3. Check the troubleshooting section above

---

**Setup Date**: October 16, 2025
**Setup Status**: ✅ Complete
**All Services**: ✅ Running
**Users**: ✅ Created
**Database**: ✅ Initialized

🎉 **The Hospital Web App is ready to use!**

