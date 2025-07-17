@echo off
echo =================================
echo 🖥️ 生产看板桌面应用打包工具
echo =================================

echo 📦 步骤1: 安装Electron Builder...
call npm install --save-dev electron-builder

echo 🔨 步骤2: 构建Web应用...
call npm run build

if not exist dist (
    echo ❌ 构建失败！请检查错误信息
    pause
    exit /b 1
)

echo 📱 步骤3: 打包桌面应用...
call npx electron-builder --win --x64

echo 🎉 桌面应用打包完成！
echo 📁 应用位置: dist-electron\
echo 💡 可以直接在内网机器上运行，无需安装任何环境
echo.
pause
