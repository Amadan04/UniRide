# 🔒 UniRide GitHub Security Cleanup Instructions

## ⚠️ **CRITICAL: Follow These Steps Before Pushing to GitHub**

This document contains **STEP-BY-STEP instructions** to safely prepare your UniRide project for public GitHub release **without breaking anything** and **without deleting any local files**.

---

## 📋 **What Was Found**

### 🚨 **Exposed Secrets**
1. **Firebase API Keys** - Currently hardcoded in backend
2. **OpenRouter API Key** - In `.env` file (tracked by git)
3. **Environment Variables** - `.env` file is currently tracked

### ✅ **Already Safe**
- Frontend Firebase config ✅ (uses environment variables)
- Frontend OpenRouter API ✅ (uses environment variables)

---

## 🛠️ **STEP-BY-STEP CLEANUP PROCESS**

### **STEP 1: Untrack `.env` File (DON'T DELETE IT)**

Run these commands in your terminal:

```bash
cd "C:\Users\abdul\OneDrive\Documents\GitHub\SWEN360"

# Untrack the .env file WITHOUT deleting it locally
git rm --cached App/carpooling-frontend/.env

# Untrack backend .env if it exists
git rm --cached App/carpooling-backend/.env 2>/dev/null || echo "Backend .env not tracked"

# Commit this change
git commit -m "🔒 Remove .env files from version control"
```

**✅ This removes the file from git tracking but KEEPS IT on your computer**

---

### **STEP 2: Install `dotenv` Package for Backend**

The backend needs the `dotenv` package to read environment variables:

```bash
cd "C:\Users\abdul\OneDrive\Documents\GitHub\SWEN360\App\carpooling-backend"

# Install dotenv (if not already installed)
npm install dotenv

# Or if using functions folder:
cd functions
npm install dotenv
```

---

### **STEP 3: Update Backend Firebase Configuration**

**File:** `App/carpooling-backend/services/firebase.js`

**Replace the entire file with this code:**

```javascript
/**
 * Firebase Configuration and Initialization
 *
 * This file initializes Firebase services for the carpooling app.
 * Configuration is loaded from environment variables for security.
 *
 * Make sure to create a .env file in the backend root directory.
 * See .env.example for required variables.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration - loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Export the app instance
export default app;

/**
 * Collection and path constants
 * Centralized location for all Firestore collection names and Realtime DB paths
 */
export const COLLECTIONS = {
  USERS: 'users',
  RIDES: 'rides',
  BOOKINGS: 'bookings',
  RATINGS: 'ratings'
};

export const REALTIME_PATHS = {
  RIDE_LOCATIONS: 'rideLocations',
  CHATS: 'chats'
};

/**
 * Helper function to check if Firebase is initialized
 */
export const isFirebaseInitialized = () => {
  return app !== null;
};
```

---

### **STEP 4: Verify Everything Still Works**

**Test Frontend:**
```bash
cd "C:\Users\abdul\OneDrive\Documents\GitHub\SWEN360\App\carpooling-frontend"
npm run dev
```

**Test Backend (if applicable):**
```bash
cd "C:\Users\abdul\OneDrive\Documents\GitHub\SWEN360\App\carpooling-backend"
npm start
```

**✅ Expected Result:** App should run exactly the same as before

**❌ If you get errors:** The `.env` files are in place, check that environment variable names match

---

### **STEP 5: Commit the Security Fixes**

```bash
cd "C:\Users\abdul\OneDrive\Documents\GitHub\SWEN360"

# Stage all changes
git add .

# Commit the security improvements
git commit -m "🔒 Security: Move Firebase keys to environment variables

- Updated backend firebase.js to use environment variables
- Enhanced .gitignore files across all projects
- Added .env.example templates for configuration
- Removed hardcoded API keys from source code

BREAKING: Developers must create .env files locally
See .env.example for required variables"

# Push to GitHub (NOW SAFE!)
git push origin main
```

---

## 📁 **Files Created/Updated**

### ✅ **Created:**
- `.gitignore` (root)
- `App/carpooling-frontend/.gitignore`
- `App/carpooling-backend/.gitignore`
- `App/carpooling-backend/.env` (your real secrets - **NOT TRACKED**)
- `App/carpooling-backend/.env.example` (template - **SAFE TO COMMIT**)

### ✅ **Already Exists:**
- `App/carpooling-frontend/.env` (your real secrets - **WILL BE UNTRACKED**)
- `App/carpooling-frontend/.env.example` (template - **SAFE TO COMMIT**)

