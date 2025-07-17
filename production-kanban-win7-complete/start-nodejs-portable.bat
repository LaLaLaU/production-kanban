@echo off
echo.
echo ===============================================
echo    Production Kanban System - Node.js Portable
echo ===============================================
echo.
echo Starting with portable Node.js...
echo.

REM Check for Node.js in the extracted folder
if exist "runtime\nodejs\node-v16.20.2-win-x64\node-v16.20.2-win-x64\node.exe" (
    set "NODEJS_EXE=runtime\nodejs\node-v16.20.2-win-x64\node-v16.20.2-win-x64\node.exe"
    goto start_server
)

if exist "runtime\nodejs\node-v16.20.2-win-x64\node.exe" (
    set "NODEJS_EXE=runtime\nodejs\node-v16.20.2-win-x64\node.exe"
    goto start_server
)

if exist "runtime\nodejs\node.exe" (
    set "NODEJS_EXE=runtime\nodejs\node.exe"
    goto start_server
)

echo Node.js not found
echo Please extract Node.js to runtime\nodejs\ folder
echo.
dir /b "runtime\nodejs\" 2>nul
echo.
echo Expected locations:
echo - runtime\nodejs\node.exe
echo - runtime\nodejs\node-v16.20.2-win-x64\node.exe
echo - runtime\nodejs\node-v16.20.2-win-x64\node-v16.20.2-win-x64\node.exe
echo.
pause
exit /b 1

:start_server
echo Found portable Node.js: %NODEJS_EXE%
echo Getting Node.js version...
"%NODEJS_EXE%" --version
echo.
echo Starting HTTP server...
echo Server file: deployment_package\server.js
echo Trying ports: 8000, 8001, 8002...
echo.
cd deployment_package
"..\%NODEJS_EXE%" server.js
if errorlevel 1 (
    cd ..
    echo.
    echo Node.js server startup failed
    echo Trying Python backup...
    call start-python-portable.bat
) else (
    cd ..
    echo.
    echo Server started successfully
)
echo.
echo Press any key to close...
pause >nul