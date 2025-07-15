import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'
import type { Task } from '../types'

interface DraggableTaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onEdit={onEdit} />
    </div>
  )
}

export default DraggableTaskCard