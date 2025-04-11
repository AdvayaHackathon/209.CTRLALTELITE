@echo off
title AR Blender Viewer Server
color 0A

echo ==========================================
echo       AR BLENDER VIEWER LAUNCHER
echo ==========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Display IP information for connecting devices
echo NETWORK INFORMATION:
echo -------------------
echo Your AR Blender Viewer will be available at:
echo.
ipconfig | findstr "IPv4 Address" | findstr /V "192.168.56.1 172.31.64.1"
echo.
echo PORT: 5000
echo.
echo FULL URL: https://YOUR_IP_ADDRESS:5000
echo.
echo IMPORTANT: Accept the security warning in your browser.
echo            This is normal for self-signed certificates.
echo.
echo Starting server...
echo.

:: Start the server
cd /d "%~dp0"
node simple-server.js

:: If server stops
echo.
echo Server stopped. Press any key to exit.
pause > nul
