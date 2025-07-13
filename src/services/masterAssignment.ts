import type { MasterAssignment } from '../types/import'
import type { Task } from '../types'
import { LocalStorageService } from './localStorage'

export class MasterAssignmentService {
  static updateAssignment(productName: string, masterName: string, productCode?: string): void {
    const assignments = LocalStorageService.loadMasterAssignments()
    const existingIndex = assignments.findIndex(a => 
      a.productName === productName && 
      (productCode ? a.productCode === productCode : !a.productCode)
    )
    
    console.log('更新分配记录:', { productName, productCode, masterName, existingIndex })
    
    if (existingIndex >= 0) {
      assignments[existingIndex].masterName = masterName
      assignments[existingIndex].confidence = Math.min(assignments[existingIndex].confidence + 0.1, 1.0)
      assignments[existingIndex].lastAssignedTime = new Date().toISOString()
      if (productCode) {
        assignments[existingIndex].productCode = productCode
      }
      console.log('更新现有记录:', assignments[existingIndex])
    } else {
      const newAssignment = {
        productName,
        productCode,
        masterName,
        confidence: 0.3,
        lastAssignedTime: new Date().toISOString()
      }
      assignments.push(newAssignment)
      console.log('创建新记录:', newAssignment)
    }
    
    LocalStorageService.saveMasterAssignments(assignments)
    console.log('保存分配记录完成，总数:', assignments.length)
  }

  static getRecommendedMaster(productName: string, productCode?: string): string | null {
    const assignments = LocalStorageService.loadMasterAssignments()
    console.log('智能分配查询:', { productName, productCode, assignments })
    
    // 只有在产品图号和产品名称都完全匹配时才自动分配
    if (productCode && productName) {
      const exactMatch = assignments.find(a => 
        a.productCode === productCode && 
        a.productName === productName
      )
      if (exactMatch) {
        console.log('精确匹配成功:', exactMatch)
        return exactMatch.masterName
      }
    }
    
    // 如果没有产品图号，只有产品名称完全匹配且置信度高才分配
    if (!productCode && productName) {
      const nameMatch = assignments.find(a => 
        !a.productCode && 
        a.productName === productName && 
        a.confidence > 0.8
      )
      if (nameMatch) {
        console.log('产品名称精确匹配成功:', nameMatch)
        return nameMatch.masterName
      }
    }
    
    console.log('未找到精确匹配的分配记录，设为待分配')
    return null
  }

  static getAllAssignments(): MasterAssignment[] {
    return LocalStorageService.loadMasterAssignments()
  }

  static learnFromTaskUpdate(task: Task, previousMaster?: string): void {
    if (task.masterName && task.masterName !== '待分配' && task.masterName !== previousMaster) {
      this.updateAssignment(task.productName, task.masterName, task.productCode)
    }
  }

  static suggestMasterForImport(tasks: Task[]): Task[] {
    return tasks.map(task => {
      if (!task.masterName || task.masterName === '待分配') {
        const recommendedMaster = this.getRecommendedMaster(task.productName, task.productCode)
        if (recommendedMaster) {
          return { ...task, masterName: recommendedMaster }
        }
      }
      return task
    })
  }

  // 获取智能分配统计信息
  static getAssignmentStats(tasks: Task[]): {
    total: number
    autoAssigned: number
    byProductCode: number
    byProductName: number
    manual: number
  } {
    const assignments = LocalStorageService.loadMasterAssignments()
    let autoAssigned = 0
    let byProductCode = 0
    let byProductName = 0
    let manual = 0

    tasks.forEach(task => {
      if (task.masterName === '待分配') {
        manual++
        return
      }

      const recommendedMaster = this.getRecommendedMaster(task.productName, task.productCode)
      if (recommendedMaster === task.masterName) {
        autoAssigned++
        
        // 判断是通过产品图号还是产品名称匹配的
        if (task.productCode) {
          const codeMatch = assignments.find(a => a.productCode === task.productCode)
          if (codeMatch) {
            byProductCode++
          } else {
            byProductName++
          }
        } else {
          byProductName++
        }
      } else {
        manual++
      }
    })

    return {
      total: tasks.length,
      autoAssigned,
      byProductCode,
      byProductName,
      manual
    }
  }

  static getMasterStats(): Array<{
    masterName: string
    productCount: number
    confidence: number
    products: string[]
  }> {
    const assignments = LocalStorageService.loadMasterAssignments()
    const masterMap = new Map<string, {
      products: Set<string>
      totalConfidence: number
      count: number
    }>()

    assignments.forEach(assignment => {
      if (!masterMap.has(assignment.masterName)) {
        masterMap.set(assignment.masterName, {
          products: new Set(),
          totalConfidence: 0,
          count: 0
        })
      }
      
      const masterData = masterMap.get(assignment.masterName)!
      const productKey = assignment.productCode ? 
        `${assignment.productName}(${assignment.productCode})` : 
        assignment.productName
      masterData.products.add(productKey)
      masterData.totalConfidence += assignment.confidence
      masterData.count++
    })

    return Array.from(masterMap.entries()).map(([masterName, data]) => ({
      masterName,
      productCount: data.products.size,
      confidence: data.totalConfidence / data.count,
      products: Array.from(data.products)
    }))
  }

  static clearLowConfidenceAssignments(threshold: number = 0.3): void {
    const assignments = LocalStorageService.loadMasterAssignments()
    const filteredAssignments = assignments.filter(a => a.confidence >= threshold)
    LocalStorageService.saveMasterAssignments(filteredAssignments)
  }

  static exportAssignments(): string {
    const assignments = LocalStorageService.loadMasterAssignments()
    return JSON.stringify(assignments, null, 2)
  }

  static importAssignments(jsonData: string): boolean {
    try {
      const assignments = JSON.parse(jsonData) as MasterAssignment[]
      LocalStorageService.saveMasterAssignments(assignments)
      return true
    } catch (error) {
      console.error('导入师傅分配数据失败:', error)
      return false
    }
  }
}