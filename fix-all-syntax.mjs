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

    // 修复缺少闭合引号的 label 属性 - 匹配 label="xxx"xxx"> 或 label="xxx> 的情况
    const labelPatterns = [
      // label="xxx"xxx"> -> label="xxx">
      /label="([^"]*?)"([^>]*?)">/g,
      // label="xxx> -> label="xxx">
      /label="([^"]*?)([^>]*?)">/g,
      // label="xxx"鏃 -> label="xxx日期">
      /label="([^"]*?)"鏃ユ湡">/g,
      /label="([^"]*?)"鏃堕棿">/g,
    ];

    for (const pattern of labelPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        if (pattern.source.includes('鏃ユ湡')) {
          content = content.replace(pattern, 'label="$1日期">');
          modified = true;
        } else if (pattern.source.includes('鏃堕棿')) {
          content = content.replace(pattern, 'label="$1时间">');
          modified = true;
        } else {
          content = content.replace(pattern, 'label="$1">');
          modified = true;
        }
        console.log(`  - 修复了 ${matches.length} 处 label 属性`);
      }
    }

    // 修复缺少闭合引号的 placeholder 属性
    const placeholderPattern = /placeholder="([^"]*?)([^>]*?)maxlength="/g;
    if (placeholderPattern.test(content)) {
      content = content.replace(placeholderPattern, 'placeholder="$1" maxlength="');
      modified = true;
      console.log(`  - 修复了缺少闭合引号的 placeholder 属性`);
    }

    // 修复其他常见的语法错误
    // label="xxx> -> label="xxx">
    content = content.replace(/label="([^"]*?)([^>]*?)">/g, (match, p1, p2) => {
      if (p2 && !p2.includes('"')) {
        return `label="${p1}">`;
      }
      return match;
    });

    // 修复乱码字符
    const fixes = [
      { from: /故障鐜拌薄描述/g, to: '故障现象描述' },
      { from: /故障鍒濆垽鏂?/g, to: '故障初步判断' },
      { from: /鑰楁潗/g, to: '耗材' },
      { from: /閰嶄欢/g, to: '配件' },
      { from: /鍨嬪彿/g, to: '型号' },
      { from: /瑙勬牸/g, to: '规格' },
      { from: /鏁伴噺/g, to: '数量' },
      { from: /鏇存崲鍘熷洜/g, to: '更换原因' },
      { from: /璺熻釜澶╂暟/g, to: '跟踪天数' },
      { from: /鏈В鍐冲師鍥?/g, to: '未解决原因' },
      { from: /姝ｅ父杩愯/g, to: '正常运行' },
      { from: /鏈畬鎴?/g, to: '未完成' },
    ];

    for (const fix of fixes) {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        modified = true;
        console.log(`  - 修复了乱码字符: ${fix.to}`);
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
}

// 主函数
function main() {
  const files = [
    path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'DeviceFaults.vue'),
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

