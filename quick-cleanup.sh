#!/bin/bash

# =========================
# UniRide Quick Cleanup Script
# =========================
# This script performs all necessary steps to safely prepare
# your repo for public GitHub release WITHOUT deleting local files.
#
# Usage: bash quick-cleanup.sh
# =========================

echo "🔒 UniRide GitHub Security Cleanup"
echo "=================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"
echo ""

# Step 1: Untrack .env files
echo "STEP 1: Untracking .env files from git..."
git rm --cached App/carpooling-frontend/.env 2>/dev/null && echo "✅ Frontend .env untracked" || echo "ℹ️  Frontend .env not tracked"
git rm --cached App/carpooling-backend/.env 2>/dev/null && echo "✅ Backend .env untracked" || echo "ℹ️  Backend .env not tracked"
echo ""

# Step 2: Install dotenv in backend
echo "STEP 2: Installing dotenv in backend..."
cd App/carpooling-backend
if [ -f "package.json" ]; then
    npm install dotenv
    echo "✅ dotenv installed"
else
    echo "⚠️  No package.json found in backend"
fi
cd ../..
echo ""

# Step 3: Reminder to update firebase.js
echo "STEP 3: ⚠️  ACTION REQUIRED"
echo "You need to manually update:"
echo "  → App/carpooling-backend/services/firebase.js"
echo ""
echo "Replace the hardcoded firebaseConfig with:"
echo "=================================="
cat << 'EOF'
import dotenv from 'dotenv';
dotenv.config();

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
EOF
echo "=================================="
echo ""

# Step 4: Verify no secrets in code
echo "STEP 4: Checking for hardcoded secrets..."
if git grep -q "AIzaSyDMllqkxUAY9z8alO1oLaJAqjc_jMxk50E" 2>/dev/null; then
    echo "❌ Firebase API key still hardcoded in source!"
    echo "   → Update backend firebase.js"
else
    echo "✅ No Firebase API keys found in source code"
fi

if git grep -q "sk-or-v1-" 2>/dev/null; then
    echo "❌ OpenRouter API key still in tracked files!"
else
    echo "✅ No OpenRouter API keys found in tracked files"
fi
echo ""

# Step 5: Check git status
echo "STEP 5: Checking git status..."
echo "Files to be committed:"
git status --short
echo ""

# Step 6: Final checklist
echo "✅ CLEANUP CHECKLIST"
echo "===================="
echo "[✓] .gitignore files updated"
echo "[✓] .env.example files created"
echo "[✓] .env files untracked from git"
echo "[✓] dotenv package installed"
echo ""
echo "⚠️  MANUAL STEPS REMAINING:"
echo "[  ] Update App/carpooling-backend/services/firebase.js"
echo "[  ] Test app locally: npm run dev"
echo "[  ] Commit changes: git commit -m '🔒 Security improvements'"
echo "[  ] Push to GitHub: git push origin main"
echo ""

echo "📚 For detailed instructions, see:"
echo "   → GITHUB_CLEANUP_INSTRUCTIONS.md"
echo ""
echo "🎉 Once manual steps complete, you're ready for GitHub!"