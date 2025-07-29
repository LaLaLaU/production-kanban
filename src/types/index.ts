export interface Task {
  id: string
  productName: string
  productCode?: string // 产品图号
  workHours: number
  masterName: string
  batchNumber: string
  clientName: string
  commitTime: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: number
  coefficient?: number // 每个任务独立的工时系数，默认为1
  // 新增字段以支持更多导入信息
  processOrderId?: string // 委托加工单ID
  factoryCode?: string // 工厂编号
  orderDate?: string // 委托日期
  deliveryTime?: string // 送达时间
  quantity?: number // 数量
  assignedPerson?: string // 委托人
  assignedTeam?: string // 委托班组
}

export interface WorkHourAdjustment {
  coefficient: number
}
