# PLC 数据采集模块
import snap7
import struct
import logging
from typing import Dict, List, Optional, Any, Union
from config import (
    DEFAULT_PLC_RACK, DEFAULT_PLC_SLOT,
    PLC_CONNECTION_TIMEOUT, DATA_TYPE_SIZES
)

logger = logging.getLogger(__name__)

class PlcCollector:
    """PLC 数据采集器"""

    def __init__(self):
        self.clients: Dict[str, snap7.client.Client] = {}

    def get_client(self, ip: str) -> snap7.client.Client:
        """获取或创建 PLC 客户端连接"""
        if ip not in self.clients or not self.clients[ip].get_connected():
            client = snap7.client.Client()
            try:
                client.connect(ip, DEFAULT_PLC_RACK, DEFAULT_PLC_SLOT)
                self.clients[ip] = client
                logger.info(f"Connected to PLC at {ip}")
            except Exception as e:
                logger.error(f"Failed to connect to PLC at {ip}: {e}")
                raise
        return self.clients[ip]

    def disconnect(self, ip: str) -> None:
        """断开 PLC 连接"""
        if ip in self.clients:
            try:
                self.clients[ip].disconnect()
                del self.clients[ip]
                logger.info(f"Disconnected from PLC at {ip}")
            except Exception as e:
                logger.error(f"Error disconnecting from PLC at {ip}: {e}")

    def disconnect_all(self) -> None:
        """断开所有 PLC 连接"""
        for ip in list(self.clients.keys()):
            self.disconnect(ip)

    def read_value(self, ip: str, db_number: int, offset: float, data_type: str) -> Optional[Any]:
        """
        从 PLC 读取单个值

        Args:
            ip: PLC IP 地址
            db_number: DB 块号
            offset: 偏移地址
            data_type: 数据类型 (REAL/DINT/INT/BOOL/WORD/DWORD)

        Returns:
            读取的值，失败返回 None
        """
        try:
            client = self.get_client(ip)
            byte_offset = int(offset)
            bit_offset = int((offset - byte_offset) * 10)  # 0.0 -> 0, 0.1 -> 1, etc.

            size = DATA_TYPE_SIZES.get(data_type.upper(), 4)

            # 读取数据
            data = client.db_read(db_number, byte_offset, size)

            # 根据数据类型解析
            value = self._parse_value(data, data_type, bit_offset)
            return value

        except Exception as e:
            logger.error(f"Error reading from PLC {ip}, DB{db_number}.{offset}: {e}")
            return None

    def read_batch(self, ip: str, readings: List[Dict]) -> List[Dict]:
        """
        批量读取多个值

        Args:
            ip: PLC IP 地址
            readings: 读取配置列表，每项包含 db_number, offset, data_type

        Returns:
            读取结果列表
        """
        results = []
        try:
            client = self.get_client(ip)

            for reading in readings:
                try:
                    db_number = reading['db_number']
                    offset = float(reading['offset'])
                    data_type = reading.get('data_type', 'REAL')

                    value = self.read_value(ip, db_number, offset, data_type)
                    results.append({
                        'db_number': db_number,
                        'offset': offset,
                        'data_type': data_type,
                        'value': value,
                        'success': value is not None,
                        'address': f"DB{db_number}.{offset}"
                    })
                except Exception as e:
                    address = None
                    if reading.get('db_number') is not None and reading.get('offset') is not None:
                        address = f"DB{reading.get('db_number')}.{reading.get('offset')}"
                    results.append({
                        'db_number': reading.get('db_number'),
                        'offset': reading.get('offset'),
                        'data_type': reading.get('data_type', 'REAL'),
                        'value': None,
                        'success': False,
                        'error': str(e),
                        'address': address
                    })

        except Exception as e:
            logger.error(f"Batch read error for PLC {ip}: {e}")
            # 连接失败，所有读取都失败
            for reading in readings:
                address = None
                if reading.get('db_number') is not None and reading.get('offset') is not None:
                    address = f"DB{reading.get('db_number')}.{reading.get('offset')}"
                results.append({
                    'db_number': reading.get('db_number'),
                    'offset': reading.get('offset'),
                    'data_type': reading.get('data_type', 'REAL'),
                    'value': None,
                    'success': False,
                    'error': str(e),
                    'address': address
                })

        return results

    def write_value(self, ip: str, db_number: int, offset: float, data_type: str, value: Any) -> bool:
        """
        向 PLC 写入单个值

        Args:
            ip: PLC IP 地址
            db_number: DB 块号
            offset: 偏移地址
            data_type: 数据类型
            value: 要写入的值

        Returns:
            是否写入成功
        """
        try:
            client = self.get_client(ip)
            byte_offset = int(offset)
            bit_offset = int((offset - byte_offset) * 10)

            data = self._encode_value(value, data_type, bit_offset)
            if data is None:
                return False

            client.db_write(db_number, byte_offset, data)
            logger.info(f"Written to PLC {ip}, DB{db_number}.{offset}: {value}")
            return True

        except Exception as e:
            logger.error(f"Error writing to PLC {ip}, DB{db_number}.{offset}: {e}")
            return False

    def _parse_value(self, data: bytes, data_type: str, bit_offset: int = 0) -> Optional[Any]:
        """解析 PLC 数据"""
        data_type = data_type.upper()

        try:
            if data_type == 'BOOL':
                return bool((data[0] >> bit_offset) & 1)
            elif data_type == 'INT':
                return struct.unpack('>h', data[:2])[0]
            elif data_type == 'DINT':
                return struct.unpack('>i', data[:4])[0]
            elif data_type == 'REAL':
                return struct.unpack('>f', data[:4])[0]
            elif data_type == 'WORD':
                return struct.unpack('>H', data[:2])[0]
            elif data_type == 'DWORD':
                return struct.unpack('>I', data[:4])[0]
            else:
                logger.warning(f"Unknown data type: {data_type}")
                return None
        except Exception as e:
            logger.error(f"Error parsing {data_type}: {e}")
            return None

    def _encode_value(self, value: Any, data_type: str, bit_offset: int = 0) -> Optional[bytes]:
        """编码值为 PLC 数据格式"""
        data_type = data_type.upper()

        try:
            if data_type == 'BOOL':
                byte_val = (1 if value else 0) << bit_offset
                return struct.pack('B', byte_val)
            elif data_type == 'INT':
                return struct.pack('>h', int(value))
            elif data_type == 'DINT':
                return struct.pack('>i', int(value))
            elif data_type == 'REAL':
                return struct.pack('>f', float(value))
            elif data_type == 'WORD':
                return struct.pack('>H', int(value))
            elif data_type == 'DWORD':
                return struct.pack('>I', int(value))
            else:
                return None
        except Exception as e:
            logger.error(f"Error encoding {data_type}: {e}")
            return None

    def check_connection(self, ip: str) -> bool:
        """检查 PLC 连接状态"""
        try:
            client = self.get_client(ip)
            return client.get_connected()
        except:
            return False


# 单例实例
collector = PlcCollector()
