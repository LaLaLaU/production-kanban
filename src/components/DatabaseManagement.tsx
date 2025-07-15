import React, { useEffect, useState } from 'react'
import { databaseAdapter, type StorageMode } from '../services/databaseAdapter'

interface StorageStats {
  mode: StorageMode
  size: number
  lastBackup?: string
  lastImport?: string
  hasBackup: boolean
}

export const DatabaseManagement: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 加载存储统计
  const loadStats = async () => {
    try {
      const storageStats = await databaseAdapter.getStorageStats()
      setStats(storageStats)
    } catch (error) {
      console.error('加载存储统计失败:', error)
    }
  }

  // 显示消息
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // 导出数据库
  const handleExport = async () => {
    setLoading(true)
    try {
      await databaseAdapter.exportToFile()
      showMessage('success', '数据库导出成功！文件已下载到您的下载文件夹')
      await loadStats()
    } catch (error) {
      showMessage('error', `导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 导入数据库
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.db')) {
      showMessage('error', '请选择 .db 格式的数据库文件')
      return
    }

    setLoading(true)
    try {
      await databaseAdapter.importFromFile(file)
      showMessage('success', '数据库导入成功！页面将刷新以加载新数据')

      // 刷新页面以重新加载数据
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      showMessage('error', `导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 手动备份
  const handleBackup = async () => {
    setLoading(true)
    try {
      await databaseAdapter.autoBackup()
      showMessage('success', '手动备份完成')
      await loadStats()
    } catch (error) {
      showMessage('error', `备份失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 清理localStorage
  const handleCleanup = async () => {
    if (!confirm('确定要清理localStorage备份数据吗？这将删除所有备份文件（不影响当前数据）')) {
      return
    }

    setLoading(true)
    try {
      await databaseAdapter.cleanupLocalStorage()
      showMessage('success', 'localStorage清理完成')
      await loadStats()
    } catch (error) {
      showMessage('error', `清理失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 获取存储建议
  const getStorageRecommendation = () => {
    if (!stats) return null

    if (stats.size > 5) {
      return {
        type: 'warning' as const,
        text: `数据库较大 (${stats.size.toFixed(2)} MB)，建议定期导出备份文件`
        }
      }

    if (stats.size > 2) {
      return {
        type: 'info' as const,
        text: `数据库正常 (${stats.size.toFixed(2)} MB)，建议启用自动备份`
      }
    }

    return {
      type: 'success' as const,
      text: `数据库轻量 (${stats.size.toFixed(2)} MB)，当前存储方式适合`
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const recommendation = getStorageRecommendation()

  return (
    <div className="database-management">
      <div className="management-header">
        <h3>数据库管理</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="toggle-advanced"
        >
          {showAdvanced ? '隐藏高级选项' : '显示高级选项'}
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 存储统计 */}
      {stats && (
        <div className="storage-stats">
          <div className="stat-item">
            <label>存储方式:</label>
            <span className="storage-mode">{stats.mode}</span>
          </div>
          <div className="stat-item">
            <label>数据库大小:</label>
            <span className="storage-size">{stats.size.toFixed(2)} MB</span>
          </div>
          {stats.lastBackup && (
            <div className="stat-item">
              <label>上次备份:</label>
              <span>{new Date(stats.lastBackup).toLocaleString()}</span>
            </div>
          )}
          {stats.hasBackup && (
            <div className="stat-item">
              <label>本地备份:</label>
              <span className="has-backup">✅ 有备份</span>
            </div>
          )}
        </div>
      )}

      {/* 存储建议 */}
      {recommendation && (
        <div className={`recommendation recommendation-${recommendation.type}`}>
          <strong>建议:</strong> {recommendation.text}
        </div>
          )}

      {/* 基本操作 */}
      <div className="basic-operations">
        <button
          onClick={handleExport}
          disabled={loading}
          className="export-btn"
        >
          {loading ? '导出中...' : '📁 导出数据库文件'}
        </button>

        <label className="import-btn">
          📂 导入数据库文件
          <input
            type="file"
            accept=".db"
            onChange={handleImport}
            disabled={loading}
            style={{ display: 'none' }}
          />
        </label>

        <button
          onClick={handleBackup}
          disabled={loading}
          className="backup-btn"
        >
          {loading ? '备份中...' : '💾 手动备份'}
        </button>
      </div>

      {/* 高级选项 */}
      {showAdvanced && (
        <div className="advanced-options">
          <h4>高级选项</h4>

          <div className="advanced-actions">
            <button
              onClick={handleCleanup}
              disabled={loading}
              className="cleanup-btn"
            >
              🧹 清理localStorage
            </button>

            <button
              onClick={loadStats}
              disabled={loading}
              className="refresh-btn"
            >
              🔄 刷新统计
            </button>
          </div>

          <div className="storage-info">
            <h5>存储方式说明:</h5>
            <ul>
              <li><strong>localStorage:</strong> 数据存储在浏览器中，访问快速但有大小限制</li>
              <li><strong>file:</strong> 数据存储在独立文件中，容量大但需要手动管理</li>
              <li><strong>hybrid:</strong> 结合两种方式的优点</li>
            </ul>
          </div>
        </div>
      )}

      <style>{`
        .database-management {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .management-header h3 {
          margin: 0;
          color: #333;
        }

        .toggle-advanced {
          background: #f0f0f0;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .toggle-advanced:hover {
          background: #e0e0e0;
        }

        .message {
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .message-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .message-info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .storage-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-item label {
          font-weight: 500;
          color: #666;
        }

        .storage-mode {
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .storage-size {
          font-weight: bold;
          color: #333;
        }

        .has-backup {
          color: #28a745;
          font-weight: bold;
        }

        .recommendation {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .recommendation-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .recommendation-warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .recommendation-info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .basic-operations {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .basic-operations button,
        .basic-operations label {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .export-btn {
          background: #007bff;
          color: white;
        }

        .export-btn:hover:not(:disabled) {
          background: #0056b3;
        }

        .import-btn {
          background: #28a745;
          color: white;
          display: inline-block;
        }

        .import-btn:hover {
          background: #1e7e34;
        }

        .backup-btn {
          background: #ffc107;
          color: #212529;
        }

        .backup-btn:hover:not(:disabled) {
          background: #e0a800;
        }

        .advanced-options {
          border-top: 1px solid #dee2e6;
          padding-top: 20px;
        }

        .advanced-options h4 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .advanced-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .cleanup-btn {
          background: #dc3545;
          color: white;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .cleanup-btn:hover:not(:disabled) {
          background: #c82333;
        }

        .refresh-btn {
          background: #6c757d;
          color: white;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #5a6268;
        }

        .storage-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
        }

        .storage-info h5 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .storage-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .storage-info li {
          margin-bottom: 5px;
          font-size: 13px;
          color: #666;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .storage-stats {
            grid-template-columns: 1fr;
          }

          .basic-operations {
            flex-direction: column;
          }

          .advanced-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default DatabaseManagement
