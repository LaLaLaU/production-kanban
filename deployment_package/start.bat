@echo off
chcp 65001 >nul 2>&1
echo Production Kanban System Launcher v2.0
echo.
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.6+ first.
    echo Download from: https://www.python.org/downloads/
    echo.
    echo Alternative: Double-click index.html and use a modern browser
    pause
    exit /b 1
)

echo Starting local HTTP server...
echo This will automatically open your browser
echo Press Ctrl+C in this window to stop the server
echo.
python server.py
pause
