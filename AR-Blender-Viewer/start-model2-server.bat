@echo off
echo Starting AR Blender Viewer - Model2 Version on port 8081
echo.
echo This will run an HTTPS server on port 8081
echo Press Ctrl+C to stop the server
echo.

cd %~dp0
node server-model2.js

pause 