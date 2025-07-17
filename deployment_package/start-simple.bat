@echo off
chcp 65001 >nul 2>&1
echo Production Kanban System - Simple Launcher
echo.
echo WARNING: This may cause CORS errors in some browsers
echo For best experience, use start.bat with Python server
echo.
echo Opening application in browser...
set "INDEX_PATH=%cd%\index.html"
if not exist "%INDEX_PATH%" (
    echo ERROR: index.html not found
    pause
    exit /b 1
)

echo Trying Chrome...
start "" "chrome.exe" "--allow-file-access-from-files" "file:///%INDEX_PATH%" 2>nul
if errorlevel 1 (
    echo Chrome not found, trying Edge...
    start "" "msedge.exe" "--allow-file-access-from-files" "file:///%INDEX_PATH%" 2>nul
    if errorlevel 1 (
        echo Using default browser...
        start "" "%INDEX_PATH%"
    )
)
echo Application started!
echo If you see a blank page, please use start.bat instead
pause
