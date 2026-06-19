@echo off
setlocal
set "ROOT=%~dp0"

echo Starting AI Asset Studio as one web service...
echo.
echo Open this address:
echo http://127.0.0.1:3001
echo.

cd /d "%ROOT%backend"
start "AI Asset Studio Web Service" cmd /k "npm.cmd start"
timeout /t 3 /nobreak > nul
start http://127.0.0.1:3001
