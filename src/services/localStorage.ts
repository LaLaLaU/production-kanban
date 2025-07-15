import type { Task } from '../types'
import type { ImportSettings, MasterAssignment } from '../types/import'

export class LocalStorageService {
  private static readonly KEYS = {
    TASKS: 'kanban_tasks',
    SETTINGS: 'kanban_settings',
    IMPORT_SETTINGS: 'kanban_import_settings',
    MASTER_ASSIGNMENTS: 'kanban_master_assignments'
  }

  static saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks))
    } catch {
      // 静默失败，避免控制台错误
    }
  }

  static loadTasks(): Task[] {
    try {
      const tasksJson = localStorage.getItem(this.KEYS.TASKS)
      return tasksJson ? JSON.parse(tasksJson) : []
    } catch {
      return []
    }
  }

  static saveImportSettings(settings: ImportSettings): void {
    try {
      localStorage.setItem(this.KEYS.IMPORT_SETTINGS, JSON.stringify(settings))
    } catch {
      // 静默失败
    }
  }

  static loadImportSettings(): ImportSettings | null {
    try {
      const settingsJson = localStorage.getItem(this.KEYS.IMPORT_SETTINGS)
      return settingsJson ? JSON.parse(settingsJson) : null
    } catch {
      return null
    }
  }

  static saveMasterAssignments(assignments: MasterAssignment[]): void {
    try {
      localStorage.setItem(this.KEYS.MASTER_ASSIGNMENTS, JSON.stringify(assignments))
    } catch {
      // 静默失败
    }
  }

  static loadMasterAssignments(): MasterAssignment[] {
    try {
      const assignmentsJson = localStorage.getItem(this.KEYS.MASTER_ASSIGNMENTS)
      return assignmentsJson ? JSON.parse(assignmentsJson) : []
    } catch {
      return []
    }
  }

  static saveUserSettings(settings: { coefficient: number }): void {
    try {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings))
    } catch {
      // 静默失败
    }
  }

  static loadUserSettings(): { coefficient: number } {
    try {
      const settingsJson = localStorage.getItem(this.KEYS.SETTINGS)
      return settingsJson ? JSON.parse(settingsJson) : { coefficient: 1.2 }
    } catch {
      return { coefficient: 1.2 }
    }
  }

  static clearAllData(): void {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch {
      // 静默失败
    }
  }

  static exportData(): string {
    const data = {
      tasks: this.loadTasks(),
      settings: this.loadUserSettings(),
      importSettings: this.loadImportSettings(),
      masterAssignments: this.loadMasterAssignments(),
      exportTime: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.tasks) this.saveTasks(data.tasks)
      if (data.settings) this.saveUserSettings(data.settings)
      if (data.importSettings) this.saveImportSettings(data.importSettings)
      if (data.masterAssignments) this.saveMasterAssignments(data.masterAssignments)
      
      return true
    } catch {
      return false
    }
  }

  static getStorageInfo(): { used: number, available: number } {
    try {
      let used = 0
      Object.values(this.KEYS).forEach(key => {
        const item = localStorage.getItem(key)
        if (item) {
          used += item.length * 2 // 每个字符通常占用2字节
        }
      })

      // 使用简单快速的方式估算可用空间，避免卡死
      let available = 0
      
      try {
        // 快速测试几个固定大小，避免复杂循环
        const testKey = 'storage_test'
        const testSizes = [1024, 10240, 102400, 1048576] // 1KB, 10KB, 100KB, 1MB
        
        for (const size of testSizes) {
          try {
            const testData = 'x'.repeat(size)
            localStorage.setItem(testKey, testData)
            localStorage.removeItem(testKey)
            available = size
          } catch {
            break
          }
        }
        
        // 估算总可用空间（通常localStorage限制在5-10MB）
        const estimatedTotal = 5 * 1024 * 1024 // 5MB
        available = Math.max(0, estimatedTotal - used)
        
      } catch {
        // 如果测试失败，使用保守估算
        available = Math.max(0, 2 * 1024 * 1024 - used) // 假设2MB可用空间
      }

      return { used, available }
    } catch {
      return { used: 0, available: 0 }
    }
  }
}