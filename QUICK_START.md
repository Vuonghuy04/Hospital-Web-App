# 🚀 Hospital Web App - Quick Start

## ✅ System Status: READY

All components have been initialized and are running!

---

## 🌐 Access URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:3000 | ✅ Healthy |
| **Backend API** | http://localhost:5002 | ✅ Healthy |
| **ML Service** | http://localhost:5001 | ✅ Healthy |
| **Keycloak** | http://localhost:8080 | ✅ Ready |

---

## 🔐 Login Credentials

All passwords are the same as the username for easy testing:

| Username | Password | Role | Department |
|----------|----------|------|------------|
| **admin** | admin | Administrator + Manager | Administration |
| **duc** | duc | Doctor | Medical (Hospital Side) |
| **dung** | dung | Nurse | Medical (Hospital Side) |
| **huy** | huy | Contractor | Finance Group |
| **dat** | dat | Accountant | Finance Group |

---

## 🎯 How to Use

### Step 1: Open the App
```
Open your browser: http://localhost:3000
```

### Step 2: Login
- Use any of the credentials above
- Example: `admin` / `admin`

### Step 3: Explore Features

**As Admin:**
- ✅ User Management
- ✅ System Analytics
- ✅ Risk Assessment
- ✅ ML Risk Dashboard
- ✅ JIT Access Control
- ✅ Audit Logs
- ✅ Behavior Profiling

**As Medical Staff (duc/dung):**
- ✅ Patient Records
- ✅ Medical Data
- ✅ Appointments

**As Finance Staff (huy/dat):**
- ✅ Financial Data
- ✅ Billing Information

---

## 📋 Useful Commands

### Check Service Status
```powershell
docker compose -f deployment/docker/docker-compose.yml ps
```

### View Logs
```powershell
# All services
docker compose -f deployment/docker/docker-compose.yml logs -f

# Specific service
docker compose -f deployment/docker/docker-compose.yml logs -f backend
docker compose -f deployment/docker/docker-compose.yml logs -f frontend
```

### Restart Services
```powershell
# Restart all
docker compose -f deployment/docker/docker-compose.yml restart

# Restart specific
docker compose -f deployment/docker/docker-compose.yml restart backend
```

### Stop/Start
```powershell
# Stop all services
docker compose -f deployment/docker/docker-compose.yml down

# Start all services
docker compose -f deployment/docker/docker-compose.yml up -d
```

### Recreate Users (if needed)
```powershell
powershell.exe -ExecutionPolicy Bypass -File ".\scripts\setup-hospital-users.ps1"
```

---

## 🔍 Health Checks

### Backend Health
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/health"
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

### ML Service Health
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/health"
```

Expected response:
```json
{
  "status": "healthy"
}
```

### Database Viewer
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/database-viewer"
```

---

## 📊 Current Service Status

```
NAME                  STATUS
hospital-frontend     ✅ Healthy
hospital-backend      ✅ Healthy
hospital-ml-service   ✅ Running
hospital-keycloak     ✅ Ready
hospital-postgres     ✅ Running
hospital-opa          ⚠️ Running (endpoint debug needed)
```

---

## 🛠️ Troubleshooting

### Can't Login?
1. Check Keycloak is running: `docker ps | findstr keycloak`
2. Wait 1-2 minutes for Keycloak to fully initialize
3. Try accessing: http://localhost:8080/realms/demo
4. Recreate users if needed: `.\scripts\setup-hospital-users.ps1`

### Service Not Responding?
```powershell
# Check logs
docker compose -f deployment/docker/docker-compose.yml logs [service-name]

# Restart service
docker compose -f deployment/docker/docker-compose.yml restart [service-name]

# Full restart
docker compose -f deployment/docker/docker-compose.yml down
docker compose -f deployment/docker/docker-compose.yml up -d
```

### Port Already in Use?
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 📚 Documentation

For more detailed information:

- **Full Documentation**: `PROJECT_REBUILD_COMPLETE.md`
- **OPA Integration**: `docs/OPA_INTEGRATION_GUIDE.md`
- **Setup Status**: `FINAL_SETUP_STATUS.md`
- **OPA Use Cases**: `opa/OPA_USE_CASES_SUMMARY.md`

---

## 🎉 You're All Set!

Your Hospital Web App is fully initialized and ready to use!

**Next Steps:**
1. Open http://localhost:3000
2. Login with `admin` / `admin`
3. Explore the features!

Enjoy your Hospital Web App! 🏥💙

---

**Last Updated**: October 16, 2025
**Status**: All Components Initialized ✅

