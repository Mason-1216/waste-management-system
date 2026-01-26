# Migration Checklist

## Before You Start
- Confirm the target server has Docker and docker-compose installed.
- Confirm required ports are available: 80 (frontend), 3000 (backend), 5001 (plc-service), 3307 (mysql).
- Prepare access to the repository and any environment-specific configuration.

## Data Backup
- Stop any write-heavy operations.
- Run database backup scripts (see `scripts/backup-all.ps1` or `.sh`).
- Verify backup files are created and non-empty.

## Schema Upgrade
- Run the unified schema upgrade script:
  - Docker: `Get-Content -Raw database/update_schema.sql | docker exec -i wms-mysql mysql -uwms_user -pwms123456`
  - Native MySQL: `mysql -uwms_user -p -D waste_management < database/update_schema.sql`
- Re-run the script if needed; it is idempotent.

## Build and Restart
- Rebuild images and restart services: `docker-compose up -d --build`
- Confirm containers are healthy: `docker ps`

## Smoke Checks
- API (sum/605315220):
  - `/api/auth/me`
  - `/api/roles`
  - `/api/permissions`
  - `/api/safety-check-items`
  - `/api/plc-monitor/realtime`
- Frontend:
  - `http://localhost/`
  - `http://localhost/login`
  - `http://localhost/plc-data-report`

## Post-Migration
- Confirm roles/menus load correctly.
- Confirm file uploads and image previews work.
- Monitor logs for 10-15 minutes for any recurring errors.
