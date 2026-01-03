import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue');

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 修复 steps.push 中的引号问题
  const fixes = [
    { from: /steps\.push\('待验[^']*\?;/g, to: "steps.push('待验收');" },
  ];

  for (const fix of fixes) {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to);
      modified = true;
      console.log(`✓ 修复了 steps.push 中的引号问题`);
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

