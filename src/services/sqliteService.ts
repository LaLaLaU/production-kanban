import type { Database } from 'sql.js'
import type { Task } from '../types'

// 兼容的sql.js导入函数
async function loadSqlJs(): Promise<any> {
  try {
    // 优先使用本地的sql.js文件
    if (typeof window !== 'undefined') {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = './sql.js-wasm/sql-wasm.js'
        script.onload = () => {
          if ((window as any).initSqlJs) {
            resolve((window as any).initSqlJs)
          } else {
            reject(new Error('sql.js加载失败'))
          }
        }
        script.onerror = () => {
          // 如果本地加载失败，尝试npm包
          import('sql.js').then(sqlModule => {
            resolve(sqlModule.default || sqlModule)
          }).catch(reject)
        }
        document.head.appendChild(script)
      })
    }

    // 服务器端或其他环境，尝试ES模块导入
    const sqlModule = await import('sql.js')
    return sqlModule.default || sqlModule
  } catch (error) {
    console.error('所有sql.js导入方式都失败:', error)
    throw error
  }
}

interface SQLiteConfig {
  dbName: string
  version: number
  wasmPath?: string
}

interface QueryResult<T = any> {
  success: boolean
  data?: T
  error?: string
  rowsAffected?: number
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

class SQLiteService {
  private db: Database | null = null
  private SQL: any = null
  private config: SQLiteConfig
  private isInitialized = false

  constructor(config: Partial<SQLiteConfig> = {}) {
    this.config = {
      dbName: 'production_kanban.db',
      version: 2,
      wasmPath: './sql.js-wasm/',
      ...config
    }
  }

  // 初始化数据库
  async init(): Promise<QueryResult<boolean>> {
    try {
      if (this.isInitialized) {
        console.log('✅ SQLite已经初始化，跳过')
        return { success: true, data: true }
      }

      console.log('🔧 开始初始化SQLite...')
      console.log('📂 WASM路径:', this.config.wasmPath)

      // 初始化 SQL.js
      console.log('📦 加载SQL.js...')
      const initSqlJs = await loadSqlJs()
      this.SQL = await initSqlJs({
        locateFile: (file: string) => {
          // 优先使用本地WASM文件，降级到CDN
          const localPath = `${this.config.wasmPath}${file}`
          console.log(`🔍 定位文件: ${file} -> ${localPath}`)

          // 简单返回本地路径，如果失败会自动降级到CDN
          return localPath
        }
      })
      console.log('✅ SQL.js加载完成')

      // 尝试从本地存储恢复数据库
      console.log('🔄 检查本地存储中的数据库...')
      const savedDb = localStorage.getItem('sqlite_db_data')
      const savedVersion = localStorage.getItem('sqlite_db_version')
      
      if (savedDb && savedVersion && parseInt(savedVersion) === this.config.version) {
        try {
          console.log('📥 从本地存储恢复数据库...')
          const uint8Array = new Uint8Array(
            atob(savedDb).split('').map(char => char.charCodeAt(0))
          )
          this.db = new this.SQL.Database(uint8Array)
          console.log('✅ SQLite数据库已从本地存储恢复')
        } catch (error) {
          console.warn('⚠️ 恢复数据库失败，创建新数据库:', error)
          this.db = new this.SQL.Database()
        }
      } else {
        if (savedDb && savedVersion) {
          console.log(`🔄 数据库版本从 ${savedVersion} 升级到 ${this.config.version}`)
        }
        console.log('🆕 创建新的SQLite数据库')
        this.db = new this.SQL.Database()
      }

      console.log('🏗️ 创建数据表...')
      await this.createTables()
      console.log('✅ 数据表创建完成')

      this.isInitialized = true
      console.log('🎉 SQLite初始化完成')

      return { success: true, data: true }
    } catch (error) {
      const errorMsg = `SQLite初始化失败: ${error instanceof Error ? error.message : String(error)}`
      console.error('❌', errorMsg)
      console.error('🔍 详细错误信息:', error)

      // 检查是否是WASM加载问题
      if (error instanceof Error && error.message.includes('wasm')) {
        console.error('💡 可能是WASM文件加载问题，请检查:')
        console.error('   1. public/sql.js-wasm/ 目录是否存在')
        console.error('   2. sql-wasm.wasm 和 sql-wasm.js 文件是否存在')
        console.error('   3. 服务器是否正确配置了WASM MIME类型')
      }

      return { success: false, error: errorMsg }
    }
  }

