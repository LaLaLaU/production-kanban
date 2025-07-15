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

## 🏗️ 实用的项目结构

```
production-kanban/
├── 📁 .vscode/                    # VS Code配置（开发用）
│   ├── settings.json              # 编辑器设置
│   └── extensions.json            # 推荐扩展
├── 📁 docs/                       # 文档（简化）
│   ├── 技术文档.md                # 技术说明
│   ├── 用户手册.md                # 使用说明
│   └── 更新日志.md                # 版本记录
├── 📁 electron/                   # Electron桌面应用
│   ├── main.js                    # 主进程
│   └── preload.js                 # 预加载脚本
├── 📁 public/                     # 静态资源
│   ├── vite.svg                   # 图标
│   └── sql.js-wasm/              # SQLite WASM文件
├── 📁 scripts/                    # 启动和部署脚本
│   ├── 启动.bat                   # Windows启动
│   ├── 启动.sh                    # Linux/Mac启动
│   ├── 启动应用.bat               # Windows应用启动
│   ├── 启动应用.sh                # Linux/Mac应用启动
│   └── 部署说明.sh                # 部署脚本
├── 📁 src/                        # 源代码
│   ├── 📁 components/             # React组件
│   │   ├── KanbanBoard.tsx        # 看板主界面
│   │   ├── MasterGanttView.tsx    # 师傅甘特图
│   │   ├── ImportModal.tsx        # 导入模态框
│   │   ├── TaskCard.tsx           # 任务卡片
│   │   ├── TaskEditModal.tsx      # 任务编辑
│   │   ├── DatabaseManagement.tsx # 数据库管理
│   │   └── StatsPanel.tsx         # 统计面板
│   ├── 📁 services/               # 业务服务
│   │   ├── sqliteService.ts       # SQLite服务
│   │   ├── localStorage.ts        # 本地存储
│   │   ├── masterAssignment.ts    # 智能分配
│   │   ├── fileImport.ts          # 文件导入
│   │   ├── dataMigration.ts       # 数据迁移
│   │   └── portableSQLite.ts      # 便携SQLite
│   ├── 📁 types/                  # 类型定义
│   │   ├── index.ts               # 主要类型
│   │   └── import.ts              # 导入类型
│   ├── 📁 test/                   # 测试文件
│   │   ├── setup.ts               # 测试配置
│   │   └── TaskCard.test.tsx      # 组件测试
│   ├── App.tsx                    # 主应用
│   ├── main.tsx                   # 入口文件
│   └── vite-env.d.ts             # Vite类型
├── 📁 tests/                      # 测试数据和工具
│   ├── fixtures/                  # 测试数据
│   │   ├── 智能分配测试.xlsx      # 测试Excel
│   │   └── 生产任务清单.xlsx      # 示例数据
│   └── test_smart_assignment.cjs  # 智能分配测试
├── 📄 .gitignore                 # Git忽略文件
├── 📄 .prettierrc                # 代码格式化
├── 📄 env.example                # 环境变量模板
├── 📄 eslint.config.js           # 代码规范
├── 📄 index.html                 # HTML入口
├── 📄 package.json               # 依赖管理
├── 📄 README.md                  # 项目说明
├── 📄 server.cjs                 # 简单服务器
├── 📄 tsconfig.json              # TypeScript配置
├── 📄 vite.config.ts             # Vite配置
├── 📄 vitest.config.ts           # 测试配置
└── 📄 说明文档.txt               # 详细说明
```

## 🔧 当前结构问题分析

### 问题1：根目录文件过多
- 启动脚本散乱在根目录
- 测试文件和Excel样例混杂
- 缺乏清晰的功能分组

### 问题2：缺少基础配置
- 没有代码格式化配置
- 缺少环境变量管理
- VS Code开发体验不佳

### 问题3：文档组织不当
- README内容过于简单
- 技术文档和用户文档混在一起
- 缺少清晰的使用指南

## 🎯 实用改进建议

### 1. 整理目录结构（保持简单）
```bash
# 创建必要目录
mkdir -p scripts
mkdir -p tests/fixtures
mkdir -p docs

# 移动文件到合适位置
mv 启动*.{sh,bat} scripts/
mv 启动应用*.{sh,bat} scripts/
mv 部署说明.sh scripts/
mv test_smart_assignment.cjs tests/
mv 智能分配测试*.xlsx tests/fixtures/
mv 生产任务清单*.xlsx tests/fixtures/
```

### 2. 添加必要配置文件
- ✅ `.prettierrc` - 代码格式化（已添加）
- ✅ `env.example` - 环境变量模板（已添加）
- ✅ `.vscode/` - VS Code配置（已添加）
- ❌ ~~Docker相关~~ - 不需要
- ❌ ~~CI/CD~~ - 不需要

### 3. 简化文档体系
- 📝 `docs/技术文档.md` - 开发者文档
- 📝 `docs/用户手册.md` - 使用说明
- 📝 `docs/更新日志.md` - 版本记录
- 📝 `README.md` - 项目简介

### 4. 保持构建流程简单
- 保持现有的Vite构建
- 保持现有的启动脚本
- 不增加复杂的自动化

## 📋 简化实施计划

1. **阶段1**: 目录整理（移动文件）
2. **阶段2**: 添加开发配置（VS Code、Prettier）
3. **阶段3**: 完善文档（技术文档、用户手册）
4. **阶段4**: 优化README和说明

## 🔍 验证标准（实用导向）

- [ ] 目录结构清晰，便于维护
- [ ] 开发体验良好，代码格式一致
- [ ] 文档清晰，技术小白能看懂
- [ ] 部署简单，U盘即插即用
- [ ] 功能完整，满足生产需求
