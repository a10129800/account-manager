@echo off
cd /d "%~dp0"

taskkill /f /im electron.exe >nul 2>&1

if not exist "node_modules\.bin\electron.cmd" (
    echo [Info] Installing dependencies, please wait...
    call npm install
)

call npm start
pause
