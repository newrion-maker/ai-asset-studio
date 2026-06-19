@echo off
setlocal

set "ROOT=%~dp0"

echo OpenAI API key setup
echo.
echo Paste your OpenAI API key below, then press Enter.
echo The key will be saved to backend\.env on this computer.
echo.

set /p OPENAI_KEY=OpenAI API key: 

if "%OPENAI_KEY%"=="" (
  echo.
  echo No key was entered. Nothing was changed.
  pause
  exit /b 1
)

(
  echo OPENAI_API_KEY=%OPENAI_KEY%
  echo PORT=3001
) > "%ROOT%backend\.env"

echo.
echo Saved.
echo Please close the Backend server window and start AI Asset Studio again.
pause
