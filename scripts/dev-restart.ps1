param(
    [switch]$BuildBackend
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Restarting dev stack from $root"

docker info *> $null

# Ensure network exists
$networkName = 'waste-management-system_default'
if (-not (docker network ls --format '{{.Name}}' | Select-String -Quiet "^$networkName$")) {
    docker network create $networkName | Out-Null
}

# Ensure volume exists for frontend node_modules
$volumeName = 'wms-frontend-node-modules'
if (-not (docker volume ls --format '{{.Name}}' | Select-String -Quiet "^$volumeName$")) {
    docker volume create $volumeName | Out-Null
}

# Start mysql if present
if (docker ps -a --format '{{.Names}}' | Select-String -Quiet '^wms-mysql$') {
    docker start wms-mysql | Out-Null
}

if ($BuildBackend) {
    $env:DOCKER_BUILDKIT = '0'
    docker build -t waste-management-system-backend .\backend
}

# Restart backend container
if (docker ps -a --format '{{.Names}}' | Select-String -Quiet '^wms-backend$') {
    docker rm -f wms-backend | Out-Null
}
docker run -d --name wms-backend --restart always `
  --network $networkName --network-alias backend `
  -p 3000:3000 `
  -e NODE_ENV=production `
  -e DB_HOST=mysql `
  -e DB_PORT=3306 `
  -e DB_NAME=waste_management `
  -e DB_USER=wms_user `
  -e DB_PASSWORD=wms123456 `
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production `
  -e PORT=3000 `
  -v "$root\\uploads:/app/uploads" `
  waste-management-system-backend | Out-Null

# Restart frontend dev container
if (docker ps -a --format '{{.Names}}' | Select-String -Quiet '^wms-frontend-dev$') {
    docker rm -f wms-frontend-dev | Out-Null
}
docker run -d --name wms-frontend-dev `
  --network $networkName `
  -p 5173:5173 `
  -e VITE_API_TARGET=http://backend:3000 `
  -e CHOKIDAR_USEPOLLING=true `
  -v "$root\\frontend:/app" `
  -v ${volumeName}:/app/node_modules `
  -w /app `
  node:18 sh -c "npm run dev -- --host 0.0.0.0 --port 5173" | Out-Null

Write-Host "Dev frontend: http://localhost:5173"
Write-Host "Backend: http://localhost:3000"
