#!/bin/bash
# 废物管理系统 - 完整备份脚本
# 备份MySQL数据库和Docker卷数据

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
PROJECT_NAME="waste-management-system"
DB_CONTAINER="wms-mysql"
DB_NAME="waste_management"
DB_USER="root"
DB_PASSWORD="root123456"

# 获取脚本所在目录的父目录(项目根目录)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 生成时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 备份目录
BACKUP_DIR="$PROJECT_DIR"
DB_BACKUP_FILE="db_backup_${TIMESTAMP}.sql"
VOLUME_BACKUP_FILE="mysql_data_${TIMESTAMP}.tar.gz"

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  废物管理系统 - 完整备份${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo "项目目录: $PROJECT_DIR"
echo "备份时间戳: $TIMESTAMP"
echo ""

# 步骤1: 备份数据库
echo -e "${YELLOW}[1/2] 备份MySQL数据库...${NC}"
echo "导出到: $DB_BACKUP_FILE"

if docker exec "$DB_CONTAINER" mysqldump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_DIR/$DB_BACKUP_FILE" 2>/dev/null; then
    DB_SIZE=$(du -h "$BACKUP_DIR/$DB_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ 数据库备份成功${NC}"
    echo "  文件: $DB_BACKUP_FILE"
    echo "  大小: $DB_SIZE"
else
    echo -e "${RED}✗ 数据库备份失败${NC}"
    exit 1
fi

echo ""

# 步骤2: 备份Docker卷
echo -e "${YELLOW}[2/2] 备份MySQL数据卷...${NC}"
echo "导出到: $VOLUME_BACKUP_FILE"

# 使用docker run创建临时容器来备份卷
VOLUME_NAME="${PROJECT_NAME}_mysql_data"

if MSYS_NO_PATHCONV=1 docker run --rm \
    -v "$VOLUME_NAME:/data" \
    -v "$BACKUP_DIR:/backup" \
    mysql:8.0 \
    tar czf "/backup/$VOLUME_BACKUP_FILE" -C /data . 2>/dev/null; then
    VOLUME_SIZE=$(du -h "$BACKUP_DIR/$VOLUME_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ 数据卷备份成功${NC}"
    echo "  文件: $VOLUME_BACKUP_FILE"
    echo "  大小: $VOLUME_SIZE"
else
    echo -e "${RED}✗ 数据卷备份失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  备份完成!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo "备份文件位置:"
echo "  数据库SQL: $BACKUP_DIR/$DB_BACKUP_FILE"
echo "  数据卷:    $BACKUP_DIR/$VOLUME_BACKUP_FILE"
echo ""
echo -e "${YELLOW}建议:${NC}"
echo "  1. 将备份文件保存到安全的位置"
echo "  2. 定期清理旧的备份文件以节省空间"
echo "  3. 测试备份文件的可恢复性"
echo ""
