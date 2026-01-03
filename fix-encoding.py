#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 Vue 文件中的编码问题
"""
import os
import re
import glob
from pathlib import Path

# 常见的乱码字符映射（UTF-8 被错误解释为 GBK/Latin-1 的情况）
# 这些映射基于常见的乱码模式
ENCODING_FIXES = {
    # 常见字符映射
    '閫': '选',
    '鍗': '卫',
    '鑷': '自',
    '鏌': '查',
    '妫': '检',
    '缁': '统',
    '绠': '管',
    '鐢': '用',
    '缁勭粐': '组织',
    '鏋舵瀯': '架构',
    '璁惧': '设备',
    '鏁呴殰': '故障',
    '涓婃姤': '上报',
    '缂栧彿': '编号',
    '鍚嶇О': '名称',
    '瀹夎': '安装',
    '鍦扮偣': '地点',
    '鑷€姩濉€厖': '自动填充',
    '璇疯緭鍏': '请输入',
    '绫诲瀷': '类型',
    '璇烽€夋嫨': '请选择',
    '鏈烘': '机械',
    '鐢垫皵': '电气',
    '娑插帇': '液压',
    '鎺у埗绯荤粺': '控制系统',
    '鍏朵粬': '其他',
    '绱ф€ョ▼搴?': '紧急程度',
    '涓€鑸?': '一般',
    '杈冩€?': '较急',
    '绱ф€?': '紧急',
    '闈炲父绱ф€?': '非常紧急',
    '鎻忚堪': '描述',
    '璇疯缁嗘弿杩?': '请详细描述',
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
}

def fix_encoding_in_content(content):
    """修复内容中的编码问题"""
    # 先尝试修复常见的乱码模式
    fixed = content
    
    # 修复常见的乱码字符
    for garbled, correct in ENCODING_FIXES.items():
        fixed = fixed.replace(garbled, correct)
    
    # 修复字符串闭合问题（如 '鍗敓妫€鏌?' -> '卫生检查'）
    # 这些通常是因为字符串没有正确闭合导致的
    patterns = [
        (r"title:\s*'鍗[^']*鏌\?", "title: '卫生检查'"),
        (r"title:\s*'浠婃棩鑷[^']*", "title: '今日自检'"),
        (r"title:\s*'鍥哄畾[^']*", "title: '固定任务'"),
        (r"title:\s*'璁惧[^']*鏁呴殰'", "title: '设备故障'"),
        (r"title:\s*'瀹夊叏[^']*闅愭偅'", "title: '安全隐患'"),
        (r"title:\s*'璁惧[^']*淇濆吇'", "title: '设备保养'"),
        (r"title:\s*'鏁版嵁[^']*", "title: '数据报表'"),
        (r"title:\s*'鐢ㄦ埛[^']*", "title: '用户管理'"),
        (r"title:\s*'缁勭粐[^']*", "title: '组织架构'"),
    ]
    
    for pattern, replacement in patterns:
        fixed = re.sub(pattern, replacement, fixed)
    
    return fixed

def fix_file(file_path):
    """修复单个文件的编码问题"""
    try:
        # 尝试用不同的编码读取文件
        encodings = ['utf-8', 'gbk', 'gb2312', 'latin-1', 'cp1252']
        content = None
        used_encoding = None
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                    used_encoding = encoding
                    break
            except (UnicodeDecodeError, UnicodeError):
                continue
        
        if content is None:
            print(f"无法读取文件: {file_path}")
            return False
        
        # 修复编码问题
        fixed_content = fix_encoding_in_content(content)
        
        # 如果内容有变化，保存文件
        if fixed_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"已修复: {file_path}")
            return True
        else:
            print(f"无需修复: {file_path}")
            return False
            
    except Exception as e:
        print(f"处理文件 {file_path} 时出错: {e}")
        return False

def main():
    """主函数"""
    # 获取 frontend/src/views 目录
    base_dir = Path(__file__).parent / 'frontend' / 'src' / 'views'
    
    if not base_dir.exists():
        print(f"目录不存在: {base_dir}")
        return
    
    # 查找所有 Vue 文件
    vue_files = list(base_dir.rglob('*.vue'))
    
    print(f"找到 {len(vue_files)} 个 Vue 文件")
    print("开始修复编码问题...\n")
    
    fixed_count = 0
    for vue_file in vue_files:
        if fix_file(vue_file):
            fixed_count += 1
    
    print(f"\n修复完成！共修复 {fixed_count} 个文件")

if __name__ == '__main__':
    main()

