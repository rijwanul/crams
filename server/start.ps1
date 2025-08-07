Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "CRAMS Server Startup Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking current directory..." -ForegroundColor Yellow
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor White
Write-Host ""

Write-Host "Checking if server.js exists..." -ForegroundColor Yellow
if (Test-Path "server.js") {
    Write-Host "✓ server.js found" -ForegroundColor Green
} else {
    Write-Host "✗ server.js not found in current directory" -ForegroundColor Red
    Write-Host "Make sure you're in the server folder" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting CRAMS Server..." -ForegroundColor Yellow
Write-Host "If you see any errors, press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected output:" -ForegroundColor Yellow
Write-Host "- ✓ Full user routes loaded and attached successfully" -ForegroundColor Gray
Write-Host "- ✓ Connected to MongoDB" -ForegroundColor Gray
Write-Host "- ✓ Server running on port 5000" -ForegroundColor Gray
Write-Host ""

# Start the server
node server.js

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
