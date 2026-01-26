# PLC 定时采集服务
import logging
import mysql.connector
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import List, Dict
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
from plc_collector import collector

logger = logging.getLogger(__name__)


class SchedulerService:
    """定时采集服务"""

    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone="Asia/Shanghai")
        self.db_config = {
            'host': DB_HOST,
            'port': DB_PORT,
            'database': DB_NAME,
            'user': DB_USER,
            'password': DB_PASSWORD
        }

    def get_db_connection(self):
        """获取数据库连接"""
        return mysql.connector.connect(**self.db_config)

    def get_active_configs(self) -> List[Dict]:
        """获取启用的监控点配置"""
        conn = self.get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT c.*, cat.category_key, cat.schedule_type, cat.interval_hours, cat.interval_minutes, cat.fixed_time
                FROM plc_monitor_configs c
                LEFT JOIN plc_categories cat ON c.category_id = cat.id
                WHERE c.is_active = 1
                ORDER BY c.plc_ip, c.db_number, c.offset_address
            """)
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    def save_readings(self, readings: List[Dict]) -> int:
        """保存读取结果到数据库"""
        if not readings:
            return 0

        conn = self.get_db_connection()
        cursor = conn.cursor()

        try:
            insert_sql = """
                INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, raw_value, quality)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """

            rows = []
            for r in readings:
                rows.append((
                    r['timestamp'],
                    r['config_id'],
                    r['address'],
                    r['value'],
                    r.get('category_id'),
                    r.get('station_id'),
                    str(r['value']) if r['value'] is not None else None,
                    1 if r.get('success') else 0
                ))

            cursor.executemany(insert_sql, rows)
            conn.commit()
            return cursor.rowcount
        except Exception as e:
            logger.error(f"Error saving readings: {e}")
            conn.rollback()
            return 0
        finally:
            cursor.close()
            conn.close()

    def collect_data(self, category_key: str = None):
        """执行数据采集"""
        logger.info(f"Starting data collection, category: {category_key or 'all'}")

        configs = self.get_active_configs()

        # 按分类过滤
        if category_key:
            configs = [c for c in configs if c.get('category_key') == category_key]

        if not configs:
            logger.info("No active configs found")
            return

        # 按 IP 分组
        ip_groups: Dict[str, List[Dict]] = {}
        for config in configs:
            ip = config['plc_ip']
            if ip not in ip_groups:
                ip_groups[ip] = []
            ip_groups[ip].append(config)

        timestamp = datetime.now(ZoneInfo("Asia/Shanghai"))
        all_readings = []

        # 按 IP 采集数据
        for ip, group_configs in ip_groups.items():
            readings = [{
                'db_number': c['db_number'],
                'offset': float(c['offset_address']),
                'data_type': c['data_type'],
                'config_id': c['id']
            } for c in group_configs]

            results = collector.read_batch(ip, readings)

            # 合并配置信息
            for i, result in enumerate(results):
                if i < len(group_configs):
                    config = group_configs[i]
                    result['config_id'] = config['id']
                    result['category_id'] = config.get('category_id')
                    result['station_id'] = config.get('station_id')
                    result['timestamp'] = timestamp
                    if not result.get('address'):
                        result['address'] = f"DB{config['db_number']}.{config['offset_address']}"

            all_readings.extend(results)

        # 保存到数据库（仅保存可用记录）
        safe_readings = [r for r in all_readings if r.get('address') and r.get('success')]
        saved = self.save_readings(safe_readings)
        logger.info(f"Data collection completed, saved {saved} readings")

    def setup_jobs(self):
        """设置定时任务"""
        conn = self.get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT * FROM plc_categories WHERE is_enabled = 1
            """)
            categories = cursor.fetchall()
            enabled_job_ids = {f"collect_{cat['category_key']}" for cat in categories}

            # 移除被禁用的旧任务
            for job in self.scheduler.get_jobs():
                if job.id.startswith('collect_') and job.id not in enabled_job_ids:
                    self.scheduler.remove_job(job.id)

            for cat in categories:
                job_id = f"collect_{cat['category_key']}"

                # 移除已存在的任务
                if self.scheduler.get_job(job_id):
                    self.scheduler.remove_job(job_id)

                if cat['schedule_type'] == 'interval':
                    # 间隔采集
                    hours = int(cat.get('interval_hours') or 0)
                    minutes = int(cat.get('interval_minutes') or 0)
                    if hours == 0 and minutes == 0:
                        hours = 1
                    self.scheduler.add_job(
                        self.collect_data,
                        trigger=IntervalTrigger(hours=hours, minutes=minutes),
                        args=[cat['category_key']],
                        id=job_id,
                        name=f"Collect {cat['category_name']}"
                    )
                    logger.info(f"Scheduled interval job: {job_id}, every {hours} hours {minutes} minutes")

                elif cat['schedule_type'] == 'fixed' and cat['fixed_time']:
                    # 固定时间采集
                    hour, minute = cat['fixed_time'].split(':')
                    self.scheduler.add_job(
                        self.collect_data,
                        trigger=CronTrigger(hour=int(hour), minute=int(minute), timezone="Asia/Shanghai"),
                        args=[cat['category_key']],
                        id=job_id,
                        name=f"Collect {cat['category_name']}"
                    )
                    logger.info(f"Scheduled fixed job: {job_id}, at {cat['fixed_time']}")
                else:
                    logger.warning(f"Skip schedule for category {cat.get('category_key')}: invalid schedule config")

        finally:
            cursor.close()
            conn.close()

    def start(self):
        """启动调度器"""
        self.setup_jobs()
        # 周期刷新配置，确保前端调整后立即生效
        self.scheduler.add_job(
            self.setup_jobs,
            trigger=IntervalTrigger(minutes=1),
            id='refresh_jobs',
            name='Refresh PLC schedules'
        )
        self.scheduler.start()
        logger.info("Scheduler started")

    def stop(self):
        """停止调度器"""
        self.scheduler.shutdown()
        logger.info("Scheduler stopped")

    def trigger_collection(self, category_key: str = None):
        """手动触发采集"""
        self.collect_data(category_key)


# 单例实例
scheduler_service = SchedulerService()
