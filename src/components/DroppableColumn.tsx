import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Typography, Badge } from 'antd'
import DraggableTaskCard from './DraggableTaskCard'
import type { Task } from '../types'

const { Title, Text } = Typography

interface DroppableColumnProps {
  column: {
    title: string
    status: Task['status']
    color: string
    tasks: Task[]
  }
  coefficient: number
  onEditTask?: (task: Task) => void
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ column, coefficient, onEditTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  })

  const getTotalWorkHours = (tasks: Task[]) => {
    return tasks.reduce((total, task) => total + (task.workHours * coefficient), 0)
  }

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 4,
                height: 20,
                backgroundColor: column.color,
                marginRight: 8,
                borderRadius: 2
              }}
            />
            <Title level={4} className="kanban-column-title" style={{ margin: 0 }}>
              {column.title}
            </Title>
            <Badge
              count={column.tasks.length}
              style={{ backgroundColor: column.color, marginLeft: 8 }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getTotalWorkHours(column.tasks).toFixed(0)}分钟
          </Text>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        style={{
          minHeight: 400,
          overflowY: 'auto',
          backgroundColor: isOver ? '#f0f8ff' : 'transparent',
          borderRadius: isOver ? '8px' : '0',
          padding: isOver ? '8px' : '0',
          transition: 'all 0.2s ease'
        }}
      >
        <SortableContext items={column.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map(task => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
            />
          ))}
        </SortableContext>
        {column.tasks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#bfbfbf',
              padding: '40px 0',
              fontSize: '14px'
            }}
          >
            暂无任务
          </div>
        )}
      </div>
    </div>
  )
}

export default DroppableColumn