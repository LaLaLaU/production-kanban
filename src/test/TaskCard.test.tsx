import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskCard from '../components/TaskCard'
import type { Task } from '../types'

const mockTask: Task = {
  id: 'test-1',
  productName: '测试产品',
  productCode: 'TEST-001',
  workHours: 120,
  masterName: '张师傅',
  batchNumber: 'BATCH-001',
  clientName: '测试委托方',
  commitTime: '2024-01-01',
  status: 'pending',
  priority: 5,
  coefficient: 1.2
}

describe('TaskCard', () => {
  it('应该正确渲染任务卡片', () => {
    render(<TaskCard task={mockTask} />)
    
    expect(screen.getByText('测试产品')).toBeInTheDocument()
    expect(screen.getByText('张师傅')).toBeInTheDocument()
    expect(screen.getByText('BATCH-001')).toBeInTheDocument()
    expect(screen.getByText(/144分钟/)).toBeInTheDocument() // 120 * 1.2
  })

  it('应该显示正确的优先级标签', () => {
    render(<TaskCard task={mockTask} />)
    
    expect(screen.getByText('重要')).toBeInTheDocument()
  })
})