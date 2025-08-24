#!/bin/bash

echo "🚀 Starting UI Testing Tools for Micro-Segmentation"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo ""
print_info "Starting port forwarding for UI tools..."

# Start port forwarding for custom visualizer
echo "Starting Network Policy Visualizer on port 8080..."
kubectl port-forward -n micro-segmentation-ui svc/network-policy-visualizer-service 8080:80 &
VISUALIZER_PID=$!

# Start port forwarding for Kubernetes Dashboard
echo "Starting Kubernetes Dashboard on port 8443..."
kubectl port-forward -n kubernetes-dashboard svc/kubernetes-dashboard 8443:443 &
DASHBOARD_PID=$!

# Wait a moment for port forwarding to start
sleep 3

echo ""
print_success "🎉 UI Testing Tools Started Successfully!"
echo ""

echo "📱 Available Testing Interfaces:"
echo "================================"
echo ""
echo "1. 🎨 Custom Network Policy Visualizer:"
echo "   🌐 URL: http://localhost:8080"
echo "   📋 Features: Interactive testing, policy visualization, real-time results"
echo "   🧪 Tests: Allowed traffic, blocked traffic, DNS policy"
echo ""
echo "2. 📊 Kubernetes Dashboard:"
echo "   🌐 URL: https://localhost:8443"
echo "   🔑 Token: (see below)"
echo "   📋 Features: Network policy management, pod monitoring, service discovery"
echo "   🧪 Tests: Policy management, pod connectivity, service monitoring"
echo ""

echo "🔑 Kubernetes Dashboard Access Token:"
echo "====================================="
kubectl -n kubernetes-dashboard create token admin-user
echo ""

echo "🧪 How to Test Micro-Segmentation:"
echo "=================================="
echo ""
echo "✅ Step 1: Open Custom Visualizer"
echo "   - Go to: http://localhost:8080"
echo "   - Click test buttons to verify policies"
echo "   - Watch real-time results and logs"
echo ""
echo "✅ Step 2: Use Kubernetes Dashboard"
echo "   - Go to: https://localhost:8443"
echo "   - Login with the token above"
echo "   - Navigate to hospital-web-app namespace"
echo "   - View Network Policies and Pods"
echo ""
echo "✅ Step 3: Run Automated Tests"
echo "   - Execute: ./test-micro-segmentation.sh"
echo "   - View comprehensive test results"
echo ""

echo "🚨 To Stop UI Tools:"
echo "===================="
echo "Run: pkill -f 'kubectl port-forward'"
echo "Or: kill $VISUALIZER_PID $DASHBOARD_PID"
echo ""

echo "📚 Documentation:"
echo "================="
echo "📖 UI Testing Guide: UI_TESTING_GUIDE.md"
echo "📖 Micro-Segmentation Guide: KUBERNETES_SETUP.md"
echo ""

print_success "🎯 Your micro-segmentation is now testable through multiple UI interfaces!"
print_info "Open http://localhost:8080 to start testing!"
