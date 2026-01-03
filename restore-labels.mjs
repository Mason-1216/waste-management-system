import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 根据上下文恢复 label
const labelRestorations = [
  // Tab label
  { pattern: /<el-tab-pane label="">\s*<div class="page-header">\s*<h2>设备[^<]*故障<\/h2>/, replacement: '<el-tab-pane label="设备故障">' },
  
  // Table columns
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<span>{{ row\.record_code/, replacement: '<el-table-column label="表单编号">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<span>{{ row\.equipment_name/, replacement: '<el-table-column label="设备名称">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<span>{{ row\.equipment_location/, replacement: '<el-table-column label="安装地点">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<el-tag :type="statusTag\(row\)">/, replacement: '<el-table-column label="状态">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<el-tag :type="urgencyTag\(row\.urgency_level\)">/, replacement: '<el-table-column label="紧急程度">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<span>{{ row\.reporter_name/, replacement: '<el-table-column label="上报人">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<span>{{ row\.dispatch_by_name/, replacement: '<el-table-column label="派单人">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<span>{{ row\.repair_person_name/, replacement: '<el-table-column label="维修人员">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<span>{{ row\.verifier_name/, replacement: '<el-table-column label="验收人">' },
  { pattern: /<el-table-column label="">\s*<template #default="{ row }">\s*<el-button size="small" @click="openDialog\(row\)">/, replacement: '<el-table-column label="操作">' },
  
  // Form items
  { pattern: /<el-form-item label="">\s*<el-select\s+v-model="currentRow\.station_id"/, replacement: '<el-form-item label="场站">' },
  { pattern: /<el-form-item label="">\s*<el-select\s+v-model="currentRow\.equipment_code"/, replacement: '<el-form-item label="设备编号">' },
  { pattern: /<el-form-item label="">\s*<el-input v-model="currentRow\.equipment_name"/, replacement: '<el-form-item label="设备名称">' },
  { pattern: /<el-form-item label="">\s*<el-input v-model="currentRow\.equipment_location"/, replacement: '<el-form-item label="安装地点">' },
  { pattern: /<el-form-item label="">\s*<el-date-picker\s+v-model="currentRow\.report_date"/, replacement: '<el-form-item label="上报日期">' },
  { pattern: /<el-form-item label="">\s*<el-time-picker\s+v-model="currentRow\.report_time"/, replacement: '<el-form-item label="上报时间">' },
  { pattern: /<el-form-item label="">\s*<el-date-picker\s+v-model="currentRow\.plan_repair_date_range"/, replacement: '<el-form-item label="计划维修日期">' },
  { pattern: /<el-form-item label="">\s*<el-time-picker\s+v-model="currentRow\.plan_repair_time_range"/, replacement: '<el-form-item label="计划维修时间">' },
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    for (const restoration of labelRestorations) {
      if (restoration.pattern.test(content)) {
        content = content.replace(restoration.pattern, restoration.replacement);
        modified = true;
        console.log(`  - 恢复了 label: ${restoration.replacement.match(/label="([^"]*)"/)?.[1] || 'unknown'}`);
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
  
  console.log('开始恢复 label...\n');
  
  if (fs.existsSync(file)) {
    console.log(`处理: ${file}`);
    fixFile(file);
  } else {
    console.log(`文件不存在: ${file}`);
  }
  
  console.log(`\n修复完成！`);
}

main();

