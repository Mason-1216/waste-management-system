import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 修复第 736-739 行的引号问题
  const fixes = [
    { from: /return '已完成;/g, to: "return '已完成';" },
    { from: /return '寰呰[^']*瀵\?;/g, to: "return '待观察';" },
    { from: /return '鏈[^']*畬鎴\?;/g, to: "return '未完成';" },
    { from: /return '维修中;/g, to: "return '维修中';" },
  ];

  for (const fix of fixes) {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to);
      modified = true;
      console.log(`✓ 修复了引号问题`);
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

