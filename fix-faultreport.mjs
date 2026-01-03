import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'frontend', 'src', 'views', 'maintenance', 'FaultReport.vue');

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // 找到第一个 <script setup> 的位置（应该是第 186 行左右）
  let scriptStartIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '<script setup>') {
      scriptStartIdx = i;
      break;
    }
  }
  
  if (scriptStartIdx === -1) {
    console.log('未找到 <script setup>');
    process.exit(1);
  }
  
  // 找到第二个 <script setup> 的位置（应该是第 277 行左右）
  let scriptStartIdx2 = -1;
  for (let i = scriptStartIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '<script setup>') {
      scriptStartIdx2 = i;
      break;
    }
  }
  
  if (scriptStartIdx2 === -1) {
    console.log('未找到第二个 <script setup>');
    process.exit(1);
  }
  
  // 删除第一个 <script setup> 到第二个 <script setup> 之间的所有内容
  const newLines = [
    ...lines.slice(0, scriptStartIdx + 1), // 保留第一个 <script setup>
    ...lines.slice(scriptStartIdx2 + 1)   // 从第二个 <script setup> 之后开始
  ];
  
  fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
  console.log(`✓ 已修复: ${filePath}`);
  console.log(`删除了 ${scriptStartIdx2 - scriptStartIdx - 1} 行重复内容`);
} catch (error) {
  console.error(`✗ 处理文件失败:`, error.message);
  process.exit(1);
}

