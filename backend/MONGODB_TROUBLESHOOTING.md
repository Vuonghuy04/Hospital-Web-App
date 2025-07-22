# MongoDB Connection Troubleshooting Guide

## 🔍 Current Issue: SSL/TLS Connection Error

The error you're experiencing is a common MongoDB Atlas connection issue related to SSL/TLS configuration.

## 🚀 Quick Fixes (Try These First)

### 1. Update Your IP Whitelist in MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Login to your account
3. Go to **Network Access** → **IP Access List**
4. Click **Add IP Address**
5. Choose **Add Current IP Address** or **Allow Access from Anywhere** (0.0.0.0/0)
6. Save and wait 2-3 minutes for changes to propagate

### 2. Test Different Connection Strings
In your `backend/.env` file, try these alternatives:

#### Option A: Add SSL parameters
```env
MONGO_URI=mongodb+srv://vqh04092004:admin@cluster0.nnhndae.mongodb.net/hospital_analytics?retryWrites=true&w=majority&ssl=true&authSource=admin
```

#### Option B: Simplified connection
```env
MONGO_URI=mongodb+srv://vqh04092004:admin@cluster0.nnhndae.mongodb.net/hospital_analytics?retryWrites=true&w=majority
```

#### Option C: With timeout settings
```env
MONGO_URI=mongodb+srv://vqh04092004:admin@cluster0.nnhndae.mongodb.net/hospital_analytics?retryWrites=true&w=majority&serverSelectionTimeoutMS=5000&socketTimeoutMS=45000
```

### 3. Network/Firewall Check
```bash
# Test if you can reach MongoDB Atlas
nslookup cluster0.nnhndae.mongodb.net

# Test port connectivity (should work if firewall allows)
telnet cluster0.nnhndae.mongodb.net 27017
```

## 🔧 Advanced Solutions

### Solution 1: Use Local MongoDB (Temporary)
If Atlas keeps failing, set up local MongoDB:

1. **Install MongoDB locally**:
   - Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Install and start the service

2. **Update .env**:
   ```env
   MONGO_URI=mongodb://localhost:27017
   ```

3. **Test connection**:
   ```bash
   cd backend
   npm run dev
   ```

### Solution 2: Alternative Cloud Database
Use a different MongoDB service temporarily:

#### MongoDB Compass (Local Connection)
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to local instance
3. Create database `hospital_analytics`

#### Alternative Cloud Provider
- Try [MongoDB Atlas](https://cloud.mongodb.com/) with a new cluster
- Consider [DigitalOcean MongoDB](https://www.digitalocean.com/products/managed-databases-mongodb)

### Solution 3: Backend Without Database
For immediate testing, you can run the backend without database:

1. **Create a no-database mode**:
   ```javascript
   // In server.js, add this flag
   const USE_MEMORY_STORE = process.env.NODE_ENV === 'development' && !db;
   ```

2. **Use in-memory storage**:
   ```javascript
   let memoryStore = [];
   
   // In POST route
   if (USE_MEMORY_STORE) {
     memoryStore.push(behaviorData);
     return res.json({ message: 'Stored in memory', id: Date.now() });
   }
   ```

## 🔍 Detailed Diagnostics

### Check Your MongoDB Atlas Configuration

1. **Database User**:
   - Go to **Database Access**
   - Ensure user `vqh04092004` exists
   - Password is correct
   - User has read/write permissions

2. **Network Access**:
   - Go to **Network Access**
   - Check IP whitelist includes your current IP
   - Try adding `0.0.0.0/0` (allow all) temporarily

3. **Cluster Status**:
   - Go to **Clusters**
   - Ensure cluster `Cluster0` is running
   - Check if there are any maintenance windows

### Test Connection Manually

Create a test file `backend/test-connection.js`:

```javascript
const { MongoClient } = require('mongodb');

const testConnection = async () => {
  const uri = 'mongodb+srv://vqh04092004:admin@cluster0.nnhndae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      tls: true,
    });
    
    await client.connect();
    console.log('✅ Connection successful!');
    
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Ping successful!');
    
    await client.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
};

testConnection();
```

Run: `node test-connection.js`

## 🚨 Emergency Workaround

If nothing works, use this temporary in-memory backend:

```javascript
// Add to server.js
let inMemoryData = [];

app.post('/api/behavior-tracking', verifyToken, (req, res) => {
  const data = { ...req.body, timestamp: new Date(), id: Date.now() };
  inMemoryData.push(data);
  res.json({ message: 'Stored in memory', id: data.id });
});

app.get('/api/behavior-tracking', verifyToken, (req, res) => {
  res.json({ data: inMemoryData, count: inMemoryData.length });
});
```

## 📞 Get Help

1. **MongoDB Atlas Support**: Check their [status page](https://status.cloud.mongodb.com/)
2. **Community Forums**: [MongoDB Community Forum](https://community.mongodb.com/)
3. **Stack Overflow**: Search for "MongoDB Atlas SSL error"

## ✅ Verification Steps

After trying solutions:

1. **Restart backend**: `npm run dev`
2. **Check health endpoint**: Visit `http://localhost:3001/api/health`
3. **Test frontend connection**: Use the Analytics dashboard
4. **Check logs**: Look for "✅ Connected to MongoDB" message

## 🔄 Quick Recovery Commands

```bash
# Stop backend
Ctrl + C

# Clear npm cache (sometimes helps)
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install

# Try different Node version (if available)
nvm use 18  # or nvm use 16

# Restart backend
npm run dev
```

Choose the solution that works best for your environment! 