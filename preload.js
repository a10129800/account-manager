const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 視窗控制
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // 認證
  auth: {
    check: () => ipcRenderer.invoke('auth:check'),
    setup: (password) => ipcRenderer.invoke('auth:setup', password),
    login: (password) => ipcRenderer.invoke('auth:login', password),
    logout: () => ipcRenderer.invoke('auth:logout')
  },

  // 保險庫
  vault: {
    load: () => ipcRenderer.invoke('vault:load'),
    save: (data) => ipcRenderer.invoke('vault:save', data),
    export: (data) => ipcRenderer.invoke('vault:export', data),
    import: () => ipcRenderer.invoke('vault:import')
  },

  // 工具
  utils: {
    generatePassword: (options) => ipcRenderer.invoke('utils:generatePassword', options),
    getDataPath: () => ipcRenderer.invoke('utils:getDataPath')
  }
});
