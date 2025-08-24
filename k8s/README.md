# 🚀 **Kubernetes Configuration Directory**

## 📁 **Directory Structure (Cleaned & Organized)**

### **🔧 Core Setup Files:**
- **`setup-cluster.sh`** - Complete cluster setup (Kind + Calico + Linkerd + NGINX)
- **`deploy.sh`** - Application deployment automation
- **`namespace.yaml`** - Hospital app namespace with Linkerd injection

### **🌐 Network & Security:**
- **`calico-install-fixed.yaml`** - Calico CNI installation (fixed version)
- **`calico-network-policy.yaml`** - Calico GlobalNetworkPolicy definitions
- **`test-network-policies-final.yaml`** - Standard Kubernetes NetworkPolicies for testing
- **`test-pods.yaml`** - Test pods for micro-segmentation validation

### **📱 Application Deployments:**
- **`backend-deployment.yaml`** - Node.js backend deployment + service
- **`frontend-deployment.yaml`** - React frontend deployment + service
- **`secrets.yaml`** - MongoDB connection and Linkerd certificates

### **🔗 Service Mesh & Routing:**
- **`linkerd-install.yaml`** - Linkerd CRDs and installation
- **`linkerd-config.yaml`** - ServiceProfiles and TrafficSplit configurations
- **`ingress.yaml`** - NGINX Ingress for external access

### **📊 Monitoring & Observability:**
- **`monitoring.yaml`** - Prometheus + Grafana deployment

### **🧪 Testing & Validation:**
- **`test-micro-segmentation.sh`** - Automated micro-segmentation testing script

### **🖥️ UI Testing Tools:**
- **`ui-testing-setup.yaml`** - Custom network policy visualizer
- **`start-ui-testing.sh`** - Quick start script for UI tools
- **`UI_TESTING_GUIDE.md`** - Comprehensive UI testing documentation
- **`dashboard-admin.yaml`** - Kubernetes dashboard admin access

## 🧹 **Cleanup Completed:**

**Removed redundant files:**
- ❌ `test-network-policies.yaml` (outdated)
- ❌ `test-network-policies-fixed.yaml` (intermediate)
- ❌ `calico-install.yaml` (had errors)

**Current files are the final, working versions.**

## 🎯 **Quick Start:**

1. **Setup Cluster**: `./setup-cluster.sh`
2. **Deploy App**: `./deploy.sh`
3. **Test Security**: `./test-micro-segmentation.sh`
4. **UI Testing**: `./start-ui-testing.sh`

## 📚 **Documentation:**
- **`UI_TESTING_GUIDE.md`** - Complete UI testing guide
- **`KUBERNETES_SETUP.md`** - Full setup documentation

---

**🎉 Directory is now clean, organized, and ready for production use!**