  // 创建数据表
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    const createTablesSQL = `
      -- 任务表
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        product_name TEXT NOT NULL,
        product_code TEXT,
        work_hours REAL NOT NULL,
        coefficient REAL DEFAULT 1.0,
        master_name TEXT NOT NULL,
        batch_number TEXT NOT NULL,
        client_name TEXT NOT NULL,
        commit_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        priority INTEGER DEFAULT 1,
        -- 新增字段
        process_order_id TEXT,
        factory_code TEXT,
        order_date TEXT,
        delivery_time TEXT,
        quantity INTEGER,
        assigned_person TEXT,
        assigned_team TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 师傅表
      CREATE TABLE IF NOT EXISTS masters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        skill_level INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT 1,
        total_tasks INTEGER DEFAULT 0,
        completed_tasks INTEGER DEFAULT 0,
        avg_completion_time REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 师傅分配历史表
      CREATE TABLE IF NOT EXISTS master_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        product_code TEXT,
        master_name TEXT NOT NULL,
        assignment_count INTEGER DEFAULT 1,
        success_rate REAL DEFAULT 100.0,
        avg_completion_time REAL DEFAULT 0,
        last_assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 任务历史表 (用于追踪变更)
      CREATE TABLE IF NOT EXISTS task_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned'
        old_values TEXT, -- JSON格式的旧值
        new_values TEXT, -- JSON格式的新值
        changed_by TEXT DEFAULT 'system',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 设置表
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
        description TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 导入设置表
      CREATE TABLE IF NOT EXISTS import_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        column_mapping TEXT NOT NULL, -- JSON格式的列映射
        file_type TEXT NOT NULL, -- 'excel', 'csv'
        is_default BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_used_at TEXT
      );

      -- 系统日志表
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL, -- 'info', 'warn', 'error'
        message TEXT NOT NULL,
        details TEXT, -- JSON格式的详细信息
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 创建索引以提高查询性能
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_master_name ON tasks(master_name);
      CREATE INDEX IF NOT EXISTS idx_tasks_commit_time ON tasks(commit_time);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_product ON tasks(product_name, product_code);
      CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_master_assignments_product ON master_assignments(product_name, product_code);
      CREATE INDEX IF NOT EXISTS idx_master_assignments_master ON master_assignments(master_name);
      CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

      -- 插入默认师傅数据
      INSERT OR IGNORE INTO masters (name, skill_level) VALUES
        ('潘敏', 3), ('黄尚斌', 3), ('钱伟', 2), ('蒋怀东', 3), ('江峰', 2),
        ('谢守刚', 3), ('周博', 2), ('秦龙', 2), ('王章良', 3), ('叶佩珺', 2),
        ('李雪', 2), ('昂洪涛', 3), ('刘庆', 2), ('王家龙', 2), ('叶建辉', 3),
        ('魏祯', 2), ('杨同', 2);

      -- 插入默认设置
      INSERT OR IGNORE INTO settings (key, value, type, description) VALUES
        ('default_coefficient', '1.2', 'number', '默认工时系数'),
        ('work_hours_per_day', '540', 'number', '每日工作时间(分钟)'),
        ('auto_assign', 'true', 'boolean', '启用智能分配'),
        ('theme', 'light', 'string', '界面主题'),
        ('page_size', '50', 'number', '分页大小'),
        ('backup_interval', '24', 'number', '自动备份间隔(小时)');

      -- 记录数据库创建日志
      INSERT INTO system_logs (level, message, details) VALUES
        ('info', '数据库表结构创建完成', '{"version": ${this.config.version}, "timestamp": "' || datetime('now') || '"}');
    `

