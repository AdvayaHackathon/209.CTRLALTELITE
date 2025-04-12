@echo off
echo Starting AR Blender Viewer Server
echo ===============================================
echo This window will remain open while the server is running.
echo Server will be available at: https://localhost:8080
echo.
echo Press Ctrl+C to stop the server.
echo.

:: Run the server
node wifi-server.js

echo.
echo Server stopped.
pause 