// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  dbExec: (sql, params) => ipcRenderer.invoke('db-exec', sql, params),
  dbRun: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
  dbGet: (sql, params) => ipcRenderer.invoke('db-get', sql, params),
  dbAll: (sql, params) => ipcRenderer.invoke('db-all', sql, params),
  
  // 文件操作
  exportDatabase: () => ipcRenderer.invoke('export-database'),
  importDatabase: (filePath) => ipcRenderer.invoke('import-database', filePath),
  
  // 系统信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => process.platform,
  
  // 便携包操作
  createPortablePackage: () => ipcRenderer.invoke('create-portable-package'),
  
  // 事件监听
  onDatabaseUpdated: (callback) => {
    ipcRenderer.on('database-updated', callback)
  },
  
  // 移除监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})