const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ===== 加密工具 =====
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

function encrypt(text, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted
  };
}

function decrypt(encryptedObj, password) {
  const salt = Buffer.from(encryptedObj.salt, 'hex');
  const iv = Buffer.from(encryptedObj.iv, 'hex');
  const tag = Buffer.from(encryptedObj.tag, 'hex');
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ===== 資料路徑 =====
function getDataPath() {
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function getVaultPath() {
  return path.join(getDataPath(), 'vault.enc');
}

function getMasterKeyPath() {
  return path.join(getDataPath(), 'master.key');
}

// ===== 主密碼驗證 =====
function hashMasterPassword(password) {
  const salt = crypto.randomBytes(32);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512');
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex')
  };
}

function verifyMasterPassword(password, stored) {
  const salt = Buffer.from(stored.salt, 'hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512');
  return hash.toString('hex') === stored.hash;
}

// ===== 全域狀態 =====
let mainWindow;
let masterPassword = null;

// ===== 吉祥物資產初始化 (生活感牛仔外套帥犬 - 去背處理) =====
const mascotSource = 'C:\\Users\\mice\\.gemini\\antigravity-ide\\brain\\93aa6c51-7009-45ac-a224-a3d4a8d12816\\anthro_dog_isolated_1790597732222.jpg';
const mascotDestSrcJpg = path.join(__dirname, 'src', 'curry_dog.jpg');
const mascotDestRootJpg = path.join(__dirname, 'curry_dog.jpg');
const mascotDestSrcPng = path.join(__dirname, 'src', 'curry_dog.png');
const mascotDestRootPng = path.join(__dirname, 'curry_dog.png');

try {
  if (fs.existsSync(mascotSource)) {
    fs.copyFileSync(mascotSource, mascotDestSrcJpg);
    fs.copyFileSync(mascotSource, mascotDestRootJpg);

    // 去除純白背景生成真正透明 PNG
    const img = nativeImage.createFromPath(mascotSource);
    const size = img.getSize();
    if (size.width > 0 && size.height > 0) {
      const bitmap = img.toBitmap();
      for (let i = 0; i < bitmap.length; i += 4) {
        const b = bitmap[i];
        const g = bitmap[i + 1];
        const r = bitmap[i + 2];
        if (r > 240 && g > 240 && b > 240) {
          bitmap[i + 3] = 0; // 完全透明
        } else if (r > 220 && g > 220 && b > 220) {
          const avg = (r + g + b) / 3;
          bitmap[i + 3] = Math.max(0, Math.min(255, Math.floor(((240 - avg) / 20) * 255)));
        }
      }
      const transImg = nativeImage.createFromBitmap(bitmap, { width: size.width, height: size.height });
      const pngBuffer = transImg.toPNG();
      fs.writeFileSync(mascotDestSrcPng, pngBuffer);
      fs.writeFileSync(mascotDestRootPng, pngBuffer);

      // 備份並儲存全套吉祥物供未來專案使用
      const assetDir = path.join(__dirname, 'assets', 'mascot');
      const backupDir = 'd:\\專案吉祥物庫';
      [assetDir, backupDir].forEach(dir => {
        try {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.copyFileSync(mascotDestRootPng, path.join(dir, '01_牛仔外套_透明去背.png'));
          fs.copyFileSync(mascotSource, path.join(dir, '01_牛仔外套_去背高解析.jpg'));
          
          const brainDir = 'C:\\Users\\mice\\.gemini\\antigravity-ide\\brain\\93aa6c51-7009-45ac-a224-a3d4a8d12816';
          const fileMap = {
            'anthro_dog_casual_jacket_1790597624188.jpg': '02_牛仔外套_街景圓標.jpg',
            'anthro_dog_casual_hoodie_1790597605710.jpg': '03_墨綠連帽衛衣_咖啡廳.jpg',
            'cool_anthro_dog_agent_1790597252084.jpg': '04_賽博朋克特工犬.jpg'
          };
          for (const [srcName, destName] of Object.entries(fileMap)) {
            const p = path.join(brainDir, srcName);
            if (fs.existsSync(p)) fs.copyFileSync(p, path.join(dir, destName));
          }
        } catch (_) {}
      });
    }
  }
} catch (e) {
  console.warn('Mascot copy / transparency failed:', e.message);
}

function createWindow() {
  let iconPath = path.join(__dirname, 'src', 'curry_dog.png');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, 'src', 'curry_dog.jpg');
  }
  const winOptions = {
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#f0f3f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  };
  if (fs.existsSync(iconPath)) {
    winOptions.icon = iconPath;
  }
  mainWindow = new BrowserWindow(winOptions);

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 支援快捷鍵 F12 切換開發者工具、F5 重新整理
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F12') {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      } else if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        mainWindow.reload();
        event.preventDefault();
      }
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  masterPassword = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ===== IPC 處理 =====

