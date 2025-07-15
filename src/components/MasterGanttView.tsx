
import { Button, Card, Col, Row, Space, Tooltip, Typography } from 'antd'
import { SortDescendingOutlined, UnorderedListOutlined } from '@ant-design/icons'
import React, { useEffect, useMemo, useState } from 'react'
import type { Task } from '../types'
import GanttWaterLevel from './GanttWaterLevel'
import TaskEditModal from './TaskEditModal'

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

// 根据委托时间获取颜色（与水位效果一致）
const getTimeBasedColor = (commitTime: string): string => {
  if (!commitTime) return 'rgba(200, 200, 200, 0.8)' // 默认灰色

  try {
    const commitDate = new Date(commitTime)
    const now = new Date()

    if (isNaN(commitDate.getTime())) {
      return 'rgba(200, 200, 200, 0.8)' // 无效日期时使用灰色
    }

    const diffTime = Math.abs(now.getTime() - commitDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const maxDays = 4 // 与水位效果保持一致
    const ratio = diffDays / maxDays

    if (ratio <= 0.25) {
      // 0-1天：绿色系
      return 'rgba(82, 196, 26, 0.8)'
    } else if (ratio <= 0.5) {
      // 2天：黄色系
      return 'rgba(250, 173, 20, 0.8)'
    } else if (ratio <= 0.75) {
      // 3天：橙色系
      return 'rgba(255, 136, 0, 0.8)'
    } else {
      // 4天+：红色系
      return 'rgba(255, 77, 79, 0.8)'
    }
  } catch (error) {
    return 'rgba(200, 200, 200, 0.8)' // 错误时使用灰色
  }
}

// 判断是否为紧急任务（只有紧急任务才显示高亮红色）
const isUrgentTask = (priority: number): boolean => {
  return priority >= 8
}



// 任务条组件
const TaskBar: React.FC<{
  task: Task
  maxWidth: number
  onEdit?: (task: Task) => void
  barHeight?: number // 任务条高度
  pixelsPerMinute?: number // 每分钟像素数
}> = ({ task, onEdit, barHeight = 16, pixelsPerMinute = 1.5 }) => {
  const taskCoefficient = task.coefficient || 1 // 使用任务自己的系数
  const adjustedWorkHours = task.workHours * taskCoefficient

        // 使用自适应像素宽度计算，支持横向滚动
  const baseWidth = adjustedWorkHours * pixelsPerMinute
  const minWidth = 5 * pixelsPerMinute // 5分钟任务的宽度作为最小宽度
  const width = adjustedWorkHours < 5 ? minWidth : baseWidth // 小于5分钟时使用固定宽度


  // 紧急任务显示高亮红色，其他任务根据委托时间显示颜色
  const isUrgent = isUrgentTask(task.priority)
  const taskColor = isUrgent ? '#ff4d4f' : getTimeBasedColor(task.commitTime)

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
          backgroundColor: task.masterName === '待分配' ? '#fff2f0' : 'rgba(200, 200, 200, 0.3)',
          borderRadius: '3px',
          margin: '1px 3px 1px 0',
          position: 'relative',
          cursor: 'pointer',
          border: task.masterName === '待分配' ? '2px solid #ff4d4f' :
                 task.status === 'inProgress' ? '1px solid #1890ff' : `1px solid ${taskColor}`,
          opacity: task.status === 'completed' ? 0.7 : 1,
          display: 'inline-block',
          verticalAlign: 'top',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          flexShrink: 0 // 防止任务条被压缩
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* 水位指示器 */}
        <GanttWaterLevel
          commitTime={task.commitTime}
          width={width}
          height={barHeight}
          maxDays={4}
          isUrgent={isUrgent}
        />


        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '4px',
            color: task.masterName === '待分配' ? '#ff4d4f' :
                   isUrgent ? 'white' : 'white',
            fontSize: Math.max(8, Math.min(14, barHeight - 4)) + 'px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: `${width - 20}px`,
            textShadow: task.masterName === '待分配' ? 'none' :
                       isUrgent ? '1px 1px 1px rgba(0,0,0,0.5)' : '1px 1px 1px rgba(0,0,0,0.5)',
            zIndex: 1
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
  pixelsPerMinute: number
  showRanking?: boolean
  ranking?: number
  totalWorkHours?: number
}> = ({ masterName, tasks, onEditTask, rowHeight, pixelsPerMinute, showRanking = false, ranking, totalWorkHours }) => {
  // 按委托时间排序任务，过滤掉已完成的任务
  const sortedTasks = useMemo(() => {
    return tasks
      .filter(task => task.masterName === masterName && task.status !== 'completed')
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
          <Text strong style={{
            fontSize: Math.max(10, Math.min(16, Math.max(14, rowHeight - 8))) + 'px',
            lineHeight: '1.2',
            color: masterName === '待分配' ? '#ff4d4f' : 'inherit'
          }}>
            {showRanking && ranking && ranking <= 3 && (
              <span style={{
                display: 'inline-block',
                marginRight: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                color: ranking === 1 ? '#faad14' : ranking === 2 ? '#d9d9d9' : '#cd7f32',
                backgroundColor: ranking === 1 ? '#fff7e6' : ranking === 2 ? '#f5f5f5' : '#fdf6ec',
                padding: '1px 4px',
                borderRadius: '2px',
                border: `1px solid ${ranking === 1 ? '#faad14' : ranking === 2 ? '#d9d9d9' : '#cd7f32'}`
              }}>
                #{ranking}
              </span>
            )}
            {showRanking && ranking && ranking > 3 && (
              <span style={{
                display: 'inline-block',
                marginRight: '4px',
                fontSize: '10px',
                color: '#666'
              }}>
                #{ranking}
              </span>
            )}
            {masterName}
          </Text>
          {showRanking && totalWorkHours !== undefined && totalWorkHours > 0 && (
            <Text type="secondary" style={{
              fontSize: Math.max(8, Math.min(12, rowHeight - 12)) + 'px',
              lineHeight: '1.1'
            }}>
              {Math.round(totalWorkHours)}分钟
            </Text>
          )}
        </div>
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
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {/* 背景刻度线 - 最大显示600分钟 */}
          {Array.from({ length: 12 }, (_, i) => {
            const leftPosition = i * 50 * pixelsPerMinute // 每50分钟一个刻度
            return (
              <div key={i} style={{
                position: 'absolute',
                left: `${leftPosition}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: '#e8e8e8',
                pointerEvents: 'none'
              }} />
            )
          })}
        </div>
                <div
          className="gantt-scroll-container"
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            minWidth: '100%', // 确保内容可以超出容器宽度
            scrollbarWidth: 'thin', // Firefox
            scrollbarColor: '#d9d9d9 #f5f5f5' // Firefox
          }}
        >
          {sortedTasks.length === 0 ? (
            <Text type="secondary" style={{ fontSize: rowHeight < 30 ? '10px' : '11px', fontStyle: 'italic' }}>
              暂无任务
            </Text>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              minWidth: 'max-content' // 确保容器宽度适应内容
            }}>
              {sortedTasks.map(task => (
                <TaskBar
                  key={task.id}
                  task={task}
                  maxWidth={999999} // 不限制最大宽度，支持横向滚动
                  onEdit={onEditTask}
                  barHeight={Math.max(14, rowHeight - 8)} // 调整任务条高度，保留上下边距
                  pixelsPerMinute={pixelsPerMinute}
                />
              ))}
            </div>
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
  const [containerWidth, setContainerWidth] = useState(0)
  const [sortByWorkload, setSortByWorkload] = useState(false)

  // 计算可用高度和宽度
  useEffect(() => {
    const updateDimensions = () => {
      const contentHeight = window.innerHeight - 64 // 减去Header高度
      const statsCardHeight = 80 // 统计卡片高度
      const cardPadding = 48 // 卡片内外边距
      const rulerHeight = 30 // 时间标尺高度
      const containerPadding = 32 // 容器内边距
      const availableHeight = contentHeight - statsCardHeight - cardPadding - rulerHeight - containerPadding
      setContainerHeight(Math.max(400, availableHeight)) // 最小400px

      // 计算可用宽度
      const contentWidth = window.innerWidth - 32 // 减去页面边距
      const masterNameWidth = 120 // 师傅名称列宽度
      const borderWidth = 24 // 边框和间距
      const availableWidth = contentWidth - masterNameWidth - borderWidth - cardPadding
      setContainerWidth(Math.max(600, availableWidth)) // 最小600px
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // 计算每行的高度
  const rowHeight = useMemo(() => {
    if (containerHeight === 0) return 30
    const calculatedHeight = Math.floor(containerHeight / MASTERS.length)
    return Math.max(25, Math.min(50, calculatedHeight)) // 最小25px，最大50px
  }, [containerHeight])

  // 计算自适应的像素比例 - 600分钟填满可用宽度
  const pixelsPerMinute = useMemo(() => {
    if (containerWidth === 0) return 1.5 // 默认比例
    return containerWidth / 600 // 600分钟填满可用宽度
  }, [containerWidth])

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

  // 计算师傅的工时量并排序
  const sortedMasters = useMemo(() => {
    if (!sortByWorkload) {
      return MASTERS
    }

    // 计算每个师傅的总工时量（只计算未完成的任务）
    const masterWorkloads = MASTERS.map(master => {
      const masterTasks = tasks.filter(t =>
        t.masterName === master && t.status !== 'completed'
      )
      const totalWorkHours = masterTasks.reduce((sum, task) => {
        const coefficient = task.coefficient || 1
        return sum + (task.workHours * coefficient)
      }, 0)

      return {
        name: master,
        workload: totalWorkHours,
        taskCount: masterTasks.length
      }
    })

    // 按工时量从多到少排序
    return masterWorkloads
      .sort((a, b) => b.workload - a.workload)
      .map(item => item.name)
  }, [tasks, sortByWorkload])

  const stats = useMemo(() => {
    // 只统计未完成的任务（待处理和进行中）
    const activeTasks = tasks.filter(t => t.status !== 'completed')
    const totalTasks = activeTasks.length
    const urgentTasks = activeTasks.filter(t => t.priority >= 8).length
    const activeMasters = new Set(activeTasks.filter(t => t.masterName && t.masterName !== '待分配').map(t => t.masterName)).size

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
              <Text>活跃任务: <strong>{stats.totalTasks}</strong></Text>
              <Text>紧急任务: <strong style={{ color: '#ff4d4f' }}>{stats.urgentTasks}</strong></Text>
              <Text>活跃师傅: <strong>{stats.activeMasters}/17</strong></Text>
              <Text type="secondary">已完成任务已从甘特图中隐藏</Text>
              <Text type="secondary">双击任务条可编辑系数和责任人</Text>
            </Space>
          </Col>
          <Col flex="auto" />
          <Col>
            <Button
              type={sortByWorkload ? 'primary' : 'default'}
              icon={sortByWorkload ? <SortDescendingOutlined /> : <UnorderedListOutlined />}
              onClick={() => setSortByWorkload(!sortByWorkload)}
              size="small"
              style={{ marginRight: 16 }}
            >
              {sortByWorkload ? '工时排名' : '默认排序'}
            </Button>
          </Col>
          <Col>
            <Space>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(82, 196, 26, 0.8)', marginRight: '4px', borderRadius: '2px' }} />
                0-1天
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(250, 173, 20, 0.8)', marginRight: '4px', borderRadius: '2px' }} />
                2天
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(255, 136, 0, 0.8)', marginRight: '4px', borderRadius: '2px' }} />
                3天
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(255, 77, 79, 0.8)', marginRight: '4px', borderRadius: '2px' }} />
                4天+
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(0, 0, 0, 0.8)', marginRight: '4px', borderRadius: '2px' }} />
                紧急任务
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
                pointerEvents: 'none'
              }}>
                {/* 背景刻度线 - 最大显示600分钟 */}
                {Array.from({ length: 12 }, (_, i) => {
                  const leftPosition = i * 50 * pixelsPerMinute // 每50分钟一个刻度
                  return (
                    <div key={`line-${i}`} style={{
                      position: 'absolute',
                      left: `${leftPosition}px`,
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      backgroundColor: '#d9d9d9',
                      pointerEvents: 'none'
                    }} />
                  )
                })}
                {/* 刻度标签 - 最大显示600分钟 */}
                {Array.from({ length: 12 }, (_, i) => {
                  const leftPosition = i * 50 * pixelsPerMinute // 每50分钟一个刻度
                  return (
                    <div key={`label-${i}`} style={{
                      position: 'absolute',
                      left: `${leftPosition}px`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      color: '#666',
                      whiteSpace: 'nowrap'
                    }}>
                      {i * 50}分钟
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 师傅行列表 */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {sortedMasters.map((master, index) => {
              const masterTasks = tasks.filter(t =>
                t.masterName === master && t.status !== 'completed'
              )
              const totalWorkHours = masterTasks.reduce((sum, task) => {
                const coefficient = task.coefficient || 1
                return sum + (task.workHours * coefficient)
              }, 0)

              return (
                <MasterRow
                  key={master}
                  masterName={master}
                  tasks={tasks}
                  onEditTask={handleEditTask}
                  rowHeight={rowHeight}
                  pixelsPerMinute={pixelsPerMinute}
                  showRanking={sortByWorkload}
                  ranking={index + 1}
                  totalWorkHours={totalWorkHours}
                />
              )
            })}
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
