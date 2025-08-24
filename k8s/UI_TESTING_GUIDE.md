# 🖥️ **UI-Based Micro-Segmentation Testing Guide**

## 🎯 **Overview**

This guide shows you how to test and visualize micro-segmentation through multiple user interfaces, making it easy to understand and verify your network security policies.

## 🚀 **Available UI Testing Tools**

### **1. 🎨 Custom Network Policy Visualizer**
- **Purpose**: Interactive dashboard for testing micro-segmentation
- **Features**: Real-time policy status, test buttons, visual policy cards
- **Access**: Web-based interface

### **2. 📊 Kubernetes Dashboard**
- **Purpose**: Official Kubernetes management interface
- **Features**: Network policy management, pod monitoring, service discovery
- **Access**: Web-based interface with authentication

### **3. 🔍 Linkerd Dashboard** (When Ready)
- **Purpose**: Service mesh observability and traffic management
- **Features**: mTLS status, service communication, traffic metrics
- **Access**: Web-based interface

## 🎨 **1. Custom Network Policy Visualizer**

### **Access the Dashboard:**
```bash
# Port forward to access the visualizer
kubectl port-forward -n micro-segmentation-ui svc/network-policy-visualizer-service 8080:80
```

### **Open in Browser:**
```
http://localhost:8080
```

### **Features Available:**
- ✅ **Policy Status Cards**: Visual representation of each network policy
- 🧪 **Test Buttons**: Interactive testing of micro-segmentation rules
- 📊 **Real-time Results**: Live feedback on policy tests
- 📝 **Activity Log**: Detailed log of all testing activities

### **How to Test:**
1. **Click "Test Allowed Traffic"** → Tests Frontend → Backend communication
2. **Click "Test Blocked Traffic"** → Tests Attacker → Backend blocking
3. **Click "Test DNS Policy"** → Tests DNS resolution for all pods
4. **Click "Refresh Policies"** → Updates policy status

## 📊 **2. Kubernetes Dashboard**

### **Get Access Token:**
```bash
# Get the admin user token
kubectl -n kubernetes-dashboard create token admin-user
```

### **Start Dashboard:**
```bash
# Port forward to access dashboard
kubectl port-forward -n kubernetes-dashboard svc/kubernetes-dashboard 8443:443
```

### **Access Dashboard:**
```
https://localhost:8443
```

### **Login:**
- **Token**: Use the token from the command above
- **Username**: Leave empty
- **Password**: Leave empty

### **Testing Micro-Segmentation in Dashboard:**

#### **Step 1: View Network Policies**
1. Navigate to **Namespaces** → **hospital-web-app**
2. Click **Network Policies**
3. View all active policies and their status

#### **Step 2: Monitor Pod Communication**
1. Go to **Pods** in hospital-web-app namespace
2. Click on a pod (e.g., test-frontend)
3. View **Logs** and **Events** for network activity

#### **Step 3: Test Network Connectivity**
1. Go to **Pods** → **test-attacker**
2. Click **Exec** → **Terminal**
3. Run connectivity tests:
   ```bash
   # Test blocked access (should fail)
   wget --timeout=5 --tries=1 -O- http://<backend-ip>:80
   
   # Test DNS (should work)
   nslookup kubernetes.default.svc.cluster.local
   ```

## 🔍 **3. Advanced Testing with kubectl**

### **Real-time Policy Monitoring:**
```bash
# Watch network policies
kubectl get networkpolicies -n hospital-web-app -w

# Monitor policy events
kubectl get events -n hospital-web-app --sort-by='.lastTimestamp'

# Check policy details
kubectl describe networkpolicy <policy-name> -n hospital-web-app
```

### **Interactive Pod Testing:**
```bash
# Test from attacker pod
kubectl exec -it -n hospital-web-app test-attacker -- sh

# Inside pod, test connectivity:
wget --timeout=5 --tries=1 -O- http://<backend-ip>:80
nslookup kubernetes.default.svc.cluster.local
exit
```

## 🧪 **4. Automated Testing Scripts**

### **Run Comprehensive Test:**
```bash
# Execute the automated test script
./test-micro-segmentation.sh
```

### **Test Specific Scenarios:**
```bash
# Test only blocked traffic
kubectl exec -n hospital-web-app test-attacker -- wget --timeout=5 --tries=1 -O- http://<backend-ip>:80

# Test only allowed traffic
kubectl exec -n hospital-web-app test-frontend -- wget --timeout=5 --tries=1 -O- http://<backend-ip>:80

# Test DNS resolution
kubectl exec -n hospital-web-app test-frontend -- nslookup kubernetes.default.svc.cluster.local
```

## 📱 **5. Mobile-Friendly Testing**

### **Access from Mobile Device:**
1. Find your computer's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Access from mobile browser:
   ```
   http://<your-computer-ip>:8080
   ```

## 🎯 **6. What to Look For**

### **✅ Successful Micro-Segmentation:**
- **Attacker pod** cannot reach backend (connection timeout)
- **Frontend pod** can reach backend (connection successful)
- **Backend pod** cannot reach frontend (connection timeout)
- **All pods** can resolve DNS (nslookup successful)

### **❌ Failed Micro-Segmentation:**
- **Attacker pod** can reach backend (security vulnerability)
- **Frontend pod** cannot reach backend (policy too restrictive)
- **DNS resolution** fails (DNS policy issue)

## 🚨 **7. Troubleshooting**

### **Common Issues:**

#### **Dashboard Not Accessible:**
```bash
# Check if pods are running
kubectl get pods -n micro-segmentation-ui

# Check service status
kubectl get svc -n micro-segmentation-ui

# Restart port-forward if needed
kubectl port-forward -n micro-segmentation-ui svc/network-policy-visualizer-service 8080:80
```

#### **Network Policies Not Working:**
```bash
# Check policy status
kubectl get networkpolicies -n hospital-web-app

# Verify Calico is running
kubectl get pods -n kube-system -l k8s-app=calico-node

# Check policy events
kubectl get events -n hospital-web-app | grep NetworkPolicy
```

## 🎉 **8. Success Criteria**

Your micro-segmentation is working correctly when:

1. **Security**: Unauthorized access is blocked
2. **Functionality**: Legitimate communication works
3. **Isolation**: Services are properly isolated
4. **DNS**: Service discovery functions normally
5. **Monitoring**: All activities are visible in UI

## 🚀 **9. Next Steps**

1. **Test all scenarios** using the UI tools
2. **Document results** for compliance/auditing
3. **Set up monitoring** for production use
4. **Implement alerting** for policy violations
5. **Regular testing** to ensure continued security

---

**🎯 Goal**: Use these UI tools to make micro-segmentation testing intuitive, visual, and accessible to both technical and non-technical team members.
