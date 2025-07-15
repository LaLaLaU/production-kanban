@echo off
chcp 65001 >nul
echo ========================================
echo     生产看板系统 - 便携版启动器
echo ========================================
echo.

:: 检查Node.js环境
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js环境
    echo 请先安装Node.js: https://nodejs.org/
    echo.
    echo 或者使用预编译版本...
    if exist "生产看板.exe" (
        echo 找到预编译版本，正在启动...
        start "" "生产看板.exe"
        exit /b 0
    )
    pause
    exit /b 1
)

:: 检查应用文件
if not exist "package.json" (
    echo [错误] 应用文件不完整
    echo 请确保所有文件都已复制到此目录
    pause
    exit /b 1
)

:: 创建数据库目录
if not exist "database" (
    echo 创建数据库目录...
    mkdir database
)

:: 检查依赖
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    npm install --production
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        echo 请检查网络连接或联系技术支持
        pause
        exit /b 1
    )
)

:: 启动应用
echo 正在启动生产看板系统...
echo.
echo 系统将在默认浏览器中打开
echo 如需关闭系统，请关闭此命令窗口
echo.
echo 数据库位置: %cd%\database\production.db
echo 访问地址: http://localhost:3000
echo.

:: 启动方式1: Electron应用（推荐）
if exist "electron" (
    echo 使用Electron模式启动...
    npm run electron
) else (
    :: 启动方式2: Web服务器模式
    echo 使用Web服务器模式启动...
    npm run serve
    
    :: 等待服务器启动
    timeout /t 3 /nobreak >nul
    
    :: 自动打开浏览器
    start http://localhost:3000
)

pause