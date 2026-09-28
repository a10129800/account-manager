@echo off
cd /d "%~dp0"

taskkill /f /im electron.exe >nul 2>&1

copy /y "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\mascot_arcane_stylized_1790598288807.jpg" "%~dp0mascot_welcome.jpg" >nul 2>&1
copy /y "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\mascot_cool_dev_glasses_1790598309579.jpg" "%~dp0mascot_glasses.jpg" >nul 2>&1
copy /y "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\anthro_dog_casual_hoodie_1790597605710.jpg" "%~dp0mascot_hoodie.jpg" >nul 2>&1
copy /y "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\anthro_dog_isolated_1790597732222.jpg" "%~dp0curry_dog.jpg" >nul 2>&1
copy /y "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\anthro_dog_isolated_1790597732222.jpg" "%~dp0src\curry_dog.jpg" >nul 2>&1
copy /y "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\anthro_dog_isolated_1790597732222.jpg" "%~dp0curry_dog.png" >nul 2>&1
copy /y "C:\Users\mice\.gemini\antigravity-ide\brain\93aa6c51-7009-45ac-a224-a3d4a8d12816\anthro_dog_isolated_1790597732222.jpg" "%~dp0src\curry_dog.png" >nul 2>&1



if not exist "node_modules\.bin\electron.cmd" (
    echo [Info] Installing dependencies, please wait...
    call npm install
)

call npm start
pause
