import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Typography, Slider, Card, Space, Input, Select, Button, Collapse } from 'antd'
import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SearchOutlined, ClearOutlined, BarChartOutlined } from '@ant-design/icons'
import TaskCard from './TaskCard'
import DroppableColumn from './DroppableColumn'
import StatsPanel from './StatsPanel'
import TaskEditModal from './TaskEditModal'
import type { Task } from '../types'
import { LocalStorageService } from '../services/localStorage'
import { MasterAssignmentService } from '../services/masterAssignment'

const { Text } = Typography
const { Search } = Input
const { Panel } = Collapse

const mockTasks: Task[] = [
  {
    id: '1',
    productName: '发动机机壳',
    workHours: 120,
    masterName: '张师傅',
    batchNumber: 'A001-2024',
    clientName: '航空公司A',
    commitTime: '2024-01-10',
    status: 'pending',
    priority: 8,
    coefficient: 1.5
  },
  {
    id: '2',
    productName: '涡轮叶片',
    workHours: 90,
    masterName: '李师傅',
    batchNumber: 'B002-2024',
    clientName: '航空公司B',
    commitTime: '2024-01-09',
    status: 'pending',
    priority: 5
  },
  {
    id: '3',
    productName: '油路系统',
    workHours: 180,
    masterName: '王师傅',
    batchNumber: 'C003-2024',
    clientName: '航空公司C',
    commitTime: '2024-01-08',
    status: 'in-progress',
    priority: 6
  },
  {
    id: '4',
    productName: '控制面板',
    workHours: 60,
    masterName: '赵师傅',
    batchNumber: 'D004-2024',
    clientName: '航空公司D',
    commitTime: '2024-01-07',
    status: 'completed',
    priority: 3
  },
  {
    id: '5',
    productName: '燃油喷嘴',
    workHours: 80,
    masterName: '刘师傅',
    batchNumber: 'E005-2024',
    clientName: '航空公司E',
    commitTime: '2024-01-12',
    status: 'pending',
    priority: 9,
    coefficient: 0.8
  },
  {
    id: '6',
    productName: '液压泵',
    workHours: 150,
    masterName: '陈师傅',
    batchNumber: 'F006-2024',
    clientName: '航空公司F',
    commitTime: '2024-01-11',
    status: 'in-progress',
    priority: 7
  },
  {
    id: '7',
    productName: '起落架',
    workHours: 200,
    masterName: '杨师傅',
    batchNumber: 'G007-2024',
    clientName: '航空公司G',
    commitTime: '2024-01-13',
    status: 'pending',
    priority: 4
  },
  {
    id: '8',
    productName: '座椅框架',
    workHours: 45,
    masterName: '黄师傅',
    batchNumber: 'H008-2024',
    clientName: '航空公司H',
    commitTime: '2024-01-06',
    status: 'completed',
    priority: 2
  },
  {
    id: '9',
    productName: '舱门机构',
    workHours: 110,
    masterName: '周师傅',
    batchNumber: 'I009-2024',
    clientName: '航空公司I',
    commitTime: '2024-01-14',
    status: 'pending',
    priority: 6
  },
  {
    id: '10',
    productName: '导航系统',
    workHours: 75,
    masterName: '吴师傅',
    batchNumber: 'J010-2024',
    clientName: '航空公司J',
    commitTime: '2024-01-15',
    status: 'in-progress',
    priority: 8
  },
  {
    id: '11',
    productName: '通信天线',
    workHours: 65,
    masterName: '徐师傅',
    batchNumber: 'K011-2024',
    clientName: '航空公司K',
    commitTime: '2024-01-05',
    status: 'completed',
    priority: 1
  },
  {
    id: '12',
    productName: '氧气面罩',
    workHours: 30,
    masterName: '孙师傅',
    batchNumber: 'L012-2024',
    clientName: '航空公司L',
    commitTime: '2024-01-16',
    status: 'pending',
    priority: 3
  }
]

