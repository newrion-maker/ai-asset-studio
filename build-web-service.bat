@echo off
setlocal
set "ROOT=%~dp0"

echo Building AI Asset Studio web service...
echo.

cd /d "%ROOT%frontend"
call npm.cmd install
if errorlevel 1 exit /b 1
call npm.cmd run build
if errorlevel 1 exit /b 1

cd /d "%ROOT%backend"
call npm.cmd install
if errorlevel 1 exit /b 1
call npm.cmd run build
if errorlevel 1 exit /b 1

echo.
echo Build complete.
echo For local test, run:
echo   cd /d "%ROOT%backend"
echo   npm.cmd start
echo.
pause
