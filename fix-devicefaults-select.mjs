import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 修复缺少 <el-select> 开始标签的问题
  // 查找模式: <el-form-item label="设备编号">\n              :disabled=...
  const pattern = /(<el-form-item label="设备编号">)\s*\n\s*:disabled="!canEditReport\(currentRow\)"/;
  const replacement = `$1
            <el-select
              v-model="currentRow.equipment_code"
              :disabled="!canEditReport(currentRow)"`;

  if (pattern.test(content)) {
    content = content.replace(pattern, replacement);
    modified = true;
    console.log('✓ 修复了设备编号的 <el-select> 开始标签');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ 已修复文件: ${filePath}`);
  } else {
    console.log(`⚠ 未找到需要修复的内容`);
  }
} catch (error) {
  console.error(`✗ 处理文件失败:`, error.message);
  process.exit(1);
}