    this.db.exec(createTablesSQL)
    await this.saveToLocalStorage()
  }

  // ================== 任务管理 ==================

  // 分页获取任务
  async getTasksPaginated(
    page: number = 1,
    pageSize: number = 50,
    filters?: {
      status?: string
      masterName?: string
      dateRange?: { start: string; end: string }
      search?: string
      priority?: number
    }
  ): Promise<QueryResult<PaginatedResult<Task>>> {
    try {
      if (!this.db) await this.init()

      let whereClause = 'WHERE 1=1'
      const params: any[] = []

      // 构建过滤条件
      if (filters?.status) {
        whereClause += ' AND status = ?'
        params.push(filters.status)
      }
      if (filters?.masterName) {
        whereClause += ' AND master_name = ?'
        params.push(filters.masterName)
      }
      if (filters?.dateRange) {
        whereClause += ' AND commit_time BETWEEN ? AND ?'
        params.push(filters.dateRange.start, filters.dateRange.end)
      }
      if (filters?.search) {
        whereClause += ' AND (product_name LIKE ? OR batch_number LIKE ? OR client_name LIKE ?)'
        const searchTerm = `%${filters.search}%`
        params.push(searchTerm, searchTerm, searchTerm)
      }
      if (filters?.priority !== undefined) {
        whereClause += ' AND priority >= ?'
        params.push(filters.priority)
      }

      // 获取总数
      const countSQL = `SELECT COUNT(*) as total FROM tasks ${whereClause}`
      const countResult = this.db!.exec(countSQL, params)
      const total = countResult[0]?.values[0][0] as number || 0

      // 获取分页数据
      const offset = (page - 1) * pageSize
      const dataSQL = `
        SELECT * FROM tasks
        ${whereClause}
        ORDER BY priority DESC, commit_time DESC, created_at DESC
        LIMIT ? OFFSET ?
      `

      const result = this.db!.exec(dataSQL, [...params, pageSize, offset])
      const tasks = this.parseTaskResults(result)

      const paginatedResult: PaginatedResult<Task> = {
        data: tasks,
        total,
        page,
        pageSize,
        hasMore: offset + pageSize < total
      }

      return { success: true, data: paginatedResult }
    } catch (error) {
      const errorMsg = `获取任务失败: ${error instanceof Error ? error.message : String(error)}`
      await this.logError('getTasksPaginated', errorMsg, { page, pageSize, filters })
      return { success: false, error: errorMsg }
    }
  }

  // 保存单个任务
  async saveTask(task: Task, recordHistory = true): Promise<QueryResult<boolean>> {
    try {
      if (!this.db) await this.init()

      // 检查任务是否已存在
      const existingTask = await this.getTaskById(task.id)
      const isUpdate = existingTask.success && existingTask.data

      const sql = `
        INSERT OR REPLACE INTO tasks (
          id, product_name, product_code, work_hours, coefficient,
          master_name, batch_number, client_name, commit_time,
          status, priority, process_order_id, factory_code, order_date,
          delivery_time, quantity, assigned_person, assigned_team, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `

      this.db!.run(sql, [
        task.id, task.productName, task.productCode || null, task.workHours,
        task.coefficient || 1, task.masterName, task.batchNumber,
        task.clientName, task.commitTime, task.status, task.priority || 1,
        task.processOrderId || null, task.factoryCode || null, task.orderDate || null,
        task.deliveryTime || null, task.quantity || null, task.assignedPerson || null, task.assignedTeam || null
      ])

      // 记录变更历史
      if (recordHistory) {
        await this.logTaskChange(
          task.id,
          isUpdate ? 'updated' : 'created',
          isUpdate ? existingTask.data : null,
          task
        )
      }

      // 更新师傅统计
      await this.updateMasterStats(task.masterName)

      await this.saveToLocalStorage()

      return {
        success: true,
        data: true,
        rowsAffected: 1
      }
    } catch (error) {
      const errorMsg = `保存任务失败: ${error instanceof Error ? error.message : String(error)}`
      await this.logError('saveTask', errorMsg, { taskId: task.id })
      return { success: false, error: errorMsg }
    }
  }

