import { DatabaseOutlined, DownloadOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Layout, message, notification, Space, Spin, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import DatabaseManagement from './components/DatabaseManagement'
import FontSizeSettings from './components/FontSizeSettings'
import ImportModal from './components/ImportModal'
import KeepScreenAwake from './components/KeepScreenAwake'
import MasterGanttView from './components/MasterGanttView'
import { DataMigrationService, initAutoMigration } from './services/dataMigration'
import { LocalStorageService } from './services/localStorage'
import { sqliteService } from './services/sqliteService'
import './styles/fontSizeSupport.css'
import type { Task } from './types'

const { Header, Content } = Layout
const { Title, Text } = Typography

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('应用错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Alert
            message="应用运行错误"
            description={`错误信息: ${this.state.error?.message || '未知错误'}`}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
          <Button
            type="primary"
            onClick={() => window.location.reload()}
          >
            重新加载页面
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [dbManagementVisible, setDbManagementVisible] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [totalTasks, setTotalTasks] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<{
    isInitialized: boolean
    usingLocalStorage: boolean
    errorMessage?: string
  }>({
    isInitialized: false,
    usingLocalStorage: false
  })

  const pageSize = 50

  // 初始化应用和数据库
  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      setLoading(true)
      setInitError(null)

      console.log('🚀 开始初始化应用...')

      // 请求通知权限
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      // 执行自动迁移
      console.log('🔄 开始自动迁移...')
      await initAutoMigration()
      console.log('✅ 自动迁移完成')

      // 检查数据库状态
      console.log('🔍 检查数据库状态...')
      const healthCheck = await sqliteService.healthCheck()

      if (healthCheck.success && healthCheck.data?.isInitialized) {
        // SQLite模式
        console.log('✅ SQLite模式启动')
        setDbStatus({
          isInitialized: true,
          usingLocalStorage: false
        })

        await loadTasksFromSQLite()

        // 显示SQLite模式通知
        notification.success({
          message: '数据库已就绪',
          description: '正在使用SQLite数据库，支持高性能数据存储',
          duration: 3
        })
      } else {
        // 降级到localStorage模式
        console.log('⚠️ 降级到localStorage模式')
        setDbStatus({
          isInitialized: false,
          usingLocalStorage: true,
          errorMessage: healthCheck.error
        })

        loadTasksFromLocalStorage()

        // 显示降级通知
        notification.warning({
          message: '使用本地存储模式',
          description: 'SQLite初始化失败，已降级到localStorage模式',
          duration: 5
        })
      }

    } catch (error) {
      console.error('应用初始化失败:', error)

      const errorMessage = error instanceof Error ? error.message : String(error)
      setInitError(errorMessage)

      setDbStatus({
        isInitialized: false,
        usingLocalStorage: true,
        errorMessage: errorMessage
      })

      // 降级到localStorage
      try {
        loadTasksFromLocalStorage()
      } catch (localError) {
        console.error('localStorage加载也失败:', localError)
        setTasks([])
      }

      message.error('应用初始化失败，已降级到本地存储模式')
    } finally {
      setLoading(false)
    }
  }

  // 从SQLite加载任务
  const loadTasksFromSQLite = async (page: number = 1) => {
    try {
      const result = await sqliteService.getTasksPaginated(page, pageSize)

      if (result.success && result.data) {
        if (page === 1) {
          setTasks(result.data.data)
        } else {
          setTasks(prev => [...prev, ...result.data!.data])
        }

        setTotalTasks(result.data.total)
        setHasMore(result.data.hasMore)
      } else {
        throw new Error(result.error || '加载任务失败')
      }
    } catch (error) {
      console.error('从SQLite加载任务失败:', error)
      message.error('加载任务失败')
    }
  }

  // 从localStorage加载任务
  const loadTasksFromLocalStorage = () => {
    try {
      const savedTasks = LocalStorageService.loadTasks()
      setTasks(savedTasks)
      setTotalTasks(savedTasks.length)
      setHasMore(false)
    } catch (error) {
      console.error('从localStorage加载任务失败:', error)
      message.error('加载本地数据失败')
    }
  }

  // 处理任务变更
  const handleTasksChange = async (newTasks: Task[]) => {
    if (dbStatus.isInitialized) {
      // SQLite模式
      console.log('🔄 SQLite模式：处理任务变更...')

      // 找出被修改的任务
      const changedTasks = newTasks.filter(newTask => {
        const oldTask = tasks.find(t => t.id === newTask.id)
        return oldTask && JSON.stringify(oldTask) !== JSON.stringify(newTask)
      })

      console.log(`📊 检测到 ${changedTasks.length} 个任务变更`)

      if (changedTasks.length === 0) {
        console.log('⚠️ 没有检测到实际变更')
        return
      }

      // 先更新本地状态，提供即时反馈
      setTasks(newTasks)

      // 保存变更的任务到数据库
      let allSaved = true
      for (const task of changedTasks) {
        const result = await sqliteService.saveTask(task)
        if (!result.success) {
          console.error('保存任务失败:', result.error)
          message.error(`保存任务失败: ${result.error}`)
          allSaved = false
          break
        }
      }

      if (allSaved) {
        console.log(`✅ 已成功保存 ${changedTasks.length} 个任务到数据库`)
        // 单个任务编辑时不需要重新加载整个数据集
        // 只有在批量操作或导入时才需要重新加载
      } else {
        // 如果保存失败，回滚到原始状态
        setTasks(tasks)
        await loadTasksFromSQLite(1)
      }
    } else {
      // localStorage模式：直接更新状态
      setTasks(newTasks)
      LocalStorageService.saveTasks(newTasks)
    }
  }

  // 处理导入
  const handleImport = async (importedTasks: Task[]) => {
    try {
      console.log(`🔄 开始导入 ${importedTasks.length} 个任务...`)
      console.log('📊 导入的任务详情:', importedTasks.slice(0, 3))

      if (dbStatus.isInitialized) {
        // SQLite模式
        console.log('📊 使用SQLite模式导入')
        const result = await sqliteService.saveTasksBatch(importedTasks)

        if (result.success) {
          console.log('✅ SQLite批量保存完成，重新加载数据')

          // 确保数据已保存完成后再重新加载
          await new Promise(resolve => setTimeout(resolve, 100)) // 短暂延迟确保数据已保存

          await loadTasksFromSQLite(1)
          console.log('✅ 任务数据重新加载完成')
          console.log('📊 重新加载后的任务数量:', tasks.length)

          message.success(`成功导入 ${importedTasks.length} 个任务`)
        } else {
          throw new Error(result.error)
        }
      } else {
        // localStorage模式
        console.log('💾 使用localStorage模式导入')
        const updatedTasks = [...tasks, ...importedTasks]
        setTasks(updatedTasks)
        LocalStorageService.saveTasks(updatedTasks)
        console.log('✅ localStorage数据更新完成')
        message.success(`成功导入 ${importedTasks.length} 个任务`)
      }
    } catch (error) {
      console.error('❌ 导入任务失败:', error)
      message.error(`导入任务失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 处理导出
  const handleExport = async () => {
    try {
      let exportTasks = tasks

      // 如果使用SQLite且有更多数据，获取全部数据
      if (dbStatus.isInitialized && hasMore) {
        const result = await sqliteService.getTasksPaginated(1, 10000)
        if (result.success && result.data) {
          exportTasks = result.data.data
        }
      }

      const exportData = exportTasks.map(task => ({
        '产品名称': task.productName,
        '产品图号': task.productCode || '',
        '原始工时(分钟)': task.workHours,
        '工时系数': task.coefficient || 1,
        '实际工时(分钟)': Math.round(task.workHours * (task.coefficient || 1)),
        '师傅': task.masterName,
        '架次号': task.batchNumber,
        '委托方': task.clientName,
        '委托时间': task.commitTime,
        '优先级': task.priority,
        '状态': task.status === 'pending' ? '待处理' :
                task.status === 'in-progress' ? '进行中' : '已完成'
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '生产任务')

      const fileName = `生产看板数据_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)

      message.success(`数据导出成功 (共${exportTasks.length}条记录)`)
    } catch (error) {
      console.error('导出失败:', error)
      message.error('数据导出失败')
    }
  }



  // 创建便携包
  const handleCreatePortablePackage = async () => {
    try {
      const result = await DataMigrationService.createPortablePackage()

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename || '生产看板便携包.json'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        message.success('便携包创建成功！可直接复制到U盘使用')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('创建便携包失败:', error)
      message.error('创建便携包失败')
    }
  }

  if (loading) {
    return (
      <Layout className="kanban-container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column'
        }}>
          <Spin size="large" />
          <Text style={{ marginTop: 16, color: '#666' }}>
            正在初始化数据库...
          </Text>
          {initError && (
            <Alert
              message="初始化错误"
              description={initError}
              type="error"
              showIcon
              style={{ marginTop: 16, maxWidth: '600px' }}
              action={
                <Button size="small" onClick={() => window.location.reload()}>
                  重试
                </Button>
              }
            />
          )}
        </div>
      </Layout>
    )
  }

  return (
    <ErrorBoundary>
      <Layout className="kanban-container">
        <Header className="kanban-header">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            padding: '0 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title level={2} style={{
                margin: 0,
                color: '#1890ff',
                lineHeight: '64px',
                marginRight: 16
              }}>
                喷漆二工段任务分配可视化系统
              </Title>

              {/* 数据库状态指示器 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DatabaseOutlined
                  style={{
                    color: dbStatus.isInitialized ? '#52c41a' : '#faad14',
                    marginRight: 4
                  }}
                />
                <Text style={{
                  fontSize: 12,
                  color: dbStatus.isInitialized ? '#52c41a' : '#faad14'
                }}>
                  {dbStatus.isInitialized ? 'SQLite' : 'localStorage'}
                </Text>
                {totalTasks > 0 && (
                  <Text style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                    {totalTasks} 个任务
                  </Text>
                )}
              </div>
            </div>

            <Space size="large">
              <FontSizeSettings />
              <KeepScreenAwake />
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                导入任务
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出Excel
              </Button>
              <Button
                icon={<DatabaseOutlined />}
                onClick={() => setDbManagementVisible(true)}
              >
                数据管理
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={handleCreatePortablePackage}
              >
                便携包
              </Button>
            </Space>
          </div>
        </Header>

        {/* 状态提示 */}
        {dbStatus.usingLocalStorage && dbStatus.errorMessage && (
          <Alert
            message="数据库模式提醒"
            description={`当前使用localStorage存储模式。SQLite初始化失败: ${dbStatus.errorMessage}`}
            type="warning"
            showIcon
            style={{ margin: '16px 24px 0' }}
          />
        )}

        <Content className="kanban-content">
          <MasterGanttView
            tasks={tasks}
            onTasksChange={handleTasksChange}
          />
        </Content>

        <ImportModal
          visible={importModalVisible}
          onCancel={() => setImportModalVisible(false)}
          onImport={handleImport}
        />

        {dbManagementVisible && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90%',
              overflow: 'auto',
              position: 'relative'
            }}>
              <button
                onClick={() => setDbManagementVisible(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  zIndex: 1001
                }}
              >
                ×
              </button>
              <DatabaseManagement />
            </div>
          </div>
        )}
      </Layout>
    </ErrorBoundary>
  )
}

export default App
