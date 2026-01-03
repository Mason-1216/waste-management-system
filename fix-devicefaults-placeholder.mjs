import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 修复 placeholder 中的乱码字符和引号问题
  // 查找模式: placeholder="可选"
  const pattern = /placeholder="可选[^"]*"/g;
  const replacement = 'placeholder="可选"';

  if (pattern.test(content)) {
    content = content.replace(pattern, replacement);
    modified = true;
    console.log('✓ 修复了 placeholder 中的乱码字符');
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

