import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { Task } from '../types'
import type { ColumnMapping } from '../types/import'

export class FileImportService {
  static async parseExcelFile(file: File): Promise<unknown[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          resolve(jsonData as unknown[][])
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  static async parseCSVFile(file: File): Promise<unknown[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          resolve(results.data as unknown[][])
        },
        error: (error) => {
          reject(error)
        },
        encoding: 'UTF-8'
      })
    })
  }

  static async parseFile(file: File): Promise<unknown[][]> {
    const extension = file.name.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'xlsx':
      case 'xls':
        return this.parseExcelFile(file)
      case 'csv':
        return this.parseCSVFile(file)
      default:
        throw new Error('不支持的文件格式，请选择Excel或CSV文件')
    }
  }

  static extractHeaders(data: unknown[][]): string[] {
    if (data.length === 0) return []
    const firstRow = data[0] || []
    return firstRow.filter((header: unknown) => header && header.toString().trim() !== '') as string[]
  }

  static mapDataToTasks(
    data: unknown[][],
    mapping: ColumnMapping
  ): Task[] {
    if (data.length <= 1) return []

    const headers = data[0] as string[]
    const rows = data.slice(1)

    return rows
      .filter(row => row && row.some((cell: unknown) => cell !== null && cell !== undefined && cell !== ''))
      .map((row, index) => {
        const rowData: Record<string, unknown> = {}
        headers.forEach((header: string, headerIndex: number) => {
          if (header && mapping[header]) {
            rowData[mapping[header]] = row[headerIndex] || ''
          }
        })

        // 处理状态字段映射
        let taskStatus: 'pending' | 'in-progress' | 'completed' = 'pending'
        if (rowData.status) {
          const statusStr = String(rowData.status).toLowerCase()
          if (statusStr.includes('进行') || statusStr.includes('processing') || statusStr.includes('progress')) {
            taskStatus = 'in-progress'
          } else if (statusStr.includes('完成') || statusStr.includes('completed') || statusStr.includes('done')) {
            taskStatus = 'completed'
          } else if (statusStr.includes('待') || statusStr.includes('pending') || statusStr.includes('wait')) {
            taskStatus = 'pending'
          }
        }

        return {
          id: `imported-${Date.now()}-${index}`,
          productName: String(rowData.productName || '未知产品'),
          productCode: rowData.productCode ? String(rowData.productCode) : undefined,
          workHours: parseFloat(String(rowData.workHours)) || 60,
          masterName: String(rowData.masterName || '待分配'),
          batchNumber: String(rowData.batchNumber || `BATCH-${Date.now()}`),
          clientName: String(rowData.clientName || '未知委托方'),
          commitTime: String(rowData.commitTime || new Date().toISOString().split('T')[0]),
          status: taskStatus,
          priority: parseInt(String(rowData.priority)) || 1,
          // 新增字段映射
          processOrderId: rowData.processOrderId ? String(rowData.processOrderId) : undefined,
          factoryCode: rowData.factoryCode ? String(rowData.factoryCode) : undefined,
          orderDate: rowData.orderDate ? String(rowData.orderDate) : undefined,
          deliveryTime: rowData.deliveryTime ? String(rowData.deliveryTime) : undefined,
          quantity: rowData.quantity ? parseInt(String(rowData.quantity)) : undefined,
          assignedPerson: rowData.assignedPerson ? String(rowData.assignedPerson) : undefined,
          assignedTeam: rowData.assignedTeam ? String(rowData.assignedTeam) : undefined
        }
      })
  }

  static generateColumnMappingTemplate(): ColumnMapping {
    return {
      '产品名称': 'productName',
      '产品图号': 'productCode',
      '工时': 'workHours',
      '师傅': 'masterName',
      '架次号': 'batchNumber',
      '委托方': 'clientName',
      '委托时间': 'commitTime',
      '优先级': 'priority'
    }
  }

  static detectColumnMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {}
    const keywords = {
      productName: ['零件名称', '产品', '产品名', '产品名称', '名称', 'product', 'name'],
      productCode: ['零件图号', '产品图号', '图号', '型号', '编号', '产品编号', 'code', 'model', 'number'],
      workHours: ['工时', '时间', '小时', '分钟', 'hours', 'time', 'duration'],
      masterName: ['师傅', '工人', '操作员', '负责人', 'master', 'worker', 'operator'],
      batchNumber: ['架次', '批次', '架次号', '批次号', 'batch', 'lot'],
      clientName: ['委托方', '客户', '公司', 'client', 'customer', 'company'],
      commitTime: ['委托时间', '下达时间', '时间', 'date', 'time', 'commit'],
      priority: ['优先级', '紧急度', 'priority', 'urgent'],
      // 根据真实词条更新的关键词识别
      processOrderId: ['委托加工单ID'],
      factoryCode: ['工厂编号'],
      orderDate: ['委托日期'],
      deliveryTime: ['送达时间'],
      quantity: ['数量'],
      assignedPerson: ['委托人'],
      assignedTeam: ['委托班组'],
      status: ['状态']
    }

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim()

      Object.entries(keywords).forEach(([field, synonyms]) => {
        if (synonyms.some(keyword =>
          normalizedHeader.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(normalizedHeader)
        )) {
          mapping[header] = field
        }
      })
    })

    return mapping
  }
}
