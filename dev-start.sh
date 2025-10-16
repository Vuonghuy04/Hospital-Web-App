#!/bin/bash
# Development startup script with hot reloading
echo "🚀 Starting Hospital Web App in Development Mode..."
echo "================================================"

# Check if Docker services are running
echo "🔍 Checking Docker services..."
if ! docker-compose -f deployment/docker/docker-compose.yml ps | grep -q "Up"; then
    echo "⚠️  Docker services not running. Starting them..."
    docker-compose -f deployment/docker/docker-compose.yml up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 15
fi

echo "✅ Docker services are running"
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5002"
echo "🤖 ML Service: http://localhost:5001"
echo "🔐 Keycloak: http://localhost:8080"
echo ""
echo "🔥 Hot reloading is ENABLED - changes will appear automatically!"
echo "📝 Edit files in src/ and see changes instantly in the browser"
echo ""
echo "Press Ctrl+C to stop the development server"
echo "================================================"

# Start the React development server
npm start
