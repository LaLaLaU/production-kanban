import React, { useState } from 'react'
import {
  Modal,
  Upload,
  Button,
  Table,
  Select,
  Space,
  Typography,
  Alert,
  Steps,
  Row,
  Col,
  Statistic,
  message
} from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { FileImportService } from '../services/fileImport'
import { MasterAssignmentService } from '../services/masterAssignment'
import type { Task } from '../types'
import type { ColumnMapping } from '../types/import'

const { Text } = Typography
const { Dragger } = Upload
const { Step } = Steps

// 17名师傅列表
const MASTERS = [
  '潘敏', '黄尚斌', '钱伟', '蒋怀东', '江峰', '谢守刚', '周博', '秦龙', '王章良',
  '叶佩珺', '李雪', '昂洪涛', '刘庆', '王家龙', '叶建辉', '魏祯', '杨同'
]

interface ImportModalProps {
  visible: boolean
  onCancel: () => void
  onImport: (tasks: Task[]) => void
}

const ImportModal: React.FC<ImportModalProps> = ({ visible, onCancel, onImport }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [fileData, setFileData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [previewTasks, setPreviewTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([]) // 存储所有任务数据

  const fieldOptions = [
    { label: '产品名称', value: 'productName' },
    { label: '产品图号', value: 'productCode' },
    { label: '工时(分钟)', value: 'workHours' },
    { label: '师傅', value: 'masterName' },
    { label: '架次号', value: 'batchNumber' },
    { label: '委托方', value: 'clientName' },
    { label: '委托时间', value: 'commitTime' },
    { label: '优先级', value: 'priority' },
    { label: '不导入', value: '' }
  ]

  const masterOptions = [
    { label: <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>待分配</span>, value: '待分配' },
    ...MASTERS.map(master => ({ label: master, value: master }))
  ]

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls,.csv',
    beforeUpload: async (file: UploadFile) => {
      try {
        const data = await FileImportService.parseFile(file as unknown as File)
        const extractedHeaders = FileImportService.extractHeaders(data)
        const detectedMapping = FileImportService.detectColumnMapping(extractedHeaders)
        
        setFileData(data)
        setHeaders(extractedHeaders)
        setColumnMapping(detectedMapping)
        setCurrentStep(1)
        
        message.success(`成功解析文件，检测到 ${extractedHeaders.length} 列数据`)
      } catch (error) {
        message.error(`文件解析失败: ${error}`)
      }
      return false
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    }
  }

  const handleMappingChange = (header: string, field: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [header]: field
    }))
  }

  const generatePreview = () => {
    try {
      let tasks = FileImportService.mapDataToTasks(fileData, columnMapping)
      tasks = MasterAssignmentService.suggestMasterForImport(tasks)
      setAllTasks(tasks) // 保存所有任务
      setPreviewTasks(tasks.slice(0, 10)) // 只显示前10条预览
      setCurrentStep(2)
      
      const stats = MasterAssignmentService.getAssignmentStats(tasks)
      message.success(`成功映射数据，将导入 ${tasks.length} 条任务，其中 ${stats.autoAssigned} 条已智能分配师傅（${stats.byProductCode} 条通过产品图号，${stats.byProductName} 条通过产品名称）`)
    } catch (error) {
      message.error(`数据映射失败: ${error}`)
    }
  }

  // 处理单个任务的责任人变更
  const handleTaskMasterChange = (taskId: string, newMaster: string) => {
    // 更新所有任务数据
    const updatedAllTasks = allTasks.map(task => 
      task.id === taskId ? { ...task, masterName: newMaster } : task
    )
    setAllTasks(updatedAllTasks)
    
    // 更新预览数据
    const updatedPreviewTasks = previewTasks.map(task => 
      task.id === taskId ? { ...task, masterName: newMaster } : task
    )
    setPreviewTasks(updatedPreviewTasks)
  }

  const handleImport = () => {
    try {
      // 在导入前，先学习用户的分配选择
      allTasks.forEach(task => {
        if (task.masterName && task.masterName !== '待分配') {
          MasterAssignmentService.updateAssignment(task.productName, task.masterName, task.productCode)
        }
      })
      
      onImport(allTasks) // 导入所有任务（包括用户修改的责任人）
      
      const stats = MasterAssignmentService.getAssignmentStats(allTasks)
      handleReset()
      onCancel()
      
      message.success(`成功导入 ${allTasks.length} 条任务！智能分配 ${stats.autoAssigned} 条（产品图号匹配 ${stats.byProductCode} 条，产品名称匹配 ${stats.byProductName} 条），手动分配 ${stats.manual} 条。系统已学习您的分配选择。`)
    } catch (error) {
      message.error(`导入失败: ${error}`)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setFileData([])
    setHeaders([])
    setColumnMapping({})
    setPreviewTasks([])
    setAllTasks([])
  }

  const mappingColumns = [
    {
      title: '文件列名',
      dataIndex: 'header',
      key: 'header',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '映射到字段',
      dataIndex: 'mapping',
      key: 'mapping',
      render: (_: any, record: { header: string }) => (
        <Select
          style={{ width: '100%' }}
          placeholder="选择对应字段"
          value={columnMapping[record.header] || ''}
          onChange={(value) => handleMappingChange(record.header, value)}
          options={fieldOptions}
        />
      )
    },
    {
      title: '示例数据',
      dataIndex: 'sample',
      key: 'sample',
      render: (_: any, record: { header: string }) => {
        const headerIndex = headers.indexOf(record.header)
        const sampleData = fileData[1] ? fileData[1][headerIndex] : ''
        return <Text type="secondary">{sampleData || '无数据'}</Text>
      }
    }
  ]

  const previewColumns = [
    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
    { title: '产品图号', dataIndex: 'productCode', key: 'productCode' },
    { title: '工时', dataIndex: 'workHours', key: 'workHours' },
    { 
      title: '责任人', 
      dataIndex: 'masterName', 
      key: 'masterName',
      render: (masterName: string, record: Task) => (
        <Select
          style={{ width: '100%' }}
          value={masterName}
          onChange={(value) => handleTaskMasterChange(record.id, value)}
          options={masterOptions}
        />
      )
    },
    { title: '架次号', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: '委托方', dataIndex: 'clientName', key: 'clientName' }
  ]

  const mappingData = headers.map(header => ({
    key: header,
    header,
    mapping: columnMapping[header] || ''
  }))

  return (
    <Modal
      title="导入任务数据"
      open={visible}
      onCancel={() => {
        handleReset()
        onCancel()
      }}
      width={900}
      footer={null}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="选择文件" description="上传Excel或CSV文件" />
        <Step title="字段映射" description="配置列名对应关系" />
        <Step title="预览确认" description="预览导入数据并选择责任人" />
      </Steps>

      {currentStep === 0 && (
        <div>
          <Alert
            message="支持的文件格式"
            description="支持 .xlsx, .xls, .csv 格式文件。请确保文件第一行为列标题。"
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个文件上传，请选择包含任务数据的Excel或CSV文件
            </p>
          </Dragger>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Alert
            message="配置字段映射"
            description="请为每个文件列选择对应的系统字段。系统已自动检测并预填了可能的映射关系。"
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={mappingColumns}
            dataSource={mappingData}
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Button onClick={() => setCurrentStep(0)}>上一步</Button>
            <Button 
              type="primary" 
              onClick={generatePreview}
              disabled={Object.values(columnMapping).filter(v => v).length === 0}
            >
              下一步：预览数据
            </Button>
          </Space>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic title="总数据行数" value={fileData.length - 1} />
            </Col>
            <Col span={6}>
              <Statistic title="将导入任务" value={allTasks.length} />
            </Col>
            <Col span={6}>
              <Statistic 
                title="智能分配" 
                value={MasterAssignmentService.getAssignmentStats(allTasks).autoAssigned} 
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="待手动分配" 
                value={MasterAssignmentService.getAssignmentStats(allTasks).manual} 
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>

          <Alert
            message="数据预览与责任人选择"
            description="以下是前10条数据的预览，您可以为每个任务选择责任人。确认无误后点击导入按钮。"
            type="success"
            style={{ marginBottom: 16 }}
          />

          <Table
            columns={previewColumns}
            dataSource={previewTasks}
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          />

          <Space>
            <Button onClick={() => setCurrentStep(1)}>上一步</Button>
            <Button type="primary" onClick={handleImport}>
              确认导入
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  )
}

export default ImportModal