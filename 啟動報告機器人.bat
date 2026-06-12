@echo off
cd /d "%~dp0"

set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
set "PYTHONW=%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe"

if not exist "%PYTHON%" (
  echo Python was not found.
  echo Please contact Codex for help.
  pause
  exit /b 1
)

"%PYTHON%" -c "import docx" >nul 2>&1
if errorlevel 1 (
  echo First-time setup is running. Please wait...
  "%PYTHON%" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo Setup failed. Please contact Codex for help.
    pause
    exit /b 1
  )
)

start "" "%PYTHONW%" "%~dp0app.py"
