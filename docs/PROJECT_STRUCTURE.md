# 项目结构规范 - 面向便携式部署

## 🎯 项目定位分析

**项目特点**:
- 🎯 **目标用户**: 喷漆工段师傅（技术小白）
- 📦 **部署方式**: U盘便携部署，即插即用
- 🔌 **运行环境**: 完全离线，无需网络
- 🖥️ **使用场景**: 工厂现场，简单易用

**设计原则**:
- ✅ **简单优先** - 不为了规范而规范
- ✅ **实用导向** - 只保留必要的结构
- ✅ **便携友好** - 适合U盘部署
- ✅ **维护简单** - 减少复杂度

## 🏗️ 清理后的项目结构

```
production-kanban/
├── 📁 docs/                       # 文档（已整合）
│   ├── 部署指南.md                # 统一部署指南
│   ├── 技术文档.md                # 技术说明
│   ├── 用户手册.md                # 使用说明
│   ├── 更新日志.md                # 版本记录
│   ├── 开发计划.md                # 开发规划
│   └── PROJECT_STRUCTURE.md       # 项目结构说明
├── 📁 electron/                   # Electron桌面应用
│   ├── main.js                    # 主进程
│   └── preload.js                 # 预加载脚本
├── 📁 production-kanban-win7-complete/ # 完整部署包
│   ├── deployment_package/        # 应用文件
│   ├── runtime/python/           # Python 3.8.10嵌入式
│   ├── start-python-portable.bat # 启动脚本
│   └── README-Win7.txt           # 使用说明
├── 📁 public/                     # 静态资源
│   ├── browser-check.js          # 浏览器检测
│   ├── diagnose.html             # 诊断页面
│   ├── icon.png                  # 应用图标
│   ├── sql.js-wasm/              # SQLite WASM文件
│   └── vite.svg                  # Vite图标
├── 📁 scripts/                    # 启动和部署脚本
│   ├── 创建内网部署包.bat         # 部署包创建
│   ├── 启动.bat                   # Windows启动
│   ├── 启动.sh                    # Linux/Mac启动
│   ├── 打包桌面应用.bat           # Electron打包
│   └── 部署说明.sh                # 部署脚本
├── 📁 src/                        # 源代码
│   ├── 📁 components/             # React组件
│   │   ├── KanbanBoard.tsx        # 看板主界面
│   │   ├── MasterGanttView.tsx    # 师傅甘特图
│   │   ├── ImportModal.tsx        # 导入模态框
│   │   ├── TaskCard.tsx           # 任务卡片
│   │   ├── TaskEditModal.tsx      # 任务编辑
│   │   ├── DatabaseManagement.tsx # 数据库管理
│   │   ├── StatsPanel.tsx         # 统计面板
│   │   ├── DataSyncPanel.tsx      # 数据同步
│   │   ├── DraggableTaskCard.tsx  # 可拖拽任务卡
│   │   ├── DroppableColumn.tsx    # 可放置列
│   │   ├── GanttWaterLevel.tsx    # 甘特图水位
│   │   ├── UnifiedDataManagement.tsx # 统一数据管理
│   │   └── WaterLevelIndicator.tsx # 水位指示器
│   ├── 📁 services/               # 业务服务
│   │   ├── sqliteService.ts       # SQLite服务
│   │   ├── localStorage.ts        # 本地存储
│   │   ├── masterAssignment.ts    # 智能分配
│   │   ├── fileImport.ts          # 文件导入
│   │   ├── dataMigration.ts       # 数据迁移
│   │   ├── portableSQLite.ts      # 便携SQLite
│   │   └── databaseAdapter.ts     # 数据库适配器
│   ├── 📁 types/                  # 类型定义
│   │   ├── index.ts               # 主要类型
│   │   └── import.ts              # 导入类型
│   ├── 📁 test/                   # 单元测试
│   │   ├── setup.ts               # 测试配置
│   │   └── TaskCard.test.tsx      # 组件测试
│   ├── 📁 utils/                  # 工具函数
│   │   ├── dataSyncHelper.ts      # 数据同步助手
│   │   └── debugHelper.ts         # 调试助手
│   ├── App.tsx                    # 主应用
│   ├── main.tsx                   # 入口文件
│   └── vite-env.d.ts             # Vite类型
├── 📁 tests/                      # 测试数据和工具（已整合）
│   ├── fixtures/                  # 测试数据
│   │   ├── 智能分配测试_2025-07-13.xlsx
│   │   ├── 智能分配测试_2025-07-13 - 副本.xlsx
│   │   ├── 生产任务清单_2025-07-13.xlsx
│   │   ├── 导入测试_时间可视化.xlsx
│   │   ├── 导入测试_标准格式.xlsx
│   │   └── 导入测试_自定义格式.xlsx
│   ├── test_smart_assignment.cjs  # 智能分配测试
│   └── test-data-README.md        # 测试数据说明
├── 📄 .gitignore                 # Git忽略文件
├── 📄 .prettierrc                # 代码格式化
├── 📄 !MANUAL_FILE!              # 手动文件标记
├── 📄 env.example                # 环境变量模板
├── 📄 eslint.config.js           # 代码规范
├── 📄 index.html                 # HTML入口
├── 📄 package.json               # 依赖管理
├── 📄 README.md                  # 项目说明
├── 📄 server.py                  # Python服务器
├── 📄 tsconfig.json              # TypeScript配置
├── 📄 tsconfig.app.json          # 应用TypeScript配置
├── 📄 tsconfig.node.json         # Node.js TypeScript配置
├── 📄 vite.config.ts             # Vite配置
└── 📄 vitest.config.ts           # 测试配置
```

