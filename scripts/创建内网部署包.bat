@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ========================================
echo Production Kanban - Deployment Tool v2.0
echo ========================================
echo.

set "DEPLOY_DIR=deployment_package"
set "LOG_FILE=deployment.log"

echo [%date% %time%] Starting deployment > "%LOG_FILE%"
echo Starting deployment package creation...
echo.

echo Step 1: Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js check passed
echo.

echo Step 2: Checking project files...
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from project root directory
    pause
    exit /b 1
)
echo Project files check passed
echo.

echo Step 3: Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Dependencies installation failed
        echo Trying to continue with existing setup...
    )
) else (
    echo Dependencies already exist, skipping installation
)
echo Dependencies check completed
echo.

echo Step 4: Building static files...
npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo Build completed successfully
echo.

echo Step 5: Creating deployment package...
if exist "%DEPLOY_DIR%" (
    rmdir /s /q "%DEPLOY_DIR%"
)
mkdir "%DEPLOY_DIR%"
echo Deployment directory created
echo.

echo Copying static files...
xcopy "dist\*" "%DEPLOY_DIR%\" /e /i /h /y
if errorlevel 1 (
    echo ERROR: File copy failed
    pause
    exit /b 1
)
echo Files copied successfully
echo.

echo Creating launcher script...
echo @echo off > "%DEPLOY_DIR%\start.bat"
echo chcp 65001 ^>nul 2^>^&1 >> "%DEPLOY_DIR%\start.bat"
echo echo Production Kanban System Launcher >> "%DEPLOY_DIR%\start.bat"
echo echo. >> "%DEPLOY_DIR%\start.bat"
echo echo Starting application... >> "%DEPLOY_DIR%\start.bat"
echo set "INDEX_PATH=%%cd%%\index.html" >> "%DEPLOY_DIR%\start.bat"
echo if not exist "%%INDEX_PATH%%" ^( >> "%DEPLOY_DIR%\start.bat"
echo     echo ERROR: index.html not found >> "%DEPLOY_DIR%\start.bat"
echo     pause >> "%DEPLOY_DIR%\start.bat"
echo     exit /b 1 >> "%DEPLOY_DIR%\start.bat"
echo ^) >> "%DEPLOY_DIR%\start.bat"
echo start "" "chrome.exe" "file:///%%INDEX_PATH%%" 2^>nul >> "%DEPLOY_DIR%\start.bat"
echo if errorlevel 1 ^( >> "%DEPLOY_DIR%\start.bat"
echo     start "" "msedge.exe" "file:///%%INDEX_PATH%%" 2^>nul >> "%DEPLOY_DIR%\start.bat"
echo     if errorlevel 1 ^( >> "%DEPLOY_DIR%\start.bat"
echo         start "" "%%INDEX_PATH%%" >> "%DEPLOY_DIR%\start.bat"
echo     ^) >> "%DEPLOY_DIR%\start.bat"
echo ^) >> "%DEPLOY_DIR%\start.bat"
echo echo Application started successfully! >> "%DEPLOY_DIR%\start.bat"
echo pause >> "%DEPLOY_DIR%\start.bat"
echo Launcher script created
echo.

