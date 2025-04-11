@echo off
title AR Blender Viewer WiFi Server
color 0A

echo ==========================================
echo       AR BLENDER VIEWER WIFI SERVER
echo ==========================================
echo.

:: Run the WiFi server
node wifi-server.js

:: If server stops
echo.
echo Server stopped.
pause
