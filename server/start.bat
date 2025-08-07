@echo off
echo ===============================================
echo CRAMS Server Startup Script
echo ===============================================
echo.

echo Checking current directory...
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Checking if server.js exists...
if exist server.js (
    echo ✓ server.js found
) else (
    echo ✗ server.js not found in current directory
    echo Make sure you're in the server folder
    pause
    exit /b 1
)

echo.
echo Checking environment variables...
if exist .env (
    echo ✓ .env file found
) else (
    echo ✗ .env file not found
    pause
    exit /b 1
)

echo.
echo Starting CRAMS Server...
echo If you see any errors, press Ctrl+C to stop
echo.
echo Expected output:
echo - ✓ Full user routes loaded and attached successfully
echo - ✓ Connected to MongoDB
echo - ✓ Server running on port 5000
echo.

node server.js

echo.
echo Server stopped. Press any key to exit.
pause
