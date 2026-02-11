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

function Add-TimestampToPath {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Timestamp
  )

  $dir = [System.IO.Path]::GetDirectoryName($Path)
  $file = [System.IO.Path]::GetFileName($Path)

  # Preserve .tar.gz (GetExtension only returns .gz)
  if ($file.ToLowerInvariant().EndsWith('.tar.gz')) {
    $base = $file.Substring(0, $file.Length - 7)
    $ext = '.tar.gz'
  } else {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($file)
    $ext = [System.IO.Path]::GetExtension($file)
  }

  $newFile = "${base}_${Timestamp}${ext}"
  if ($dir) {
    return (Join-Path $dir $newFile)
  }
  return $newFile
}

if ($UseRoot) {
  $User = "root"
  $Password = "root123456"
}

if ($AddTimestamp) {
  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $SqlOutput = Add-TimestampToPath -Path $SqlOutput -Timestamp $timestamp
  $VolumeOutput = Add-TimestampToPath -Path $VolumeOutput -Timestamp $timestamp
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
docker exec -e "MYSQL_PWD=$Password" $ContainerName mysqldump -u $User --no-tablespaces --single-transaction --quick --lock-tables=false --databases $Database > $sqlPath
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
$backupContainerName = "wms-mysql-vol-backup-$([Guid]::NewGuid().ToString('N'))"

try {
  $ErrorActionPreference = "Continue"
  try { docker rm -f $backupContainerName 2>$null | Out-Null } catch { }

  # Create backup archive inside a temporary container, then docker cp it out.
  docker create --name $backupContainerName `
    --mount "type=volume,source=$VolumeName,target=/var/lib/mysql" `
    mysql:8.0 sh -c "cd /var/lib/mysql && tar -czf /tmp/mysql_data.tar.gz ." | Out-Null
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "Backup failed: docker create failed with exit code $exitCode"
  }

  docker start -a $backupContainerName | Out-Null
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "Backup failed: volume backup container failed with exit code $exitCode"
  }

  $volumeDir = Split-Path -Parent $volumePath
  if ($volumeDir -and !(Test-Path -LiteralPath $volumeDir)) {
    New-Item -ItemType Directory -Path $volumeDir | Out-Null
  }

  docker cp "${backupContainerName}:/tmp/mysql_data.tar.gz" $volumePath | Out-Null
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "Backup failed: docker cp failed with exit code $exitCode"
  }
} finally {
  $ErrorActionPreference = "Continue"
  try { docker rm -f $backupContainerName 2>$null | Out-Null } catch { }
  $ErrorActionPreference = "Stop"
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
