import type { Task } from '../types'

// SQLite文件管理服务
class PortableSQLiteService {
  private dbPath: string = './database/production.db'
  private db: any = null

  // 检测运行环境
  private isElectron(): boolean {
    return typeof window !== 'undefined' &&
           (window as any).electronAPI !== undefined
  }

  private isTauri(): boolean {
    return typeof window !== 'undefined' &&
           (window as any).__TAURI__ !== undefined
  }

  // 初始化数据库连接
  async init(): Promise<void> {
    try {
      if (this.isElectron()) {
        // Electron环境：使用原生SQLite
        await this.initElectronSQLite()
      } else if (this.isTauri()) {
        // Tauri环境：使用原生SQLite
        await this.initTauriSQLite()
      } else {
        // 浏览器环境：使用SQL.js + 文件持久化
        await this.initWebSQLite()
      }

      await this.createTables()
      console.log('SQLite数据库初始化完成')
    } catch (error) {
      console.error('数据库初始化失败:', error)
      throw error
    }
  }

  // Electron环境的SQLite初始化
  private async initElectronSQLite(): Promise<void> {
    const { ipcRenderer } = (window as any).electronAPI

    // 通过IPC与主进程通信
    this.db = {
      exec: async (sql: string, params?: any[]) => {
        return await ipcRenderer.invoke('db-exec', sql, params)
      },
      run: async (sql: string, params?: any[]) => {
        return await ipcRenderer.invoke('db-run', sql, params)
      },
      get: async (sql: string, params?: any[]) => {
        return await ipcRenderer.invoke('db-get', sql, params)
      },
      all: async (sql: string, params?: any[]) => {
        return await ipcRenderer.invoke('db-all', sql, params)
      }
    }
  }

  // Tauri环境的SQLite初始化
  private async initTauriSQLite(): Promise<void> {
    const { invoke } = (window as any).__TAURI__.tauri

    this.db = {
      exec: async (sql: string, params?: any[]) => {
        return await invoke('db_exec', { sql, params })
      },
      run: async (sql: string, params?: any[]) => {
        return await invoke('db_run', { sql, params })
      },
      get: async (sql: string, params?: any[]) => {
        return await invoke('db_get', { sql, params })
      },
      all: async (sql: string, params?: any[]) => {
        return await invoke('db_all', { sql, params })
      }
    }
  }

