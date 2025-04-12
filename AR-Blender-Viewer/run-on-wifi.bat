@echo off
title AR Blender Viewer WiFi Server
color 0A

echo ==========================================
echo       AR BLENDER VIEWER WIFI SERVER
echo ==========================================
echo.

:: Display network information
echo Getting your local IP address...
echo.
ipconfig | findstr IPv4
echo.
echo ==========================================
echo.
echo INSTRUCTIONS:
echo 1. Make sure your device is connected to the same WiFi network
echo 2. Open the browser on your device and navigate to:
echo    https://YOUR_IP_ADDRESS:5000
echo    (Use the IPv4 Address shown above)
echo 3. Accept the security warning in your browser
echo 4. Enjoy the AR experience!
echo.
echo ==========================================
echo.
echo Starting server...
echo (Press Ctrl+C to stop)
echo.

:: Run the server
node simple-server.js

:: If server stops
echo.
echo Server stopped.
pause 