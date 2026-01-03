import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 常见乱码字符映射
const encodingFixes = {
  '鏈烘': '机械',
  '鐢垫皵': '电气',
  '娑插帇': '液压',
  '鎺у埗绯荤粺': '控制系统',
  '鍏朵粬': '其他',
  '涓€鑸?': '一般',
  '杈冩€?': '较急',
  '绱ф€?': '紧急',
  '闈炲父绱ф€?': '非常紧急',
  '寰呭鐞?': '待处理',
  '宸叉淳鍙?': '已派发',
  '缁翠慨涓?': '维修中',
  '寰呴獙鏀?': '待验收',
  '宸插畬鎴?': '已完成',
  '寰呰瀵?': '待观察',
  '鏈В鍐?': '未解决',
  '璇疯緭鍏': '请输入',
  '璇烽€': '请',
  '璇锋弿': '请描述',
  '璁惧': '设备',
  '缂栧彿': '编号',
  '鍚嶇О': '名称',
  '瀹夎': '安装',
  '鍦扮偣': '地点',
  '鑷€姩濉€厖': '自动填充',
  '鏁呴殰': '故障',
  '绫诲瀷': '类型',
  '鎻忚堪': '描述',
  '鐜板満': '现场',
  '鐓х墖': '照片',
  '鏀€寔': '支持',
  '鏍煎紡': '格式',
  '鏈€澶': '最多',
  '涓婃传': '上传',
  '寮€': '开',
  '鎻愪氦': '提交',
  '閲嶇疆': '重置',
  '鏈€杩?': '最近',
  '璁板綍': '记录',
  '琛ㄥ崟': '表单',
  '鐘舵€?': '状态',
  '涓婃姤浜?': '上报人',
  '鍒锋柊': '刷新',
  '鏂板€': '新增',
  '鎶ラ殰': '报障',
  '鎿嶄綔': '操作',
  '缂栬緫': '编辑',
  '鍒犻櫎': '删除',
  '涓嬭浇': '下载',
  '瀵煎叆': '导入',
  '妯℃澘': '模板',
  '鏂囦欢': '文件',
  '瑙ｆ瀽': '解析',
  '璇诲彇': '读取',
  '鏁版嵁': '数据',
  '鏈夋晥': '有效',
  '鍦虹珯': '场站',
  '绀轰緥': '示例',
  '鍘嬬缉': '压缩',
  '涓昏溅': '主车间',
  '鍒嗘嫞': '分拣',
  '杈撻€佸甫': '输送带',
  '鏇存柊': '更新',
  '鏂板': '新增',
  '纭€畾': '确定',
  '鎻愮ず': '提示',
  '淇濆瓨': '保存',
  '鍙栨秷': '取消',
  '鏍煎紡涓嶆纭': '格式不正确',
  '璇蜂娇鐢ㄤ笅杞界殑妯℃澘': '请使用下载的模板',
  '瀵煎叆鎴愬姛': '导入成功',
  '鏉¤澶囪褰?': '条设备记录',
  '鍔犺浇': '加载',
  '澶辫触': '失败',
  '鏈壘鍒': '未找到',
  '璇峰厛鍦ㄨ澶囩鐞嗕腑娣诲姞璁惧': '请先在设备管理中添加设备',
  '妯℃澘涓嬭浇鎴愬姛': '模板下载成功',
  '鏁呴殰涓婃姤': '故障上报',
  '璁惧绠＄悊': '设备管理',
  '鏂板/缂栬緫': '新增/编辑',
  '鏂板璁惧': '新增设备',
  '缂栬緫璁惧': '编辑设备',
  '鏁呴殰涓婃姤鏃ユ湡': '故障上报日期',
  '鏁呴殰涓婃姤鏃堕棿': '故障上报时间',
  '鏈€杩戜笂鎶ヨ褰?': '最近上报记录',
  '鎴戠殑涓婃姤璁板綍': '我的上报记录',
  '绱ф€ョ▼搴?': '紧急程度',
  '鏁呴殰鎻忚堪': '故障描述',
  '鎻愪氦涓婃姤': '提交上报',
  '涓婃姤鎴愬姛': '上报成功',
  '鏇存柊鎴愬姛': '更新成功',
  '鏂板鎴愬姛': '新增成功',
  '鍒犻櫎鎴愬姛': '删除成功',
  '鍒犻櫎澶辫触': '删除失败',
  '瀵煎叆澶辫触': '导入失败',
  '淇濆瓨澶辫触': '保存失败',
  '鍔犺浇璁惧鍒楄〃澶辫触': '加载设备列表失败',
  '纭€畾鍒犻櫎璇ヨ澶囧悧锛?': '确定删除该设备吗？',
  '璁惧绠＄悊瀵煎叆妯℃澘': '设备管理导入模板',
  '鍦虹珯': '场站',
  '绀轰緥鍦虹珯': '示例场站',
  '鍘嬬缉鏈?鍙?': '压缩机1号',
  '鍘嬬缉鏈?鍙?': '压缩机2号',
  '涓昏溅闂碅鍖?': '主车间A区',
  '涓昏溅闂碆鍖?': '主车间B区',
  '鍒嗘嫞鍖?': '分拣区',
  '鏉¤澶囪褰?': '条设备记录',
  '瀵煎叆鎴愬姛锛佸叡瀵煎叆': '导入成功！共导入',
  '鏁呴殰涓婃姤琛ㄥ崟': '故障上报表单',
  '璁惧绠＄悊鐩稿叧': '设备管理相关',
  '璁惧缂栧彿澶辩劍鏃惰嚜鍔ㄥ～鍏?': '设备编号失焦时自动填充',
  '鍔犺浇璁惧鍒楄〃': '加载设备列表',
  '鏄剧ず鏂板璁惧瀵硅瘽妗?': '显示新增设备对话框',
  '缂栬緫璁惧': '编辑设备',
  '淇濆瓨璁惧': '保存设备',
  '鍒犻櫎璁惧': '删除设备',
  '涓嬭浇瀵煎叆妯℃澘': '下载导入模板',
  '澶勭悊鏂囦欢閫夋嫨': '处理文件选择',
  '璇诲彇 Excel 鏂囦欢': '读取 Excel 文件',
  '瀵煎叆璁惧鏁版嵁': '导入设备数据',
  'Tab 鎺у埗': 'Tab 控制',
  '鏈€杩戜笂鎶ヨ褰?': '最近上报记录',
  'Tab 2: 璁惧绠＄悊': 'Tab 2: 设备管理',
  '鏂板璁惧': '新增设备',
  '缂栬緫璁惧': '编辑设备',
  '鏂板/缂栬緫瀵硅瘽妗?': '新增/编辑对话框',
  'Enter equipment code': '请输入设备编号',
  'Enter equipment code': '请输入设备名称',
  'Enter equipment code': '请输入安装地点',
  '寰呭鐞?': '待处理',
  '寰呰瀵?': '待观察',
  '鏌ョ湅璇︽儏鍔熻兘寰呭畬鍠?': '查看详情功能待完善',
  '缁翠慨': '维修',
  '缁翠慨浜?': '维修人员',
  '璁″垝': '计划',
  '缁翠慨鏃ユ湡': '维修日期',
  '缁翠慨鏃堕棿': '维修时间',
  '缁翠慨璐熻矗浜?': '维修负责人',
  '缁翠慨閰嶅悎浜?': '维修配合人',
  '缁翠慨淇℃伅': '维修信息',
  '缁翠慨鏂规硶': '维修方法',
  '缁翠慨宸ュ叿': '维修工具',
  '缁翠慨鏃堕暱': '维修时长',
  '缁翠慨缁撴灉': '维修结果',
  '缁翠慨鎬佸害': '维修态度',
  '缁翠慨璐ㄩ噺': '维修质量',
  '提交缁翠慨': '提交维修',
  '缁翠慨宸叉彁浜?': '维修已提交',
  '提交缁翠慨失败': '提交维修失败',
  '保存缁翠慨失败': '保存维修失败',
  '请夋嫨': '请选择',
  'Tab鎺у埗': 'Tab控制',
  '闈欓粯澶勭悊加载缁翠慨浜哄憳失败': '静默处理加载维修人员失败',
  '设备故障': '设备故障',
  '新增报障': '新增报障',
  '设备名称': '设备名称',
  '安装地点': '安装地点',
};

