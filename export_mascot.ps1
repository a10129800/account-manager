# 設定 UTF-8 編碼
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$host.UI.RawUI.WindowTitle = "專案代表物 (吉祥物) 導出工具"

Clear-Host
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       專案代表物 (吉祥物) 全套資產一鍵導出工具" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# 目標資料夾：D 槽永久資產庫 與 桌面
$destD = "D:\專案吉祥物庫"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$destDesktop = Join-Path $desktopPath "專案吉祥物庫"

@($destD, $destDesktop) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

$brainDir = "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816"
$curryPng = Join-Path $PSScriptRoot "curry_dog.png"
$curryJpg = Join-Path $PSScriptRoot "curry_dog.jpg"

Write-Host "[1/4] 正在複製去背生活感牛仔帥犬 (核心代表物)..." -ForegroundColor Yellow

# 1. 透明去背 PNG
if (Test-Path $curryPng) {
    Copy-Item $curryPng -Destination (Join-Path $destD "01_牛仔外套_透明去背.png") -Force
    Copy-Item $curryPng -Destination (Join-Path $destDesktop "01_牛仔外套_透明去背.png") -Force
}

# 2. 去背高解析原檔 JPG
$srcIsolated = Join-Path $brainDir "anthro_dog_isolated_1790597732222.jpg"
if (Test-Path $srcIsolated) {
    Copy-Item $srcIsolated -Destination (Join-Path $destD "01_牛仔外套_去背高解析.jpg") -Force
    Copy-Item $srcIsolated -Destination (Join-Path $destDesktop "01_牛仔外套_去背高解析.jpg") -Force
} elseif (Test-Path $curryJpg) {
    Copy-Item $curryJpg -Destination (Join-Path $destD "01_牛仔外套_去背高解析.jpg") -Force
    Copy-Item $curryJpg -Destination (Join-Path $destDesktop "01_牛仔外套_去背高解析.jpg") -Force
}

Write-Host "[2/4] 正在複製街景牛仔外套圓標頭像..." -ForegroundColor Yellow
$srcJacket = Join-Path $brainDir "anthro_dog_casual_jacket_1790597624188.jpg"
if (Test-Path $srcJacket) {
    Copy-Item $srcJacket -Destination (Join-Path $destD "02_牛仔外套_街景圓標.jpg") -Force
    Copy-Item $srcJacket -Destination (Join-Path $destDesktop "02_牛仔外套_街景圓標.jpg") -Force
}

Write-Host "[3/4] 正在複製墨綠質感衛衣生活風..." -ForegroundColor Yellow
$srcHoodie = Join-Path $brainDir "anthro_dog_casual_hoodie_1790597605710.jpg"
if (Test-Path $srcHoodie) {
    Copy-Item $srcHoodie -Destination (Join-Path $destD "03_墨綠連帽衛衣_咖啡廳.jpg") -Force
    Copy-Item $srcHoodie -Destination (Join-Path $destDesktop "03_墨綠連帽衛衣_咖啡廳.jpg") -Force
}

Write-Host "[4/5] 正在複製雙城之戰 Arcane 潮流特工犬 (歡迎封面代表物)..." -ForegroundColor Yellow
$srcArcane = Join-Path $brainDir "mascot_arcane_stylized_1790598288807.jpg"
if (Test-Path $srcArcane) {
    Copy-Item $srcArcane -Destination (Join-Path $destD "04_雙城之戰_潮流特工犬.jpg") -Force
    Copy-Item $srcArcane -Destination (Join-Path $destDesktop "04_雙城之戰_潮流特工犬.jpg") -Force
    Copy-Item $srcArcane -Destination (Join-Path $PSScriptRoot "mascot_welcome.jpg") -Force
}

Write-Host "[5/5] 正在複製極客天才眼鏡犬與賽博犬..." -ForegroundColor Yellow
$srcGlasses = Join-Path $brainDir "mascot_cool_dev_glasses_1790598309579.jpg"
if (Test-Path $srcGlasses) {
    Copy-Item $srcGlasses -Destination (Join-Path $destD "05_極客天才眼鏡犬.jpg") -Force
    Copy-Item $srcGlasses -Destination (Join-Path $destDesktop "05_極客天才眼鏡犬.jpg") -Force
}

$srcAgent = Join-Path $brainDir "cool_anthro_dog_agent_1790597252084.jpg"
if (Test-Path $srcAgent) {
    Copy-Item $srcAgent -Destination (Join-Path $destD "06_賽博朋克戰術犬.jpg") -Force
    Copy-Item $srcAgent -Destination (Join-Path $destDesktop "06_賽博朋克戰術犬.jpg") -Force
}

# 產生使用指南文字檔
$guideText = @"
======================================================
         專案吉祥物 / 代表物使用指南
======================================================

本資料夾已收錄您專屬的帥氣生活感代表物資產：

1. 01_牛仔外套_透明去背.png
   - 核心代表物（已去背，無背景色）
   - 推薦用途：新專案 Logo、Favicon 網站圖示、軟體桌面圖標、個人頭像。
   - 網頁語法：<img src="01_牛仔外套_透明去背.png" style="width:60px;">

2. 01_牛仔外套_去背高解析.jpg
   - 純白背景超高清立繪，適合平面簡報 PPT 或設計素材。

3. 02_牛仔外套_街景圓標.jpg
   - 街頭生活感圓形徽章，適合 GitHub Profile 或社群頭像。

4. 03_墨綠連帽衛衣_咖啡廳.jpg
   - 溫暖休閒生活風，適合日常或閱讀學習專案。

5. 04_賽博朋克特工犬.jpg
   - 高科技外骨骼裝甲戰術風，適合資安或加密工具類專案。
"@

Set-Content -Path (Join-Path $destD "使用指南.txt") -Value $guideText -Encoding UTF8
Set-Content -Path (Join-Path $destDesktop "使用指南.txt") -Value $guideText -Encoding UTF8

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  [成功] 吉祥物已完整備份並導出至：" -ForegroundColor Green
Write-Host "  1. D 槽永久保存庫：$destD" -ForegroundColor Green
Write-Host "  2. 電腦桌面：$destDesktop" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Green
