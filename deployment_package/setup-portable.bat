@echo off
chcp 65001 >nul
echo.
echo ===============================================
echo    Production Kanban System - Portable Setup
echo ===============================================
echo.
echo This script helps you set up a portable environment without Python or Node.js
echo.
echo Please follow these steps:
echo.
echo 1. Download portable Node.js:
echo    Visit: https://nodejs.org/en/download/
echo    Select: Windows Binary (.zip)
echo    Recommended: node-v18.19.0-win-x64.zip (LTS version)
echo    Size: About 28MB
echo.
echo 2. Extract to current directory:
echo    Extract the downloaded zip file to current folder
echo    Rename the extracted folder to: nodejs
echo    Ensure path: %cd%\nodejs\node.exe
echo.
echo 3. File structure check:
echo    nodejs/
echo    ├── node.exe          (Main program)
echo    ├── npm.cmd           (Package manager)
echo    └── node_modules/     (Core modules)
echo.
echo 4. Run the generated start-portable.bat after completion
echo.
echo ===============================================
echo.
echo Press any key to start checking existing environment...
pause >nul
echo.
echo Checking portable Node.js...
if exist "nodejs\node.exe" (
    echo ✓ Found portable Node.js
    for /f "tokens=*" %%i in ('"nodejs\node.exe" --version 2^>nul') do set NODE_VERSION=%%i
    echo   Version: %NODE_VERSION%
    echo Generating startup script...
    goto :create_portable_script
) else (
    echo ✗ Portable Node.js not found
    echo.
    echo Please follow the steps above:
    echo 1. Download Node.js Windows Binary (.zip)
    echo 2. Extract to current directory and rename to nodejs
    echo 3. Ensure nodejs\node.exe file exists
    echo.
    echo Current directory: %cd%
    echo Expected path: %cd%\nodejs\node.exe
    echo.
    pause
    exit /b 1
)

:create_portable_script
echo Creating start-portable.bat...
(
echo @echo off
echo chcp 65001 ^>nul
echo echo.
echo echo ===============================================
echo echo    Production Kanban System - Portable Launcher
echo echo ===============================================
echo echo.
echo echo Starting application with portable Node.js...
echo echo.
echo if not exist "nodejs\node.exe" ^
echo     echo ✗ Portable Node.js not found
echo     echo Please run setup-portable.bat to reset
echo     echo.
echo     pause
echo     exit /b 1
echo ^
echo.
echo echo ✓ Checking Node.js version...
echo for /f "tokens=*" %%%%i in ^('"nodejs\node.exe" --version 2^>nul'^ do set NODE_VERSION=%%%%i
echo echo   Node.js version: %%NODE_VERSION%%
echo echo.
echo echo ✓ Starting HTTP server...
echo echo   Server file: server.js
echo echo   Trying ports: 8000, 8001, 8002...
echo echo.
echo "nodejs\node.exe" server.js
echo.
echo if errorlevel 1 ^
echo     echo.
echo     echo ✗ Node.js server startup failed
echo     echo Trying backup startup method...
echo     echo.
echo     timeout /t 2 /nobreak ^>nul
echo     call start-simple.bat
echo ^ else ^
echo     echo.
echo     echo ✓ Server started
echo     echo Browser should open automatically
echo ^
echo.
echo echo.
echo echo Press any key to close...
echo pause ^>nul
) > start-portable.bat

echo ✓ start-portable.bat created successfully
echo.
echo 🎉 Setup complete!
echo.
echo Now you can start the application using:
echo.
echo 1. 🚀 Double-click start-portable.bat (portable Node.js)
echo 2. 🔧 Double-click start-simple.bat (backup method)
echo 3. 🌐 Double-click index.html directly (may have CORS issues)
echo.
echo If you encounter "Initializing database..." stuck:
echo 👉 Double-click diagnose-sqlite.html for diagnosis
echo.
echo Portable version advantages:
echo ✓ No need to install Python or Node.js
echo ✓ Solves CORS cross-origin issues
echo ✓ Suitable for intranet environment deployment
echo ✓ File size only about 30MB
echo.
pause
