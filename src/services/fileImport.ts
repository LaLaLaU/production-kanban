import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { Task } from '../types'
import type { ColumnMapping } from '../types/import'

export class FileImportService {
  static async parseExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          resolve(jsonData as any[])
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  static async parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          resolve(results.data as any[])
        },
        error: (error) => {
          reject(error)
        },
        encoding: 'UTF-8'
      })
    })
  }

  static async parseFile(file: File): Promise<any[]> {
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

  static extractHeaders(data: any[]): string[] {
    if (data.length === 0) return []
    return data[0].filter((header: any) => header && header.toString().trim() !== '')
  }

  static mapDataToTasks(
    data: any[],
    mapping: ColumnMapping
  ): Task[] {
    if (data.length <= 1) return []

    const headers = data[0]
    const rows = data.slice(1)

    return rows
      .filter(row => row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''))
      .map((row, index) => {
        const rowData: any = {}
        headers.forEach((header: string, headerIndex: number) => {
          if (header && mapping[header]) {
            rowData[mapping[header]] = row[headerIndex] || ''
          }
        })

        return {
          id: `imported-${Date.now()}-${index}`,
          productName: rowData.productName || '未知产品',
          productCode: rowData.productCode || undefined, // 产品图号
          workHours: parseFloat(rowData.workHours) || 60,
          masterName: rowData.masterName || '待分配',
          batchNumber: rowData.batchNumber || `BATCH-${Date.now()}`,
          clientName: rowData.clientName || '未知委托方',
          commitTime: rowData.commitTime || new Date().toISOString().split('T')[0],
          status: 'pending' as const,
          priority: parseInt(rowData.priority) || 1
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
      productName: ['产品', '产品名', '产品名称', '名称', 'product', 'name'],
      productCode: ['产品图号', '图号', '型号', '编号', '产品编号', 'code', 'model', 'number'],
      workHours: ['工时', '时间', '小时', '分钟', 'hours', 'time', 'duration'],
      masterName: ['师傅', '工人', '操作员', '负责人', 'master', 'worker', 'operator'],
      batchNumber: ['架次', '批次', '架次号', '批次号', 'batch', 'lot'],
      clientName: ['委托方', '客户', '公司', 'client', 'customer', 'company'],
      commitTime: ['委托时间', '下达时间', '时间', 'date', 'time', 'commit'],
      priority: ['优先级', '紧急度', 'priority', 'urgent']
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