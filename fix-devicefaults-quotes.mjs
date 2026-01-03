import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 修复第 471 行：label="寰呰瀵? value="observe" -> label="待观察" value="observe"
  const pattern1 = /label="寰呰[^"]*瀵\? value="observe"/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, 'label="待观察" value="observe"');
    modified = true;
    console.log('✓ 修复了第 471 行的引号和乱码问题');
  }

  // 修复第 472 行：label="鏈畬鎴? value="unsolved" -> label="未完成" value="unsolved"
  const pattern2 = /label="鏈[^"]*畬鎴\? value="unsolved"/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, 'label="未完成" value="unsolved"');
    modified = true;
    console.log('✓ 修复了第 472 行的引号和乱码问题');
  }

  // 修复第 470 行：label="正常运行" -> label="正常运行"
  const pattern3 = /label="正常运行[^"]*"/g;
  if (pattern3.test(content)) {
    content = content.replace(pattern3, 'label="正常运行"');
    modified = true;
    console.log('✓ 修复了第 470 行的乱码问题');
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

