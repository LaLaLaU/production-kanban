export interface ColumnMapping {
  [key: string]: string
}

export interface ImportSettings {
  columnMapping: ColumnMapping
  coefficient: number
  lastImportTime: string
}

export interface MasterAssignment {
  productName: string
  productCode?: string // 产品图号
  masterName: string
  confidence: number
  lastAssignedTime?: string // 最后分配时间
}