  // 批量保存任务
  async saveTasksBatch(tasks: Task[]): Promise<QueryResult<boolean>> {
    try {
      if (!this.db) await this.init()

      console.log(`🔄 开始批量保存 ${tasks.length} 个任务...`)

      this.db!.exec('BEGIN TRANSACTION')

      let successCount = 0
      const errors: string[] = []

      // 使用同步的SQL操作替代异步的saveTask
      for (const task of tasks) {
        try {
          const sql = `
            INSERT OR REPLACE INTO tasks (
              id, product_name, product_code, work_hours, coefficient,
              master_name, batch_number, client_name, commit_time,
              status, priority, process_order_id, factory_code, order_date,
              delivery_time, quantity, assigned_person, assigned_team, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `

          this.db!.run(sql, [
            task.id, task.productName, task.productCode || null, task.workHours,
            task.coefficient || 1, task.masterName, task.batchNumber,
            task.clientName, task.commitTime, task.status, task.priority || 1,
            task.processOrderId || null, task.factoryCode || null, task.orderDate || null,
            task.deliveryTime || null, task.quantity || null, task.assignedPerson || null, task.assignedTeam || null
          ])

          successCount++
        } catch (taskError) {
          errors.push(`任务 ${task.id} 保存失败: ${taskError}`)
          console.error(`任务 ${task.id} 保存失败:`, taskError)
        }
      }

      // 提交事务
      this.db!.exec('COMMIT')
      console.log(`✅ 事务提交完成，成功保存 ${successCount} 个任务`)

      // 记录批量操作历史
      await this.logSystemEvent('info', `批量保存任务完成`, {
        totalTasks: tasks.length,
        successCount,
        failedCount: tasks.length - successCount,
        errors: errors.slice(0, 10) // 只记录前10个错误
      })

      // 保存到localStorage
      await this.saveToLocalStorage()
      console.log(`💾 数据已保存到localStorage`)

      // 验证数据是否真正保存成功
      const verifyResult = await this.getTasksPaginated(1, 1)
      if (verifyResult.success) {
        console.log(`✅ 数据保存验证成功，数据库中共有 ${verifyResult.data?.total} 个任务`)
      } else {
        console.warn(`⚠️ 数据保存验证失败: ${verifyResult.error}`)
      }

      if (errors.length > 0) {
        console.warn(`⚠️ 批量保存完成，但有 ${errors.length} 个任务失败`)
      }

      return {
        success: true,
        data: true,
        rowsAffected: successCount
      }
    } catch (error) {
      try {
        this.db!.exec('ROLLBACK')
        console.error('❌ 事务回滚')
      } catch (rollbackError) {
        console.error('❌ 事务回滚也失败:', rollbackError)
      }

      const errorMsg = `批量保存任务失败: ${error instanceof Error ? error.message : String(error)}`
      console.error('❌ 批量保存失败:', errorMsg)
      await this.logError('saveTasksBatch', errorMsg, { taskCount: tasks.length })
      return { success: false, error: errorMsg }
    }
  }

  // 获取单个任务
  async getTaskById(taskId: string): Promise<QueryResult<Task | null>> {
    try {
      if (!this.db) await this.init()

      const sql = 'SELECT * FROM tasks WHERE id = ?'
      const result = this.db!.exec(sql, [taskId])

      if (result.length > 0 && result[0].values.length > 0) {
        const tasks = this.parseTaskResults(result)
        return { success: true, data: tasks[0] }
      }

      return { success: true, data: null }
    } catch (error) {
      const errorMsg = `获取任务失败: ${error instanceof Error ? error.message : String(error)}`
      return { success: false, error: errorMsg }
    }
  }

