import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 修复文件中的语法错误
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // 修复缺少闭合引号的 label 属性
    const labelWidthPattern = /label="([^"]*?) width="(\d+)"/g;
    const labelWidthMatches = [...content.matchAll(labelWidthPattern)];
    if (labelWidthMatches.length > 0) {
      content = content.replace(labelWidthPattern, 'label="$1" width="$2"');
      modified = true;
      console.log(`  - 修复了 ${labelWidthMatches.length} 处缺少闭合引号的 label 属性`);
    }

    // 修复乱码字符 - 使用更精确的匹配
    const fixes = [
      { from: /请输入ヨ[^'"]*澶囩紪鍙?/g, to: '请输入设备编号' },
      { from: /请输入ヨ[^'"]*澶囧悕绉?/g, to: '请输入设备名称' },
      { from: /请输入ュ[^'"]*畨瑁呭湴鐐?/g, to: '请输入安装地点' },
      { from: /请输入ュ[^'"]*畨瑁呬綅缃?/g, to: '请输入安装位置' },
      { from: /鎵ц[^'"]*浜?/g, to: '执行人' },
      { from: /娲惧崟[^'"]*浜?/g, to: '派单人' },
      { from: /楠屾敹[^'"]*浜?/g, to: '验收人' },
      { from: /娲惧彂[^'"]*浜?/g, to: '派发人' },
    ];

    for (const fix of fixes) {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        modified = true;
        console.log(`  - 修复了乱码字符: ${fix.to}`);
      }
    }

    // 修复缺少闭合引号的 placeholder 属性
    const placeholderPattern = /placeholder="([^"]*?) maxlength="/g;
    if (placeholderPattern.test(content)) {
      content = content.replace(placeholderPattern, 'placeholder="$1" maxlength="');
      modified = true;
      console.log(`  - 修复了缺少闭合引号的 placeholder 属性`);
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

// 主函数
function main() {
  const files = [
    path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue'),
    path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'FaultReport.vue'),
    path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'EquipmentMaintenance.vue'),
  ];

  console.log('开始修复语法错误...\n');

  let fixedCount = 0;
  for (const file of files) {
    if (fs.existsSync(file)) {
      console.log(`处理: ${file}`);
      if (fixFile(file)) {
        fixedCount++;
      }
    } else {
      console.log(`文件不存在: ${file}`);
    }
  }

  console.log(`\n修复完成！共修复 ${fixedCount} 个文件`);
}

main();

