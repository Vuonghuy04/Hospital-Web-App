#!/bin/bash

set -e

echo "🏥 Deploying Hospital Web App to Kubernetes with Calico CNI and Linkerd Service Mesh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_status "Connected to Kubernetes cluster: $(kubectl cluster-info | head -n1)"

# Step 1: Install Calico CNI
print_status "Step 1: Installing Calico CNI..."
kubectl apply -f calico-install.yaml

# Wait for Calico to be ready
print_status "Waiting for Calico pods to be ready..."
kubectl wait --for=condition=ready pod -l k8s-app=calico-node -n calico-system --timeout=300s
kubectl wait --for=condition=ready pod -l k8s-app=calico-kube-controllers -n calico-system --timeout=300s

print_success "Calico CNI installed successfully"

# Step 2: Install Linkerd
print_status "Step 2: Installing Linkerd Service Mesh..."

# Check if Linkerd CLI is installed
if ! command -v linkerd &> /dev/null; then
    print_warning "Linkerd CLI not found. Installing Linkerd CLI..."
    curl -sL https://run.linkerd.io/install | sh
    export PATH=$PATH:$HOME/.linkerd2/bin
fi

# Install Linkerd
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -

# Wait for Linkerd to be ready
print_status "Waiting for Linkerd to be ready..."
kubectl wait --for=condition=ready pod -l linkerd.io/control-plane-component=controller -n linkerd --timeout=300s

print_success "Linkerd Service Mesh installed successfully"

# Step 3: Create namespace and apply network policies
print_status "Step 3: Creating namespace and applying network policies..."
kubectl apply -f namespace.yaml
kubectl apply -f calico-network-policy.yaml

print_success "Namespace and network policies created"

# Step 4: Build and push Docker images
print_status "Step 4: Building Docker images..."

# Build backend image
print_status "Building backend image..."
cd ../backend
docker build -t hospital-backend:latest .

# Build frontend image
print_status "Building frontend image..."
cd ..
docker build -t hospital-frontend:latest .

print_success "Docker images built successfully"

# Step 5: Deploy applications
print_status "Step 5: Deploying applications..."

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Apply Linkerd configuration
kubectl apply -f k8s/linkerd-config.yaml

print_success "Applications deployed successfully"

# Step 6: Wait for deployments to be ready
print_status "Step 6: Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/hospital-backend -n hospital-web-app --timeout=300s
kubectl wait --for=condition=available deployment/hospital-frontend -n hospital-web-app --timeout=300s

print_success "All deployments are ready!"

# Step 7: Display status
print_status "Step 7: Deployment Status"
echo ""
kubectl get pods -n hospital-web-app
echo ""
kubectl get services -n hospital-web-app
echo ""

# Get external IP for frontend
FRONTEND_IP=$(kubectl get service hospital-frontend-lb -n hospital-web-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending")

if [ "$FRONTEND_IP" != "Pending" ]; then
    print_success "Frontend accessible at: http://$FRONTEND_IP"
else
    print_warning "Frontend LoadBalancer IP is pending. Check with: kubectl get service hospital-frontend-lb -n hospital-web-app"
fi

# Display port mappings for kind cluster
print_status "For kind cluster, access services at:"
print_status "Frontend: http://localhost:13001"
print_status "Backend API: http://localhost:15001"
print_status "Ingress: http://localhost:9080"

# Display Linkerd dashboard info
print_status "Linkerd dashboard available at: http://localhost:8080"
print_status "Run: linkerd dashboard &"

print_success "🏥 Hospital Web App deployment completed successfully!"
print_status "Check application status with: kubectl get pods -n hospital-web-app"
print_status "View logs with: kubectl logs -f deployment/hospital-backend -n hospital-web-app"
