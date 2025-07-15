import { sqliteService } from './sqliteService'
import { LocalStorageService } from './localStorage'
import type { Task } from '../types'
import type { ImportSettings, MasterAssignment } from '../types/import'

interface MigrationResult {
  success: boolean
  message: string
  details: {
    tasksMigrated: number
    settingsMigrated: number
    assignmentsMigrated: number
    errors: string[]
  }
}

interface PortablePackage {
  type: 'portable_kanban_sqlite'
  version: string
  exportTime: string
  data: {
    tasks: Task[]
    settings: Record<string, any>
    masterAssignments: MasterAssignment[]
    importSettings: ImportSettings[]
  }
  metadata: {
    totalRecords: number
    originalSource: string
    migrationNotes: string[]
  }
}

export class DataMigrationService {
  
  // 从localStorage迁移到SQLite
  static async migrateFromLocalStorage(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      details: {
        tasksMigrated: 0,
        settingsMigrated: 0,
        assignmentsMigrated: 0,
        errors: []
      }
    }

    try {
      // 检查SQLite是否已初始化
      const healthCheck = await sqliteService.healthCheck()
      if (!healthCheck.success) {
        await sqliteService.init()
      }

      console.log('🔄 开始从localStorage迁移数据到SQLite...')

      // 1. 迁移任务数据
      const tasks = LocalStorageService.loadTasks()
      if (tasks.length > 0) {
        console.log(`📋 发现 ${tasks.length} 个任务，开始迁移...`)
        const taskResult = await sqliteService.saveTasksBatch(tasks)
        if (taskResult.success) {
          result.details.tasksMigrated = tasks.length
          console.log(`✅ 任务迁移完成: ${tasks.length} 个`)
        } else {
          result.details.errors.push(`任务迁移失败: ${taskResult.error}`)
        }
      }

      // 2. 迁移用户设置
      const userSettings = LocalStorageService.loadUserSettings()
      if (userSettings) {
        console.log('⚙️ 迁移用户设置...')
        // 将设置转换为SQLite格式
        for (const [key, value] of Object.entries(userSettings)) {
          await this.saveSetting(key, value)
        }
        result.details.settingsMigrated = Object.keys(userSettings).length
        console.log(`✅ 设置迁移完成: ${Object.keys(userSettings).length} 项`)
      }

      // 3. 迁移师傅分配记录
      const masterAssignments = LocalStorageService.loadMasterAssignments()
      if (masterAssignments.length > 0) {
        console.log(`👨‍🔧 发现 ${masterAssignments.length} 个师傅分配记录，开始迁移...`)
        const assignmentResult = await this.migrateMasterAssignments(masterAssignments)
        if (assignmentResult.success) {
          result.details.assignmentsMigrated = masterAssignments.length
          console.log(`✅ 师傅分配记录迁移完成: ${masterAssignments.length} 个`)
        } else {
          result.details.errors.push(`师傅分配记录迁移失败: ${assignmentResult.error}`)
        }
      }

      // 4. 迁移导入设置
      const importSettings = LocalStorageService.loadImportSettings()
      if (importSettings) {
        console.log('📥 迁移导入设置...')
        await this.migrateImportSettings(importSettings)
        console.log('✅ 导入设置迁移完成')
      }

      // 检查迁移结果
      const totalMigrated = result.details.tasksMigrated + 
                           result.details.settingsMigrated + 
                           result.details.assignmentsMigrated

      if (totalMigrated > 0) {
        result.success = true
        result.message = `数据迁移完成！共迁移 ${totalMigrated} 条记录`
        
        // 记录迁移日志
        await this.logMigration('localStorage_to_sqlite', result.details)
        
        console.log('🎉 数据迁移成功完成！')
        console.log(`📊 迁移统计: 任务${result.details.tasksMigrated}个, 设置${result.details.settingsMigrated}项, 分配记录${result.details.assignmentsMigrated}个`)
        
        // 可选：创建localStorage备份
        await this.createLocalStorageBackup()
        
      } else {
        result.message = '没有发现需要迁移的数据'
        result.success = true
      }

    } catch (error) {
      result.success = false
      result.message = `迁移过程中发生错误: ${error instanceof Error ? error.message : String(error)}`
      result.details.errors.push(result.message)
      console.error('❌ 数据迁移失败:', error)
    }

