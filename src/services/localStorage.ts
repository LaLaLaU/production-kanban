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
    } catch (error) {
      console.error('保存任务数据失败:', error)
    }
  }

  static loadTasks(): Task[] {
    try {
      const tasksJson = localStorage.getItem(this.KEYS.TASKS)
      return tasksJson ? JSON.parse(tasksJson) : []
    } catch (error) {
      console.error('加载任务数据失败:', error)
      return []
    }
  }

  static saveImportSettings(settings: ImportSettings): void {
    try {
      localStorage.setItem(this.KEYS.IMPORT_SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('保存导入设置失败:', error)
    }
  }

  static loadImportSettings(): ImportSettings | null {
    try {
      const settingsJson = localStorage.getItem(this.KEYS.IMPORT_SETTINGS)
      return settingsJson ? JSON.parse(settingsJson) : null
    } catch (error) {
      console.error('加载导入设置失败:', error)
      return null
    }
  }

  static saveMasterAssignments(assignments: MasterAssignment[]): void {
    try {
      localStorage.setItem(this.KEYS.MASTER_ASSIGNMENTS, JSON.stringify(assignments))
    } catch (error) {
      console.error('保存师傅分配记录失败:', error)
    }
  }

  static loadMasterAssignments(): MasterAssignment[] {
    try {
      const assignmentsJson = localStorage.getItem(this.KEYS.MASTER_ASSIGNMENTS)
      return assignmentsJson ? JSON.parse(assignmentsJson) : []
    } catch (error) {
      console.error('加载师傅分配记录失败:', error)
      return []
    }
  }

  static saveUserSettings(settings: { coefficient: number }): void {
    try {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('保存用户设置失败:', error)
    }
  }

  static loadUserSettings(): { coefficient: number } {
    try {
      const settingsJson = localStorage.getItem(this.KEYS.SETTINGS)
      return settingsJson ? JSON.parse(settingsJson) : { coefficient: 1.2 }
    } catch (error) {
      console.error('加载用户设置失败:', error)
      return { coefficient: 1.2 }
    }
  }

  static clearAllData(): void {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('清除数据失败:', error)
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
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }

  static getStorageInfo(): { used: number, available: number } {
    try {
      let used = 0
      Object.values(this.KEYS).forEach(key => {
        const item = localStorage.getItem(key)
        if (item) {
          used += item.length
        }
      })

      const testKey = 'storage_test'
      let available = 0
      try {
        const testData = 'x'.repeat(1024)
        for (let i = 0; i < 10000; i++) {
          localStorage.setItem(testKey, testData.repeat(i))
          available = testData.length * i
        }
      } catch {
        localStorage.removeItem(testKey)
      }

      return { used, available }
    } catch (error) {
      return { used: 0, available: 0 }
    }
  }
}