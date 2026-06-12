@echo off
cd /d "%~dp0"

set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"

if not exist "%PYTHON%" (
  echo Python was not found.
  pause
  exit /b 1
)

echo Installing the Word report tool. Please wait...
"%PYTHON%" -m pip install --user --disable-pip-version-check -r requirements.txt

if errorlevel 1 (
  echo.
  echo Installation failed. Please take a screenshot.
  pause
  exit /b 1
)

echo.
echo SUCCESS
echo You may close this window.
pause
