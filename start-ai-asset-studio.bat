@echo off
setlocal

set "ROOT=%~dp0"

echo Starting AI Asset Studio...
echo.
echo Please keep the two server windows open while using the app.
echo You can close them when you are done.
echo.

start "AI Asset Studio - Backend" cmd /k "cd /d ""%ROOT%backend"" && npm.cmd run dev"
start "AI Asset Studio - Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm.cmd run dev"

timeout /t 5 /nobreak > nul
start http://127.0.0.1:5173

echo Browser opened.
echo This launcher window will close automatically.
timeout /t 2 /nobreak > nul
