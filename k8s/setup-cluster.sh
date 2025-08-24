#!/bin/bash

set -e

echo "🚀 Setting up Kubernetes Cluster with Calico CNI and Linkerd Service Mesh"

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_warning "kubectl is not installed. Installing kubectl..."
    # Install kubectl for macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install kubectl
    else
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    fi
fi

# Check if kind is installed
if ! command -v kind &> /dev/null; then
    print_warning "kind is not installed. Installing kind..."
    # Install kind for macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install kind
    else
        curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
        chmod +x ./kind
        sudo mv ./kind /usr/local/bin/
    fi
fi

# Create kind cluster
print_status "Creating kind cluster..."
kind create cluster --name hospital-cluster --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 80
    hostPort: 9080
    protocol: TCP
  - containerPort: 443
    hostPort: 9443
    protocol: TCP
  - containerPort: 3000
    hostPort: 13001
    protocol: TCP
  - containerPort: 5001
    hostPort: 15001
    protocol: TCP
- role: worker
- role: worker
networking:
  disableDefaultCNI: true
  podSubnet: "192.168.0.0/16"
  serviceSubnet: "10.96.0.0/12"
EOF

print_success "Kind cluster created successfully"

# Wait for cluster to be ready
print_status "Waiting for cluster to be ready..."
kubectl wait --for=condition=ready node --all --timeout=300s

# Install Calico CNI
print_status "Installing Calico CNI..."
kubectl apply -f calico-install.yaml

# Wait for Calico to be ready
print_status "Waiting for Calico pods to be ready..."
kubectl wait --for=condition=ready pod -l k8s-app=calico-node -n calico-system --timeout=300s
kubectl wait --for=condition=ready pod -l k8s-app=calico-kube-controllers -n calico-system --timeout=300s

print_success "Calico CNI installed successfully"

# Install Linkerd
print_status "Installing Linkerd Service Mesh..."

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

# Install NGINX Ingress Controller
print_status "Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for NGINX Ingress to be ready
print_status "Waiting for NGINX Ingress to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=controller -n ingress-nginx --timeout=300s

print_success "NGINX Ingress Controller installed successfully"

# Create namespace and apply network policies
print_status "Creating namespace and applying network policies..."
kubectl apply -f namespace.yaml
kubectl apply -f calico-network-policy.yaml

print_success "Namespace and network policies created"

# Display cluster information
print_status "Cluster Setup Complete!"
echo ""
kubectl cluster-info
echo ""
kubectl get nodes
echo ""
kubectl get pods --all-namespaces

print_success "🚀 Kubernetes cluster setup completed successfully!"
print_status "Next steps:"
print_status "1. Run: ./deploy.sh"
print_status "2. Access Linkerd dashboard: linkerd dashboard &"
print_status "3. Check cluster status: kubectl get pods --all-namespaces"
