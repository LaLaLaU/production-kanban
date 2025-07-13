export interface Task {
  id: string
  productName: string
  productCode?: string // 产品图号
  workHours: number
  masterName: string
  batchNumber: string
  clientName: string
  commitTime: string
  status: 'pending' | 'inProgress' | 'completed'
  priority: number
  coefficient?: number // 每个任务独立的工时系数，默认为1
}

export interface WorkHourAdjustment {
  coefficient: number
}