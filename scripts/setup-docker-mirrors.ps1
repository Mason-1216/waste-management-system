# Docker 镜像源配置脚本
# 适用于 Windows Docker Desktop

param(
    [switch]$Apply
)

$configFile = Join-Path $PSScriptRoot "docker-daemon.json"

if (!(Test-Path $configFile)) {
    Write-Host "配置文件不存在: $configFile" -ForegroundColor Red
    exit 1
}

Write-Host "Docker 镜像源配置说明" -ForegroundColor Cyan
Write-Host "=" * 60

if ($Apply) {
    Write-Host "`n正在尝试应用配置..." -ForegroundColor Yellow
    Write-Host "注意: 此操作需要手动完成，请按照以下步骤操作:`n"
}

Write-Host "配置文件位置: $configFile`n"

Write-Host "手动配置步骤:" -ForegroundColor Green
Write-Host "1. 打开 Docker Desktop"
Write-Host "2. 点击右上角的设置图标（齿轮）"
Write-Host "3. 选择左侧的 'Docker Engine'"
Write-Host "4. 在 JSON 编辑器中，添加或修改 'registry-mirrors' 配置："
Write-Host ""
Get-Content $configFile | Write-Host -ForegroundColor Yellow
Write-Host ""
Write-Host "5. 点击 'Apply & Restart' 按钮"
Write-Host "6. 等待 Docker 重启完成"
Write-Host ""
Write-Host "验证配置:" -ForegroundColor Green
Write-Host "  docker info | Select-String -Pattern 'Registry Mirrors' -Context 0,3"
Write-Host ""
Write-Host "=" * 60
