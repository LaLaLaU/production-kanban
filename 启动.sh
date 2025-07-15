#!/bin/bash

# 生产看板系统 - Linux/Mac 启动脚本

echo "========================================"
echo "   生产看板系统 - 便携版启动器"
echo "========================================"
echo

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到Node.js环境"
    echo "请先安装Node.js: https://nodejs.org/"
    echo
    echo "Ubuntu/Debian: sudo apt install nodejs npm"
    echo "CentOS/RHEL: sudo yum install nodejs npm"
    echo "macOS: brew install node"
    exit 1
fi

# 检查应用文件
if [ ! -f "package.json" ]; then
    echo "[错误] 应用文件不完整"
    echo "请确保所有文件都已复制到此目录"
    exit 1
fi

# 创建数据库目录
if [ ! -d "database" ]; then
    echo "创建数据库目录..."
    mkdir -p database
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "首次运行，正在安装依赖..."
    echo "这可能需要几分钟时间，请耐心等待..."
    npm install --production
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        echo "请检查网络连接或联系技术支持"
        exit 1
    fi
fi

# 启动应用
echo "正在启动生产看板系统..."
echo
echo "数据库位置: $(pwd)/database/production.db"
echo "访问地址: http://localhost:3000"
echo

# 启动方式1: Electron应用（推荐）
if [ -d "electron" ]; then
    echo "使用Electron模式启动..."
    npm run electron
else
    # 启动方式2: Web服务器模式
    echo "使用Web服务器模式启动..."
    npm run serve &
    
    # 等待服务器启动
    sleep 3
    
    # 自动打开浏览器（如果是桌面环境）
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    fi
    
    # 等待用户输入后关闭
    echo "按Enter键关闭服务器..."
    read
    pkill -f "node.*serve"
fi