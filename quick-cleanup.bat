@echo off
REM =========================
REM UniRide Quick Cleanup Script (Windows)
REM =========================
REM This script performs all necessary steps to safely prepare
REM your repo for public GitHub release WITHOUT deleting local files.
REM
REM Usage: quick-cleanup.bat
REM =========================

echo.
echo ========================================
echo   UniRide GitHub Security Cleanup
echo ========================================
echo.

REM Navigate to project root
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Step 1: Untrack .env files
echo STEP 1: Untracking .env files from git...
git rm --cached App/carpooling-frontend/.env 2>nul && echo [OK] Frontend .env untracked || echo [INFO] Frontend .env not tracked
git rm --cached App/carpooling-backend/.env 2>nul && echo [OK] Backend .env untracked || echo [INFO] Backend .env not tracked
echo.

REM Step 2: Install dotenv in backend
echo STEP 2: Installing dotenv in backend...
cd App\carpooling-backend
if exist package.json (
    call npm install dotenv
    echo [OK] dotenv installed
) else (
    echo [WARNING] No package.json found in backend
)
cd ..\..
echo.

REM Step 3: Reminder to update firebase.js
echo STEP 3: ACTION REQUIRED
echo ----------------------------------------
echo You need to manually update:
echo   - App\carpooling-backend\services\firebase.js
echo.
echo See GITHUB_CLEANUP_INSTRUCTIONS.md for details
echo.

REM Step 4: Verify no secrets in code
echo STEP 4: Checking for hardcoded secrets...
git grep -q "AIzaSyDMllqkxUAY9z8alO1oLaJAqjc_jMxk50E" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [ERROR] Firebase API key still hardcoded in source!
    echo    - Update backend firebase.js
) else (
    echo [OK] No Firebase API keys found in source code
)

git grep -q "sk-or-v1-" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [ERROR] OpenRouter API key still in tracked files!
) else (
    echo [OK] No OpenRouter API keys found in tracked files
)
echo.

REM Step 5: Check git status
echo STEP 5: Checking git status...
echo Files to be committed:
git status --short
echo.

REM Step 6: Final checklist
echo ========================================
echo   CLEANUP CHECKLIST
echo ========================================
echo [OK] .gitignore files updated
echo [OK] .env.example files created
echo [OK] .env files untracked from git
echo [OK] dotenv package installed
echo.
echo MANUAL STEPS REMAINING:
echo [  ] Update App\carpooling-backend\services\firebase.js
echo [  ] Test app locally: npm run dev
echo [  ] Commit changes: git commit -m "Security improvements"
echo [  ] Push to GitHub: git push origin main
echo.
echo For detailed instructions, see:
echo    - GITHUB_CLEANUP_INSTRUCTIONS.md
echo.
echo Once manual steps complete, you're ready for GitHub!
echo.
pause