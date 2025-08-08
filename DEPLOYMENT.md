# CRAMS Deployment Guide for Existing Render Services

## 📋 Quick Deployment Steps

### 1. Push Latest Changes
```bash
git add .
git commit -m "feat: update deployment configuration"
git push origin main
```

### 2. Update Existing Backend Service Settings
- Service Name: Your existing backend service
- Build Command: `npm run install:server`
- Start Command: `npm start`
- Root Directory: `.`
- Node Version: `18`

### 3. Update Existing Frontend Service Settings (if separate)
- Service Name: Your existing frontend service  
- Build Command: `npm run install:client && npm run build`
- Publish Directory: `client/build`
- Root Directory: `.`

### 4. Environment Variables (Backend)
Make sure these are set in your backend service:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=10000
```

### 5. Environment Variables (Frontend)
Make sure this is set in your frontend service:
```
REACT_APP_API_URL=https://your-backend-service.onrender.com
```

## 🔧 Manual Redeploy
If auto-deploy doesn't work:
1. Go to Render Dashboard
2. Select your service
3. Click "Manual Deploy" 
4. Click "Deploy latest commit"

## 🚨 Troubleshooting
If deployment fails, check:
1. Build logs in Render dashboard
2. Make sure all dependencies are in package.json
3. Verify Node version is 18+
4. Check environment variables are set correctly

## 📞 Support
If you need to update service settings:
1. Go to service → Settings tab
2. Update the commands above
3. Save changes
4. Redeploy