## ✅ 已完成的结构优化

### 优化1：重复内容清理
- ✅ **删除重复部署包**：移除根目录的 `deployment_package`，保留完整的 `production-kanban-win7-complete`
- ✅ **整合测试文件**：将 `test-excel` 目录内容合并到 `tests/fixtures`
- ✅ **统一部署文档**：合并3个重复的部署指南为统一的 `部署指南.md`
- ✅ **清理过时文档**：删除开发过程中的临时文档和分析文档

### 优化2：文档结构整理
- ✅ **主README**：将 `docs/README.md` 移动到根目录作为项目主说明
- ✅ **统一部署指南**：整合内网部署、Python服务器、静态文件3个指南
- ✅ **保留核心文档**：技术文档、用户手册、更新日志、开发计划

### 优化3：启动脚本清理
- ✅ **删除过时脚本**：移除引用错误路径的启动应用脚本
- ✅ **保留核心脚本**：保留开发环境和部署相关的必要脚本

### 优化4：测试文件整合
- ✅ **统一测试数据**：所有Excel测试文件集中到 `tests/fixtures`
- ✅ **添加说明文档**：保留测试数据的README说明
- ✅ **删除临时文件**：清理根目录的测试页面和说明文件

## 🎯 优化效果

### 文件数量减少
- **删除重复文件**：约20个重复或过时文件
- **整合相似内容**：3个部署指南合并为1个
- **清理临时文件**：移除开发过程中的临时文档

### 结构更清晰
- **功能分组明确**：文档、脚本、测试数据各归其位
- **避免重复维护**：统一的部署指南减少维护成本
- **便于查找**：相关文件集中存放

### 维护成本降低
- **减少文档冗余**：避免多处更新同样内容
- **统一入口**：根目录README作为项目主入口
- **清晰的文件职责**：每个文件都有明确用途

## 🔍 验证标准（实用导向）

- [ ] 目录结构清晰，便于维护
- [ ] 开发体验良好，代码格式一致
- [ ] 文档清晰，技术小白能看懂
- [ ] 部署简单，U盘即插即用
- [ ] 功能完整，满足生产需求
