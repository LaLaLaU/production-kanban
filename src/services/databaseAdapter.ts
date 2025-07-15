
// 数据库存储方式
export type StorageMode = 'localStorage' | 'file' | 'hybrid'

// 数据库配置
export interface DatabaseConfig {
  mode: StorageMode
  autoBackup: boolean
  backupInterval: number // 分钟
  maxLocalStorageSize: number // MB
}

// 数据库适配器
export class DatabaseAdapter {
  private config: DatabaseConfig
  private currentMode: StorageMode

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      mode: 'localStorage', // 默认使用当前方式
      autoBackup: true,
      backupInterval: 60, // 1小时
      maxLocalStorageSize: 5, // 5MB
      ...config
    }
    this.currentMode = this.config.mode
  }

  // 检查localStorage大小
  async checkLocalStorageSize(): Promise<number> {
    const data = localStorage.getItem('sqlite_db_data')
    if (!data) return 0

    // 计算大小（字节）
    const sizeInBytes = new Blob([data]).size
    const sizeInMB = sizeInBytes / (1024 * 1024)

    console.log(`📊 数据库大小: ${sizeInMB.toFixed(2)} MB`)
    return sizeInMB
  }

  // 自动选择最佳存储方式
  async getOptimalStorageMode(): Promise<StorageMode> {
    const currentSize = await this.checkLocalStorageSize()

    if (currentSize > this.config.maxLocalStorageSize) {
      console.log('⚠️ localStorage数据过大，建议使用文件存储')
      return 'file'
    }

    if (currentSize > this.config.maxLocalStorageSize * 0.8) {
      console.log('⚠️ localStorage接近限制，建议使用混合存储')
      return 'hybrid'
    }

    return 'localStorage'
  }

  // 导出数据库为文件
  async exportToFile(): Promise<void> {
    try {
      const data = localStorage.getItem('sqlite_db_data')
      if (!data) {
        throw new Error('没有找到数据库数据')
      }

      // 解码base64数据
      const uint8Array = new Uint8Array(
        atob(data).split('').map(char => char.charCodeAt(0))
      )

      // 创建文件并下载
      const blob = new Blob([uint8Array], {
        type: 'application/x-sqlite3'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `production-kanban-${new Date().toISOString().split('T')[0]}.db`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      console.log('✅ 数据库文件导出成功')
    } catch (error) {
      console.error('❌ 导出数据库失败:', error)
      throw error
    }
  }

  // 从文件导入数据库
  async importFromFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // 编码为base64
      const base64 = btoa(String.fromCharCode(...uint8Array))

      // 备份当前数据
      const currentData = localStorage.getItem('sqlite_db_data')
      if (currentData) {
        localStorage.setItem('sqlite_db_data_backup', currentData)
        localStorage.setItem('sqlite_backup_time', new Date().toISOString())
      }

      // 导入新数据
      localStorage.setItem('sqlite_db_data', base64)
      localStorage.setItem('sqlite_last_import', new Date().toISOString())

      console.log('✅ 数据库文件导入成功')
    } catch (error) {
      console.error('❌ 导入数据库失败:', error)
      throw error
    }
  }

  // 自动备份
  async autoBackup(): Promise<void> {
    if (!this.config.autoBackup) return

    const lastBackup = localStorage.getItem('sqlite_last_backup')
    const now = new Date()

    if (lastBackup) {
      const lastBackupTime = new Date(lastBackup)
      const diffMinutes = (now.getTime() - lastBackupTime.getTime()) / (1000 * 60)

      if (diffMinutes < this.config.backupInterval) {
        return // 还没到备份时间
      }
    }

    try {
      await this.exportToFile()
      localStorage.setItem('sqlite_last_backup', now.toISOString())
      console.log('🔄 自动备份完成')
    } catch (error) {
      console.error('❌ 自动备份失败:', error)
    }
  }

  // 清理localStorage
  async cleanupLocalStorage(): Promise<void> {
    const keysToRemove = [
      'sqlite_db_data_backup',
      'sqlite_backup_time',
      'sqlite_last_import',
      'sqlite_last_backup'
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    console.log('🧹 localStorage清理完成')
  }

  // 获取存储统计信息
  async getStorageStats(): Promise<{
    mode: StorageMode
    size: number
    lastBackup?: string
    lastImport?: string
    hasBackup: boolean
  }> {
    const size = await this.checkLocalStorageSize()
    const lastBackup = localStorage.getItem('sqlite_last_backup')
    const lastImport = localStorage.getItem('sqlite_last_import')
    const hasBackup = !!localStorage.getItem('sqlite_db_data_backup')

    return {
      mode: this.currentMode,
      size,
      lastBackup: lastBackup || undefined,
      lastImport: lastImport || undefined,
      hasBackup
    }
  }
}

// 创建默认实例
export const databaseAdapter = new DatabaseAdapter()
