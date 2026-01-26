# Test Docker mirror availability

Write-Host "Docker Mirror Availability Test" -ForegroundColor Cyan
Write-Host "=" * 60

$mirrors = @(
    @{Name="DaoCloud"; URL="https://docker.m.daocloud.io/v2/"},
    @{Name="1Panel"; URL="https://docker.1panel.live/v2/"},
    @{Name="Rat.dev"; URL="https://hub.rat.dev/v2/"}
)

$npmMirror = "https://registry.npmmirror.com/"
$alpineMirror = "https://mirrors.aliyun.com/alpine/"

Write-Host "`nTesting Docker Hub Mirrors:" -ForegroundColor Green

foreach ($mirror in $mirrors) {
    Write-Host "`n[$($mirror.Name)]" -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $mirror.URL -Method Head -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
            Write-Host " Available" -ForegroundColor Green
            Write-Host "  URL: $($mirror.URL)"
        } else {
            Write-Host " Unavailable (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host " Unavailable (Connection failed)" -ForegroundColor Red
    }
}

Write-Host "`n`nTesting NPM Mirror:" -ForegroundColor Green
Write-Host "`n[Taobao Mirror]" -NoNewline
try {
    $response = Invoke-WebRequest -Uri $npmMirror -Method Head -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host " Available" -ForegroundColor Green
        Write-Host "  URL: $npmMirror"
    } else {
        Write-Host " Unavailable" -ForegroundColor Red
    }
} catch {
    Write-Host " Unavailable" -ForegroundColor Red
}

Write-Host "`n`nTesting Alpine Mirror:" -ForegroundColor Green
Write-Host "`n[Aliyun Mirror]" -NoNewline
try {
    $response = Invoke-WebRequest -Uri $alpineMirror -Method Head -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host " Available" -ForegroundColor Green
        Write-Host "  URL: $alpineMirror"
    } else {
        Write-Host " Unavailable" -ForegroundColor Red
    }
} catch {
    Write-Host " Unavailable" -ForegroundColor Red
}

Write-Host "`n`nTesting Docker Configuration:" -ForegroundColor Green
try {
    $dockerInfo = docker info 2>$null | Select-String -Pattern "Registry Mirrors" -Context 0,5
    if ($dockerInfo) {
        Write-Host "`nConfigured Registry Mirrors:" -ForegroundColor Yellow
        $dockerInfo | ForEach-Object { Write-Host $_.Line }
    } else {
        Write-Host "`nNo registry mirrors configured" -ForegroundColor Yellow
        Write-Host "  Run: .\setup-docker-mirrors.ps1 -Apply"
    }
} catch {
    Write-Host "`nCannot get Docker info" -ForegroundColor Red
    Write-Host "  Make sure Docker Desktop is running"
}

Write-Host "`n" + "=" * 60
Write-Host "Test completed" -ForegroundColor Cyan
