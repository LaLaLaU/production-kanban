import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Button, 
  Space, 
  Typography, 
  Card, 
  Statistic, 
  Upload, 
  message, 
  Divider,
  Alert,
  Row,
  Col,
  Tooltip,
  Progress
} from 'antd'
import { 
  DatabaseOutlined, 
  UploadOutlined, 
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  SaveOutlined,
  HddOutlined,
  CloudDownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { sqliteService } from '../services/sqliteService'
import { DataMigrationService } from '../services/dataMigration'
import { LocalStorageService } from '../services/localStorage'

const { Text, Paragraph } = Typography
const { Dragger } = Upload

interface DatabaseManagementProps {
  visible: boolean
  onCancel: () => void
  dbStatus: {
    isInitialized: boolean
    usingLocalStorage: boolean
    errorMessage?: string
  }
  onDatabaseExport: () => void
  onCreatePortablePackage: () => void
  onRefresh: () => void
}

interface HealthStatus {
  isInitialized: boolean
  dbSize: number
  tableCount: number
  lastSave: string | null
  version: number
}

interface StorageInfo {
  used: number
  available: number
}

const DatabaseManagement: React.FC<DatabaseManagementProps> = ({
  visible,
  onCancel,
  dbStatus,
  onDatabaseExport,
  onCreatePortablePackage,
  onRefresh
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({ used: 0, available: 0 })
  const [migrationLoading, setMigrationLoading] = useState(false)
  const [storageLoading, setStorageLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      loadHealthStatus()
      loadStorageInfo()
    }
  }, [visible])

  const loadHealthStatus = async () => {
    try {
      const result = await sqliteService.healthCheck()
      if (result.success && result.data) {
        setHealthStatus(result.data)
      }
    } catch (error) {
      console.error('获取健康状态失败:', error)
    }
  }

  const loadStorageInfo = async () => {
    try {
      setStorageLoading(true)
      // 使用setTimeout避免阻塞UI线程
      setTimeout(() => {
        try {
          const info = LocalStorageService.getStorageInfo()
          setStorageInfo(info)
        } catch (error) {
          console.error('获取存储信息失败:', error)
          // 设置默认值避免显示错误
          setStorageInfo({ used: 0, available: 0 })
        } finally {
          setStorageLoading(false)
        }
      }, 100) // 稍微延迟一下，让加载状态显示
    } catch (error) {
      console.error('获取存储信息失败:', error)
      setStorageInfo({ used: 0, available: 0 })
      setStorageLoading(false)
    }
  }

  const handleManualMigration = async () => {
    try {
      setMigrationLoading(true)
      message.loading('正在迁移数据...', 0)

      const result = await DataMigrationService.migrateFromLocalStorage()
      
      message.destroy()
      
      if (result.success) {
        message.success(result.message)
        onRefresh()
        loadHealthStatus()
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.destroy()
      message.error('迁移过程中发生错误')
      console.error('手动迁移失败:', error)
    } finally {
      setMigrationLoading(false)
    }
  }

  const handleImportPortablePackage = async (file: File) => {
    try {
      message.loading('正在导入便携包...', 0)

      const text = await file.text()
      const result = await DataMigrationService.importPortablePackage(text)
      
      message.destroy()
      
      if (result.success) {
        message.success(result.message)
        onRefresh()
        loadHealthStatus()
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.destroy()
      message.error('导入便携包失败')
      console.error('导入便携包失败:', error)
    }
    
    return false // 阻止默认上传行为
  }

  const handleClearLocalStorage = () => {
    Modal.confirm({
      title: '确认清除本地数据',
      content: '此操作将清除所有localStorage中的数据，确保已做好备份。是否继续？',
      onOk: () => {
        try {
          LocalStorageService.clearAllData()
          message.success('本地数据已清除')
          loadStorageInfo()
        } catch (error) {
          message.error('清除数据失败')
          console.error('清除本地数据失败:', error)
        }
      }
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStorageUsagePercentage = () => {
    if (storageInfo.available === 0) return 0
    return Math.round((storageInfo.used / (storageInfo.used + storageInfo.available)) * 100)
  }

  return (
    <Modal
      title={
        <Space>
          <DatabaseOutlined />
          数据库管理
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={() => {
          loadHealthStatus()
          loadStorageInfo()
          onRefresh()
        }}>
          刷新状态
        </Button>,
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 数据库状态概览 */}
        <Card title="数据库状态" size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="存储模式"
                value={dbStatus.isInitialized ? 'SQLite' : 'localStorage'}
                prefix={<DatabaseOutlined style={{ color: dbStatus.isInitialized ? '#52c41a' : '#faad14' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="数据库大小"
                value={formatBytes(healthStatus?.dbSize || 0)}
                prefix={<HddOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="表数量"
                value={healthStatus?.tableCount || 0}
                prefix={<DatabaseOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="版本"
                value={"v" + (healthStatus?.version || 1)}
              />
            </Col>
          </Row>

          {healthStatus?.lastSave && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                最后保存时间: {new Date(healthStatus.lastSave).toLocaleString()}
              </Text>
            </div>
          )}

          {dbStatus.errorMessage && (
            <Alert
              message="数据库初始化失败"
              description={dbStatus.errorMessage}
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>

        {/* 存储空间使用 */}
        <Card 
          title="本地存储使用情况" 
          size="small"
          loading={storageLoading}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="已使用空间"
                value={formatBytes(storageInfo.used)}
                prefix={<SaveOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="可用空间"
                value={formatBytes(storageInfo.available)}
                prefix={<HddOutlined />}
              />
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <Text>存储使用率</Text>
            <Progress 
              percent={getStorageUsagePercentage()} 
              status={getStorageUsagePercentage() > 80 ? 'exception' : 'normal'}
              style={{ marginBottom: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getStorageUsagePercentage()}% 已使用
            </Text>
          </div>
        </Card>

        <Divider />

        {/* 数据迁移 */}
        <Card title="数据迁移" size="small">
          <Paragraph type="secondary">
            可以在不同存储模式之间迁移数据，或导入/导出便携包用于跨设备部署。
          </Paragraph>
          
          <Space wrap>
            <Tooltip title="将localStorage数据迁移到SQLite数据库">
              <Button
                icon={<ImportOutlined />}
                loading={migrationLoading}
                onClick={handleManualMigration}
                disabled={dbStatus.isInitialized}
              >
                迁移到SQLite
              </Button>
            </Tooltip>

            <Tooltip title="导出当前数据库为JSON格式">
              <Button
                icon={<ExportOutlined />}
                onClick={onDatabaseExport}
              >
                导出数据库
              </Button>
            </Tooltip>

            <Tooltip title="创建便携包，可复制到U盘使用">
              <Button
                icon={<CloudDownloadOutlined />}
                onClick={onCreatePortablePackage}
                type="primary"
              >
                创建便携包
              </Button>
            </Tooltip>
          </Space>
        </Card>

        {/* 便携包导入 */}
        <Card title="便携包导入" size="small">
          <Paragraph type="secondary">
            选择便携包文件(.json)导入数据，适用于从其他设备迁移数据。
          </Paragraph>
          
          <Dragger
            name="portablePackage"
            accept=".json"
            beforeUpload={handleImportPortablePackage}
            showUploadList={false}
            style={{ padding: '20px' }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽便携包文件到此区域</p>
            <p className="ant-upload-hint">
              支持 .json 格式的便携包文件
            </p>
          </Dragger>
        </Card>

        <Divider />

        {/* 危险操作 */}
        <Card title="危险操作" size="small">
          <Alert
            message="危险操作"
            description="以下操作可能导致数据丢失，请谨慎操作并确保已做好备份。"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Space>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearLocalStorage}
            >
              清除本地存储
            </Button>
          </Space>
        </Card>

      </Space>
    </Modal>
  )
}

export default DatabaseManagement