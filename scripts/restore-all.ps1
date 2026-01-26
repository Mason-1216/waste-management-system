param(
  [string]$VolumeName = "waste-management-system_mysql_data",
  [string]$VolumeInput = "mysql_data.tar.gz",
  [string]$SqlInput = "db_dump.sql",
  [string]$ContainerName = "wms-mysql",
  [switch]$ImportSql
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$volumePath = Join-Path $root $VolumeInput
$sqlPath = Join-Path $root $SqlInput

if (!(Test-Path -LiteralPath $volumePath)) {
  throw "Volume backup not found: $volumePath"
}

Write-Host "Ensuring Docker volume '$VolumeName' exists..."
& docker volume create $VolumeName | Out-Null

Write-Host "Restoring Docker volume from '$VolumeInput'..."
$ErrorActionPreference = "Continue"
& docker run --rm -v "${VolumeName}:/var/lib/mysql" -v "${root}:/backup" mysql:8.0 sh -c "cd /var/lib/mysql && tar -xzf /backup/$VolumeInput"
$exitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"

if ($exitCode -ne 0) {
  throw "Volume restore failed with exit code $exitCode"
}

Write-Host "Pulling required Docker images..."
Write-Host "  - Pulling mysql:8.0..."
& docker pull mysql:8.0 | Out-Null
Write-Host "  - Pulling node:18-alpine..."
& docker pull node:18-alpine | Out-Null
Write-Host "  - Pulling nginx:alpine..."
& docker pull nginx:alpine | Out-Null
Write-Host "All images pulled successfully."

Write-Host "Starting services..."
& docker-compose up -d

if ($ImportSql) {
  if (!(Test-Path -LiteralPath $sqlPath)) {
    throw "SQL backup not found: $sqlPath"
  }
  Write-Host "Importing SQL from '$SqlInput'..."
  Get-Content $sqlPath | & docker exec -i $ContainerName mysql -u wms_user -pwms123456 waste_management
  Write-Host "SQL import completed."
}
