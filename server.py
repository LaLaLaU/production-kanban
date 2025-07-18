#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生产看板系统 - Python HTTP 服务器

这是一个简单的HTTP服务器，用于在内网环境中部署生产看板系统。
使用Python 3.8.10嵌入式版本，无需安装额外环境。

特性：
- 支持静态文件服务
- 自动MIME类型检测
- 支持CORS跨域
- 兼容Win7+系统
- 轻量级，性能优异

作者：生产看板开发团队
版本：v2.0
日期：2025年7月18日
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time
from urllib.parse import unquote

# 配置
PORT = 8000
DIRECTORY = "dist"  # 构建后的目录

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP请求处理器"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        """添加CORS头部"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        """处理OPTIONS请求"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def check_directory():
    """检查目录是否存在"""
    if not os.path.exists(DIRECTORY):
        print(f"错误：目录 '{DIRECTORY}' 不存在")
        return False
    
    index_file = os.path.join(DIRECTORY, 'index.html')
    if not os.path.exists(index_file):
        print(f"警告：找不到 '{index_file}'")
        print("将直接服务当前目录的文件")
    
    return True

def find_available_port(start_port=8000, max_attempts=10):
    """查找可用端口"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socketserver.TCPServer(("", port), None) as test_server:
                return port
        except OSError:
            continue
    return None

def open_browser(url, delay=2):
    """延迟打开浏览器"""
    time.sleep(delay)
    try:
        webbrowser.open(url)
        print(f"浏览器已自动打开: {url}")
    except Exception as e:
        print(f"无法自动打开浏览器: {e}")
        print(f"请手动访问: {url}")

def main():
    """主函数"""
    print("="*50)
    print("    生产看板系统 - Python HTTP 服务器")
    print("="*50)
    print()
    
    # 检查Python版本
    python_version = sys.version.split()[0]
    print(f"Python版本: {python_version}")
    
    # 检查目录
    if not check_directory():
        input("按任意键退出...")
        return
    
    # 查找可用端口
    global PORT
    available_port = find_available_port(PORT)
    if available_port is None:
        print(f"错误：无法找到可用端口（尝试了 {PORT}-{PORT+9}）")
        input("按任意键退出...")
        return
    
    if available_port != PORT:
        print(f"端口 {PORT} 被占用，使用端口 {available_port}")
        PORT = available_port
    
    # 启动服务器
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            server_url = f"http://localhost:{PORT}"
            
            print(f"服务器启动成功!")
            print(f"本地访问: {server_url}")
            print(f"局域网访问: http://[内网IP]:{PORT}")
            print(f"服务目录: {os.path.abspath(DIRECTORY)}")
            print()
            print("按 Ctrl+C 停止服务器")
            print("="*50)
            print()
            
            # 在新线程中打开浏览器
            browser_thread = threading.Thread(
                target=open_browser, 
                args=(server_url,),
                daemon=True
            )
            browser_thread.start()
            
            # 启动服务器
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"服务器启动失败: {e}")
        input("按任意键退出...")

if __name__ == "__main__":
    main()