// 視窗控制
ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
  return mainWindow.isMaximized();
});
ipcMain.handle('window:close', () => mainWindow.close());

// 檢查是否已設定主密碼
ipcMain.handle('auth:check', () => {
  return fs.existsSync(getMasterKeyPath());
});

// 設定主密碼
ipcMain.handle('auth:setup', (event, password) => {
  try {
    const masterKeyData = hashMasterPassword(password);
    fs.writeFileSync(getMasterKeyPath(), JSON.stringify(masterKeyData), 'utf8');

    // 建立空白保險庫
    const emptyVault = {
      categories: [
        { id: 'default', name: '未分類', icon: '📁', color: '#6366f1' },
        { id: 'social', name: '社群媒體', icon: '💬', color: '#ec4899' },
        { id: 'gaming', name: '遊戲', icon: '🎮', color: '#10b981' },
        { id: 'work', name: '工作', icon: '💼', color: '#f59e0b' },
        { id: 'finance', name: '金融', icon: '🏦', color: '#3b82f6' }
      ],
      accounts: [],
      tags: ['常用', '重要', '待更新']
    };

    const encrypted = encrypt(JSON.stringify(emptyVault), password);
    fs.writeFileSync(getVaultPath(), JSON.stringify(encrypted), 'utf8');

    masterPassword = password;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 驗證主密碼
ipcMain.handle('auth:login', (event, password) => {
  try {
    const masterKeyData = JSON.parse(fs.readFileSync(getMasterKeyPath(), 'utf8'));
    if (verifyMasterPassword(password, masterKeyData)) {
      masterPassword = password;
      return { success: true };
    }
    return { success: false, error: '密碼錯誤' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 登出
ipcMain.handle('auth:logout', () => {
  masterPassword = null;
  return { success: true };
});

// 讀取保險庫
ipcMain.handle('vault:load', () => {
  try {
    if (!masterPassword) return { success: false, error: '未登入' };
    const encryptedData = JSON.parse(fs.readFileSync(getVaultPath(), 'utf8'));
    const decrypted = decrypt(encryptedData, masterPassword);
    return { success: true, data: JSON.parse(decrypted) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 儲存保險庫
ipcMain.handle('vault:save', (event, vaultData) => {
  try {
    if (!masterPassword) return { success: false, error: '未登入' };
    const encrypted = encrypt(JSON.stringify(vaultData), masterPassword);
    fs.writeFileSync(getVaultPath(), JSON.stringify(encrypted), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 匯出資料
ipcMain.handle('vault:export', async (event, vaultData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '匯出帳號資料',
      defaultPath: `帳號備份_${new Date().toISOString().slice(0, 10)}.json`,
      filters: [
        { name: 'JSON 檔案', extensions: ['json'] },
        { name: '所有檔案', extensions: ['*'] }
      ]
    });
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(vaultData, null, 2), 'utf8');
      return { success: true };
    }
    return { success: false, error: '取消匯出' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 匯入資料
ipcMain.handle('vault:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '匯入帳號資料',
      filters: [
        { name: 'JSON 檔案', extensions: ['json'] },
        { name: '所有檔案', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const content = fs.readFileSync(result.filePaths[0], 'utf8');
      const data = JSON.parse(content);
      return { success: true, data };
    }
    return { success: false, error: '取消匯入' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 產生密碼
ipcMain.handle('utils:generatePassword', (event, options) => {
  const { length = 16, uppercase = true, lowercase = true, numbers = true, symbols = true } = options;
  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
});

// 取得資料儲存路徑
ipcMain.handle('utils:getDataPath', () => {
  return getDataPath();
});
