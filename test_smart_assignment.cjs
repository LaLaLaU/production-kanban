const XLSX = require('xlsx');
const path = require('path');

// 创建测试数据，包含产品图号
const testData = [
  ['产品名称', '产品图号', '工时', '架次号', '委托方', '委托时间', '优先级'],
  ['液压缸总成', 'HC-001', 120, 'BATCH-001', '机械厂A', '2025-01-13', 5],
  ['精密齿轮箱', 'GB-002', 180, 'BATCH-002', '设备厂B', '2025-01-13', 8],
  ['传动轴组件', 'TA-003', 90, 'BATCH-003', '汽车厂C', '2025-01-13', 3],
  ['液压缸总成', 'HC-001', 110, 'BATCH-004', '机械厂A', '2025-01-14', 6], // 重复产品图号
  ['精密齿轮箱', 'GB-002', 190, 'BATCH-005', '设备厂B', '2025-01-14', 9], // 重复产品图号
  ['轴承座', 'BS-004', 75, 'BATCH-006', '轴承厂D', '2025-01-14', 4],
  ['液压缸总成', 'HC-001', 130, 'BATCH-007', '机械厂A', '2025-01-15', 7], // 再次重复
  ['连接器组件', 'CC-005', 60, 'BATCH-008', '电子厂E', '2025-01-15', 2],
  ['精密齿轮箱', 'GB-002', 170, 'BATCH-009', '设备厂B', '2025-01-15', 8], // 再次重复
  ['传动轴组件', 'TA-003', 95, 'BATCH-010', '汽车厂C', '2025-01-15', 5], // 重复产品图号
];

// 创建工作簿
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(testData);

// 添加工作表
XLSX.utils.book_append_sheet(workbook, worksheet, '智能分配测试');

// 保存文件
const filename = `智能分配测试_${new Date().toISOString().split('T')[0]}.xlsx`;
XLSX.writeFile(workbook, filename);

console.log(`测试文件已生成: ${filename}`);
console.log('文件包含重复的产品图号，用于测试智能分配功能');
console.log('使用步骤：');
console.log('1. 首次导入时手动分配师傅');
console.log('2. 再次导入相同产品图号的任务时，系统会自动分配相同的师傅'); 