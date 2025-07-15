import React, { useMemo, useState, useEffect } from 'react'
import { Card, Typography, Row, Col, Space, Tooltip } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import TaskEditModal from './TaskEditModal'
import type { Task } from '../types'

const { Title, Text } = Typography

interface MasterGanttViewProps {
  tasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
}

// 17名师傅的固定列表
const MASTERS = [
  '潘敏', '黄尚斌', '钱伟', '蒋怀东', '江峰', '谢守刚', '周博', '秦龙', '王章良',
  '叶佩珺', '李雪', '昂洪涛', '刘庆', '王家龙', '叶建辉', '魏祯', '杨同'
]

// 根据优先级获取颜色
const getPriorityColor = (priority: number): string => {
  if (priority >= 8) return '#ff4d4f' // 高优先级 - 红色
  if (priority >= 5) return '#faad14' // 中优先级 - 橙色
  return '#52c41a' // 低优先级 - 绿色
}



// 任务条组件
const TaskBar: React.FC<{
  task: Task
  maxWidth: number
  onEdit?: (task: Task) => void
  barHeight?: number // 任务条高度
}> = ({ task, maxWidth, onEdit, barHeight = 16 }) => {
  const taskCoefficient = task.coefficient || 1 // 使用任务自己的系数
  const adjustedWorkHours = task.workHours * taskCoefficient
  // 更精确的工时长度计算：每分钟对应1.5px，确保工时差异明显
  const baseWidth = adjustedWorkHours * 1.5
  const width = Math.max(60, Math.min(maxWidth, baseWidth)) // 最小60px以便显示任务名
  const color = getPriorityColor(task.priority)
  const isUrgent = task.priority >= 8

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(task)
  }

  return (
    <Tooltip
      title={
        <div>
          <div><strong>{task.productName}</strong></div>
          <div>架次号: {task.batchNumber}</div>
          <div>委托方: {task.clientName}</div>
          <div>原始工时: {task.workHours}分钟</div>
          <div>工时系数: {taskCoefficient}x</div>
          <div><strong>实际工时: {adjustedWorkHours.toFixed(0)}分钟</strong></div>
          <div>任务条长度: {width}px</div>
          <div>委托时间: {task.commitTime}</div>
          <div>优先级: {task.priority}</div>
          <div>状态: {task.status === 'pending' ? '待处理' : task.status === 'inProgress' ? '进行中' : '已完成'}</div>
          <div style={{ color: '#1890ff', fontSize: '11px', marginTop: '4px' }}>
            双击任务可编辑系数
          </div>
        </div>
      }
      placement="top"
    >
      <div
        style={{
          width: `${width}px`,
          height: `${barHeight}px`,
          backgroundColor: task.masterName === '待分配' ? '#fff2f0' : color,
          borderRadius: '3px',
          margin: '1px 3px 1px 0',
          position: 'relative',
          cursor: 'pointer',
          border: task.masterName === '待分配' ? '2px solid #ff4d4f' : 
                 task.status === 'inProgress' ? '1px solid #1890ff' : 'none',
          opacity: task.status === 'completed' ? 0.7 : 1,
          display: 'inline-block',
          verticalAlign: 'top',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
        }}
        onDoubleClick={handleDoubleClick}
      >
        {isUrgent && (
          <ExclamationCircleFilled
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              color: '#ff4d4f',
              fontSize: '9px',
              backgroundColor: 'white',
              borderRadius: '50%'
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '4px',
            transform: 'translateY(-50%)',
            color: task.masterName === '待分配' ? '#ff4d4f' : 'white',
            fontSize: Math.max(8, Math.min(14, barHeight - 4)) + 'px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: `${width - 20}px`,
            textShadow: task.masterName === '待分配' ? 'none' : '1px 1px 1px rgba(0,0,0,0.5)'
          }}
        >
          {task.productName}
        </div>
      </div>
    </Tooltip>
  )
}



