param(
  [string]$VolumeName = "waste-management-system_mysql_data",
  [string]$VolumeInput = "backups\\mysql_data.tar.gz",
  [string]$SqlInput = "backups\\db_dump.sql",
  [string]$ContainerName = "wms-mysql",
  [string]$Database = "waste_management",
  [string]$User = "root",
  [string]$Password = "root123456",
  [switch]$UseRoot,
  [switch]$ImportSql,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$volumePath = Join-Path $root $VolumeInput
$sqlPath = Join-Path $root $SqlInput

if ($UseRoot) {
  $User = "root"
  $Password = "root123456"
}

function Write-DryRun {
  param([Parameter(Mandatory = $true)][string]$Text)
  Write-Host "[DryRun] $Text" -ForegroundColor DarkGray
}

if (!(Test-Path -LiteralPath $volumePath)) {
  throw "Volume backup not found: $volumePath"
}

Write-Host "Checking MySQL image..." -ForegroundColor Yellow
$imageExists = docker images mysql:8.0 -q
if (!$imageExists) {
  if ($DryRun) {
    Write-DryRun "docker pull mysql:8.0"
  } else {
    docker pull mysql:8.0 | Out-Null
  }
}

Write-Host "Stopping services (docker-compose down)..." -ForegroundColor Yellow
if ($DryRun) {
  Write-DryRun "docker-compose down (workdir: $root)"
} else {
  Push-Location $root
  try {
    $ErrorActionPreference = "Continue"
    docker-compose down | Out-Null
    $ErrorActionPreference = "Stop"
  } finally {
    Pop-Location
  }
}

Write-Host "Ensuring Docker volume '$VolumeName' exists..." -ForegroundColor Yellow
if ($DryRun) {
  Write-DryRun "docker volume create $VolumeName"
} else {
  docker volume create $VolumeName | Out-Null
}

Write-Host "Restoring Docker volume from '$VolumeInput'..." -ForegroundColor Cyan
$restoreContainerName = "wms-mysql-vol-restore-$([Guid]::NewGuid().ToString('N'))"
$restoreCmd = "set -e; find /var/lib/mysql -mindepth 1 -maxdepth 1 -exec rm -rf {} +; cd /var/lib/mysql; tar -xzf /tmp/volume_backup.tar.gz"

try {
  if ($DryRun) {
    Write-DryRun "docker create --name $restoreContainerName --mount type=volume,source=$VolumeName,target=/var/lib/mysql mysql:8.0 sh -c <restoreCmd>"
    Write-DryRun "docker cp $volumePath ${restoreContainerName}:/tmp/volume_backup.tar.gz"
    Write-DryRun "docker start -a $restoreContainerName"
  } else {
    $ErrorActionPreference = "Continue"
    try { docker rm -f $restoreContainerName 2>$null | Out-Null } catch { }

    docker create --name $restoreContainerName `
      --mount "type=volume,source=$VolumeName,target=/var/lib/mysql" `
      mysql:8.0 sh -c $restoreCmd | Out-Null
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      throw "Volume restore failed: docker create failed with exit code $exitCode"
    }

    docker cp $volumePath "${restoreContainerName}:/tmp/volume_backup.tar.gz" | Out-Null
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      throw "Volume restore failed: docker cp failed with exit code $exitCode"
    }

    docker start -a $restoreContainerName | Out-Null
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      throw "Volume restore failed: restore container failed with exit code $exitCode"
    }

    $ErrorActionPreference = "Stop"
  }
} finally {
  if ($DryRun) {
    Write-DryRun "docker rm -f $restoreContainerName"
  } else {
    $ErrorActionPreference = "Continue"
    try { docker rm -f $restoreContainerName 2>$null | Out-Null } catch { }
    $ErrorActionPreference = "Stop"
  }
}

Write-Host "Pulling required base images (optional)..." -ForegroundColor Yellow
$images = @("node:18-alpine", "nginx:alpine")
foreach ($img in $images) {
  $exists = docker images $img -q
  if (!$exists) {
    if ($DryRun) {
      Write-DryRun "docker pull $img"
    } else {
      docker pull $img | Out-Null
    }
  }
}

Write-Host "Starting services (docker-compose up -d)..." -ForegroundColor Green
if ($DryRun) {
  Write-DryRun "docker-compose up -d (workdir: $root)"
} else {
  Push-Location $root
  try {
    docker-compose up -d
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      throw "docker-compose up failed with exit code $exitCode"
    }
  } finally {
    Pop-Location
  }
}

if ($ImportSql) {
  if (!(Test-Path -LiteralPath $sqlPath)) {
    throw "SQL backup not found: $sqlPath"
  }

  Write-Host "Waiting for MySQL to become ready..." -ForegroundColor Yellow
  if ($DryRun) {
    Write-DryRun "docker exec $ContainerName mysqladmin ping ..."
  } else {
    $deadline = (Get-Date).AddSeconds(180)
    while ($true) {
      $ErrorActionPreference = "Continue"
      docker exec -e "MYSQL_PWD=$Password" $ContainerName mysqladmin -u $User ping -h 127.0.0.1 --silent | Out-Null
      $exitCode = $LASTEXITCODE
      $ErrorActionPreference = "Stop"

      if ($exitCode -eq 0) {
        break
      }
      if ((Get-Date) -gt $deadline) {
        throw "MySQL is not ready after 180 seconds. Container: $ContainerName"
      }
      Start-Sleep -Seconds 2
    }
  }

  Write-Host "Importing SQL from '$SqlInput'..." -ForegroundColor Cyan
  if ($DryRun) {
    Write-DryRun "docker cp $sqlPath ${ContainerName}:/tmp/db_dump.sql"
    Write-DryRun "docker exec -e MYSQL_PWD=*** $ContainerName sh -c 'mysql -u $User < /tmp/db_dump.sql'"
  } else {
    docker cp $sqlPath "${ContainerName}:/tmp/db_dump.sql" | Out-Null
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      throw "SQL import failed: docker cp failed with exit code $exitCode"
    }

    # Root import is recommended when the dump contains CREATE DATABASE/USE statements.
    $importCmd = if ($User -eq "root") {
      "mysql -u $User < /tmp/db_dump.sql"
    } else {
      "mysql -u $User $Database < /tmp/db_dump.sql"
    }

    docker exec -e "MYSQL_PWD=$Password" $ContainerName sh -c $importCmd | Out-Null
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      throw "SQL import failed with exit code $exitCode"
    }
  }

  Write-Host "SQL import completed." -ForegroundColor Green
}

Write-Host "Restore completed." -ForegroundColor Green