  // 删除任务
  async deleteTask(taskId: string): Promise<QueryResult<boolean>> {
    try {
      if (!this.db) await this.init()

      // 先获取任务信息用于记录历史
      const taskResult = await this.getTaskById(taskId)

      const sql = 'DELETE FROM tasks WHERE id = ?'
      this.db!.run(sql, [taskId])

      if (taskResult.success && taskResult.data) {
        await this.logTaskChange(taskId, 'deleted', taskResult.data, null)
      }

      await this.saveToLocalStorage()

      return {
        success: true,
        data: true,
        rowsAffected: 1
      }
    } catch (error) {
      const errorMsg = `删除任务失败: ${error instanceof Error ? error.message : String(error)}`
      return { success: false, error: errorMsg }
    }
  }

  // ================== 统计分析 ==================

  // 获取生产统计数据
  async getProductionStatistics(dateRange?: { start: string; end: string }): Promise<QueryResult<{
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    inProgressTasks: number
    avgCompletionTime: number
    masterProductivity: Array<{
      masterName: string
      totalTasks: number
      completedTasks: number
      avgWorkHours: number
      efficiency: number
    }>
    dailyProgress: Array<{
      date: string
      completed: number
      total: number
      percentage: number
    }>
  }>> {
    try {
      if (!this.db) await this.init()

      let whereClause = ''
      const params: any[] = []

      if (dateRange) {
        whereClause = 'WHERE commit_time BETWEEN ? AND ?'
        params.push(dateRange.start, dateRange.end)
      }

      // 总体统计
      const overallSQL = `
        SELECT
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks,
          AVG(CASE WHEN status = 'completed' THEN work_hours * coefficient ELSE NULL END) as avg_completion_time
        FROM tasks ${whereClause}
      `

      const overallResult = this.db!.exec(overallSQL, params)
      const [totalTasks, completedTasks, pendingTasks, inProgressTasks, avgCompletionTime] =
        overallResult[0]?.values[0] || [0, 0, 0, 0, 0]

      // 师傅生产力统计
      const masterSQL = `
        SELECT
          master_name,
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          AVG(work_hours * coefficient) as avg_work_hours,
          (SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as efficiency
        FROM tasks ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} master_name != '待分配'
        GROUP BY master_name
        ORDER BY efficiency DESC, completed_tasks DESC
      `

      const masterResult = this.db!.exec(masterSQL, params)
      const masterProductivity = this.parseMasterProductivity(masterResult)

      // 每日进度统计
      const dailySQL = `
        SELECT
          DATE(commit_time) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          (SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as percentage
        FROM tasks ${whereClause}
        GROUP BY DATE(commit_time)
        ORDER BY date DESC
        LIMIT 30
      `

      const dailyResult = this.db!.exec(dailySQL, params)
      const dailyProgress = this.parseDailyProgress(dailyResult)

      return {
        success: true,
        data: {
          totalTasks: totalTasks as number,
          completedTasks: completedTasks as number,
          pendingTasks: pendingTasks as number,
          inProgressTasks: inProgressTasks as number,
          avgCompletionTime: avgCompletionTime as number || 0,
          masterProductivity,
          dailyProgress
        }
      }
    } catch (error) {
      const errorMsg = `获取统计数据失败: ${error instanceof Error ? error.message : String(error)}`
      return { success: false, error: errorMsg }
    }
  }

