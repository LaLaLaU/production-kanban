import { CalendarOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { Card, Space, Tag, Typography } from 'antd'
import React from 'react'
import type { Task } from '../types'

const { Text } = Typography

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const taskCoefficient = task.coefficient || 1 // 使用任务自己的系数，默认为1
  const adjustedWorkHours = task.workHours * taskCoefficient
  const cardHeight = Math.max(80, Math.min(200, adjustedWorkHours * 0.8))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#faad14'
      case 'inProgress': return '#1890ff'
      case 'completed': return '#52c41a'
      default: return '#d9d9d9'
    }
  }

  const getPriorityTag = (priority: number) => {
    if (priority >= 8) return <Tag color="red">紧急</Tag>
    if (priority >= 5) return <Tag color="orange">重要</Tag>
    return null
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(task)
  }

  return (
    <Card
      size="small"
      style={{
        height: cardHeight,
        marginBottom: 8,
        borderLeft: `4px solid ${getStatusColor(task.status)}`,
        cursor: 'grab',
        position: 'relative',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '12px', position: 'relative', zIndex: 1 }}
      onDoubleClick={handleDoubleClick}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            双击编辑师傅分配
          </Text>
        </div>
      }
    >
      {/* 水位指示器 */}
      <WaterLevelIndicator
        commitTime={task.commitTime}
        height={cardHeight}
        maxDays={30}
      />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text strong style={{ fontSize: '14px' }}>
            {task.productName}
          </Text>
          {getPriorityTag(task.priority)}
        </div>

        <Space direction="vertical" size={4} style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ClockCircleOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {adjustedWorkHours.toFixed(0)}分钟 (系数{taskCoefficient}x)
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {task.masterName}
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {task.batchNumber}
            </Text>
          </div>
        </Space>

        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {task.clientName} · {task.commitTime}
          </Text>
        </div>
      </div>
    </Card>
  )
}

export default TaskCard
