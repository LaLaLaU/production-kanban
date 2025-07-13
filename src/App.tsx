import { useState, useEffect } from 'react'
import { Layout, Typography, Space, Button, message } from 'antd'
import { UploadOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import MasterGanttView from './components/MasterGanttView'
import ImportModal from './components/ImportModal'
import type { Task } from './types'
import { LocalStorageService } from './services/localStorage'

const { Header, Content } = Layout
const { Title } = Typography

function App() {
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [coefficient, setCoefficient] = useState(1.2)

  useEffect(() => {
    const savedTasks = LocalStorageService.loadTasks()
    setTasks(savedTasks)
    
    const savedSettings = LocalStorageService.loadUserSettings()
    setCoefficient(savedSettings.coefficient)
  }, [])

  const handleTasksChange = (newTasks: Task[]) => {
    setTasks(newTasks)
    LocalStorageService.saveTasks(newTasks)
  }

  // 保留coefficient相关代码以兼容性，但现在每个任务有自己的系数
  const handleCoefficientChange = (newCoefficient: number) => {
    setCoefficient(newCoefficient)
    LocalStorageService.saveUserSettings({ coefficient: newCoefficient })
  }

  const handleImport = (importedTasks: Task[]) => {
    const updatedTasks = [...tasks, ...importedTasks]
    handleTasksChange(updatedTasks)
  }

  const handleExport = () => {
    try {
      const exportData = tasks.map(task => ({
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
                task.status === 'inProgress' ? '进行中' : '已完成'
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '生产任务')

      const fileName = `生产看板数据_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
      message.success('数据导出成功')
    } catch (error) {
      message.error('数据导出失败')
      console.error('Export error:', error)
    }
  }

  return (
    <Layout className="kanban-container">
      <Header className="kanban-header">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          height: '100%',
          padding: '0 24px'
        }}>
          <Title level={2} style={{ 
            margin: 0, 
            color: '#1890ff',
            lineHeight: '64px'
          }}>
            喷漆二工段任务分配可视化系统
          </Title>
          <Space size="large">
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
              导出备份
            </Button>
            <Button icon={<SettingOutlined />}>
              设置
            </Button>
          </Space>
        </div>
      </Header>
      <Content className="kanban-content">
        <MasterGanttView 
          tasks={tasks} 
          coefficient={coefficient}
          onTasksChange={handleTasksChange}
        />
      </Content>
      
      <ImportModal
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onImport={handleImport}
      />
    </Layout>
  )
}

export default App