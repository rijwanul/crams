@echo off
echo ===============================================
echo CRAMS Server Diagnostic and Restart Script
echo ===============================================
echo.

echo 1. Stopping any existing Node processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo.
echo 2. Checking environment files...
if exist .env (
    echo ✓ .env file found
) else (
    echo ✗ .env file not found!
)

echo.
echo 3. Checking dependencies...
if exist node_modules (
    echo ✓ node_modules folder exists
) else (
    echo ✗ node_modules not found, installing...
    npm install
)

echo.
echo 4. Testing route loading...
node test-routes.js

echo.
echo 5. Starting server with enhanced logging...
echo Server should start on http://localhost:5000
echo.
echo Watch for these messages:
echo - ✓ User routes loaded
echo - Available user routes: POST /api/users/register-student
echo - ✓ Connected to MongoDB
echo - ✓ Server running on port 5000
echo.
echo If you see any ✗ errors, press Ctrl+C and check the error messages.
echo.
echo Starting server now...
echo.

node server.js

pause
