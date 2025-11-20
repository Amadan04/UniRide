# 🔒 UniRide Security Checklist

## ✅ Quick Pre-Push Checklist

Run through this before pushing to GitHub:

### 1. Environment Files
- [ ] `.env` files exist locally in both frontend and backend
- [ ] `.env` files are **NOT** tracked by git
- [ ] `.env.example` files exist and contain only placeholders
- [ ] `.env.example` files **ARE** tracked by git

### 2. Git Tracking
```bash
# Check what's tracked:
git status

# Should NOT see:
# - .env files
# - node_modules/
# - dist/
# - build/
# - Any firebase-admin*.json or serviceAccount*.json files
```

### 3. Code Review
- [ ] Backend `firebase.js` uses `process.env.FIREBASE_*`
- [ ] Frontend `firebase.js` uses `import.meta.env.VITE_FIREBASE_*`
- [ ] No hardcoded API keys in source code
- [ ] `dotenv` package installed in backend

### 4. Test Locally
- [ ] Frontend runs: `cd App/carpooling-frontend && npm run dev`
- [ ] Backend runs: `cd App/carpooling-backend && npm start`
- [ ] No errors in console
- [ ] Firebase connects successfully
- [ ] OpenRouter AI works (if testing that feature)

### 5. .gitignore Files
- [ ] Root `.gitignore` updated
- [ ] Frontend `.gitignore` updated
- [ ] Backend `.gitignore` updated
- [ ] All ignore patterns tested with `git status`

### 6. Dependencies
- [ ] `npm install` runs successfully in frontend
- [ ] `npm install` runs successfully in backend
- [ ] `dotenv` listed in backend `package.json`

## 🚨 Red Flags (DON'T PUSH IF YOU SEE THESE)

```bash
git status
```

If you see any of these in the output, **STOP**:
- ❌ `.env` (without .example)
- ❌ `firebase-admin-sdk.json`
- ❌ `serviceAccount*.json`
- ❌ Any files with "secret" or "key" in the name
- ❌ Files containing actual API keys

## ✅ Safe to Commit

These are **SAFE** to push:
- ✅ `.env.example` files
- ✅ `.gitignore` files
- ✅ Source code using environment variables
- ✅ `README.md` files
- ✅ Configuration files without secrets

## 🔐 Secrets Storage

### Local Development
- Secrets in `.env` files (not tracked)
- Never commit `.env` files

### Production Deployment
- **Vercel**: Add env vars in dashboard
- **Render**: Add env vars in dashboard
- **Never** hardcode in source code

## 📞 Emergency: If Secrets Were Pushed

If you accidentally pushed secrets:

```bash
# 1. IMMEDIATELY rotate all API keys
# - Firebase: Generate new API key
# - OpenRouter: Generate new API key

# 2. Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch App/carpooling-frontend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (BE CAREFUL!)
git push origin --force --all

# 4. Update all .env files with new keys
```

## ✅ Final Check

```bash
# 1. Check git status
git status

# 2. Check what will be pushed
git diff --cached

# 3. Search for any API keys
git grep -i "AIza" || echo "No Firebase keys found ✅"
git grep -i "sk-or-v1" || echo "No OpenRouter keys found ✅"

# 4. If all clear, push!
git push origin main
```

---

**Last Updated:** 2025-11-20
**Status:** Ready for GitHub Public Release ✅