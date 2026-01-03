import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'FaultReport.vue');

const encodingFixes = {
  "寰呭鐞?": "待处理",
  "寰呰瀵?": "待观察",
  "鏈В鍐?": "未解决",
};

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const [garbled, correct] of Object.entries(encodingFixes)) {
    if (content.includes(garbled)) {
      content = content.replaceAll(garbled, correct);
      modified = true;
      console.log(`✓ 修复: ${garbled} -> ${correct}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ 已修复文件: ${filePath}`);
  } else {
    console.log(`✓ 文件无需修复: ${filePath}`);
  }
} catch (error) {
  console.error(`✗ 处理文件失败:`, error.message);
  process.exit(1);
}