  // 智能师傅推荐
  async getRecommendedMaster(productName: string, productCode?: string): Promise<QueryResult<{
    recommendedMaster: string
    confidence: number
    reason: string
    alternatives: Array<{ masterName: string; score: number; reason: string }>
  }>> {
    try {
      if (!this.db) await this.init()

      // 基于历史分配记录的推荐算法
      const sql = `
        SELECT
          ma.master_name,
          ma.assignment_count,
          ma.success_rate,
          ma.avg_completion_time,
          m.skill_level,
          m.total_tasks,
          m.completed_tasks,
          (
            ma.success_rate * 0.4 +
            (CASE WHEN ma.avg_completion_time > 0 THEN (100 - ma.avg_completion_time/60) ELSE 50 END) * 0.3 +
            (ma.assignment_count * 2) * 0.2 +
            m.skill_level * 10 * 0.1
          ) as score
        FROM master_assignments ma
        JOIN masters m ON ma.master_name = m.name
        WHERE ma.product_name = ? ${productCode ? 'AND ma.product_code = ?' : ''}
          AND m.active = 1
        ORDER BY score DESC
        LIMIT 5
      `

      const params = productCode ? [productName, productCode] : [productName]
      const result = this.db!.exec(sql, params)

      if (result.length > 0 && result[0].values.length > 0) {
        const recommendations = this.parseMasterRecommendations(result)
        const best = recommendations[0]

        return {
          success: true,
          data: {
            recommendedMaster: best.masterName,
            confidence: Math.min(best.score, 95), // 最高95%置信度
            reason: `基于${best.assignmentCount}次历史分配，成功率${best.successRate.toFixed(1)}%`,
            alternatives: recommendations.slice(1).map(r => ({
              masterName: r.masterName,
              score: r.score,
              reason: `历史分配${r.assignmentCount}次，成功率${r.successRate.toFixed(1)}%`
            }))
          }
        }
      }

      // 如果没有历史记录，返回工作负载最轻的师傅
      const fallbackSQL = `
        SELECT name, total_tasks, skill_level
        FROM masters
        WHERE active = 1
        ORDER BY total_tasks ASC, skill_level DESC
        LIMIT 3
      `

      const fallbackResult = this.db!.exec(fallbackSQL)

      if (fallbackResult.length > 0 && fallbackResult[0].values.length > 0) {
        const fallbackMaster = fallbackResult[0].values[0][0] as string
        const alternatives = fallbackResult[0].values.slice(1).map(row => ({
          masterName: row[0] as string,
          score: 30 - (row[1] as number), // 任务数越少分数越高
          reason: `当前任务负载较轻(${row[1]}个任务)`
        }))

        return {
          success: true,
          data: {
            recommendedMaster: fallbackMaster,
            confidence: 30,
            reason: '基于当前工作负载推荐',
            alternatives
          }
        }
      }

      return {
        success: true,
        data: {
          recommendedMaster: '待分配',
          confidence: 0,
          reason: '无可用师傅',
          alternatives: []
        }
      }
    } catch (error) {
      const errorMsg = `获取师傅推荐失败: ${error instanceof Error ? error.message : String(error)}`
      return { success: false, error: errorMsg }
    }
  }

  // ================== 数据导入导出 ==================

