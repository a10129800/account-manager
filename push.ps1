# 設定 UTF-8 編碼
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$host.UI.RawUI.WindowTitle = "帳號管理器 - 推送到 GitHub"

Clear-Host
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       帳號管理器 - GitHub 一鍵推送工具" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. 檢查 Git 是否安裝
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[錯誤] 您的電腦尚未安裝 Git 工具！" -ForegroundColor Red
    Write-Host "請先至官網下載並安裝 Git：https://git-scm.com/`n" -ForegroundColor Yellow
    Read-Host "請按 Enter 鍵關閉"
    exit 1
}

# 切換到專案根目錄
Set-Location -Path $PSScriptRoot

# 確保專屬代表物資產就位 (生活感牛仔外套去背帥犬 + 方案A歡迎封面犬)
$mascotSrc = "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\anthro_dog_isolated_1790597732222.jpg"
$welcomeSrc = "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\mascot_arcane_stylized_1790598288807.jpg"

$brainDir = "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816"
$galleryMap = @{
    "mascot_arcane_stylized_1790598288807.jpg" = "mascot_welcome.jpg"
    "mascot_cool_dev_glasses_1790598309579.jpg" = "mascot_glasses.jpg"
    "anthro_dog_casual_hoodie_1790597605710.jpg" = "mascot_hoodie.jpg"
}
foreach ($item in $galleryMap.GetEnumerator()) {
    $src = Join-Path $brainDir $item.Key
    if (Test-Path $src) {
        Copy-Item $src -Destination (Join-Path $PSScriptRoot $item.Value) -Force -ErrorAction SilentlyContinue
        Copy-Item $src -Destination (Join-Path "$PSScriptRoot\src" $item.Value) -Force -ErrorAction SilentlyContinue
    }
}

if (Test-Path $mascotSrc) {
    Copy-Item $mascotSrc -Destination "$PSScriptRoot\curry_dog.jpg" -Force -ErrorAction SilentlyContinue
    Copy-Item $mascotSrc -Destination "$PSScriptRoot\src\curry_dog.jpg" -Force -ErrorAction SilentlyContinue
    try {
        Add-Type -AssemblyName System.Drawing -ErrorAction SilentlyContinue
        $bmp = [System.Drawing.Bitmap]::FromFile($mascotSrc)
        $bmp.MakeTransparent([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        $bmp.Save("$PSScriptRoot\curry_dog.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Save("$PSScriptRoot\src\curry_dog.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    } catch {
        Copy-Item $mascotSrc -Destination "$PSScriptRoot\curry_dog.png" -Force -ErrorAction SilentlyContinue
        Copy-Item $mascotSrc -Destination "$PSScriptRoot\src\curry_dog.png" -Force -ErrorAction SilentlyContinue
    }

    # 備份至專案資產與 D 槽吉祥物庫
    $mascotLib = "d:\專案吉祥物庫"
    $assetMascot = "$PSScriptRoot\assets\mascot"
    @($mascotLib, $assetMascot) | ForEach-Object {
        if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
        Copy-Item "$PSScriptRoot\curry_dog.png" -Destination "$_\01_牛仔外套_透明去背.png" -Force -ErrorAction SilentlyContinue
        Copy-Item $mascotSrc -Destination "$_\01_牛仔外套_去背高解析.jpg" -Force -ErrorAction SilentlyContinue
    }
}

# 2. 檢查是否初始化 Git 倉庫
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] 正在初始化本地 Git 倉庫..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "[OK] Git 初始化完成。`n" -ForegroundColor Green
}

# 3. 檢查遠端倉庫綁定
$remote = (git remote get-url origin 2>$null)
if (-not $remote) {
    Write-Host "[2/4] 尚未綁定 GitHub 倉庫網址！" -ForegroundColor Yellow
    Write-Host "請先在 GitHub (https://github.com/new) 建立新倉庫。" -ForegroundColor Gray
    Write-Host "例如：https://github.com/您的帳號/account-manager.git`n" -ForegroundColor Gray
    
    $url = Read-Host "👉 請貼上您的 GitHub 倉庫網址"
    if (-not $url -or $url.Trim() -eq "") {
        Write-Host "`n[錯誤] 倉庫網址不能為空白！" -ForegroundColor Red
        Read-Host "請按 Enter 鍵關閉"
        exit 1
    }
    git remote add origin $url.Trim()
    Write-Host "[OK] 遠端倉庫已成功綁定！`n" -ForegroundColor Green
} else {
    Write-Host "[2/4] 已綁定遠端倉庫：" -ForegroundColor Green
    git remote -v
    Write-Host ""
}

# 4. 輸入 Commit 訊息
Write-Host "[3/4] 準備儲存本次檔案變更..." -ForegroundColor Yellow
$msg = Read-Host "👉 請輸入本次更新說明 (直接按 Enter 則使用自動時間戳記)"
if (-not $msg -or $msg.Trim() -eq "") {
    $msg = "Update: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
}

git add .
git commit -m $msg

# 5. 推送
Write-Host "`n[4/4] 正在推送至 GitHub (main 分支)..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[自動修復] 檢測到 GitHub 遠端倉庫已有初始檔案，正在自動同步整合..." -ForegroundColor Cyan
    git pull origin main --rebase
    
    Write-Host "`n正在重新推送至 GitHub..." -ForegroundColor Yellow
    git push -u origin main
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "  [成功] 專案已成功推送到 GitHub！" -ForegroundColor Green
    Write-Host "  網址：https://github.com/a10129800/account-manager" -ForegroundColor Green
    Write-Host "========================================================`n" -ForegroundColor Green
} else {
    Write-Host "`n========================================================" -ForegroundColor Yellow
    Write-Host "  [提示] 遠端與本地有檔案衝突，是否要以本地專案為準強制覆蓋？" -ForegroundColor Yellow
    $ans = Read-Host "  👉 是否強制推送覆蓋遠端？(輸入 Y 覆蓋，輸入 N 放棄)"
    if ($ans -and $ans.Trim().ToUpper() -eq "Y") {
        Write-Host "`n正在強制推送 (force push)..." -ForegroundColor Yellow
        git push -u origin main -f
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n========================================================" -ForegroundColor Green
            Write-Host "  [成功] 專案已成功強制推送到 GitHub！" -ForegroundColor Green
            Write-Host "========================================================`n" -ForegroundColor Green
        }
    }
}

Read-Host "請按 Enter 鍵關閉視窗"
