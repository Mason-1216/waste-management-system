param(
  [string]$ContainerName = "wms-mysql",
  [string]$Database = "waste_management",
  [string]$User = "root",
  [string]$Password = "root123456",
  [string]$SqlOutput = "db_dump.sql",
  [string]$VolumeName = "waste-management-system_mysql_data",
  [string]$VolumeOutput = "mysql_data.tar.gz",
  [switch]$UseRoot,
  [switch]$AddTimestamp
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path

if ($UseRoot) {
  $User = "root"
  $Password = "root123456"
}

if ($AddTimestamp) {
  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $SqlOutput = "db_dump_$timestamp.sql"
  $VolumeOutput = "mysql_data_$timestamp.tar.gz"
}

$sqlPath = Join-Path $root $SqlOutput
$volumePath = Join-Path $root $VolumeOutput

Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "数据库备份开始" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

Write-Host "检查 MySQL 镜像..." -ForegroundColor Yellow
$imageExists = docker images mysql:8.0 -q
if (!$imageExists) {
  Write-Host "  MySQL 镜像不存在，正在拉取..." -ForegroundColor Yellow
  docker pull mysql:8.0 | Out-Null
  Write-Host "  镜像拉取完成" -ForegroundColor Green
} else {
  Write-Host "  MySQL 镜像已存在" -ForegroundColor Green
}
Write-Host ""

Write-Host "Backing up database '$Database' from container '$ContainerName'..."
Write-Host "SQL output: $sqlPath"
$ErrorActionPreference = "Continue"
docker exec $ContainerName sh -c "mysqldump -u $User -p$Password --no-tablespaces --databases $Database 2>/dev/null" > $sqlPath
$exitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"

if ($exitCode -ne 0) {
  throw "Backup failed: mysqldump command failed with exit code $exitCode"
}

if (!(Test-Path -LiteralPath $sqlPath)) {
  throw "Backup failed: SQL output file not created."
}

$sqlSize = (Get-Item -LiteralPath $sqlPath).Length
if ($sqlSize -eq 0) {
  throw "Backup failed: SQL output file is empty (0 bytes)."
}
Write-Host "SQL backup completed. Size: $sqlSize bytes"

Write-Host "Backing up Docker volume '$VolumeName'..."
Write-Host "Volume output: $volumePath"
$ErrorActionPreference = "Continue"
& docker run --rm `
  --mount "type=volume,source=$VolumeName,target=/var/lib/mysql" `
  --mount "type=bind,source=$root,target=/backup" `
  mysql:8.0 sh -c "cd /var/lib/mysql && tar -czf /backup/$VolumeOutput ."
$exitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"

if ($exitCode -ne 0) {
  throw "Backup failed: volume backup command failed with exit code $exitCode"
}

if (!(Test-Path -LiteralPath $volumePath)) {
  throw "Backup failed: volume output file not created."
}

$volumeSize = (Get-Item -LiteralPath $volumePath).Length
Write-Host "Volume backup completed. Size: $volumeSize bytes"

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "备份完成总结" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
Write-Host "SQL 备份文件:" -ForegroundColor Green
Write-Host "  路径: $sqlPath"
Write-Host "  大小: $([math]::Round($sqlSize / 1MB, 2)) MB ($sqlSize bytes)"
Write-Host ""
Write-Host "卷备份文件:" -ForegroundColor Green
Write-Host "  路径: $volumePath"
Write-Host "  大小: $([math]::Round($volumeSize / 1MB, 2)) MB ($volumeSize bytes)"
Write-Host ""
Write-Host "备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "所有备份操作已成功完成！" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan
