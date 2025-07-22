# Keycloak Client Configuration Fix

## 🚨 Issue: "Invalid redirect uri" on Logout

If you're seeing "Invalid redirect uri" when logging out, you need to update your Keycloak client configuration.

## 🔧 How to Fix

### 1. Access Keycloak Admin Console
- Go to `http://localhost:8080`
- Login with admin credentials
- Navigate to **Realms** → **demo**

### 2. Configure Client Settings
- Go to **Clients** → **demo-client**
- Click on the **Settings** tab

### 3. Update Redirect URIs
Make sure you have these settings:

#### **Valid Redirect URIs**
Add these entries (one per line):
```
http://localhost:3000/*
http://localhost:3000/
```

#### **Valid Post Logout Redirect URIs**
Add these entries (one per line):
```
http://localhost:3000/*
http://localhost:3000/
```

#### **Web Origins**
Add this entry:
```
http://localhost:3000
```

### 4. Other Important Settings
- **Client Protocol**: `openid-connect`
- **Access Type**: `public` (for React apps)
- **Standard Flow Enabled**: `ON`
- **Implicit Flow Enabled**: `OFF`
- **Direct Access Grants Enabled**: `ON`
- **Service Accounts Enabled**: `OFF`

### 5. Save Configuration
- Click **Save** at the bottom of the page

## ✅ Verification Steps

1. **Test Login**: Click "Sign In with Keycloak" → Should work normally
2. **Test Logout**: Click "Log Out" → Should redirect back to login page without errors
3. **Check Console**: No 400 errors in browser console

## 🔍 Alternative Fix (If Above Doesn't Work)

If you're still having issues, try this simplified client configuration:

#### **Valid Redirect URIs**
```
*
```

#### **Valid Post Logout Redirect URIs**
```
*
```

> ⚠️ **Warning**: Using `*` is less secure and should only be used for development.

## 📋 Complete Client Configuration Checklist

- [ ] Client ID: `demo-client`
- [ ] Client Protocol: `openid-connect`
- [ ] Access Type: `public`
- [ ] Valid Redirect URIs: `http://localhost:3000/*`
- [ ] Valid Post Logout Redirect URIs: `http://localhost:3000/*`
- [ ] Web Origins: `http://localhost:3000`
- [ ] Standard Flow Enabled: `ON`
- [ ] Implicit Flow Enabled: `OFF`
- [ ] Direct Access Grants Enabled: `ON`

## 🆘 Still Having Issues?

If the problem persists:

1. **Check Browser Console** for specific error messages
2. **Verify Keycloak is running** on `http://localhost:8080`
3. **Clear browser cache** and cookies
4. **Restart both** your React app and Keycloak container

## 📞 Debug Information

When reporting issues, include:
- Browser console errors
- Keycloak server logs
- Current client configuration screenshot 