@echo off
echo.
echo ===============================================
echo    Production Kanban System - Python Portable
echo ===============================================
echo.
echo Starting with portable Python...
echo.

if not exist "runtime\python\python.exe" (
    echo Portable Python not found
    echo Please extract Python to runtime\python\ folder
    echo Expected: runtime\python\python.exe
    echo.
    echo Current structure:
    dir /b "runtime\python\" 2>nul
    echo.
    pause
    exit /b 1
)

echo Found portable Python
echo Getting Python version...
"runtime\python\python.exe" --version
echo.
echo Starting HTTP server...
echo Port: 8000
echo Access: http://localhost:8000
echo.

echo Starting server... (Press Ctrl+C to stop)
echo Browser should open automatically
start http://localhost:8000
cd ..
".\production-kanban-win7-complete\runtime\python\python.exe" server.py
echo.
echo Server stopped.
echo Press any key to close...
pause >nul