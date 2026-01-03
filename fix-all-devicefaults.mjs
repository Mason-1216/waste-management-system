import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // 修复缺少闭合引号的 label
    const fixes = [
      { from: /label="维修负责人>/g, to: 'label="维修负责人">' },
      { from: /label="派单人?>/g, to: 'label="派单人日期">' },
      { from: /label="开濮嬫棩鏈?>/g, to: 'label="开始日期">' },
      { from: /label="开濮嬫椂闂?>/g, to: 'label="开始时间">' },
      { from: /label="缁撴潫鏃ユ湡">/g, to: 'label="结束日期">' },
      { from: /label="缁撴潫鏃堕棿">/g, to: 'label="结束时间">' },
      { from: /label="验收人鏃ユ湡">/g, to: 'label="验收人日期">' },
      { from: /label="验收人鏃堕棿">/g, to: 'label="验收人时间">' },
    ];

    for (const fix of fixes) {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        modified = true;
      }
    }

    // 根据上下文恢复空 label
    const contextFixes = [
      // 结束日期和时间
      { pattern: /<el-form-item label="">\s*<el-date-picker\s+v-model="currentRow\.repair_end_date"/, replacement: '<el-form-item label="结束日期">' },
      { pattern: /<el-form-item label="">\s*<el-time-picker\s+v-model="currentRow\.repair_end_time"/, replacement: '<el-form-item label="结束时间">' },
      // 初步判断
      { pattern: /<el-form-item label="">\s*<el-input v-model="currentRow\.preliminary_judgment"/, replacement: '<el-form-item label="故障初步判断">' },
      // 维修内容
      { pattern: /<el-form-item label="">\s*<el-input v-model="currentRow\.repair_content"/, replacement: '<el-form-item label="维修方法">' },
      // 维修工具
      { pattern: /<el-form-item label="">\s*<el-input v-model="currentRow\.repair_tools"/, replacement: '<el-form-item label="维修工具">' },
      // 维修时长
      { pattern: /<el-form-item label="">\s*<el-input-number v-model="currentRow\.work_hours"/, replacement: '<el-form-item label="维修时长">' },
      // 耗材表格列
      { pattern: /<el-table-column label="">\s*<template #default="{ row: item }">\s*<el-input v-model="item\.name"/, replacement: '<el-table-column label="名称">' },
      { pattern: /<el-table-column label="">\s*<template #default="{ row: item }">\s*<el-input v-model="item\.model"/, replacement: '<el-table-column label="型号">' },
      { pattern: /<el-table-column label="">\s*<template #default="{ row: item }">\s*<el-input v-model="item\.spec"/, replacement: '<el-table-column label="规格">' },
      { pattern: /<el-table-column label="">\s*<template #default="{ row: item }">\s*<el-input-number v-model="item\.quantity"/, replacement: '<el-table-column label="数量">' },
      // 配件表格列
      { pattern: /<el-table-column label="">\s*<template #default="{ row: item }">\s*<el-input v-model="item\.replacement_reason"/, replacement: '<el-table-column label="更换原因">' },
    ];

    for (const fix of contextFixes) {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    }

    // 修复其他乱码
    const encodingFixes = [
      { from: /鍙€?/g, to: '可选' },
      { from: /鏌ョ湅/g, to: '查看' },
      { from: /新增耗材/g, to: '新增耗材' },
    ];

    for (const fix of encodingFixes) {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ 已修复: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ 处理文件失败 ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const file = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');
  
  console.log('开始修复 DeviceFaults.vue...\n');
  
  if (fs.existsSync(file)) {
    fixFile(file);
  } else {
    console.log(`文件不存在: ${file}`);
  }
  
  console.log(`\n修复完成！`);
}

main();

