@echo off
setlocal enabledelayedexpansion
title Dukaan - Setup & Launcher

:: ============================================================
::  DUKAAN - Electronics Store
::  Windows CMD Setup Script
:: ============================================================

color 0B
echo.
echo  ============================================
echo    DUKAAN - Electronics ^& Gadgets Store
echo  ============================================
echo.

:: -- Check Node.js --
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo.
    echo  Download from: https://nodejs.org
    echo  Install the LTS version, then re-run this script.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js found: %NODE_VER%

:: -- Check npm --
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] npm not found. Reinstall Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo  [OK] npm found: v%NPM_VER%

echo.

:: -- Install dependencies --
if not exist "node_modules\" (
    echo  [....] Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        color 0C
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
) else (
    echo  [OK] node_modules already present. Skipping install.
)

echo.

:: -- Setup .env --
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [OK] Created .env from .env.example
        echo.
        echo  ============================================
        echo    IMPORTANT: Edit .env before continuing!
        echo  ============================================
        echo.
        echo  Open .env in Notepad and set:
        echo    WHATSAPP_NUMBER  e.g. 919876543210
        echo    UPI_ID           e.g. yourname@upi
        echo    UPI_NAME         e.g. Rahul Sharma
        echo    SHOP_NAME        e.g. Dukaan
        echo.
        echo  Opening .env in Notepad...
        start notepad ".env"
        echo.
        pause
    ) else (
        echo  [WARN] .env.example not found. Skipping .env setup.
    )
) else (
    echo  [OK] .env already exists.
)

echo.
echo  ============================================
echo    Starting Dukaan server...
echo  ============================================
echo.
echo  Store will be available at:
echo    http://localhost:3000
echo.
echo  Admin panel (shopkeeper only - password protected):
echo    Type "admin" anywhere on the store, or visit /#admin
echo.
echo  Press Ctrl+C to stop the server.
echo.

:: -- Start server --
node backend\server.js

echo.
echo  Server stopped.
pause
