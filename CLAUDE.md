# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

生产看板系统 - 专为喷漆工段设计的任务分配和进度管理系统。支持U盘便携部署，完全离线运行。

**项目特点:**
- U盘便携部署（无需安装）
- 完全离线运行（无网络依赖）
- 中文界面，面向工厂师傅（非技术用户）
- SQLite WASM数据库 + localStorage备份
- React 19 + TypeScript + Ant Design技术栈

## 开发命令

```bash
# 开发环境
npm run dev              # 启动开发服务器（端口3000）
npm run build           # 生产环境构建（tsc + vite build）
npm run preview         # 预览生产构建

# 代码质量
npm run lint            # ESLint代码检查
npm run lint:fix        # 自动修复ESLint问题
npm run format          # Prettier代码格式化
npm run typecheck       # TypeScript类型检查

# 测试
npm run test            # 运行Vitest测试
npm run test:ui         # 运行测试UI界面
npm run test:run        # 单次运行测试（CI模式）
npm run coverage        # 生成测试覆盖率报告

# 维护
npm run clean           # 清理构建产物和缓存
```

## 架构与核心模式

### 双重存储策略
- **主存储**: SQLite WASM持久化数据存储
- **备用存储**: localStorage离线恢复和数据备份
- 两套存储系统间自动数据同步
- 位置: `src/services/` (sqliteService.ts, localStorage.ts, dataMigration.ts)

### 智能任务分配系统
- 基于历史数据的自动任务分配算法
- 产品图号+名称匹配，置信度评分
- 手动分配的回退机制
- 实现: `src/services/masterAssignment.ts`

### 看板界面架构
- 使用@dnd-kit的拖拽功能
- 实时任务状态管理
- 师傅工时甘特图可视化
- 组件: `KanbanBoard.tsx`, `MasterGanttView.tsx`, `TaskCard.tsx`

### 便携部署模式
- IIFE构建输出，支持file://协议
- 内嵌Python 3.8.10运行时提供服务
- vite.config.ts中特殊的sql.js WASM配置
- 完整部署包: `production-kanban-win7-complete/`

## 关键配置

### Vite配置 (vite.config.ts)
- sql.js WASM特殊处理，排除优化
- IIFE输出格式支持file://协议
- 自定义.wasm文件资源处理
- 基础路径设为'./'使用相对路径

### SQLite WASM设置
- sql.js必须从Vite优化中排除
- WASM文件位于`public/sql.js-wasm/`
- 自定义WASM文件MIME类型处理
- 实现: `src/services/portableSQLite.ts`

### TypeScript配置
- ES2017目标，确保广泛浏览器兼容性
- 模块化设置，分离app/node配置
- 启用严格类型检查

## 文件导入系统

系统支持灵活的Excel/CSV导入和列映射:
- 产品图号、名称、数量、交期
- 自动列检测和映射
- 支持自定义格式和混合数据
- 实现: `src/services/fileImport.ts`
- 测试数据: `tests/fixtures/` (各种Excel/CSV格式)

## 核心数据类型

```typescript
interface Task {
  id: number;
  productCode?: string;      // 产品图号  
  productName: string;       // 产品名称
  quantity: number;          // 数量
  currentQuantity: number;   // 当前数量
  masterName?: string;       // 师傅姓名
  status: 'todo' | 'in-progress' | 'completed';
  deadline?: string;         // 交期
  estimatedHours?: number;   // 预估工时
  // ... 其他属性
}
```

## 测试策略

- Vitest + jsdom环境
- React Testing Library组件测试
- 测试夹具使用真实生产数据
- Node.js脚本测试智能分配算法
- 测试设置: `src/test/setup.ts`

## 部署注意事项

### 开发环境
- 使用`npm run dev`本地开发
- 服务器运行在`0.0.0.0:3000`支持局域网访问
- 启用热重载

### 生产环境
- 构建生成兼容file://协议的IIFE包
- 包含Python服务器用于静态文件服务
- 完整部署包可直接U盘部署
- 启动脚本: `scripts/启动.bat` (Windows), `scripts/启动.sh` (Linux/Mac)

## 特殊要求

### 浏览器兼容性
- 目标ES2018, Chrome 58+, Firefox 57+, Safari 11+
- SQLite功能需要WASM支持
- 导入/导出需要File API支持

### 数据迁移
- 自动模式更新和数据迁移
- 备份和恢复功能
- 遗留数据格式支持
- 实现: `src/services/dataMigration.ts`

### 中文本地化
- 所有UI文本为中文
- Ant Design中文语言包(zh_CN)
- 中文用户的日期格式和数字格式
- 文件命名支持中文字符

## 维护注意事项

- 数据库操作必须包含localStorage备份
- 导入操作必须在处理前验证数据格式
- 任务分配变更需要重新计算置信度分数
- 重大变更后必须测试便携部署
- 保持现有数据文件的向后兼容性

## 数据库版本管理

### 版本历史
- **版本1**: 初始数据库结构
- **版本2**: 添加扩展字段支持（process_order_id, factory_code, order_date, delivery_time, quantity, assigned_person, assigned_team）

### 版本升级机制
- 自动检测本地存储中的数据库版本
- 版本不匹配时自动重建数据库结构
- 版本信息存储在localStorage中（sqlite_db_version）

## 任务状态规范

### 状态值标准
- `'pending'` - 待处理
- `'in-progress'` - 进行中  
- `'completed'` - 已完成

**重要**: 所有组件必须使用统一的状态值，特别是 `'in-progress'`（带连字符）

## 常见问题处理

### 导入不显示问题
1. **检查状态映射**: 确保导入和显示组件使用相同的状态值
2. **验证数据库版本**: 版本不匹配会导致字段缺失错误
3. **确认师傅分配**: 任务必须分配给预定义师傅列表中的师傅才能在甘特图显示

### 数据库重置
如需重置数据库，删除以下localStorage项目：
- `sqlite_db_data`
- `sqlite_db_version`
- `sqlite_last_save`