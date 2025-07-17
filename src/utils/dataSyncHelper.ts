import { LocalStorageService } from '../services/localStorage'

export class DataSyncHelper {

  // 导出所有数据到JSON文件
  static async exportAllData(): Promise<void> {
    try {
      // 获取所有数据
      const allData = {
        // SQLite数据库
        sqliteData: localStorage.getItem('sqlite_db_data'),
        sqliteLastSave: localStorage.getItem('sqlite_last_save'),

        // localStorage数据
        tasks: LocalStorageService.loadTasks(),
        settings: LocalStorageService.loadUserSettings(),
        importSettings: LocalStorageService.loadImportSettings(),
        masterAssignments: LocalStorageService.loadMasterAssignments(),

        // 元数据
        exportTime: new Date().toISOString(),
        exportUrl: window.location.href,
        version: '1.0.0'
      }

      // 创建下载
      const jsonData = JSON.stringify(allData, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `生产看板数据_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('✅ 数据导出完成')
    } catch (error) {
      console.error('❌ 数据导出失败:', error)
      throw error
    }
  }

  // 导入数据
  static async importAllData(file: File): Promise<boolean> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // 备份当前数据
      await this.createBackup()

      // 导入SQLite数据
      if (data.sqliteData) {
        localStorage.setItem('sqlite_db_data', data.sqliteData)
        if (data.sqliteLastSave) {
          localStorage.setItem('sqlite_last_save', data.sqliteLastSave)
        }
        console.log('✅ SQLite数据已导入')
      }

      // 导入localStorage数据
      if (data.tasks) LocalStorageService.saveTasks(data.tasks)
      if (data.settings) LocalStorageService.saveUserSettings(data.settings)
      if (data.importSettings) LocalStorageService.saveImportSettings(data.importSettings)
      if (data.masterAssignments) LocalStorageService.saveMasterAssignments(data.masterAssignments)

      console.log('✅ 数据导入完成')
      return true
    } catch (error) {
      console.error('❌ 数据导入失败:', error)
      return false
    }
  }

  // 创建当前数据备份
  static async createBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupData = {
        sqliteData: localStorage.getItem('sqlite_db_data'),
        tasks: LocalStorageService.loadTasks(),
        settings: LocalStorageService.loadUserSettings(),
        backupTime: new Date().toISOString()
      }

      localStorage.setItem(`backup_${timestamp}`, JSON.stringify(backupData))
      console.log(`✅ 数据备份已创建: backup_${timestamp}`)
    } catch (error) {
      console.warn('创建备份失败:', error)
    }
  }

  // 获取当前存储信息
  static getStorageInfo(): {
    currentUrl: string
    hasData: boolean
    taskCount: number
    hasSQLiteData: boolean
    storageSize: number
  } {
    const tasks = LocalStorageService.loadTasks()
    const sqliteData = localStorage.getItem('sqlite_db_data')

    // 计算存储大小
    let storageSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          storageSize += key.length + value.length
        }
      }
    }

    return {
      currentUrl: window.location.href,
      hasData: tasks.length > 0 || !!sqliteData,
      taskCount: tasks.length,
      hasSQLiteData: !!sqliteData,
      storageSize: storageSize
    }
  }

  // 清理所有数据
  static clearAllData(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('kanban_') || key.startsWith('sqlite_')) {
        localStorage.removeItem(key)
      }
    })
    console.log('🧹 所有数据已清理')
  }
}