echo Creating user manual...
echo Production Kanban System - User Manual v3.0 (Python Edition) > "%DEPLOY_DIR%\README.txt"
echo. >> "%DEPLOY_DIR%\README.txt"
echo Quick Start: >> "%DEPLOY_DIR%\README.txt"
echo 1. Double-click start.bat (Python HTTP Server) >> "%DEPLOY_DIR%\README.txt"
echo 2. Or double-click index.html (Static Files) >> "%DEPLOY_DIR%\README.txt"
echo. >> "%DEPLOY_DIR%\README.txt"
echo Recommended Deployment: >> "%DEPLOY_DIR%\README.txt"
echo Use Python 3.8.10 embedded version for best performance >> "%DEPLOY_DIR%\README.txt"
echo Download complete package: production-kanban-win7-complete >> "%DEPLOY_DIR%\README.txt"
echo. >> "%DEPLOY_DIR%\README.txt"
echo System Requirements: >> "%DEPLOY_DIR%\README.txt"
echo - Windows 7 SP1 or higher >> "%DEPLOY_DIR%\README.txt"
echo - Chrome 49+ or Firefox 45+ (recommended) >> "%DEPLOY_DIR%\README.txt"
echo - Python 3.8.10+ (for HTTP server mode) >> "%DEPLOY_DIR%\README.txt"
echo - IE browser not supported >> "%DEPLOY_DIR%\README.txt"
echo. >> "%DEPLOY_DIR%\README.txt"
echo Features: >> "%DEPLOY_DIR%\README.txt"
echo - Task kanban management >> "%DEPLOY_DIR%\README.txt"
echo - Excel import/export >> "%DEPLOY_DIR%\README.txt"
echo - SQLite database with WebAssembly >> "%DEPLOY_DIR%\README.txt"
echo - Master assignment algorithm >> "%DEPLOY_DIR%\README.txt"
echo - Gantt chart visualization >> "%DEPLOY_DIR%\README.txt"
echo. >> "%DEPLOY_DIR%\README.txt"
echo Important Notes: >> "%DEPLOY_DIR%\README.txt"
echo 1. Python server mode provides better performance >> "%DEPLOY_DIR%\README.txt"
echo 2. Static file mode for simple deployment >> "%DEPLOY_DIR%\README.txt"
echo 3. Regular backup recommended >> "%DEPLOY_DIR%\README.txt"
echo 4. Portable - can copy to any location >> "%DEPLOY_DIR%\README.txt"
echo. >> "%DEPLOY_DIR%\README.txt"
echo Version: v3.0.0 Python Edition >> "%DEPLOY_DIR%\README.txt"
echo Created: %date% %time% >> "%DEPLOY_DIR%\README.txt"
echo User manual created
echo.

echo Creating deployment report...
echo Production Kanban System - Deployment Report v2.0 > "%DEPLOY_DIR%\REPORT.txt"
echo. >> "%DEPLOY_DIR%\REPORT.txt"
echo Created: %date% %time% >> "%DEPLOY_DIR%\REPORT.txt"
echo Version: v2.0.0 >> "%DEPLOY_DIR%\REPORT.txt"
echo Package: %DEPLOY_DIR% >> "%DEPLOY_DIR%\REPORT.txt"
echo. >> "%DEPLOY_DIR%\REPORT.txt"
echo System Requirements: >> "%DEPLOY_DIR%\REPORT.txt"
echo - Windows 7 SP1+ >> "%DEPLOY_DIR%\REPORT.txt"
echo - Modern browser (Chrome/Edge recommended) >> "%DEPLOY_DIR%\REPORT.txt"
echo. >> "%DEPLOY_DIR%\REPORT.txt"
echo Features: >> "%DEPLOY_DIR%\REPORT.txt"
echo - Offline operation >> "%DEPLOY_DIR%\REPORT.txt"
echo - Local data storage >> "%DEPLOY_DIR%\REPORT.txt"
echo - Browser compatibility detection >> "%DEPLOY_DIR%\REPORT.txt"
echo - Responsive design >> "%DEPLOY_DIR%\REPORT.txt"
echo. >> "%DEPLOY_DIR%\REPORT.txt"
echo Included Files: >> "%DEPLOY_DIR%\REPORT.txt"
dir "%DEPLOY_DIR%" /b >> "%DEPLOY_DIR%\REPORT.txt"
echo Deployment report created
echo.

echo ========================================
echo Deployment Package Created Successfully!
echo ========================================
echo.
echo Package Location: %cd%\%DEPLOY_DIR%
echo.
echo Usage Instructions:
echo 1. Copy "%DEPLOY_DIR%" folder to target machine
echo 2. Double-click "start.bat" or "index.html"
echo 3. Read "README.txt" for detailed information
echo.
echo Package Contents:
dir "%DEPLOY_DIR%" /b
echo.
echo Deployment completed successfully!
echo.
echo Press any key to exit...
pause >nul
