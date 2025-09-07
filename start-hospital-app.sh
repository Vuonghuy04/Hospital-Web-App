# Hospital Web App Startup Script
echo "🏥 Starting Hospital Web Application..."
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing containers
echo "🔄 Stopping any existing containers..."
docker-compose down

# Build and start the application
echo "🚀 Building and starting the Hospital Web App..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose ps

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."
echo "Backend Health: $(curl -s http://localhost:5001/api/health | jq -r '.status // "ERROR"')"
echo "Frontend Health: $(curl -s http://localhost:3000/health || echo "ERROR")"

echo ""
echo "✅ Hospital Web App is running!"
echo "=================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5001"
echo "📊 Health Check: http://localhost:5001/api/health"
echo "🗄️  Database Viewer: http://localhost:5001/api/database-viewer"
echo ""
echo "To stop the application, run: docker-compose down"
echo "To view logs, run: docker-compose logs -f"

