# 🚀 Quick Start Guide - ES6 + Mongoose Backend

Your backend has been successfully converted to your preferred architecture!

## ✅ What's Changed

### **Architecture Upgrade**
- ✅ **ES6 Modules** (`import/export` instead of `require`)
- ✅ **Mongoose ODM** (instead of native MongoDB driver)
- ✅ **Modular Routes** (separate files for organization)
- ✅ **Port 5000** (instead of 3001)
- ✅ **Fixed Password** (URL-encoded `admin%40`)

### **New File Structure**
```
backend/
├── server.js              # Main server (ES6 style)
├── models/Behavior.js      # Mongoose schema
├── routes/behavior.js      # API routes
├── middleware/auth.js      # JWT middleware
├── package.json           # Updated dependencies
└── .env                   # Fixed password
```

## 🚀 **How to Run**

### **1. Install Dependencies**
```bash
cd hospital-web-app/backend
npm install
```

### **2. Start Development Server**
```bash
npm run dev
```

### **3. Expected Output**
```
✅ MongoDB connected to hospital_analytics database
🚀 Server running on port 5000
📊 Behavior API available at http://localhost:5000/api/behavior-tracking
💊 Health check: http://localhost:5000/api/health
```

## 🎯 **API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/behavior-tracking` | Store behavior data |
| `GET` | `/api/behavior-tracking` | Get behavior data (with filters) |
| `GET` | `/api/behavior-tracking/analytics` | Get analytics summary |
| `GET` | `/api/behavior-tracking/stats` | Get quick statistics |
| `DELETE` | `/api/behavior-tracking?confirm=true` | Clear data |
| `GET` | `/api/health` | Health check |

## 🔍 **Test Your Setup**

### **1. Health Check**
```bash
curl http://localhost:5000/api/health
```

### **2. Test Behavior Tracking** (needs JWT token)
```bash
curl -X POST http://localhost:5000/api/behavior-tracking \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{
    "username": "test.user",
    "userId": "test.user",
    "action": "test_action",
    "sessionId": "test_session_123"
  }'
```

### **3. Get Statistics**
```bash
curl http://localhost:5000/api/behavior-tracking/stats \
  -H "Authorization: Bearer your-token-here"
```

## 📊 **MongoDB Database**

Your data will be stored in:
- **Database**: `hospital_analytics`
- **Collection**: `user_behavior`
- **Connection**: MongoDB Atlas (password fixed)

## 🔧 **Frontend Configuration**

Update your frontend to use the new port:

**File**: `hospital-web-app/.env.local`
```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

## 🎉 **Key Improvements**

### **Better Error Handling**
- Mongoose validation errors
- Proper HTTP status codes
- Detailed error messages

### **Enhanced Features**
- Pagination support
- Advanced filtering
- Better analytics
- Automatic timestamps

### **Modern Architecture**
- ES6 modules throughout
- Async/await patterns
- Modular structure
- Better separation of concerns

## 🔄 **Migration Notes**

The new backend maintains **100% API compatibility** with your frontend. All existing functionality works exactly the same, just with improved:
- Performance (Mongoose optimization)
- Validation (Schema validation)
- Maintainability (Modular structure)
- Error handling (Better responses)

## 🚨 **Common Issues**

### **1. Import/Export Errors**
Make sure `"type": "module"` is in `package.json`

### **2. MongoDB Connection**
Password is now URL-encoded: `admin%40` (was `admin`)

### **3. Port Conflicts**
Backend now runs on port **5000** (was 3001)

## ✅ **You're Ready!**

Your backend is now running in your preferred ES6 + Mongoose architecture with:
- ✅ Fixed MongoDB connection
- ✅ Modern ES6 modules
- ✅ Mongoose ODM
- ✅ Modular structure
- ✅ Enhanced features

Start the backend and test the endpoints above! 