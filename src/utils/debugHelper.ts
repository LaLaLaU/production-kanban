import { LocalStorageService } from '../services/localStorage'
import { sqliteService } from '../services/sqliteService'

export class DebugHelper {

  // 检查所有数据存储状态
  static async checkAllStorageStatus(): Promise<{
    localStorage: {
      hasData: boolean
      taskCount: number
      rawData: any
      size: number
    }
    sqlite: {
      isInitialized: boolean
      hasData: boolean
      taskCount: number
      rawData?: any
      error?: string
    }
    url: string
  }> {
    const url = window.location.href

    // 检查localStorage
    const localTasks = LocalStorageService.loadTasks()
    const sqliteData = localStorage.getItem('sqlite_db_data')

    let localStorageSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          localStorageSize += key.length + value.length
        }
      }
    }

    // 检查SQLite
    const sqliteStatus = {
      isInitialized: false,
      hasData: false,
      taskCount: 0,
      rawData: undefined as any,
      error: undefined as string | undefined
    }

    try {
      const healthCheck = await sqliteService.healthCheck()
      sqliteStatus.isInitialized = healthCheck.success && (healthCheck.data?.isInitialized || false)

      if (sqliteStatus.isInitialized) {
        const tasksResult = await sqliteService.getTasksPaginated(1, 1000)
        if (tasksResult.success) {
          sqliteStatus.hasData = tasksResult.data!.total > 0
          sqliteStatus.taskCount = tasksResult.data!.total
          sqliteStatus.rawData = tasksResult.data!.data.slice(0, 3) // 只取前3个作为示例
        } else {
          sqliteStatus.error = tasksResult.error
        }
      }
    } catch (error) {
      sqliteStatus.error = error instanceof Error ? error.message : String(error)
    }

    return {
      localStorage: {
        hasData: localTasks.length > 0 || !!sqliteData,
        taskCount: localTasks.length,
        rawData: localTasks.slice(0, 3), // 只取前3个作为示例
        size: localStorageSize
      },
      sqlite: sqliteStatus,
      url
    }
  }

  // 输出调试信息到控制台
  static async logStorageDebugInfo(): Promise<void> {
    console.log('🔍 ===== 数据存储调试信息 =====')

    const status = await this.checkAllStorageStatus()

    console.log('📍 当前URL:', status.url)
    console.log('')

    console.log('💾 localStorage状态:')
    console.log('  - 有数据:', status.localStorage.hasData)
    console.log('  - 任务数量:', status.localStorage.taskCount)
    console.log('  - 存储大小:', (status.localStorage.size / 1024).toFixed(1), 'KB')
    console.log('  - 示例数据:', status.localStorage.rawData)
    console.log('')

    console.log('🗄️ SQLite状态:')
    console.log('  - 已初始化:', status.sqlite.isInitialized)
    console.log('  - 有数据:', status.sqlite.hasData)
    console.log('  - 任务数量:', status.sqlite.taskCount)
    if (status.sqlite.error) {
      console.log('  - 错误:', status.sqlite.error)
    }
    console.log('  - 示例数据:', status.sqlite.rawData)
    console.log('')

    // 检查localStorage中的SQLite数据
    const sqliteDbData = localStorage.getItem('sqlite_db_data')
    console.log('🔗 localStorage中的SQLite数据:')
    console.log('  - 存在:', !!sqliteDbData)
    console.log('  - 大小:', sqliteDbData ? (sqliteDbData.length / 1024).toFixed(1) + ' KB' : '0 KB')
    console.log('')

    console.log('🔍 ===== 调试信息结束 =====')
  }

  // 强制重新初始化SQLite
  static async forceReinitSQLite(): Promise<void> {
    console.log('🔄 强制重新初始化SQLite...');

    // 重置SQLite服务状态
    (sqliteService as any).isInitialized = false;
    (sqliteService as any).db = null;

    // 重新初始化
    const result = await sqliteService.init()
    console.log('初始化结果:', result)

    // 检查数据
    const tasksResult = await sqliteService.getTasksPaginated(1, 10)
    console.log('任务查询结果:', tasksResult)
  }

  // 检查数据一致性
  static async checkDataConsistency(): Promise<{
    consistent: boolean
    issues: string[]
    details: any
  }> {
    const issues: string[] = []
    const details: any = {}

    try {
      const status = await this.checkAllStorageStatus()
      details.status = status

      // 检查1: localStorage任务数量 vs SQLite任务数量
      if (status.localStorage.taskCount !== status.sqlite.taskCount) {
        issues.push(`任务数量不一致: localStorage(${status.localStorage.taskCount}) vs SQLite(${status.sqlite.taskCount})`)
      }

      // 检查2: 如果有SQLite数据但SQLite未初始化
      const sqliteDbData = localStorage.getItem('sqlite_db_data')
      if (sqliteDbData && !status.sqlite.isInitialized) {
        issues.push('localStorage中有SQLite数据但SQLite未初始化')
      }

      // 检查3: 如果SQLite初始化但没有数据
      if (status.sqlite.isInitialized && !status.sqlite.hasData) {
        issues.push('SQLite已初始化但没有任务数据')
      }

      // 检查4: 如果localStorage有任务但SQLite没有
      if (status.localStorage.taskCount > 0 && status.sqlite.taskCount === 0) {
        issues.push('localStorage有任务数据但SQLite没有，可能需要数据迁移')
      }

      return {
        consistent: issues.length === 0,
        issues,
        details
      }
    } catch (error) {
      issues.push(`检查过程中出错: ${error}`)
      return {
        consistent: false,
        issues,
        details
      }
    }
  }

  // 修复数据问题
  static async fixDataIssues(): Promise<void> {
    console.log('🔧 开始修复数据问题...')

    const consistency = await this.checkDataConsistency()
    console.log('一致性检查结果:', consistency)

    if (consistency.consistent) {
      console.log('✅ 数据一致，无需修复')
      return
    }

    // 尝试修复
    for (const issue of consistency.issues) {
      console.log('🔧 修复问题:', issue)

      if (issue.includes('localStorage有任务数据但SQLite没有')) {
        console.log('  → 执行数据迁移...')
        const localTasks = LocalStorageService.loadTasks()
        if (localTasks.length > 0) {
          const result = await sqliteService.saveTasksBatch(localTasks)
          console.log('  → 迁移结果:', result)
        }
      }

      if (issue.includes('SQLite未初始化')) {
        console.log('  → 重新初始化SQLite...')
        await this.forceReinitSQLite()
      }
    }

    console.log('✅ 修复完成')
  }
}

// 将调试工具挂载到全局对象，方便在浏览器控制台中使用
if (typeof window !== 'undefined') {
  (window as any).debugHelper = DebugHelper
}
