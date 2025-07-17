import { DatabaseOutlined, DeleteOutlined, DownloadOutlined, InfoCircleOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Descriptions, Space, Tabs, Typography, Upload, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { databaseAdapter, type StorageMode } from '../services/databaseAdapter'
import { DataSyncHelper } from '../utils/dataSyncHelper'

const { Title, Text } = Typography
const { TabPane } = Tabs

interface StorageStats {
  mode: StorageMode
  size: number
  lastBackup?: string
  lastImport?: string
  hasBackup: boolean
}

interface UnifiedDataManagementProps {
  onDataImported?: () => void
}

const UnifiedDataManagement: React.FC<UnifiedDataManagementProps> = ({ onDataImported }) => {
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [dbStats, setDbStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('sync')

  useEffect(() => {
    updateStorageInfo()
    loadDbStats()
  }, [])

  const updateStorageInfo = () => {
    const info = DataSyncHelper.getStorageInfo()
    setStorageInfo(info)
  }

  const loadDbStats = async () => {
    try {
      const stats = await databaseAdapter.getStorageStats()
      setDbStats(stats)
    } catch (error) {
      console.error('加载数据库统计失败:', error)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  // 数据同步功能
  const handleSyncExport = async () => {
    try {
      setLoading(true)
      await DataSyncHelper.exportAllData()
      message.success('数据导出成功！文件已下载到您的下载文件夹')
    } catch (error) {
      message.error('数据导出失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncImport = async (file: File) => {
    try {
      setLoading(true)
      const success = await DataSyncHelper.importAllData(file)
      if (success) {
        message.success('数据导入成功！页面将刷新以加载新数据')
        updateStorageInfo()
        onDataImported?.()
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        message.error('数据导入失败，请检查文件格式')
      }
    } catch (error) {
      message.error('数据导入失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
    return false
  }

  // 数据库管理功能
  const handleDbExport = async () => {
    setLoading(true)
    try {
      await databaseAdapter.exportToFile()
      message.success('数据库文件导出成功！')
      await loadDbStats()
    } catch (error) {
      message.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDbImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.db')) {
      message.error('请选择 .db 格式的数据库文件')
      return
    }

    setLoading(true)
    try {
      await databaseAdapter.importFromFile(file)
      message.success('数据库导入成功！页面将刷新以加载新数据')
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      message.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    setLoading(true)
    try {
      await databaseAdapter.autoBackup()
      message.success('手动备份完成')
      await loadDbStats()
    } catch (error) {
      message.error(`备份失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClearData = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      DataSyncHelper.clearAllData()
      message.success('数据已清除')
      updateStorageInfo()
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const handleCleanupStorage = async () => {
    if (!confirm('确定要清理localStorage备份数据吗？这将删除所有备份文件（不影响当前数据）')) {
      return
    }

    setLoading(true)
    try {
      await databaseAdapter.cleanupLocalStorage()
      message.success('localStorage清理完成')
      await loadDbStats()
    } catch (error) {
      message.error(`清理失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="数据管理中心" style={{ margin: '20px 0' }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 数据同步标签页 */}
        <TabPane tab={<span><SyncOutlined />数据同步</span>} key="sync">
          <Alert
            message="数据同步说明"
            description={
              <div>
                <p>• 不同的URL地址（如localhost:3001和192.168.1.2:3002）有独立的数据存储空间</p>
                <p>• 使用此功能可以在不同地址之间同步数据</p>
                <p>• 导出格式：JSON文件，包含所有应用数据</p>
              </div>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />

          {storageInfo && (
            <Descriptions
              title="当前存储状态"
              bordered
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="当前地址">
                <Text code>{storageInfo.currentUrl}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="是否有数据">
                <Text type={storageInfo.hasData ? 'success' : 'warning'}>
                  {storageInfo.hasData ? '有数据' : '无数据'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="任务数量">
                <Text strong>{storageInfo.taskCount}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="SQLite数据">
                <Text type={storageInfo.hasSQLiteData ? 'success' : 'warning'}>
                  {storageInfo.hasSQLiteData ? '已初始化' : '未初始化'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="存储大小" span={2}>
                <Text>{formatSize(storageInfo.storageSize)}</Text>
              </Descriptions.Item>
            </Descriptions>
          )}

          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Title level={4}>导出数据（JSON格式）</Title>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleSyncExport}
                loading={loading}
                disabled={!storageInfo?.hasData}
              >
                导出所有数据
              </Button>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                将当前所有数据导出为JSON文件，用于跨URL同步
              </Text>
            </div>

            <div>
              <Title level={4}>导入数据（JSON格式）</Title>
              <Upload
                accept=".json"
                beforeUpload={handleSyncImport}
                showUploadList={false}
                disabled={loading}
              >
                <Button icon={<UploadOutlined />} loading={loading}>
                  选择JSON文件导入
                </Button>
              </Upload>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                从JSON文件导入数据，用于跨URL同步
              </Text>
            </div>
          </Space>
        </TabPane>

        {/* 数据库管理标签页 */}
        <TabPane tab={<span><DatabaseOutlined />数据库管理</span>} key="database">
          <Alert
            message="数据库管理说明"
            description={
              <div>
                <p>• 管理SQLite数据库文件的导入导出</p>
                <p>• 创建和管理数据库备份</p>
                <p>• 导出格式：.db文件，原生数据库格式</p>
              </div>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />

          {dbStats && (
            <Descriptions
              title="数据库状态"
              bordered
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="存储方式">
                <Text code>{dbStats.mode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="数据库大小">
                <Text strong>{dbStats.size.toFixed(2)} MB</Text>
              </Descriptions.Item>
              {dbStats.lastBackup && (
                <Descriptions.Item label="上次备份">
                  <Text>{new Date(dbStats.lastBackup).toLocaleString()}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="本地备份">
                <Text type={dbStats.hasBackup ? 'success' : 'warning'}>
                  {dbStats.hasBackup ? '✅ 有备份' : '⚠️ 无备份'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          )}

          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Title level={4}>导出数据库（.db格式）</Title>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDbExport}
                loading={loading}
              >
                导出数据库文件
              </Button>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                导出原生SQLite数据库文件
              </Text>
            </div>

            <div>
              <Title level={4}>导入数据库（.db格式）</Title>
              <label style={{
                display: 'inline-block',
                padding: '6px 15px',
                background: '#28a745',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                <UploadOutlined /> 选择数据库文件
                <input
                  type="file"
                  accept=".db"
                  onChange={handleDbImport}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
              </label>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                导入SQLite数据库文件
              </Text>
            </div>

            <div>
              <Title level={4}>备份管理</Title>
              <Space>
                <Button
                  icon={<DatabaseOutlined />}
                  onClick={handleBackup}
                  loading={loading}
                >
                  手动备份
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleCleanupStorage}
                  loading={loading}
                >
                  清理备份
                </Button>
              </Space>
            </div>
          </Space>
        </TabPane>

        {/* 数据清理标签页 */}
        <TabPane tab={<span><DeleteOutlined />数据清理</span>} key="cleanup">
          <Alert
            message="数据清理警告"
            description="以下操作将永久删除数据，请谨慎操作！建议在清理前先导出备份。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Title level={4}>清除所有数据</Title>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearData}
                disabled={loading}
              >
                清除所有数据
              </Button>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                清除当前地址的所有任务和设置数据
              </Text>
            </div>
          </Space>
        </TabPane>
      </Tabs>
    </Card>
  )
}

export default UnifiedDataManagement