// 修复字符串中的乱码
function fixEncoding(text) {
  let fixed = text;
  
  // 按长度从长到短排序，先替换长的
  const sortedFixes = Object.entries(encodingFixes).sort((a, b) => b[0].length - a[0].length);
  
  for (const [garbled, correct] of sortedFixes) {
    fixed = fixed.replaceAll(garbled, correct);
  }
  
  // 修复常见的字符串闭合问题
  fixed = fixed.replace(/title:\s*'鍗[^']*鏌\?/g, "title: '卫生检查'");
  fixed = fixed.replace(/title:\s*'浠婃棩鑷[^']*/g, "title: '今日自检'");
  fixed = fixed.replace(/title:\s*'鍥哄畾[^']*/g, "title: '固定任务'");
  fixed = fixed.replace(/title:\s*'璁惧[^']*鏁呴殰'/g, "title: '设备故障'");
  fixed = fixed.replace(/title:\s*'瀹夊叏[^']*闅愭偅'/g, "title: '安全隐患'");
  fixed = fixed.replace(/title:\s*'璁惧[^']*淇濆吇'/g, "title: '设备保养'");
  fixed = fixed.replace(/title:\s*'鏁版嵁[^']*/g, "title: '数据报表'");
  fixed = fixed.replace(/title:\s*'鐢ㄦ埛[^']*/g, "title: '用户管理'");
  fixed = fixed.replace(/title:\s*'缁勭粐[^']*/g, "title: '组织架构'");
  
  // 修复 placeholder 中的乱码
  fixed = fixed.replace(/placeholder="璇疯緭鍏ヨ[^"]*"/g, 'placeholder="请输入设备编号"');
  fixed = fixed.replace(/placeholder="鑷€姩濉€厖"/g, 'placeholder="自动填充"');
  fixed = fixed.replace(/placeholder="璇烽€[^"]*"/g, (match) => {
    if (match.includes('鏁呴殰')) return 'placeholder="请选择故障类型"';
    if (match.includes('绱ф€')) return 'placeholder="请选择紧急程度"';
    if (match.includes('鍙戠幇')) return 'placeholder="请选择发现时间"';
    return match;
  });
  
  // 修复 label 中的乱码
  fixed = fixed.replace(/label="璁惧[^"]*缂栧彿"/g, 'label="设备编号"');
  fixed = fixed.replace(/label="璁惧[^"]*鍚嶇О"/g, 'label="设备名称"');
  fixed = fixed.replace(/label="瀹夎[^"]*鍦扮偣"/g, 'label="安装地点"');
  fixed = fixed.replace(/label="鏁呴殰[^"]*"/g, (match) => {
    if (match.includes('绫诲瀷')) return 'label="故障类型"';
    if (match.includes('鎻忚堪')) return 'label="故障描述"';
    if (match.includes('涓婃姤')) return 'label="故障上报"';
    return match;
  });
  fixed = fixed.replace(/label="绱ф€[^"]*"/g, 'label="紧急程度"');
  fixed = fixed.replace(/label="鍙戠幇[^"]*"/g, 'label="发现时间"');
  fixed = fixed.replace(/label="鐜板満[^"]*"/g, 'label="现场照片"');
  fixed = fixed.replace(/label="琛ㄥ崟[^"]*"/g, 'label="表单编号"');
  fixed = fixed.replace(/label="鐘舵€?/g, 'label="状态"');
  fixed = fixed.replace(/label="涓婃姤浜?/g, 'label="上报人"');
  fixed = fixed.replace(/label="鎿嶄綔"/g, 'label="操作"');
  fixed = fixed.replace(/label="鍦虹珯"/g, 'label="场站"');
  
  // 修复按钮文本
  fixed = fixed.replace(/>鎻愪氦[^<]*</g, '>提交上报<');
  fixed = fixed.replace(/>閲嶇疆</g, '>重置<');
  fixed = fixed.replace(/>鍒锋柊</g, '>刷新<');
  fixed = fixed.replace(/>鏂板[^<]*</g, '>新增<');
  fixed = fixed.replace(/>缂栬緫</g, '>编辑<');
  fixed = fixed.replace(/>鍒犻櫎</g, '>删除<');
  fixed = fixed.replace(/>涓嬭浇[^<]*</g, '>下载模板<');
  fixed = fixed.replace(/>瀵煎叆</g, '>导入<');
  fixed = fixed.replace(/>淇濆瓨</g, '>保存<');
  fixed = fixed.replace(/>鍙栨秷</g, '>取消<');
  fixed = fixed.replace(/>鎭㈠[^<]*</g, '>恢复默认<');
  
  // 修复注释
  fixed = fixed.replace(/<!--\s*鏈€杩[^>]*-->/g, '<!-- 最近上报记录 -->');
  fixed = fixed.replace(/<!--\s*Tab[^>]*-->/g, (match) => {
    if (match.includes('鏁呴殰')) return '<!-- Tab 1: 故障上报 -->';
    if (match.includes('璁惧')) return '<!-- Tab 2: 设备管理 -->';
    return match;
  });
  fixed = fixed.replace(/<!--\s*璁惧[^>]*-->/g, '<!-- 设备新增/编辑对话框 -->');
  
  // 修复 h3, h4 标题
  fixed = fixed.replace(/<h3>鎴戠殑[^<]*<\/h3>/g, '<h3>我的上报记录</h3>');
  fixed = fixed.replace(/<h4>璁惧[^<]*<\/h4>/g, '<h4>设备管理</h4>');
  
  return fixed;
}

// 修复单个文件
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fixed = fixEncoding(content);
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
      console.log(`✓ 已修复: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ 处理文件失败 ${filePath}:`, error.message);
    return false;
  }
}

// 递归查找所有 Vue 文件
function findVueFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findVueFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 主函数
function main() {
  const viewsDir = path.join(__dirname, 'frontend', 'src', 'views');
  
  if (!fs.existsSync(viewsDir)) {
    console.error(`目录不存在: ${viewsDir}`);
    process.exit(1);
  }
  
  const vueFiles = findVueFiles(viewsDir);
  console.log(`找到 ${vueFiles.length} 个 Vue 文件\n开始修复编码问题...\n`);
  
  let fixedCount = 0;
  for (const file of vueFiles) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n修复完成！共修复 ${fixedCount} 个文件`);
}

main();

