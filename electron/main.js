// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Database = require('better-sqlite3')

let mainWindow
let db

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png')
  })

  // 开发环境
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function initDatabase() {
  const dbPath = path.join(process.cwd(), 'database', 'production.db')
  
  // 确保数据库目录存在
  const fs = require('fs')
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  db = new Database(dbPath)
  
  // 创建表结构
  const createTables = `
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS masters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      skill_level INTEGER DEFAULT 1,
      active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_master ON tasks(master_name);
    CREATE INDEX IF NOT EXISTS idx_tasks_time ON tasks(commit_time);
  `
  
  db.exec(createTables)
  
  // 插入默认师傅数据
  const insertMasters = db.prepare(`
    INSERT OR IGNORE INTO masters (name) VALUES (?)
  `)
  
  const masters = [
    '潘敏', '黄尚斌', '钱伟', '蒋怀东', '江峰',
    '谢守刚', '周博', '秦龙', '王章良', '叶佩珺',
    '李雪', '昂洪涛', '刘庆', '王家龙', '叶建辉',
    '魏祯', '杨同'
  ]
  
  masters.forEach(name => insertMasters.run(name))
  
  console.log('数据库初始化完成:', dbPath)
}

// IPC处理程序
ipcMain.handle('db-exec', (event, sql, params = []) => {
  try {
    return db.exec(sql)
  } catch (error) {
    console.error('SQL执行错误:', error)
    throw error
  }
})

ipcMain.handle('db-run', (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql)
    return stmt.run(...params)
  } catch (error) {
    console.error('SQL运行错误:', error)
    throw error
  }
})

ipcMain.handle('db-get', (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql)
    return stmt.get(...params)
  } catch (error) {
    console.error('SQL查询错误:', error)
    throw error
  }
})

ipcMain.handle('db-all', (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql)
    return stmt.all(...params)
  } catch (error) {
    console.error('SQL查询错误:', error)
    throw error
  }
})

// 应用生命周期
app.whenReady().then(() => {
  initDatabase()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close()
    app.quit()
  }
})

app.on('before-quit', () => {
  if (db) db.close()
})