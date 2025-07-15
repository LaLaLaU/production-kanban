@echo off
echo 正在启动生产看板应用...
echo.
echo 如果Chrome浏览器已安装，将自动打开应用
echo 如果没有自动打开，请手动复制以下路径到浏览器地址栏：
echo file:///home/tgy20/chanpingenzong/production-kanban/dist/index.html
echo.
echo 注意：某些浏览器可能需要特殊启动参数才能访问本地文件
echo.

REM 尝试用Chrome启动（禁用安全策略）
start "" "chrome.exe" --disable-web-security --disable-features=VizDisplayCompositor --allow-file-access-from-files "file:///home/tgy20/chanpingenzong/production-kanban/dist/index.html"

REM 如果Chrome不可用，尝试Edge
if %errorlevel% neq 0 (
    start "" "msedge.exe" --disable-web-security --allow-file-access-from-files "file:///home/tgy20/chanpingenzong/production-kanban/dist/index.html"
)

REM 如果都不可用，尝试默认浏览器
if %errorlevel% neq 0 (
    start "file:///home/tgy20/chanpingenzong/production-kanban/dist/index.html"
)

pause