# AR Blender Viewer Server PowerShell Script
Write-Host "==========================================`n" -ForegroundColor Green
Write-Host "      AR BLENDER VIEWER SERVER" -ForegroundColor Green
Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "`nGetting your network information..." -ForegroundColor Cyan

# Display network information
Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.IPAddress -ne "127.0.0.1"} | 
    Select-Object IPAddress, InterfaceAlias | Format-Table

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "`nINSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Make sure your device is connected to the same WiFi network" -ForegroundColor White
Write-Host "2. Open the browser on your device and navigate to:" -ForegroundColor White
Write-Host "   https://YOUR_IP_ADDRESS:5000" -ForegroundColor Cyan
Write-Host "   (Use one of the IPv4 Addresses shown above)" -ForegroundColor Cyan
Write-Host "3. Accept the security warning in your browser" -ForegroundColor White
Write-Host "4. Enjoy the AR experience!" -ForegroundColor White
Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "`nStarting server..." -ForegroundColor Cyan
Write-Host "(Press Ctrl+C to stop)`n" -ForegroundColor Yellow

# Run the server
node simple-server.js

Write-Host "`nServer stopped." -ForegroundColor Red
Read-Host -Prompt "Press Enter to exit" 