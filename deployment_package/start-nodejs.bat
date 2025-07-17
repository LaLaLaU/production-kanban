@echo off
chcp 65001 >nul 2>&1
echo Production Kanban System - Node.js Launcher v2.1
echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js not found, trying Python...
    python --version >nul 2>&1
    if errorlevel 1 (
        echo Neither Node.js nor Python found.
        echo Using simple browser launcher (may have CORS issues)...
        echo.
        call start-simple.bat
        exit /b
    ) else (
        echo Using Python server...
        python server.py
        pause
        exit /b
    )
)

echo Starting Node.js HTTP server...
echo This will automatically open your browser
echo Press Ctrl+C to stop the server
echo.
node server.js
pause
