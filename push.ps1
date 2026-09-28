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
