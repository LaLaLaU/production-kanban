#!/bin/bash

echo "=== 生产看板应用启动器 ==="
echo ""

# 检查Python
if command -v python3 &> /dev/null; then
    echo "正在启动HTTP服务器..."
    echo "应用将在 http://localhost:8000 运行"
    echo "按 Ctrl+C 停止服务器"
    echo ""
    cd /home/tgy20/chanpingenzong/production-kanban/dist
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "正在启动HTTP服务器..."
    echo "应用将在 http://localhost:8000 运行"
    echo "按 Ctrl+C 停止服务器"
    echo ""
    cd /home/tgy20/chanpingenzong/production-kanban/dist
    python -m http.server 8000
else
    echo "未找到Python，请尝试以下方法："
    echo ""
    echo "1. 安装Python后重新运行此脚本"
    echo "2. 使用浏览器启动参数："
    echo "   chrome --disable-web-security --allow-file-access-from-files"
    echo "   然后打开: file://$(pwd)/index.html"
    echo ""
    echo "3. 复制到Web服务器目录"
fi