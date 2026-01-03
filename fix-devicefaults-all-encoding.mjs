import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');

const encodingFixes = [
  { from: /label="寰呰瀵\? value="/g, to: 'label="待观察" value="' },
  { from: /label="鏈畬鎴\? value="/g, to: 'label="未完成" value="' },
  { from: /label="正常运行/g, to: 'label="正常运行' },
];

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const fix of encodingFixes) {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to);
      modified = true;
      console.log(`✓ 修复了编码问题`);
    }
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

