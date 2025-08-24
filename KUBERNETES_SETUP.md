# 🏥 Hospital Web App - Kubernetes Setup with Calico CNI and Linkerd Service Mesh

This document describes the complete Kubernetes setup for the Hospital Web App using Calico CNI for network security and Linkerd for service mesh capabilities.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Calico CNI    │    │   Linkerd       │                   │
│  │   (L3/L4)       │    │   (L7 + mTLS)   │                   │
│  └─────────────────┘    └─────────────────┘                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │  Frontend Pod   │◄──►│  Backend Pod    │                   │
│  │  (React + Nginx)│    │  (Node.js API)  │                   │
│  │  Port: 3000     │    │  Port: 5001     │                   │
│  └─────────────────┘    └─────────────────┘                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │  NGINX Ingress  │    │   Monitoring    │                   │
│  │   Controller    │    │ (Prometheus +   │                   │
│  │                 │    │   Grafana)      │                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop or Docker Engine
- kubectl CLI tool
- kind (for local cluster)
- Linkerd CLI

### 1. Setup Local Kubernetes Cluster

```bash
# Make scripts executable
chmod +x k8s/setup-cluster.sh
chmod +x k8s/deploy.sh

# Setup cluster with Calico CNI and Linkerd
./k8s/setup-cluster.sh
```

### 2. Deploy Hospital Web App

```bash
# Deploy the application
./k8s/deploy.sh
```

## 🔧 Components

### 1. Calico CNI (Container Network Interface)

**Purpose**: Provides L3/L4 network security and policy enforcement

**Features**:
- Pod-to-pod networking
- Network policies for traffic control
- BGP routing for scalability
- IPAM (IP Address Management)

**Configuration**:
```yaml
# Network policies for frontend
- Allow external access to port 3000
- Allow communication with backend on port 5001
- Block unauthorized traffic

# Network policies for backend
- Allow communication from frontend
- Allow MongoDB access on port 27017
- Block direct external access
```

### 2. Linkerd Service Mesh

**Purpose**: Provides L7 traffic management and mTLS encryption

**Features**:
- Automatic mTLS between services
- Traffic splitting and routing
- Service discovery and load balancing
- Observability and metrics
- Circuit breaking and retry logic

**Configuration**:
```yaml
# Service profiles for API endpoints
- Health check monitoring
- Behavior tracking API
- Response classification
- Traffic splitting capabilities
```

### 3. Application Deployments

#### Frontend (React + Nginx)
- **Image**: `hospital-frontend:latest`
- **Port**: 3000
- **Features**: 
  - Static file serving
  - Health checks
  - Security headers
  - Gzip compression

#### Backend (Node.js API)
- **Image**: `hospital-backend:latest`
- **Port**: 5001
- **Features**:
  - MongoDB connection
  - Health checks
  - API endpoints
  - Resource limits

### 4. Network Security

#### Calico Network Policies
```yaml
# Default deny all traffic
apiVersion: projectcalico.org/v3
kind: GlobalNetworkPolicy
metadata:
  name: hospital-app-default-deny
spec:
  tier: default
  order: 1000
  selector: all()
  types:
  - Ingress
  - Egress
  ingress: []
  egress: []
```

#### Service-to-Service Communication
- Frontend → Backend: Port 5001
- Backend → MongoDB: Port 27017
- External → Frontend: Port 3000 (LoadBalancer)

### 5. Monitoring & Observability

#### Prometheus
- Scrapes metrics from all services
- Stores time-series data
- Provides query language for metrics

#### Grafana
- Dashboard for visualization
- Pre-configured datasources
- Custom dashboards for hospital app

## 📊 Traffic Flow

### 1. External Request
```
Internet → NGINX Ingress → Frontend Service → Frontend Pod
```

### 2. API Request
```
Frontend Pod → Linkerd Proxy → Backend Service → Backend Pod
```

### 3. Database Request
```
Backend Pod → MongoDB (External)
```

## 🔐 Security Features

### 1. Network Level (Calico)
- **Default Deny**: All traffic blocked by default
- **Whitelist Approach**: Only explicitly allowed traffic
- **Pod Isolation**: Pods can only communicate as defined in policies

### 2. Application Level (Linkerd)
- **mTLS Encryption**: All inter-service communication encrypted
- **Service Identity**: Each service has cryptographic identity
- **Traffic Validation**: Request/response validation

### 3. Container Security
- **Non-root Users**: Containers run as non-privileged users
- **Resource Limits**: CPU and memory constraints
- **Health Checks**: Liveness and readiness probes

## 📈 Scaling & High Availability

### 1. Horizontal Pod Autoscaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hospital-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hospital-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 2. Load Balancing
- **Service Level**: Kubernetes service load balancing
- **Ingress Level**: NGINX ingress controller
- **Mesh Level**: Linkerd traffic splitting

## 🚨 Troubleshooting

### 1. Check Pod Status
```bash
kubectl get pods -n hospital-web-app
kubectl describe pod <pod-name> -n hospital-web-app
```

### 2. Check Network Policies
```bash
kubectl get networkpolicies -n hospital-web-app
kubectl describe networkpolicy <policy-name> -n hospital-web-app
```

### 3. Check Linkerd Status
```bash
linkerd check
linkerd dashboard &
```

### 4. Check Calico Status
```bash
kubectl get pods -n calico-system
kubectl logs -f deployment/calico-kube-controllers -n calico-system
```

### 5. Common Issues

#### Pods Stuck in Pending
- Check node resources
- Verify Calico CNI is running
- Check for taints/tolerations

#### Network Connectivity Issues
- Verify Calico network policies
- Check service endpoints
- Verify Linkerd proxy injection

#### mTLS Issues
- Check Linkerd installation
- Verify service profiles
- Check certificate validity

## 🔄 Updates & Maintenance

### 1. Rolling Updates
```bash
# Update backend
kubectl set image deployment/hospital-backend hospital-backend=hospital-backend:v2 -n hospital-web-app

# Update frontend
kubectl set image deployment/hospital-frontend hospital-frontend=hospital-frontend:v2 -n hospital-web-app
```

### 2. Scaling
```bash
# Scale backend
kubectl scale deployment hospital-backend --replicas=5 -n hospital-web-app

# Scale frontend
kubectl scale deployment hospital-frontend --replicas=3 -n hospital-web-app
```

### 3. Monitoring Updates
```bash
# Update Prometheus config
kubectl apply -f k8s/monitoring.yaml

# Update Grafana dashboards
kubectl apply -f k8s/monitoring.yaml
```

## 📚 Additional Resources

### 1. Calico Documentation
- [Calico Network Policy](https://docs.projectcalico.org/reference/resources/networkpolicy)
- [Calico Installation](https://docs.projectcalico.org/getting-started/kubernetes/quickstart)

### 2. Linkerd Documentation
- [Linkerd Getting Started](https://linkerd.io/getting-started/)
- [Linkerd Service Profiles](https://linkerd.io/2.15/reference/service-profiles/)

### 3. Kubernetes Documentation
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [Kubernetes Networking](https://kubernetes.io/docs/concepts/services-networking/)

## 🎯 Next Steps

1. **Production Deployment**: Configure for production environment
2. **CI/CD Pipeline**: Set up automated deployment pipeline
3. **Advanced Monitoring**: Add custom metrics and alerts
4. **Security Hardening**: Implement additional security measures
5. **Backup & Recovery**: Set up data backup strategies

---

**Note**: This setup provides a production-ready foundation for the Hospital Web App with enterprise-grade networking, security, and observability capabilities.
