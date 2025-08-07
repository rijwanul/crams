@echo off
echo Starting CRAMS Server...
echo.
echo Environment Check:
echo - Node Version: 
node --version
echo - NPM Version:
npm --version
echo.
echo Starting server on port 5000...
echo Server URL will be: http://localhost:5000
echo.
node server.js
pause