  // 导出完整数据库
  async exportDatabase(): Promise<QueryResult<string>> {
    try {
      if (!this.db) await this.init()

      const data = this.db!.export()
      const base64 = btoa(String.fromCharCode(...data))

      const exportPackage = {
        type: 'sqlite_database',
        version: this.config.version,
        dbName: this.config.dbName,
        exportTime: new Date().toISOString(),
        data: base64,
        metadata: {
          tables: await this.getTableInfo(),
          recordCounts: await this.getRecordCounts(),
          fileSize: data.length
        }
      }

      await this.logSystemEvent('info', '数据库导出完成', {
        fileSize: data.length,
        tables: exportPackage.metadata.tables.length
      })

      return {
        success: true,
        data: JSON.stringify(exportPackage, null, 2)
      }
    } catch (error) {
      const errorMsg = `数据库导出失败: ${error instanceof Error ? error.message : String(error)}`
      await this.logError('exportDatabase', errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // 导入数据库
  async importDatabase(jsonData: string): Promise<QueryResult<boolean>> {
    try {
      const importPackage = JSON.parse(jsonData)

      if (importPackage.type !== 'sqlite_database') {
        throw new Error('不支持的导入格式')
      }

      const uint8Array = new Uint8Array(
        atob(importPackage.data).split('').map(char => char.charCodeAt(0))
      )

      // 备份当前数据库
      await this.createBackup()

      // 导入新数据库
      this.db = new this.SQL.Database(uint8Array)
      await this.saveToLocalStorage()

      await this.logSystemEvent('info', '数据库导入完成', {
        version: importPackage.version,
        tables: importPackage.metadata?.tables?.length || 0,
        fileSize: importPackage.metadata?.fileSize || 0
      })

      return { success: true, data: true }
    } catch (error) {
      const errorMsg = `数据库导入失败: ${error instanceof Error ? error.message : String(error)}`
      await this.logError('importDatabase', errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // ================== 辅助方法 ==================

  // 保存数据库到本地存储
  private async saveToLocalStorage(): Promise<void> {
    if (!this.db) return

    try {
      const data = this.db.export()
      const base64 = btoa(String.fromCharCode(...data))
      localStorage.setItem('sqlite_db_data', base64)

      // 更新最后保存时间和版本
      localStorage.setItem('sqlite_last_save', new Date().toISOString())
      localStorage.setItem('sqlite_db_version', String(this.config.version))
    } catch (error) {
      console.error('保存数据库到本地存储失败:', error)
    }
  }

  // 创建备份
  private async createBackup(): Promise<void> {
    if (!this.db) return

    try {
      const data = this.db.export()
      const base64 = btoa(String.fromCharCode(...data))
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      localStorage.setItem(`sqlite_backup_${timestamp}`, base64)

      // 只保留最近5个备份
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('sqlite_backup_'))
        .sort()

      if (backupKeys.length > 5) {
        backupKeys.slice(0, -5).forEach(key => {
          localStorage.removeItem(key)
        })
      }
    } catch (error) {
      console.error('创建备份失败:', error)
    }
  }

  // 记录任务变更历史
  private async logTaskChange(taskId: string, action: string, oldValues: any, newValues: any): Promise<void> {
    try {
      const sql = `
        INSERT INTO task_history (task_id, action, old_values, new_values, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `

      this.db!.run(sql, [
        taskId,
        action,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null
      ])
    } catch (error) {
      console.error('记录任务历史失败:', error)
    }
  }

  // 记录系统事件
  private async logSystemEvent(level: string, message: string, details?: any): Promise<void> {
    try {
      const sql = `
        INSERT INTO system_logs (level, message, details, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `

      this.db!.run(sql, [
        level,
        message,
        details ? JSON.stringify(details) : null
      ])
    } catch (error) {
      console.error('记录系统日志失败:', error)
    }
  }

  // 记录错误
  private async logError(operation: string, error: string, context?: any): Promise<void> {
    await this.logSystemEvent('error', `操作失败: ${operation}`, {
      error,
      context,
      timestamp: new Date().toISOString()
    })
  }

  // 更新师傅统计
  private async updateMasterStats(masterName: string): Promise<void> {
    try {
      if (masterName === '待分配') return

      const sql = `
        UPDATE masters SET
          total_tasks = (SELECT COUNT(*) FROM tasks WHERE master_name = ?),
          completed_tasks = (SELECT COUNT(*) FROM tasks WHERE master_name = ? AND status = 'completed'),
          updated_at = datetime('now')
        WHERE name = ?
      `

      this.db!.run(sql, [masterName, masterName, masterName])
    } catch (error) {
      console.error('更新师傅统计失败:', error)
    }
  }

  // 解析任务查询结果
  private parseTaskResults(result: any[]): Task[] {
    if (!result.length || !result[0].values.length) return []

    const columns = result[0].columns
    return result[0].values.map((row: any[]) => {
      const task: any = {}
      columns.forEach((col: string, index: number) => {
        const camelKey = this.toCamelCase(col)
        task[camelKey] = row[index]
      })
      return {
        id: task.id,
        productName: task.productName,
        productCode: task.productCode,
        workHours: task.workHours,
        coefficient: task.coefficient || 1,
        masterName: task.masterName,
        batchNumber: task.batchNumber,
        clientName: task.clientName,
        commitTime: task.commitTime,
        status: task.status,
        priority: task.priority || 1,
        // 新增字段
        processOrderId: task.processOrderId,
        factoryCode: task.factoryCode,
        orderDate: task.orderDate,
        deliveryTime: task.deliveryTime,
        quantity: task.quantity,
        assignedPerson: task.assignedPerson,
        assignedTeam: task.assignedTeam
      } as Task
    })
  }

  // 解析师傅生产力数据
  private parseMasterProductivity(result: any[]): Array<{
    masterName: string
    totalTasks: number
    completedTasks: number
    avgWorkHours: number
    efficiency: number
  }> {
    if (!result.length || !result[0].values.length) return []

    return result[0].values.map((row: any[]) => ({
      masterName: row[0],
      totalTasks: row[1],
      completedTasks: row[2],
      avgWorkHours: row[3] || 0,
      efficiency: row[4] || 0
    }))
  }

  // 解析每日进度数据
  private parseDailyProgress(result: any[]): Array<{
    date: string
    completed: number
    total: number
    percentage: number
  }> {
    if (!result.length || !result[0].values.length) return []

    return result[0].values.map((row: any[]) => ({
      date: row[0],
      total: row[1],
      completed: row[2],
      percentage: row[3] || 0
    }))
  }

  // 解析师傅推荐数据
  private parseMasterRecommendations(result: any[]): Array<{
    masterName: string
    assignmentCount: number
    successRate: number
    score: number
  }> {
    if (!result.length || !result[0].values.length) return []

    return result[0].values.map((row: any[]) => ({
      masterName: row[0],
      assignmentCount: row[1],
      successRate: row[2],
      score: row[6]
    }))
  }

  // 获取表信息
  private async getTableInfo(): Promise<string[]> {
    const sql = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    const result = this.db!.exec(sql)
    return result[0]?.values.map(row => row[0] as string) || []
  }

  // 获取记录数量
  private async getRecordCounts(): Promise<Record<string, number>> {
    const tables = await this.getTableInfo()
    const counts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const result = this.db!.exec(`SELECT COUNT(*) FROM ${table}`)
        counts[table] = result[0]?.values[0][0] as number || 0
      } catch (error) {
        counts[table] = 0
      }
    }

    return counts
  }

  // 转换为驼峰命名
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
  }

  // 健康检查
  async healthCheck(): Promise<QueryResult<{
    isInitialized: boolean
    dbSize: number
    tableCount: number
    lastSave: string | null
    version: number
  }>> {
    try {
      const isInitialized = this.isInitialized && this.db !== null

      if (!isInitialized) {
        return {
          success: true,
          data: {
            isInitialized: false,
            dbSize: 0,
            tableCount: 0,
            lastSave: null,
            version: this.config.version
          }
        }
      }

      const data = this.db!.export()
      const tables = await this.getTableInfo()
      const lastSave = localStorage.getItem('sqlite_last_save')

      return {
        success: true,
        data: {
          isInitialized,
          dbSize: data.length,
          tableCount: tables.length,
          lastSave,
          version: this.config.version
        }
      }
    } catch (error) {
      const errorMsg = `健康检查失败: ${error instanceof Error ? error.message : String(error)}`
      return { success: false, error: errorMsg }
    }
  }
}

// 创建全局实例
export const sqliteService = new SQLiteService()

// 导出类型
export type { PaginatedResult, QueryResult }
