@echo off
title Dukaan - Git Setup
color 0E

echo.
echo  ============================================
echo    DUKAAN - Git ^& GitHub Setup Helper
echo  ============================================
echo.

:: Check git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Git is not installed.
    echo  Download from: https://git-scm.com
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('git --version') do echo  [OK] %%v

echo.
echo  Enter your GitHub repository URL:
echo  (e.g. https://github.com/yourname/dukaan.git)
echo.
set /p REPO_URL="  URL: "

if "!REPO_URL!"=="" (
    echo  [ERROR] No URL entered. Exiting.
    pause
    exit /b 1
)

echo.
echo  [....] Initialising git repo...
git init
git add .
git commit -m "Initial commit — Dukaan electronics store"

echo.
echo  [....] Pushing to GitHub...
git branch -M main
git remote add origin !REPO_URL!
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo  [OK] Pushed to GitHub!
    echo.
    echo  ============================================
    echo    Next: Deploy on Render.com
    echo  ============================================
    echo.
    echo  1. Go to https://render.com
    echo  2. New Web Service ^> Connect your repo
    echo  3. render.yaml is auto-detected
    echo  4. Set env vars in Render dashboard:
    echo       WHATSAPP_NUMBER
    echo       UPI_ID
    echo       UPI_NAME
    echo  5. Deploy!
    echo.
) else (
    color 0C
    echo  [ERROR] Push failed. Check your GitHub URL and credentials.
)

pause
