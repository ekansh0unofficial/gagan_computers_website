@echo off
title Dukaan - Dev Mode
color 0A

echo.
echo  ============================================
echo    DUKAAN - Dev Mode (auto-restart on save)
echo  ============================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js not found. Run start.bat first.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo  [....] Installing dependencies...
    npm install
)

echo  [OK] Starting with nodemon...
echo  Store: http://localhost:3000
echo  Admin: http://localhost:3000/#admin
echo.
echo  Press Ctrl+C to stop.
echo.

npx nodemon backend\server.js

pause
