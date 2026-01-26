# PLC 微服务 Flask 应用
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
from typing import Dict, List, Any

from config import FLASK_HOST, FLASK_PORT, FLASK_DEBUG
from plc_collector import collector
from scheduler_service import scheduler_service

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
_scheduler_started = False


def start_scheduler():
    """Start background scheduler once."""
    global _scheduler_started
    if _scheduler_started:
        return
    try:
        scheduler_service.start()
        _scheduler_started = True
        logger.info("Scheduler service started")
    except Exception as e:
        logger.error(f"Scheduler start failed: {e}")


start_scheduler()


def success_response(data: Any = None, message: str = 'success') -> Dict:
    """成功响应格式"""
    return {
        'code': 200,
        'message': message,
        'data': data
    }


def error_response(message: str, code: int = 500) -> Dict:
    """错误响应格式"""
    return {
        'code': code,
        'message': message,
        'data': None
    }


@app.route('/api/plc/status', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify(success_response({
        'status': 'running',
        'timestamp': datetime.now().isoformat(),
        'service': 'plc-service'
    }))


@app.route('/api/plc/read', methods=['POST'])
def read_plc():
    """
    读取 PLC 数据

    请求体:
    {
        "ip": "192.168.1.10",
        "readings": [
            {"db_number": 1, "offset": 0.0, "data_type": "REAL"},
            {"db_number": 1, "offset": 4.0, "data_type": "DINT"}
        ]
    }
    或单个读取:
    {
        "ip": "192.168.1.10",
        "db_number": 1,
        "offset": 0.0,
        "data_type": "REAL"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify(error_response('Missing request body', 400)), 400

        ip = data.get('ip')
        if not ip:
            return jsonify(error_response('Missing PLC IP address', 400)), 400

        # 批量读取
        if 'readings' in data:
            readings = data['readings']
            results = collector.read_batch(ip, readings)
            return jsonify(success_response({
                'ip': ip,
                'timestamp': datetime.now().isoformat(),
                'results': results
            }))

        # 单个读取
        db_number = data.get('db_number')
        offset = data.get('offset')
        data_type = data.get('data_type', 'REAL')

        if db_number is None or offset is None:
            return jsonify(error_response('Missing db_number or offset', 400)), 400

        value = collector.read_value(ip, int(db_number), float(offset), data_type)

        return jsonify(success_response({
            'ip': ip,
            'db_number': db_number,
            'offset': offset,
            'data_type': data_type,
            'value': value,
            'success': value is not None,
            'timestamp': datetime.now().isoformat(),
            'address': f"DB{db_number}.{offset}"
        }))

    except Exception as e:
        logger.error(f"Read error: {e}")
        return jsonify(error_response(str(e))), 500


@app.route('/api/plc/write', methods=['POST'])
def write_plc():
    """
    写入 PLC 数据

    请求体:
    {
        "ip": "192.168.1.10",
        "db_number": 1,
        "offset": 0.0,
        "data_type": "REAL",
        "value": 123.45
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify(error_response('Missing request body', 400)), 400

        ip = data.get('ip')
        db_number = data.get('db_number')
        offset = data.get('offset')
        data_type = data.get('data_type', 'REAL')
        value = data.get('value')

        if not ip:
            return jsonify(error_response('Missing PLC IP address', 400)), 400
        if db_number is None or offset is None:
            return jsonify(error_response('Missing db_number or offset', 400)), 400
        if value is None:
            return jsonify(error_response('Missing value', 400)), 400

        success = collector.write_value(ip, int(db_number), float(offset), data_type, value)

        return jsonify(success_response({
            'ip': ip,
            'db_number': db_number,
            'offset': offset,
            'data_type': data_type,
            'value': value,
            'success': success,
            'timestamp': datetime.now().isoformat(),
            'address': f"DB{db_number}.{offset}"
        }))

    except Exception as e:
        logger.error(f"Write error: {e}")
        return jsonify(error_response(str(e))), 500


@app.route('/api/plc/connection/check', methods=['POST'])
def check_connection():
    """
    检查 PLC 连接状态

    请求体:
    {
        "ip": "192.168.1.10"
    }
    """
    try:
        data = request.get_json()
        ip = data.get('ip')

        if not ip:
            return jsonify(error_response('Missing PLC IP address', 400)), 400

        connected = collector.check_connection(ip)

        return jsonify(success_response({
            'ip': ip,
            'connected': connected,
            'timestamp': datetime.now().isoformat()
        }))

    except Exception as e:
        logger.error(f"Connection check error: {e}")
        return jsonify(error_response(str(e))), 500


@app.route('/api/plc/connection/disconnect', methods=['POST'])
def disconnect_plc():
    """
    断开 PLC 连接

    请求体:
    {
        "ip": "192.168.1.10"
    }
    或断开所有:
    {
        "all": true
    }
    """
    try:
        data = request.get_json()

        if data.get('all'):
            collector.disconnect_all()
            return jsonify(success_response({
                'message': 'All connections disconnected',
                'timestamp': datetime.now().isoformat()
            }))

        ip = data.get('ip')
        if not ip:
            return jsonify(error_response('Missing PLC IP address', 400)), 400

        collector.disconnect(ip)

        return jsonify(success_response({
            'ip': ip,
            'message': 'Disconnected',
            'timestamp': datetime.now().isoformat()
        }))

    except Exception as e:
        logger.error(f"Disconnect error: {e}")
        return jsonify(error_response(str(e))), 500


@app.route('/api/plc/batch-read', methods=['POST'])
def batch_read_multiple_plc():
    """
    从多个 PLC 批量读取数据

    请求体:
    {
        "configs": [
            {
                "ip": "192.168.1.10",
                "readings": [
                    {"db_number": 1, "offset": 0.0, "data_type": "REAL", "config_id": 1},
                    {"db_number": 1, "offset": 4.0, "data_type": "DINT", "config_id": 2}
                ]
            },
            {
                "ip": "192.168.1.11",
                "readings": [
                    {"db_number": 2, "offset": 0.0, "data_type": "REAL", "config_id": 3}
                ]
            }
        ]
    }
    """
    try:
        data = request.get_json()
        configs = data.get('configs', [])

        if not configs:
            return jsonify(error_response('Missing configs', 400)), 400

        all_results = []
        timestamp = datetime.now().isoformat()

        for config in configs:
            ip = config.get('ip')
            readings = config.get('readings', [])

            if not ip or not readings:
                continue

            results = collector.read_batch(ip, readings)

            # 合并 config_id 到结果
            for i, result in enumerate(results):
                if i < len(readings) and 'config_id' in readings[i]:
                    result['config_id'] = readings[i]['config_id']
                result['ip'] = ip

            all_results.extend(results)

        return jsonify(success_response({
            'timestamp': timestamp,
            'total': len(all_results),
            'success_count': sum(1 for r in all_results if r.get('success')),
            'results': all_results
        }))

    except Exception as e:
        logger.error(f"Batch read error: {e}")
        return jsonify(error_response(str(e))), 500


if __name__ == '__main__':
    logger.info(f"Starting PLC service on {FLASK_HOST}:{FLASK_PORT}")
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG)
