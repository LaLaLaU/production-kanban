===============================================
  Production Kanban System - Windows 7 完整版
===============================================

本部署包专为 Windows 7 环境设计，包含所有必要的运行时环境。

📁 目录结构
├── deployment_package/          # 应用程序文件
├── runtime/                     # 运行时环境
│   ├── nodejs/                  # Node.js 便携版 (需要手动放置)
│   └── python/                  # Python 便携版 (需要手动放置)
├── start-nodejs-portable.bat    # Node.js 启动脚本
├── start-python-portable.bat    # Python 启动脚本
└── README-Win7.txt             # 本说明文件

🚀 快速开始

步骤1：放置运行时文件
1. 将桌面上的 Node.js 文件解压到 runtime\nodejs\ 文件夹
   - 确保存在：runtime\nodejs\node.exe
   
2. 将桌面上的 Python 文件解压到 runtime\python\ 文件夹
   - 确保存在：runtime\python\python.exe

步骤2：启动应用
方式1（推荐）：双击 start-nodejs-portable.bat
方式2（备选）：双击 start-python-portable.bat
方式3（应急）：进入 deployment_package 文件夹，双击 start-simple.bat

📋 兼容性说明

✅ Node.js v16.20.2 - 最后支持 Windows 7 的版本
✅ Python 3.8.10 - 最后支持 Windows 7 的版本
✅ 支持 Windows 7 SP1 及以上系统
✅ 无需管理员权限
✅ 完全离线运行

🔧 故障排除

问题1："找不到 node.exe"
解决：检查 runtime\nodejs\node.exe 文件是否存在

问题2："找不到 python.exe"
解决：检查 runtime\python\python.exe 文件是否存在

问题3：浏览器显示"正在初始化数据库..."
解决：运行 deployment_package\diagnose-sqlite.html 进行诊断

问题4：端口被占用
解决：关闭其他占用8000/8001端口的程序

📞 技术支持

如遇问题，请检查：
1. 文件完整性
2. 系统兼容性
3. 防火墙设置
4. 杀毒软件拦截

版本：v2.3.0 Windows 7 专版
更新时间：2024年