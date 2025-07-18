@echo off
chcp 65001 >nul
echo ========================================
echo     Production Kanban System Launcher
echo ========================================
echo.

REM Check Python environment
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not detected
    echo Please install Python: https://python.org/
    echo.
    echo Or use portable version...
    if exist "production-kanban-win7-complete\start-python-portable.bat" (
        echo Found portable version, starting...
        cd production-kanban-win7-complete
        call start-python-portable.bat
        exit /b 0
    )
    pause
    exit /b 1
)

REM Check application files
if not exist "server.py" (
    echo [ERROR] Application files incomplete
    echo Please ensure all files are copied to this directory
    pause
    exit /b 1
)

REM Create database directory
if not exist "database" (
    echo Creating database directory...
    mkdir database
)

REM Start application
echo Starting Production Kanban System...
echo.
echo System will open in default browser
echo To close system, close this command window
echo.
echo Database location: %cd%\database\production.db
echo Access URL: http://localhost:8000
echo.

REM Start Python server
echo Starting Python server...
start /b python server.py

REM Wait for server startup
timeout /t 3 /nobreak >nul

REM Remove this line to avoid duplicate browser opening
REM start http://localhost:8000

echo.
echo Server is running. Press any key to stop...
pause >nul

REM Stop server when user presses key
taskkill /f /im python.exe >nul 2>nul