const KanbanBoard: React.FC<{ 
  initialTasks?: Task[]
  onTasksChange?: (tasks: Task[]) => void
  onCoefficientChange?: (coefficient: number) => void
}> = ({ 
  initialTasks = [], 
  onTasksChange,
  onCoefficientChange
}) => {
  const [coefficient, setCoefficient] = useState(1.2)
  const [tasks, setTasks] = useState<Task[]>([...mockTasks])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedMaster, setSelectedMaster] = useState<string>('')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    const savedSettings = LocalStorageService.loadUserSettings()
    setCoefficient(savedSettings.coefficient)
  }, [])

  useEffect(() => {
    if (initialTasks.length > 0) {
      setTasks(prevTasks => {
        const existingIds = new Set(prevTasks.map(t => t.id))
        const newTasks = initialTasks.filter(t => !existingIds.has(t.id))
        return [...prevTasks, ...newTasks]
      })
    }
  }, [initialTasks])

  const handleCoefficientChange = (value: number) => {
    setCoefficient(value)
    LocalStorageService.saveUserSettings({ coefficient: value })
    onCoefficientChange?.(value)
  }

  const handleClearFilters = () => {
    setSearchText('')
    setSelectedMaster('')
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setEditModalVisible(true)
  }

  const handleSaveTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    )
    setTasks(updatedTasks)
    onTasksChange?.(updatedTasks)
    
    // 更新师傅分配记忆
    if (updatedTask.masterName && updatedTask.masterName !== '待分配') {
      MasterAssignmentService.updateAssignment(updatedTask.productName, updatedTask.masterName)
    }
  }

  const handleCancelEdit = () => {
    setEditModalVisible(false)
    setEditingTask(null)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as Task['status']

    if (newStatus === 'pending' || newStatus === 'in-progress' || newStatus === 'completed') {
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, status: newStatus }
          if (newStatus === 'in-progress' && task.masterName && task.masterName !== '待分配') {
            MasterAssignmentService.learnFromTaskUpdate(updatedTask)
          }
          return updatedTask
        }
        return task
      })
      setTasks(updatedTasks)
      onTasksChange?.(updatedTasks)
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchText || 
        task.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        task.batchNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        task.clientName.toLowerCase().includes(searchText.toLowerCase())
      
      const matchesMaster = !selectedMaster || task.masterName === selectedMaster
      
      return matchesSearch && matchesMaster
    })
  }, [tasks, searchText, selectedMaster])

  const allMasters = useMemo(() => {
    const masters = new Set(tasks.map(task => task.masterName).filter(name => name && name !== '待分配'))
    return Array.from(masters).sort()
  }, [tasks])

  const getTasksByStatus = (status: Task['status']) => {
    return filteredTasks.filter(task => task.status === status)
  }

  const columns = [
    {
      title: '待处理',
      status: 'pending' as const,
      color: '#faad14',
      tasks: getTasksByStatus('pending')
    },
    {
      title: '进行中',
      status: 'in-progress' as const,
      color: '#1890ff',
      tasks: getTasksByStatus('in-progress')
    },
    {
      title: '已完成',
      status: 'completed' as const,
      color: '#52c41a',
      tasks: getTasksByStatus('completed')
    }
  ]

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Space>
                <Text>工时系数调整:</Text>
                <Text strong>{coefficient.toFixed(1)}x</Text>
              </Space>
            </Col>
            <Col span={12}>
              <Slider
                min={1}
                max={2}
                step={0.1}
                value={coefficient}
                onChange={handleCoefficientChange}
                marks={{
                  1: '1.0x',
                  1.5: '1.5x',
                  2: '2.0x'
                }}
              />
            </Col>
          </Row>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Search
                placeholder="搜索产品名、架次号、委托方"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="按师傅筛选"
                value={selectedMaster}
                onChange={setSelectedMaster}
                style={{ width: '100%' }}
                allowClear
              >
                {allMasters.map(master => (
                  <Select.Option key={master} value={master}>
                    {master}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Button 
                icon={<ClearOutlined />} 
                onClick={handleClearFilters}
                disabled={!searchText && !selectedMaster}
              >
                清除筛选
              </Button>
            </Col>
            <Col span={6}>
              <Space>
                <Text type="secondary">
                  显示 {filteredTasks.length} / {tasks.length} 项任务
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        <Collapse style={{ marginBottom: 16 }}>
          <Panel header="数据统计" key="stats" extra={<BarChartOutlined />}>
            <StatsPanel tasks={tasks} />
          </Panel>
        </Collapse>

        <div className="kanban-board">
          {columns.map(column => (
            <DroppableColumn
              key={column.status}
              column={column}
              coefficient={coefficient}
              onEditTask={handleEditTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} />
          ) : null}
        </DragOverlay>
      </div>

      <TaskEditModal
        visible={editModalVisible}
        task={editingTask}
        onCancel={handleCancelEdit}
        onSave={handleSaveTask}
      />
    </DndContext>
  )
}

export default KanbanBoard