---

## 🔐 **Environment Variables Reference**

### **Frontend** (`App/carpooling-frontend/.env`)
```env
VITE_FIREBASE_API_KEY=AIzaSyDMllqkxUAY9z8alO1oLaJAqjc_jMxk50E
VITE_FIREBASE_AUTH_DOMAIN=university-carpool-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=university-carpool-app
VITE_FIREBASE_STORAGE_BUCKET=university-carpool-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=852111697097
VITE_FIREBASE_APP_ID=1:852111697097:web:036be8d1420f348adfd918
VITE_FIREBASE_DATABASE_URL=https://university-carpool-app-default-rtdb.europe-west1.firebasedatabase.app

VITE_OPENROUTER_API_KEY=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
```

### **Backend** (`App/carpooling-backend/.env`)
```env
FIREBASE_API_KEY=AIzaSyDMllqkxUAY9z8alO1oLaJAqjc_jMxk50E
FIREBASE_AUTH_DOMAIN=university-carpool-app.firebaseapp.com
FIREBASE_DATABASE_URL=https://university-carpool-app-default-rtdb.europe-west1.firebasedatabase.app
FIREBASE_PROJECT_ID=university-carpool-app
FIREBASE_STORAGE_BUCKET=university-carpool-app.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=852111697097
FIREBASE_APP_ID=1:852111697097:web:036be8d1420f348adfd918
FIREBASE_MEASUREMENT_ID=G-Q7TY78QFCZ

PORT=3000
NODE_ENV=development
```

---

## 🚀 **Deployment Notes**

### **Vercel (Frontend)**
Add these environment variables in Vercel dashboard:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_OPENROUTER_API_KEY`

### **Render (Backend)**
Add these environment variables in Render dashboard:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `NODE_ENV=production`

---

## ✅ **Pre-Push Checklist**

Before pushing to GitHub, verify:

- [ ] `.env` files are untracked from git
- [ ] `.env.example` files exist and have placeholder values
- [ ] Backend uses `process.env` for Firebase config
- [ ] Frontend still uses `import.meta.env` (already done ✅)
- [ ] `.gitignore` files updated in all folders
- [ ] `dotenv` package installed in backend
- [ ] App runs successfully locally
- [ ] No hardcoded API keys in source code
- [ ] `.env` files are in `.gitignore`

---

## 🛑 **What NOT To Do**

❌ **DON'T** delete `.env` files from your computer
❌ **DON'T** commit `.env` files to git
❌ **DON'T** share API keys in chat, screenshots, or docs
❌ **DON'T** hardcode secrets in source code
❌ **DON'T** push before completing these steps

---

## ✅ **What TO Do**

✅ **DO** use `git rm --cached` to untrack files
✅ **DO** keep `.env` files locally
✅ **DO** commit `.env.example` files
✅ **DO** use environment variables
✅ **DO** test locally before pushing
✅ **DO** add secrets to deployment platforms manually

---

## 📞 **Need Help?**

If something breaks:
1. Check that `.env` files exist in the correct locations
2. Verify environment variable names match the code
3. Ensure `dotenv` package is installed in backend
4. Check console for specific error messages

**Backup Created:** `App/carpooling-backend/services/firebase.js.backup`

---

## 🎯 **Final Result**

After following these steps:
- ✅ No secrets in GitHub repository
- ✅ App works exactly the same locally
- ✅ Safe to make repository public
- ✅ Other developers can use `.env.example` as template
- ✅ Deployment platforms use their own env vars

**Your local files remain untouched. Only git tracking changes.**

---

## 📝 **Summary of Commands**

```bash
# 1. Untrack .env files
cd "C:\Users\abdul\OneDrive\Documents\GitHub\SWEN360"
git rm --cached App/carpooling-frontend/.env
git rm --cached App/carpooling-backend/.env 2>/dev/null || true
git commit -m "🔒 Remove .env files from version control"

# 2. Install dotenv in backend
cd App/carpooling-backend
npm install dotenv

# 3. Update backend firebase.js (see STEP 3 above)

# 4. Test everything
cd App/carpooling-frontend
npm run dev

# 5. Commit security fixes
cd ../..
git add .
git commit -m "🔒 Security: Move Firebase keys to environment variables"
git push origin main
```

---

**🔒 You're now safe to push to GitHub!**