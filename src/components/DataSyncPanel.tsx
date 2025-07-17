import { DeleteOutlined, DownloadOutlined, InfoCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Descriptions, Divider, message, Space, Typography, Upload } from 'antd'
import React, { useEffect, useState } from 'react'
import { DataSyncHelper } from '../utils/dataSyncHelper'

const { Title, Text } = Typography

interface DataSyncPanelProps {
  onDataImported?: () => void
}

const DataSyncPanel: React.FC<DataSyncPanelProps> = ({ onDataImported }) => {
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    updateStorageInfo()
  }, [])

  const updateStorageInfo = () => {
    const info = DataSyncHelper.getStorageInfo()
    setStorageInfo(info)
  }

  const handleExport = async () => {
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

  const handleImport = async (file: File) => {
    try {
      setLoading(true)
      const success = await DataSyncHelper.importAllData(file)
      if (success) {
        message.success('数据导入成功！页面将刷新以加载新数据')
        updateStorageInfo()
        onDataImported?.()
        // 延迟刷新页面
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
    return false // 阻止默认上传行为
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <Card title="数据同步工具" style={{ margin: '20px 0' }}>
      <Alert
        message="数据存储说明"
        description={
          <div>
            <p>• 不同的URL地址（如localhost:3001和192.168.1.2:3002）有独立的数据存储空间</p>
            <p>• 使用此工具可以在不同地址之间同步数据</p>
            <p>• 建议定期导出数据作为备份</p>
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

      <Divider />

      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={4}>导出数据</Title>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={loading}
            disabled={!storageInfo?.hasData}
          >
            导出所有数据
          </Button>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            将当前所有数据导出为JSON文件
          </Text>
        </div>

        <div>
          <Title level={4}>导入数据</Title>
          <Upload
            accept=".json"
            beforeUpload={handleImport}
            showUploadList={false}
            disabled={loading}
          >
            <Button icon={<UploadOutlined />} loading={loading}>
              选择数据文件导入
            </Button>
          </Upload>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            从JSON文件导入数据（会覆盖当前数据）
          </Text>
        </div>

        <div>
          <Title level={4}>清除数据</Title>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearData}
            disabled={loading}
          >
            清除所有数据
          </Button>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            清除当前地址的所有数据
          </Text>
        </div>
      </Space>
    </Card>
  )
}

export default DataSyncPanel
