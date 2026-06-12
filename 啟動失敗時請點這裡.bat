@echo off
cd /d "%~dp0"

set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"

if not exist "%PYTHON%" (
  echo Python was not found.
  pause
  exit /b 1
)

"%PYTHON%" app.py
echo.
echo The program has stopped. Please take a screenshot of this window.
pause
