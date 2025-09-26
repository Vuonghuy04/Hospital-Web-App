@echo off
REM Hospital Web App with ML - Docker Compose Startup
REM This script starts all services using Docker Compose

echo 🏥 Hospital Web App with ML Risk Prediction (Docker)
echo =====================================================

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    echo Please install Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker is ready

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Build and start all services
echo 🚀 Building and starting all services...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    echo Checking logs...
    docker-compose logs
    pause
    exit /b 1
)

echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
docker-compose ps

REM Update existing records with ML predictions
echo 🔄 Updating existing records with ML predictions...
python docker-update-predictions.py

echo.
echo =====================================================
echo ✅ Hospital Web App with ML is now running in Docker!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🚀 Backend API: http://localhost:5002
echo 🤖 Python ML Service: http://localhost:5001
echo 📊 ML Risk Dashboard: http://localhost:3000/admin/ml-risk
echo 🔐 Keycloak Admin: http://localhost:8080 (admin/admin)
echo.
echo 🐳 Docker Services:
echo   • hospital-frontend (React app)
echo   • hospital-backend (Node.js API)
echo   • hospital-ml-service (Python ML)
echo   • hospital-postgres (Database)
echo   • hospital-keycloak (Authentication)
echo.
echo 📋 Docker Commands:
echo   • View logs: docker-compose logs -f
echo   • Stop services: docker-compose down
echo   • Restart: docker-compose restart
echo   • Rebuild: docker-compose up --build
echo.
echo Press any key to view service logs...
pause >nul

REM Show logs
docker-compose logs -f --tail=50

echo.
echo To stop all services, run: docker-compose down
pause
