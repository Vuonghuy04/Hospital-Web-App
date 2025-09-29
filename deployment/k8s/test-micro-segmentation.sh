#!/bin/bash

set -e

echo "🧪 Testing Micro-Segmentation in Kubernetes Cluster"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' 

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

test_connectivity() {
    local from_pod=$1
    local to_pod=$2
    local port=$3
    local expected_result=$4
    local test_name=$5
    
    print_status "Testing: $test_name"
    print_status "From: $from_pod -> To: $to_pod:$port"
    
    # Get target pod IP
    local target_ip=$(kubectl get pod $to_pod -n hospital-web-app -o jsonpath='{.status.podIP}')
    
    if [ -z "$target_ip" ]; then
        print_error "Could not get IP for pod $to_pod"
        return 1
    fi
    
    print_status "Target IP: $target_ip"
    
    # Test connection
    local result
    if kubectl exec -n hospital-web-app $from_pod -- wget --timeout=5 --tries=1 -O- http://$target_ip:$port >/dev/null 2>&1; then
        result="SUCCESS"
    else
        result="FAILED"
    fi
    
    if [ "$result" = "$expected_result" ]; then
        print_success "✓ Test PASSED: $test_name - $result (Expected: $expected_result)"
        return 0
    else
        print_error "✗ Test FAILED: $test_name - $result (Expected: $expected_result)"
        return 1
    fi
}

# DNS resolution
test_dns() {
    local pod_name=$1
    local test_name=$2
    
    print_status "Testing DNS: $test_name"
    
    if kubectl exec -n hospital-web-app $pod_name -- nslookup kubernetes.default >/dev/null 2>&1; then
        print_success "✓ DNS Test PASSED: $test_name"
        return 0
    else
        print_error "✗ DNS Test FAILED: $test_name"
        return 1
    fi
}

echo ""
print_status "Step 1: Checking Network Policies"
echo "----------------------------------------"
kubectl get networkpolicies -n hospital-web-app

echo ""
print_status "Step 2: Checking Pod Status"
echo "----------------------------------"
kubectl get pods -n hospital-web-app -o wide

echo ""
print_status "Step 3: Testing Micro-Segmentation Rules"
echo "------------------------------------------------"

test_connectivity "test-attacker" "test-backend" "80" "FAILED" "Attacker -> Backend (Should be BLOCKED)"

test_connectivity "test-frontend" "test-backend" "80" "SUCCESS" "Frontend -> Backend (Should be ALLOWED)"

test_connectivity "test-backend" "test-frontend" "3000" "FAILED" "Backend -> Frontend (Should be BLOCKED)"

test_dns "test-frontend" "Frontend DNS Resolution"
test_dns "test-backend" "Backend DNS Resolution"
test_dns "test-attacker" "Attacker DNS Resolution"

echo ""
print_status "Step 4: Network Policy Details"
echo "-------------------------------------"
echo "Default Deny Policy:"
kubectl describe networkpolicy default-deny-all -n hospital-web-app

echo ""
echo "Frontend Policy:"
kubectl describe networkpolicy frontend-policy -n hospital-web-app

echo ""
echo "Backend Policy:"
kubectl describe networkpolicy backend-policy -n hospital-web-app

echo ""
print_status "Step 5: Testing Results Summary"
echo "--------------------------------------"
echo "✅ Micro-segmentation is working if:"
echo "   - Attacker cannot reach backend (BLOCKED)"
echo "   - Frontend can reach backend (ALLOWED)"
echo "   - Backend cannot reach frontend (BLOCKED)"
echo "   - DNS resolution works for all pods"

echo ""
print_status "Step 6: Advanced Testing Commands"
echo "----------------------------------------"
echo "Manual testing commands you can run:"
echo ""
echo "# Test from attacker pod:"
echo "kubectl exec -n hospital-web-app test-attacker -- wget --timeout=5 --tries=1 -O- http://<backend-ip>:80"
echo ""
echo "# Test from frontend pod:"
echo "kubectl exec -n hospital-web-app test-frontend -- wget --timeout=5 --tries=1 -O- http://<backend-ip>:80"
echo ""
echo "# Test DNS resolution:"
echo "kubectl exec -n hospital-web-app test-attacker -- nslookup kubernetes.default"
echo ""
echo "# Check network policy logs (if available):"
echo "kubectl logs -n kube-system -l k8s-app=calico-node --tail=50"

echo ""
print_success "🧪 Micro-segmentation testing completed!"
print_status "Review the results above to verify your security policies are working correctly."