// 师傅行组件
const MasterRow: React.FC<{
  masterName: string
  tasks: Task[]
  onEditTask?: (task: Task) => void
  rowHeight: number
}> = ({ masterName, tasks, onEditTask, rowHeight }) => {
  // 按委托时间排序任务
  const sortedTasks = useMemo(() => {
    return tasks
      .filter(task => task.masterName === masterName)
      .sort((a, b) => new Date(a.commitTime).getTime() - new Date(b.commitTime).getTime())
  }, [tasks, masterName])

  return (
    <div style={{ 
      height: `${rowHeight}px`,
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px'
    }}>
      <div style={{ 
        width: '120px',
        flexShrink: 0,
        paddingRight: '12px',
        borderRight: '1px solid #f0f0f0'
      }}>
        <Text strong style={{ 
          fontSize: Math.max(10, Math.min(16, Math.max(14, rowHeight - 8))) + 'px',
          lineHeight: '1.2',
          color: masterName === '待分配' ? '#ff4d4f' : 'inherit'
        }}>
          {masterName}
        </Text>
      </div>
      <div style={{ 
        flex: 1,
        paddingLeft: '12px',
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* 工时刻度线 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 12,
          right: 0,
          height: '100%',
          borderBottom: '1px solid #f5f5f5',
          background: 'linear-gradient(to right, transparent 0%, transparent calc(100% - 1px), #e8e8e8 100%)',
          backgroundSize: '75px 100%', // 每50分钟一个刻度(50*1.5=75px)
          pointerEvents: 'none',
          zIndex: 1
        }} />
        <div style={{ 
          position: 'relative',
          zIndex: 2,
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          height: '100%',
          display: 'flex',
          alignItems: 'center'
        }}>
          {sortedTasks.length === 0 ? (
            <Text type="secondary" style={{ fontSize: rowHeight < 30 ? '10px' : '11px', fontStyle: 'italic' }}>
              暂无任务
            </Text>
          ) : (
            sortedTasks.map(task => (
              <TaskBar
                key={task.id}
                task={task}
                maxWidth={400}
                onEdit={onEditTask}
                barHeight={Math.max(14, rowHeight - 8)} // 调整任务条高度，保留上下边距
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const MasterGanttView: React.FC<MasterGanttViewProps> = ({ tasks, onTasksChange }) => {
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [containerHeight, setContainerHeight] = useState(0)

  // 计算可用高度
  useEffect(() => {
    const updateHeight = () => {
      const contentHeight = window.innerHeight - 64 // 减去Header高度
      const statsCardHeight = 80 // 统计卡片高度
      const cardPadding = 48 // 卡片内外边距
      const rulerHeight = 30 // 时间标尺高度
      const containerPadding = 32 // 容器内边距
      const availableHeight = contentHeight - statsCardHeight - cardPadding - rulerHeight - containerPadding
      setContainerHeight(Math.max(400, availableHeight)) // 最小400px
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // 计算每行的高度
  const rowHeight = useMemo(() => {
    if (containerHeight === 0) return 30
    const calculatedHeight = Math.floor(containerHeight / MASTERS.length)
    return Math.max(25, Math.min(50, calculatedHeight)) // 最小25px，最大50px
  }, [containerHeight])

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setEditModalVisible(true)
  }

  const handleSaveTask = (updatedTask: Task) => {
    if (onTasksChange) {
      const updatedTasks = tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
      onTasksChange(updatedTasks)
    }
  }

  const handleCancelEdit = () => {
    setEditModalVisible(false)
    setEditingTask(null)
  }

  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const urgentTasks = tasks.filter(t => t.priority >= 8).length
    const activeMasters = new Set(tasks.filter(t => t.masterName && t.masterName !== '待分配').map(t => t.masterName)).size
    
    return {
      totalTasks,
      urgentTasks,
      activeMasters
    }
  }, [tasks])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <Card style={{ marginBottom: '16px', flexShrink: 0 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>师傅任务分配</Title>
          </Col>
          <Col>
            <Space size={16}>
              <Text>总任务: <strong>{stats.totalTasks}</strong></Text>
              <Text>紧急任务: <strong style={{ color: '#ff4d4f' }}>{stats.urgentTasks}</strong></Text>
              <Text>活跃师傅: <strong>{stats.activeMasters}/17</strong></Text>
              <Text type="secondary">双击任务条可编辑系数和责任人</Text>
            </Space>
          </Col>
          <Col flex="auto" />
          <Col>
            <Space>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#ff4d4f', marginRight: '4px', borderRadius: '2px' }} />
                高优先级
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#faad14', marginRight: '4px', borderRadius: '2px' }} />
                中优先级
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#52c41a', marginRight: '4px', borderRadius: '2px' }} />
                低优先级
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <ExclamationCircleFilled style={{ color: '#ff4d4f', marginRight: '4px' }} />
                紧急标记
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ 
          height: `${containerHeight}px`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 时间刻度标尺 */}
          <div style={{
            height: '30px',
            borderBottom: '2px solid #d9d9d9',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fafafa',
            flexShrink: 0
          }}>
            <div style={{ width: '120px', paddingRight: '12px', borderRight: '1px solid #d9d9d9' }}>
              <Text strong style={{ fontSize: '12px' }}>师傅</Text>
            </div>
            <div style={{ flex: 1, paddingLeft: '12px', position: 'relative' }}>
              <div style={{
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 12,
                right: 0,
                height: '100%',
                backgroundImage: 'repeating-linear-gradient(to right, transparent 0px, transparent 74px, #d9d9d9 74px, #d9d9d9 75px)',
                pointerEvents: 'none'
              }}>
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    left: `${i * 75}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    color: '#666',
                    whiteSpace: 'nowrap'
                  }}>
                    {i * 50}分钟
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 师傅行列表 */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {MASTERS.map(master => (
              <MasterRow
                key={master}
                masterName={master}
                tasks={tasks}
                onEditTask={handleEditTask}
                rowHeight={rowHeight}
              />
            ))}
          </div>
        </div>
      </Card>

      <TaskEditModal
        visible={editModalVisible}
        task={editingTask}
        onCancel={handleCancelEdit}
        onSave={handleSaveTask}
      />
    </div>
  )
}

export default MasterGanttView 