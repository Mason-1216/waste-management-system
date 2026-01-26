# PLC 微服务配置
import os
from dotenv import load_dotenv

load_dotenv()

# Flask 配置
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

# 数据库配置
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_NAME = os.getenv('DB_NAME', 'waste_management')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')

# PLC 默认配置
DEFAULT_PLC_RACK = 0
DEFAULT_PLC_SLOT = 1
PLC_CONNECTION_TIMEOUT = 5000  # ms
PLC_READ_TIMEOUT = 3000  # ms

# 数据类型大小映射
DATA_TYPE_SIZES = {
    'BOOL': 1,
    'INT': 2,
    'DINT': 4,
    'REAL': 4,
    'WORD': 2,
    'DWORD': 4
}
