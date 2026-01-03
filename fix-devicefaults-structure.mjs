import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 修复缺少开始标签的问题
  const fixes = [
    // 修复缺少 <el-select> 开始标签
    { from: /<el-form-item label="场站">\s*:disabled="!canEditReport\(currentRow\)"/, replacement: '<el-form-item label="场站">\n            <el-select\n              v-model="currentRow.station_id"\n              :disabled="!canEditReport(currentRow)"' },
    // 修复缺少 <el-select> 开始标签
    { from: /<el-form-item label="设备编号">\s*:disabled="!canEditReport\(currentRow\)"/, replacement: '<el-form-item label="设备编号">\n            <el-select\n              v-model="currentRow.equipment_code"\n              :disabled="!canEditReport(currentRow)"' },
    // 修复缺少 <el-input> 开始标签
    { from: /<el-form-item label="设备名称"> :disabled="!canEditReport\(currentRow\)" \/>/, replacement: '<el-form-item label="设备名称">\n            <el-input v-model="currentRow.equipment_name" :disabled="!canEditReport(currentRow)" />' },
    // 修复缺少 <el-input> 开始标签
    { from: /<el-form-item label="安装地点"> :disabled="!canEditReport\(currentRow\)" \/>/, replacement: '<el-form-item label="安装地点">\n            <el-input v-model="currentRow.equipment_location" :disabled="!canEditReport(currentRow)" />' },
    // 修复缺少 <el-date-picker> 开始标签
    { from: /<el-form-item label="结束日期">\s*type="date"/, replacement: '<el-form-item label="结束日期">\n            <el-date-picker\n              v-model="currentRow.repair_end_date"\n              type="date"' },
    // 修复缺少 <el-time-picker> 开始标签
    { from: /<el-form-item label="结束时间">\s*value-format="HH:mm"/, replacement: '<el-form-item label="结束时间">\n            <el-time-picker\n              v-model="currentRow.repair_end_time"\n              value-format="HH:mm"' },
    // 修复缺少 <el-input> 开始标签
    { from: /<el-form-item label="故障初步判断"> :disabled="!canEditRepair\(currentRow\)" \/>/, replacement: '<el-form-item label="故障初步判断">\n            <el-input v-model="currentRow.preliminary_judgment" :disabled="!canEditRepair(currentRow)" />' },
    // 修复缺少 <el-input> 开始标签
    { from: /<el-form-item label="维修方法"> :disabled="!canEditRepair\(currentRow\)" \/>/, replacement: '<el-form-item label="维修方法">\n            <el-input v-model="currentRow.repair_content" :disabled="!canEditRepair(currentRow)" />' },
    // 修复缺少 <el-input> 开始标签
    { from: /<el-form-item label="维修工具"> :disabled="!canEditRepair\(currentRow\)" \/>/, replacement: '<el-form-item label="维修工具">\n            <el-input v-model="currentRow.repair_tools" :disabled="!canEditRepair(currentRow)" />' },
    // 修复缺少 <el-input-number> 开始标签
    { from: /<el-form-item label="维修时长"> :disabled="!canEditRepair\(currentRow\)" :min="0" \/>/, replacement: '<el-form-item label="维修时长">\n            <el-input-number v-model="currentRow.work_hours" :disabled="!canEditRepair(currentRow)" :min="0" />' },
    // 修复缺少 <el-input> 开始标签（表格列）
    { from: /<el-table-column label="名称"> :disabled="!canEditRepair\(currentRow\) \|\| item\._locked" \/>/, replacement: '<el-table-column label="名称">\n                    <template #default="{ row: item }">\n                      <el-input v-model="item.name" :disabled="!canEditRepair(currentRow) || item._locked" />\n                    </template>' },
    // 修复缺少 <el-input> 开始标签（表格列）
    { from: /<el-table-column label="型号"> :disabled="!canEditRepair\(currentRow\) \|\| item\._locked" \/>/, replacement: '<el-table-column label="型号">\n                    <template #default="{ row: item }">\n                      <el-input v-model="item.model" :disabled="!canEditRepair(currentRow) || item._locked" />\n                    </template>' },
    // 修复缺少 <el-input> 开始标签（表格列）
    { from: /<el-table-column label="规格"> :disabled="!canEditRepair\(currentRow\) \|\| item\._locked" \/>/, replacement: '<el-table-column label="规格">\n                    <template #default="{ row: item }">\n                      <el-input v-model="item.spec" :disabled="!canEditRepair(currentRow) || item._locked" />\n                    </template>' },
    // 修复多余的 </template> 标签
    { from: /<\/template>\s*<\/el-table-column>\s*<\/template>\s*<\/el-table-column>/, replacement: '</template>\n                  </el-table-column>' },
    // 修复缺少闭合引号的 label
    { from: /label="派单人\?>/g, replacement: 'label="派单人">' },
    { from: /label="开濮嬫棩鏈\?>/g, replacement: 'label="开始日期">' },
    { from: /label="开濮嬫椂闂\?>/g, replacement: 'label="开始时间">' },
    // 修复乱码字符
    { from: /正常运行/g, replacement: '正常运行' },
    { from: /寰呰瀵?/g, replacement: '待观察' },
    { from: /鏈畬鎴?/g, replacement: '未完成' },
    { from: /保存鑽夌/g, replacement: '保存草稿' },
    { from: /开濮嬬淮淇?/g, replacement: '开始维修' },
    { from: /验收人瀹屾垚/g, replacement: '验收完成' },
    { from: /可选/g, replacement: '可选' },
  ];

  for (const fix of fixes) {
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