  // Web环境的SQLite初始化（降级方案）
  private async initWebSQLite(): Promise<void> {
    // 使用之前实现的SQL.js方案
    const initSqlJs = (await import('sql.js')).default
    const SQL = await initSqlJs({
      locateFile: (file: string) => `./sql.js-wasm/${file}`
    })

    // 尝试加载现有数据库文件
    try {
      const response = await fetch(this.dbPath)
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        this.db = new SQL.Database(new Uint8Array(arrayBuffer))
      } else {
        this.db = new SQL.Database()
      }
    } catch {
      this.db = new SQL.Database()
    }
  }

  // 创建数据表
  private async createTables(): Promise<void> {
    const createSQL = `
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
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 分配历史表
      CREATE TABLE IF NOT EXISTS master_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        product_code TEXT,
        master_name TEXT NOT NULL,
        assignment_count INTEGER DEFAULT 1,
        success_rate REAL DEFAULT 100.0,
        last_assigned_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 设置表
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_master ON tasks(master_name);
      CREATE INDEX IF NOT EXISTS idx_tasks_time ON tasks(commit_time);

      -- 插入默认数据
      INSERT OR IGNORE INTO masters (name) VALUES
        ('潘敏'), ('黄尚斌'), ('钱伟'), ('蒋怀东'), ('江峰'),
        ('谢守刚'), ('周博'), ('秦龙'), ('王章良'), ('叶佩珺'),
        ('李雪'), ('昂洪涛'), ('刘庆'), ('王家龙'), ('叶建辉'),
        ('魏祯'), ('杨同');

      INSERT OR IGNORE INTO settings (key, value) VALUES
        ('coefficient', '1.2'),
        ('work_hours_per_day', '540');
    `

    await this.db.exec(createSQL)
  }

  // 分页获取任务
  async getTasksPaginated(
    page: number = 1,
    pageSize: number = 50,
    filters?: any
  ): Promise<{ tasks: Task[]; total: number; hasMore: boolean }> {
    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (filters?.status) {
      whereClause += ' AND status = ?'
      params.push(filters.status)
    }
    if (filters?.masterName) {
      whereClause += ' AND master_name = ?'
      params.push(filters.masterName)
    }
    if (filters?.search) {
      whereClause += ' AND (product_name LIKE ? OR batch_number LIKE ?)'
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    // 获取总数
    const countSQL = `SELECT COUNT(*) as total FROM tasks ${whereClause}`
    const countResult = await this.db.get(countSQL, params)
    const total = countResult.total

    // 获取数据
    const offset = (page - 1) * pageSize
    const dataSQL = `
      SELECT * FROM tasks ${whereClause}
      ORDER BY priority DESC, commit_time DESC
      LIMIT ? OFFSET ?
    `
    const tasks = await this.db.all(dataSQL, [...params, pageSize, offset])

    return {
      tasks: tasks.map(this.dbRowToTask),
      total,
      hasMore: offset + pageSize < total
    }
  }

  // 保存任务
  async saveTask(task: Task): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO tasks (
        id, product_name, product_code, work_hours, coefficient,
        master_name, batch_number, client_name, commit_time,
        status, priority, process_order_id, factory_code, order_date,
        delivery_time, quantity, assigned_person, assigned_team, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `

    await this.db.run(sql, [
      task.id, task.productName, task.productCode, task.workHours,
      task.coefficient || 1, task.masterName, task.batchNumber,
      task.clientName, task.commitTime, task.status, task.priority,
      task.processOrderId, task.factoryCode, task.orderDate,
      task.deliveryTime, task.quantity, task.assignedPerson, task.assignedTeam
    ])

    await this.saveToFile()
  }

  // 批量保存
  async saveTasksBatch(tasks: Task[]): Promise<void> {
    await this.db.exec('BEGIN TRANSACTION')

    try {
      for (const task of tasks) {
        await this.saveTask(task)
      }
      await this.db.exec('COMMIT')
    } catch (error) {
      await this.db.exec('ROLLBACK')
      throw error
    }

    await this.saveToFile()
  }

  // 保存数据库到文件
  private async saveToFile(): Promise<void> {
    if (this.isElectron()) {
      // Electron会自动保存到文件
      return
    } else if (this.isTauri()) {
      // Tauri会自动保存到文件
      return
    } else {
      // Web环境：保存到下载文件
      const data = this.db.export()
      const blob = new Blob([data], { type: 'application/x-sqlite3' })

      // 触发下载（用户需要手动保存）
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'production.db'

      // 静默下载到指定位置（需要用户配合）
      console.log('数据库已更新，请保存到应用目录的database文件夹')
    }
  }

  // 导出便携包
  async exportPortablePackage(): Promise<void> {
    const data = await this.db.all('SELECT * FROM tasks')
    const settings = await this.db.all('SELECT * FROM settings')
    const masters = await this.db.all('SELECT * FROM masters')

    const package_data = {
      type: 'portable_kanban',
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      data: {
        tasks: data,
        settings: settings,
        masters: masters
      },
      instructions: {
        zh: '将整个文件夹复制到U盘，插入目标电脑后运行启动脚本',
        en: 'Copy entire folder to USB drive, insert into target computer and run startup script'
      }
    }

    // 创建便携包文件
    const blob = new Blob([JSON.stringify(package_data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '便携包配置.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 数据转换辅助方法
  private dbRowToTask(row: any): Task {
    return {
      id: row.id,
      productName: row.product_name,
      productCode: row.product_code,
      workHours: row.work_hours,
      coefficient: row.coefficient,
      masterName: row.master_name,
      batchNumber: row.batch_number,
      clientName: row.client_name,
      commitTime: row.commit_time,
      status: row.status,
      priority: row.priority
    }
  }
}

export const portableSQLiteService = new PortableSQLiteService()
