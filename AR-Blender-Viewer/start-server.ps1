# AR Blender Viewer Server PowerShell Script
Write-Host "=========================================="
Write-Host "      AR BLENDER VIEWER SERVER" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "Getting your network information..." -ForegroundColor Cyan

# Get network information and filter for IPv4 addresses
Get-NetIPAddress | Where-Object { $_.AddressFamily -eq "IPv4" -and $_.InterfaceAlias -match "Wi-Fi|Ethernet|Local Area Connection" } | 
Format-Table -Property IPAddress

Write-Host "=========================================="
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Make sure your device is connected to the same WiFi network" -ForegroundColor White
Write-Host "2. Open the browser on your device and navigate to:" -ForegroundColor White
Write-Host "   https://YOUR_IP_ADDRESS:5001" -ForegroundColor Cyan
Write-Host "   (Use one of the IPv4 Addresses shown above)" -ForegroundColor Cyan
Write-Host "3. Accept the security warning in your browser" -ForegroundColor White
Write-Host "4. Enjoy the AR experience!" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "`nNode.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "`nError: Node.js is not installed or not in the PATH. Please install Node.js to continue." -ForegroundColor Red
    Write-Host "You can download Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host -Prompt "Press Enter to exit"
    exit
}

# Check if server.js or simple-server.js exists
$serverFile = "simple-server.js"
if (-not (Test-Path $serverFile)) {
    $serverFile = "server.js"
    if (-not (Test-Path $serverFile)) {
        Write-Host "`nError: Cannot find server JavaScript file." -ForegroundColor Red
        Read-Host -Prompt "Press Enter to exit"
        exit
    }
}

Write-Host "`nStarting server with $serverFile..." -ForegroundColor Cyan
Write-Host "(Press Ctrl+C to stop)`n" -ForegroundColor Yellow

# Run the server
try {
    node $serverFile
} catch {
    Write-Host "`nError starting server: $_" -ForegroundColor Red
}

Write-Host "`nServer stopped." -ForegroundColor Red
Read-Host -Prompt "Press Enter to exit" 