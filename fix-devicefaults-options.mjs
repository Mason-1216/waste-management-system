import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');

const encodingFixes = {
  "正常运行": "正常运行",
  "寰呰瀵? value=": '待观察" value="',
  "鏈畬鎴? value=": '未完成" value="',
};

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const [garbled, correct] of Object.entries(encodingFixes)) {
    if (content.includes(garbled)) {
      content = content.replaceAll(garbled, correct);
      modified = true;
      console.log(`✓ 修复: ${garbled.substring(0, 20)}... -> ${correct.substring(0, 20)}...`);
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