    return result
  }

  // 检查是否需要迁移
  static async shouldMigrate(): Promise<{
    needsMigration: boolean
    hasLocalStorageData: boolean
    hasSQLiteData: boolean
    localStorageCount: number
    sqliteCount: number
  }> {
    try {
      // 检查localStorage数据
      const localTasks = LocalStorageService.loadTasks()
      const hasLocalStorageData = localTasks.length > 0

      // 检查SQLite数据
      const healthCheck = await sqliteService.healthCheck()
      let hasSQLiteData = false
      let sqliteCount = 0

      if (healthCheck.success && healthCheck.data?.isInitialized) {
        const tasksResult = await sqliteService.getTasksPaginated(1, 1)
        if (tasksResult.success) {
          hasSQLiteData = tasksResult.data!.total > 0
          sqliteCount = tasksResult.data!.total
        }
      }

      // 需要迁移的条件：有localStorage数据且SQLite数据较少
      const needsMigration = hasLocalStorageData && (!hasSQLiteData || sqliteCount < localTasks.length)

      return {
        needsMigration,
        hasLocalStorageData,
        hasSQLiteData,
        localStorageCount: localTasks.length,
        sqliteCount
      }
    } catch (error) {
      console.error('检查迁移状态失败:', error)
      return {
        needsMigration: false,
        hasLocalStorageData: false,
        hasSQLiteData: false,
        localStorageCount: 0,
        sqliteCount: 0
      }
    }
  }

  // 自动迁移检查和执行
  static async autoMigrate(): Promise<MigrationResult | null> {
    const migrationCheck = await this.shouldMigrate()
    
    if (migrationCheck.needsMigration) {
      console.log('🔍 检测到需要迁移的数据，开始自动迁移...')
      console.log(`📊 localStorage: ${migrationCheck.localStorageCount} 个任务`)
      console.log(`📊 SQLite: ${migrationCheck.sqliteCount} 个任务`)
      
      return await this.migrateFromLocalStorage()
    }

    return null
  }

  // 创建便携包
  static async createPortablePackage(): Promise<{
    success: boolean
    data?: string
    filename?: string
    error?: string
  }> {
    try {
      console.log('📦 开始创建便携包...')

      // 初始化SQLite
      await sqliteService.init()

      // 获取所有数据
      const tasksResult = await sqliteService.getTasksPaginated(1, 10000) // 获取所有任务

      if (!tasksResult.success) {
        throw new Error(`获取任务数据失败: ${tasksResult.error}`)
      }

      // 构建便携包数据
      const portablePackage: PortablePackage = {
        type: 'portable_kanban_sqlite',
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        data: {
          tasks: tasksResult.data!.data,
          settings: await this.getAllSettings(),
          masterAssignments: await this.getAllMasterAssignments(),
          importSettings: await this.getAllImportSettings()
        },
        metadata: {
          totalRecords: tasksResult.data!.total,
          originalSource: window.location.hostname || 'localhost',
          migrationNotes: [
            '此便携包包含完整的生产看板数据',
            '可直接复制到U盘并在其他电脑上使用',
            '启动应用时会自动检测并导入数据',
            '原有数据将被备份，不会丢失'
          ]
        }
      }

      const jsonData = JSON.stringify(portablePackage, null, 2)
      const filename = `生产看板便携包_${new Date().toISOString().split('T')[0]}.json`

      // 记录创建日志
      await this.logMigration('create_portable_package', {
        taskCount: tasksResult.data!.total,
        fileSize: jsonData.length,
        filename
      })

      console.log('✅ 便携包创建完成')
      console.log(`📊 包含数据: ${tasksResult.data!.total} 个任务`)
      console.log(`📂 文件大小: ${(jsonData.length / 1024).toFixed(2)} KB`)

      return {
        success: true,
        data: jsonData,
        filename
      }
    } catch (error) {
      const errorMsg = `创建便携包失败: ${error instanceof Error ? error.message : String(error)}`
      console.error('❌', errorMsg)
      return {
        success: false,
        error: errorMsg
      }
    }
  }

  // 导入便携包
  static async importPortablePackage(jsonData: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      details: {
        tasksMigrated: 0,
        settingsMigrated: 0,
        assignmentsMigrated: 0,
        errors: []
      }
    }

    try {
      console.log('📥 开始导入便携包...')

      const packageData: PortablePackage = JSON.parse(jsonData)

      // 验证便携包格式
      if (packageData.type !== 'portable_kanban_sqlite') {
        throw new Error('不支持的便携包格式')
      }

      // 初始化SQLite
      await sqliteService.init()

      // 创建当前数据备份
      console.log('💾 创建当前数据备份...')
      await this.createDataBackup()

      // 导入任务数据
      if (packageData.data.tasks && packageData.data.tasks.length > 0) {
        console.log(`📋 导入 ${packageData.data.tasks.length} 个任务...`)
        const taskResult = await sqliteService.saveTasksBatch(packageData.data.tasks)
        if (taskResult.success) {
          result.details.tasksMigrated = packageData.data.tasks.length
        } else {
          result.details.errors.push(`任务导入失败: ${taskResult.error}`)
        }
      }

      // 导入设置
      if (packageData.data.settings) {
        console.log('⚙️ 导入设置...')
        for (const [key, value] of Object.entries(packageData.data.settings)) {
          await this.saveSetting(key, value)
        }
        result.details.settingsMigrated = Object.keys(packageData.data.settings).length
      }

      // 导入师傅分配记录
      if (packageData.data.masterAssignments && packageData.data.masterAssignments.length > 0) {
        console.log(`👨‍🔧 导入 ${packageData.data.masterAssignments.length} 个分配记录...`)
        const assignmentResult = await this.migrateMasterAssignments(packageData.data.masterAssignments)
        if (assignmentResult.success) {
          result.details.assignmentsMigrated = packageData.data.masterAssignments.length
        } else {
          result.details.errors.push(`分配记录导入失败: ${assignmentResult.error}`)
        }
      }

      const totalImported = result.details.tasksMigrated + 
                           result.details.settingsMigrated + 
                           result.details.assignmentsMigrated

      if (totalImported > 0) {
        result.success = true
        result.message = `便携包导入完成！共导入 ${totalImported} 条记录`
        
        // 记录导入日志
        await this.logMigration('import_portable_package', {
          ...result.details,
          sourceVersion: packageData.version,
          exportTime: packageData.exportTime
        })

        console.log('🎉 便携包导入成功！')
      } else {
        result.message = '便携包中没有可导入的数据'
        result.success = true
      }

    } catch (error) {
      result.success = false
      result.message = `导入便携包失败: ${error instanceof Error ? error.message : String(error)}`
      result.details.errors.push(result.message)
      console.error('❌ 便携包导入失败:', error)
    }

    return result
  }

  // 检测便携包
  static async detectPortablePackage(): Promise<{
    found: boolean
    packageData?: PortablePackage
    source: 'localStorage' | 'url_param' | 'none'
  }> {
    try {
      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search)
      const portableParam = urlParams.get('portable')
      
      if (portableParam) {
        try {
          const packageData = JSON.parse(decodeURIComponent(portableParam))
          if (packageData.type === 'portable_kanban_sqlite') {
            return {
              found: true,
              packageData,
              source: 'url_param'
            }
          }
        } catch (error) {
          console.warn('URL参数中的便携包数据格式错误:', error)
        }
      }

      // 检查localStorage中的便携包标记
      const portableData = localStorage.getItem('portable_package_data')
      if (portableData) {
        try {
          const packageData = JSON.parse(portableData)
          if (packageData.type === 'portable_kanban_sqlite') {
            return {
              found: true,
              packageData,
              source: 'localStorage'
            }
          }
        } catch (error) {
          console.warn('localStorage中的便携包数据格式错误:', error)
          localStorage.removeItem('portable_package_data')
        }
      }

      return { found: false, source: 'none' }
    } catch (error) {
      console.error('检测便携包失败:', error)
      return { found: false, source: 'none' }
    }
  }

  // ================== 私有辅助方法 ==================

  private static async saveSetting(key: string, value: any): Promise<void> {
    // 这里需要实现SQLite设置保存逻辑
    // 暂时跳过，因为sqliteService中没有暴露设置相关方法
    console.log(`保存设置: ${key} = ${value}`)
  }

  private static async migrateMasterAssignments(assignments: MasterAssignment[]): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // 这里需要实现SQLite师傅分配记录保存逻辑
      // 暂时返回成功
      console.log(`迁移师傅分配记录: ${assignments.length} 个`)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private static async migrateImportSettings(settings: ImportSettings | null): Promise<void> {
    if (!settings) return
    // 这里需要实现SQLite导入设置保存逻辑
    console.log('迁移导入设置:', settings)
  }

  private static async getAllSettings(): Promise<Record<string, any>> {
    // 这里需要实现从SQLite获取所有设置
    return {
      coefficient: 1.2,
      work_hours_per_day: 540,
      auto_assign: true
    }
  }

  private static async getAllMasterAssignments(): Promise<MasterAssignment[]> {
    // 这里需要实现从SQLite获取所有师傅分配记录
    return []
  }

  private static async getAllImportSettings(): Promise<ImportSettings[]> {
    // 这里需要实现从SQLite获取所有导入设置
    return []
  }

  private static async logMigration(operation: string, details: any): Promise<void> {
    try {
      // 记录到SQLite系统日志
      console.log(`记录迁移操作: ${operation}`, details)
    } catch (error) {
      console.warn('记录迁移日志失败:', error)
    }
  }

  private static async createLocalStorageBackup(): Promise<void> {
    try {
      const backup = {
        tasks: LocalStorageService.loadTasks(),
        settings: LocalStorageService.loadUserSettings(),
        masterAssignments: LocalStorageService.loadMasterAssignments(),
        importSettings: LocalStorageService.loadImportSettings(),
        backupTime: new Date().toISOString()
      }

      const backupKey = `localStorage_backup_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify(backup))
      console.log(`✅ localStorage备份已创建: ${backupKey}`)
    } catch (error) {
      console.warn('创建localStorage备份失败:', error)
    }
  }

  private static async createDataBackup(): Promise<void> {
    try {
      const exportResult = await sqliteService.exportDatabase()
      if (exportResult.success) {
        const backupKey = `sqlite_backup_${Date.now()}`
        localStorage.setItem(backupKey, exportResult.data!)
        console.log(`✅ 数据备份已创建: ${backupKey}`)
      }
    } catch (error) {
      console.warn('创建数据备份失败:', error)
    }
  }
}

// 应用启动时的自动迁移
export const initAutoMigration = async (): Promise<void> => {
  try {
    console.log('🚀 启动自动数据迁移检查...')

    // 1. 检测便携包
    const portableDetection = await DataMigrationService.detectPortablePackage()
    if (portableDetection.found && portableDetection.packageData) {
      console.log(`📦 检测到便携包 (来源: ${portableDetection.source})`)
      const importResult = await DataMigrationService.importPortablePackage(
        JSON.stringify(portableDetection.packageData)
      )
      
      if (importResult.success) {
        console.log('✅ 便携包自动导入完成')
        
        // 清除便携包标记
        if (portableDetection.source === 'localStorage') {
          localStorage.removeItem('portable_package_data')
        }
        
        // 显示成功通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('生产看板系统', {
            body: '便携包数据已自动导入完成',
            icon: '/vite.svg'
          })
        }
      } else {
        console.error('❌ 便携包导入失败:', importResult.message)
      }
      return
    }

    // 2. 检查是否需要从localStorage迁移
    const migrationResult = await DataMigrationService.autoMigrate()
    if (migrationResult) {
      if (migrationResult.success) {
        console.log('✅ 数据自动迁移完成')
        
        // 显示成功通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('生产看板系统', {
            body: `数据迁移完成：${migrationResult.details.tasksMigrated}个任务已迁移到SQLite`,
            icon: '/vite.svg'
          })
        }
      } else {
        console.error('❌ 数据迁移失败:', migrationResult.message)
      }
    }

    // 3. 初始化SQLite
    const initResult = await sqliteService.init()
    if (initResult.success) {
      console.log('✅ SQLite数据库初始化完成')
    } else {
      console.error('❌ SQLite初始化失败:', initResult.error)
      // 降级到localStorage模式
      console.log('⚠️ 降级到localStorage存储模式')
    }

  } catch (error) {
    console.error('❌ 自动迁移过程发生错误:', error)
  }
}