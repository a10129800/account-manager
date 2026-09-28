(() => {
  'use strict';

  // ===== 狀態管理 =====
  let vault = {
    categories: [
      { id: 'default', name: '未分類', icon: '📁', color: '#6366f1' },
      { id: 'social', name: '社群媒體', icon: '💬', color: '#ec4899' },
      { id: 'gaming', name: '遊戲', icon: '🎮', color: '#10b981' },
      { id: 'work', name: '工作', icon: '💼', color: '#f59e0b' },
      { id: 'finance', name: '金融', icon: '🏦', color: '#3b82f6' }
    ],
    accounts: [],
    tags: ['常用', '重要', '工作', '私人']
  };

  let currentFilter = {
    type: 'all', // 'all', 'favorites', 'category', 'tag'
    value: null,
    search: ''
  };

  let editingAccountId = null;
  let currentTagsInModal = [];
  let isListView = false;

  // Mock API 支援：如果在純瀏覽器開啟也能正常預覽運作
  const isElectron = typeof window.api !== 'undefined';
  const api = window.api || {
  window: {
    minimize: async () => console.log('Minimize window'),
    maximize: async () => console.log('Maximize window'),
    close: async () => console.log('Close window')
  },
  auth: {
    check: async () => !!localStorage.getItem('vault_master_mock'),
    setup: async (pw) => {
      localStorage.setItem('vault_master_mock', pw);
      localStorage.setItem('vault_data_mock', JSON.stringify(vault));
      return { success: true };
    },
    login: async (pw) => {
      const stored = localStorage.getItem('vault_master_mock');
      if (stored === pw) return { success: true };
      return { success: false, error: '密碼錯誤' };
    },
    logout: async () => ({ success: true })
  },
  vault: {
    load: async () => {
      const data = localStorage.getItem('vault_data_mock');
      return { success: true, data: data ? JSON.parse(data) : vault };
    },
    save: async (data) => {
      localStorage.setItem('vault_data_mock', JSON.stringify(data));
      return { success: true };
    },
    export: async (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `帳號備份_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      return { success: true };
    },
    import: async () => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return resolve({ success: false, error: '未選擇檔案' });
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              resolve({ success: true, data });
            } catch (err) {
              resolve({ success: false, error: '檔案格式錯誤' });
            }
          };
          reader.readAsText(file);
        };
        input.click();
      });
    }
  },
  utils: {
    generatePassword: async (options) => {
      const { length = 16, uppercase = true, lowercase = true, numbers = true, symbols = true } = options;
      let chars = '';
      if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (numbers) chars += '0123456789';
      if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let res = '';
      for (let i = 0; i < length; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    }
  }
};

// ===== 主題管理 =====
function initTheme() {
  const savedTheme = localStorage.getItem('app_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const icon = document.getElementById('theme-icon');
  if (theme === 'dark') {
    document.body.classList.add('theme-dark');
    if (icon) icon.textContent = '☀️';
  } else {
    document.body.classList.remove('theme-dark');
    if (icon) icon.textContent = '🌙';
  }
  localStorage.setItem('app_theme', theme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains('theme-dark');
  applyTheme(isDark ? 'light' : 'dark');
}

// ===== DOM 初始化 =====
async function initApp() {
  try {
    initTheme();
    initParticles();
    setupEventListeners();
    await checkAuthStatus();
  } catch (err) {
    console.error('初始化失敗:', err);
    // 萬一發生異常，至少確保登入或建立主密碼表單能展示
    const setupForm = document.getElementById('setup-form');
    if (setupForm) setupForm.style.display = 'block';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ===== 浮動粒子效果 =====
function initParticles() {
  const container = document.getElementById('auth-particles');
  if (!container) return;
  const count = 20;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'auth-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 8}s`;
    particle.style.animationDuration = `${6 + Math.random() * 6}s`;
    container.appendChild(particle);
  }
}

// ===== 認證邏輯 =====
async function checkAuthStatus() {
  try {
    const setupForm = document.getElementById('setup-form');
    const loginForm = document.getElementById('login-form');

    let hasMaster = false;
    try {
      hasMaster = await api.auth.check();
    } catch (e) {
      console.warn('api.auth.check 呼叫異常，預設進入建立主密碼模式:', e);
    }

    if (hasMaster) {
      if (setupForm) setupForm.style.display = 'none';
      if (loginForm) loginForm.style.display = 'block';
      setTimeout(() => document.getElementById('login-password')?.focus(), 100);
    } else {
      if (setupForm) setupForm.style.display = 'block';
      if (loginForm) loginForm.style.display = 'none';
      setTimeout(() => document.getElementById('setup-password')?.focus(), 100);
    }
  } catch (err) {
    console.error('checkAuthStatus 錯誤:', err);
    showToast('認證檢查失敗: ' + err.message, 'error');
  }
}

// ===== 事件監聽 =====
function setupEventListeners() {
  // 主題切換
  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);

  // 視窗控制
  document.getElementById('btn-minimize')?.addEventListener('click', () => api.window.minimize());
  document.getElementById('btn-maximize')?.addEventListener('click', () => api.window.maximize());
  document.getElementById('btn-close')?.addEventListener('click', () => api.window.close());

  // 密碼顯示/隱藏切換
  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });

  // 主密碼強度檢測
  document.getElementById('setup-password')?.addEventListener('input', (e) => {
    evaluatePasswordStrength(e.target.value);
  });

  // 建立主密碼
  document.getElementById('btn-setup')?.addEventListener('click', handleSetup);
  document.getElementById('setup-confirm')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSetup();
  });

  // 登入
  document.getElementById('btn-login')?.addEventListener('click', handleLogin);
  document.getElementById('login-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // 側邊欄分類 & 標籤篩選
  document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((i) => i.classList.remove('active'));
      document.querySelectorAll('.tag-chip').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      currentFilter.type = btn.getAttribute('data-view');
      currentFilter.value = null;
      renderAccounts();
    });
  });

  // 搜尋
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    currentFilter.search = e.target.value.trim().toLowerCase();
    renderAccounts();
  });

  // 切換清單/網格檢視
  document.getElementById('btn-toggle-view')?.addEventListener('click', () => {
    isListView = !isListView;
    const grid = document.getElementById('account-list');
    grid.classList.toggle('list-view', isListView);
  });

  // 新增帳號
  document.getElementById('btn-add-account')?.addEventListener('click', () => openAccountModal());
  document.getElementById('btn-add-first')?.addEventListener('click', () => openAccountModal());

  // 帳號 Modal 操作
  document.getElementById('modal-close')?.addEventListener('click', closeAccountModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeAccountModal);
  document.getElementById('modal-save')?.addEventListener('click', saveAccount);
  document.getElementById('modal-delete')?.addEventListener('click', deleteAccount);

  // 標籤輸入
  const tagInput = document.getElementById('acc-tags-input');
  tagInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.value.trim().replace(/^#/, '');
      if (val && !currentTagsInModal.includes(val)) {
        currentTagsInModal.push(val);
        renderModalTags();
        tagInput.value = '';
      }
    }
  });

  // 自訂欄位
  document.getElementById('btn-add-field')?.addEventListener('click', () => addCustomFieldRow());

  // 密碼產生器 Modal 操作
  document.getElementById('btn-generate-pw')?.addEventListener('click', (e) => {
    e.preventDefault();
    openPwgenModal();
  });
  document.getElementById('pwgen-close')?.addEventListener('click', closePwgenModal);
  document.getElementById('pwgen-cancel')?.addEventListener('click', closePwgenModal);
  document.getElementById('pwgen-generate')?.addEventListener('click', generateNewPassword);
  document.getElementById('pwgen-copy')?.addEventListener('click', copyGeneratedPassword);
  document.getElementById('pwgen-use')?.addEventListener('click', useGeneratedPassword);
  document.getElementById('pwgen-length')?.addEventListener('input', (e) => {
    document.getElementById('pwgen-length-val').textContent = e.target.value;
    generateNewPassword();
  });
  ['pwgen-upper', 'pwgen-lower', 'pwgen-numbers', 'pwgen-symbols'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', generateNewPassword);
  });

  // 分類 Modal 操作
  document.getElementById('btn-add-category')?.addEventListener('click', openCategoryModal);
  document.getElementById('category-close')?.addEventListener('click', closeCategoryModal);
  document.getElementById('category-cancel')?.addEventListener('click', closeCategoryModal);
  document.getElementById('category-save')?.addEventListener('click', saveCategory);

  // 顏色選擇器
  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });

  // 匯出 / 匯入 / 登出
  document.getElementById('btn-export')?.addEventListener('click', exportVault);
  document.getElementById('btn-import')?.addEventListener('click', importVault);
  document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
}

// ===== 主密碼強度計算 =====
function evaluatePasswordStrength(password) {
  const fill = document.getElementById('strength-fill');
  const text = document.getElementById('strength-text');
  if (!password) {
    fill.style.width = '0%';
    text.textContent = '';
    return;
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { percent: '20%', color: '#ef4444', label: '太弱' },
    { percent: '40%', color: '#f97316', label: '較弱' },
    { percent: '60%', color: '#f59e0b', label: '一般' },
    { percent: '80%', color: '#10b981', label: '良好' },
    { percent: '100%', color: '#6366f1', label: '極強' }
  ];

  const current = levels[Math.min(score - 1, 4)] || levels[0];
  fill.style.width = current.percent;
  fill.style.background = current.color;
  text.textContent = `強度：${current.label}`;
  text.style.color = current.color;
}

// ===== 設定主密碼 =====
async function handleSetup() {
  const pw = document.getElementById('setup-password').value;
  const confirm = document.getElementById('setup-confirm').value;

  if (!pw || pw.length < 6) {
    showToast('主密碼長度至少需要 6 個字元', 'error');
    return;
  }
  if (pw !== confirm) {
    showToast('兩次輸入的密碼不一致', 'error');
    return;
  }

  const res = await api.auth.setup(pw);
  if (res.success) {
    showToast('主密碼設定成功，已建立加密保險庫', 'success');
    await enterApp();
  } else {
    showToast(res.error || '設定失敗', 'error');
  }
}

// ===== 登入 =====
async function handleLogin() {
  const pwInput = document.getElementById('login-password');
  const pw = pwInput.value;
  const errorEl = document.getElementById('login-error');

  if (!pw) {
    errorEl.textContent = '請輸入主密碼';
    errorEl.style.display = 'block';
    return;
  }

  const res = await api.auth.login(pw);
  if (res.success) {
    errorEl.style.display = 'none';
    pwInput.value = '';
    await enterApp();
  } else {
    errorEl.textContent = res.error || '密碼錯誤';
    errorEl.style.display = 'block';
  }
}

// ===== 進入主介面 =====
async function enterApp() {
  const loadRes = await api.vault.load();
  if (loadRes.success && loadRes.data) {
    vault = loadRes.data;
  }

  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';

  renderCategories();
  renderTags();
  renderAccounts();
}

// ===== 登出 =====
async function handleLogout() {
  await api.auth.logout();
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
  showToast('保險庫已鎖定', 'info');
  await checkAuthStatus();
}

// ===== 渲染分類列表 =====
function renderCategories() {
  const listEl = document.getElementById('category-list');
  const selectEl = document.getElementById('acc-category');
  if (!listEl) return;

  listEl.innerHTML = '';
  if (selectEl) selectEl.innerHTML = '';

  vault.categories.forEach((cat) => {
    // 側邊欄項目
    const count = vault.accounts.filter((a) => a.categoryId === cat.id).length;
    const btn = document.createElement('button');
    btn.className = `nav-item ${currentFilter.type === 'category' && currentFilter.value === cat.id ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="nav-icon">${cat.icon}</span>
      <span class="nav-text">${escapeHtml(cat.name)}</span>
      <span class="nav-badge">${count}</span>
    `;
    btn.onclick = () => {
      document.querySelectorAll('.nav-item').forEach((i) => i.classList.remove('active'));
      document.querySelectorAll('.tag-chip').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      currentFilter.type = 'category';
      currentFilter.value = cat.id;
      renderAccounts();
    };
    listEl.appendChild(btn);

    // Modal 選單
    if (selectEl) {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.icon} ${cat.name}`;
      selectEl.appendChild(opt);
    }
  });
}

// ===== 渲染標籤列表 =====
function renderTags() {
  const tagListEl = document.getElementById('tag-list');
  if (!tagListEl) return;

  // 收集所有已使用的標籤與預設標籤
  const allTags = new Set(vault.tags || []);
  vault.accounts.forEach((a) => {
    if (Array.isArray(a.tags)) a.tags.forEach((t) => allTags.add(t));
  });

  tagListEl.innerHTML = '';
  allTags.forEach((tag) => {
    const chip = document.createElement('div');
    chip.className = `tag-chip ${currentFilter.type === 'tag' && currentFilter.value === tag ? 'active' : ''}`;
    chip.textContent = `# ${tag}`;
    chip.onclick = () => {
      document.querySelectorAll('.nav-item').forEach((i) => i.classList.remove('active'));
      document.querySelectorAll('.tag-chip').forEach((t) => t.classList.remove('active'));
      chip.classList.add('active');
      currentFilter.type = 'tag';
      currentFilter.value = tag;
      renderAccounts();
    };
    tagListEl.appendChild(chip);
  });
}

// ===== 渲染帳號列表 =====
function renderAccounts() {
  const listEl = document.getElementById('account-list');
  const emptyEl = document.getElementById('empty-state');
  const titleEl = document.getElementById('content-title');
  const countEl = document.getElementById('content-count');

  // 更新徽章數字
  document.getElementById('badge-all').textContent = vault.accounts.length;
  document.getElementById('badge-favorites').textContent = vault.accounts.filter((a) => a.favorite).length;

  // 依條件過濾
  let filtered = vault.accounts;

  if (currentFilter.type === 'favorites') {
    filtered = filtered.filter((a) => a.favorite);
    titleEl.textContent = '我的最愛';
  } else if (currentFilter.type === 'category') {
    filtered = filtered.filter((a) => a.categoryId === currentFilter.value);
    const cat = vault.categories.find((c) => c.id === currentFilter.value);
    titleEl.textContent = cat ? `${cat.icon} ${cat.name}` : '分類';
  } else if (currentFilter.type === 'tag') {
    filtered = filtered.filter((a) => Array.isArray(a.tags) && a.tags.includes(currentFilter.value));
    titleEl.textContent = `# ${currentFilter.value}`;
  } else {
    titleEl.textContent = '所有帳號';
  }

  // 搜尋過濾
  if (currentFilter.search) {
    const q = currentFilter.search;
    filtered = filtered.filter((a) => {
      const inName = (a.name || '').toLowerCase().includes(q);
      const inUser = (a.username || '').toLowerCase().includes(q);
      const inUrl = (a.url || '').toLowerCase().includes(q);
      const inNotes = (a.notes || '').toLowerCase().includes(q);
      const inTags = Array.isArray(a.tags) && a.tags.some((t) => t.toLowerCase().includes(q));
      return inName || inUser || inUrl || inNotes || inTags;
    });
  }

  countEl.textContent = `${filtered.length} 個帳號`;

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.add('visible');
    return;
  }

  emptyEl.classList.remove('visible');
  listEl.innerHTML = '';

  filtered.forEach((acc) => {
    const card = createAccountCard(acc);
    listEl.appendChild(card);
  });
}

// ===== 產生單張帳號卡片 =====
function createAccountCard(acc) {
  const category = vault.categories.find((c) => c.id === acc.categoryId) || {
    name: '未分類',
    icon: '📁',
    color: '#6366f1'
  };

  const card = document.createElement('div');
  card.className = 'account-card';
  card.onclick = (e) => {
    // 點擊複製按鈕時不要觸發卡片編輯
    if (e.target.closest('.card-field-copy') || e.target.closest('.card-favorite')) return;
    openAccountModal(acc.id);
  };

  const tagsHtml = (acc.tags || [])
    .map((t) => `<span class="card-tag">#${escapeHtml(t)}</span>`)
    .join('');

  card.innerHTML = `
    <div class="card-header">
      <div class="card-icon" style="background: ${category.color}20; color: ${category.color};">
        ${category.icon}
      </div>
      <div class="card-info">
        <div class="card-name">${escapeHtml(acc.name)}</div>
        <div class="card-category">${escapeHtml(category.name)}</div>
      </div>
      <button class="card-favorite ${acc.favorite ? 'active' : ''}" title="${acc.favorite ? '取消最愛' : '設為最愛'}">
        ${acc.favorite ? '⭐' : '☆'}
      </button>
    </div>

    <div class="card-body">
      ${
        acc.username
          ? `
        <div class="card-field">
          <span class="card-field-label">帳號</span>
          <span class="card-field-value">${escapeHtml(acc.username)}</span>
          <button class="card-field-copy" data-copy="${escapeAttr(acc.username)}" title="複製帳號">📋</button>
        </div>
      `
          : ''
      }

      ${
        acc.password
          ? `
        <div class="card-field">
          <span class="card-field-label">密碼</span>
          <span class="card-field-value">••••••••••••</span>
          <button class="card-field-copy" data-copy="${escapeAttr(acc.password)}" title="複製密碼">📋</button>
        </div>
      `
          : ''
      }

      ${
        acc.url
          ? `
        <div class="card-field">
          <span class="card-field-label">網址</span>
          <span class="card-field-value">${escapeHtml(acc.url)}</span>
          <button class="card-field-copy" data-copy="${escapeAttr(acc.url)}" title="複製網址">🔗</button>
        </div>
      `
          : ''
      }

      ${
        acc.customFields && acc.customFields.length > 0
          ? acc.customFields
              .map(
                (f) => `
          <div class="card-field">
            <span class="card-field-label">${escapeHtml(f.key)}</span>
            <span class="card-field-value">${escapeHtml(f.value)}</span>
            <button class="card-field-copy" data-copy="${escapeAttr(f.value)}" title="複製">📋</button>
          </div>
        `
              )
              .join('')
          : ''
      }
    </div>

    ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
  `;

  // 複製事件綁定
  card.querySelectorAll('.card-field-copy').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-copy');
      copyToClipboard(text);
      btn.textContent = '✅';
      setTimeout(() => (btn.textContent = '📋'), 1500);
    });
  });

  // 最愛切換綁定
  const favBtn = card.querySelector('.card-favorite');
  favBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    acc.favorite = !acc.favorite;
    await saveVault();
    renderAccounts();
  });

  return card;
}

// ===== 帳號 Modal 操作 =====
function openAccountModal(id = null) {
  editingAccountId = id;
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const delBtn = document.getElementById('modal-delete');
  const fieldsContainer = document.getElementById('custom-fields-list');

  fieldsContainer.innerHTML = '';
  currentTagsInModal = [];

  if (id) {
    const acc = vault.accounts.find((a) => a.id === id);
    if (!acc) return;
    title.textContent = '編輯帳號';
    delBtn.style.display = 'inline-flex';

    document.getElementById('acc-name').value = acc.name || '';
    document.getElementById('acc-username').value = acc.username || '';
    document.getElementById('acc-password').value = acc.password || '';
    document.getElementById('acc-url').value = acc.url || '';
    document.getElementById('acc-category').value = acc.categoryId || 'default';
    document.getElementById('acc-notes').value = acc.notes || '';
    document.getElementById('acc-favorite').checked = !!acc.favorite;

    currentTagsInModal = Array.isArray(acc.tags) ? [...acc.tags] : [];

    if (acc.customFields) {
      acc.customFields.forEach((f) => addCustomFieldRow(f.key, f.value));
    }
  } else {
    title.textContent = '新增帳號';
    delBtn.style.display = 'none';

    document.getElementById('acc-name').value = '';
    document.getElementById('acc-username').value = '';
    document.getElementById('acc-password').value = '';
    document.getElementById('acc-url').value = '';
    document.getElementById('acc-category').value = vault.categories[0]?.id || 'default';
    document.getElementById('acc-notes').value = '';
    document.getElementById('acc-favorite').checked = false;
  }

  renderModalTags();
  overlay.style.display = 'flex';
  setTimeout(() => document.getElementById('acc-name').focus(), 50);
}

function closeAccountModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  editingAccountId = null;
}

function renderModalTags() {
  const container = document.getElementById('acc-tags-display');
  if (!container) return;
  container.innerHTML = '';

  currentTagsInModal.forEach((tag, idx) => {
    const span = document.createElement('span');
    span.className = 'tag-input-tag';
    span.innerHTML = `
      #${escapeHtml(tag)}
      <button type="button" data-idx="${idx}">✕</button>
    `;
    span.querySelector('button').onclick = () => {
      currentTagsInModal.splice(idx, 1);
      renderModalTags();
    };
    container.appendChild(span);
  });
}

function addCustomFieldRow(key = '', value = '') {
  const container = document.getElementById('custom-fields-list');
  const row = document.createElement('div');
  row.className = 'custom-field-row';
  row.innerHTML = `
    <input type="text" class="custom-field-key" placeholder="欄位名稱 (如: PIN, 安全問題)" value="${escapeAttr(key)}">
    <input type="text" class="custom-field-value" placeholder="內容值" value="${escapeAttr(value)}">
    <button class="btn-remove-field" title="刪除欄位">✕</button>
  `;
  row.querySelector('.btn-remove-field').onclick = () => row.remove();
  container.appendChild(row);
}

async function saveAccount() {
  const name = document.getElementById('acc-name').value.trim();
  if (!name) {
    showToast('請填寫帳號名稱', 'error');
    document.getElementById('acc-name').focus();
    return;
  }

  const username = document.getElementById('acc-username').value.trim();
  const password = document.getElementById('acc-password').value;
  const url = document.getElementById('acc-url').value.trim();
  const categoryId = document.getElementById('acc-category').value;
  const notes = document.getElementById('acc-notes').value.trim();
  const favorite = document.getElementById('acc-favorite').checked;

  // 自訂欄位蒐集
  const customFields = [];
  document.querySelectorAll('.custom-field-row').forEach((row) => {
    const k = row.querySelector('.custom-field-key').value.trim();
    const v = row.querySelector('.custom-field-value').value.trim();
    if (k) customFields.push({ key: k, value: v });
  });

  const now = new Date().toISOString();

  if (editingAccountId) {
    // 更新
    const idx = vault.accounts.findIndex((a) => a.id === editingAccountId);
    if (idx !== -1) {
      vault.accounts[idx] = {
        ...vault.accounts[idx],
        name,
        username,
        password,
        url,
        categoryId,
        notes,
        favorite,
        tags: currentTagsInModal,
        customFields,
        updatedAt: now
      };
      showToast('帳號已更新', 'success');
    }
  } else {
    // 新增
    const newAccount = {
      id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name,
      username,
      password,
      url,
      categoryId,
      notes,
      favorite,
      tags: currentTagsInModal,
      customFields,
      createdAt: now,
      updatedAt: now
    };
    vault.accounts.unshift(newAccount);
    showToast('帳號已建立', 'success');
  }

  // 儲存並更新介面
  await saveVault();
  closeAccountModal();
  renderCategories();
  renderTags();
  renderAccounts();
}

async function deleteAccount() {
  if (!editingAccountId) return;
  if (!confirm('確定要刪除這個帳號嗎？此操作無法還原。')) return;

  vault.accounts = vault.accounts.filter((a) => a.id !== editingAccountId);
  await saveVault();
  closeAccountModal();
  renderCategories();
  renderTags();
  renderAccounts();
  showToast('帳號已刪除', 'info');
}

// ===== 密碼產生器 =====
let generatedPasswordBuffer = '';

function openPwgenModal() {
  document.getElementById('pwgen-overlay').style.display = 'flex';
  generateNewPassword();
}

function closePwgenModal() {
  document.getElementById('pwgen-overlay').style.display = 'none';
}

async function generateNewPassword() {
  const length = parseInt(document.getElementById('pwgen-length').value, 10);
  const uppercase = document.getElementById('pwgen-upper').checked;
  const lowercase = document.getElementById('pwgen-lower').checked;
  const numbers = document.getElementById('pwgen-numbers').checked;
  const symbols = document.getElementById('pwgen-symbols').checked;

  const pw = await api.utils.generatePassword({ length, uppercase, lowercase, numbers, symbols });
  generatedPasswordBuffer = pw;
  document.getElementById('pwgen-result').textContent = pw;
}

function copyGeneratedPassword() {
  if (generatedPasswordBuffer) {
    copyToClipboard(generatedPasswordBuffer);
    showToast('已複製產生的密碼', 'success');
  }
}

function useGeneratedPassword() {
  if (generatedPasswordBuffer) {
    document.getElementById('acc-password').value = generatedPasswordBuffer;
    closePwgenModal();
    showToast('已填入產生的密碼', 'info');
  }
}

// ===== 分類新增 =====
function openCategoryModal() {
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-icon').value = '📁';
  document.getElementById('category-overlay').style.display = 'flex';
}

function closeCategoryModal() {
  document.getElementById('category-overlay').style.display = 'none';
}

async function saveCategory() {
  const name = document.getElementById('cat-name').value.trim();
  const icon = document.getElementById('cat-icon').value.trim() || '📁';
  const activeSwatch = document.querySelector('.color-swatch.active');
  const color = activeSwatch ? activeSwatch.getAttribute('data-color') : '#6366f1';

  if (!name) {
    showToast('請輸入分類名稱', 'error');
    return;
  }

  const id = 'cat_' + Date.now();
  vault.categories.push({ id, name, icon, color });

  await saveVault();
  closeCategoryModal();
  renderCategories();
  showToast(`已建立分類「${name}」`, 'success');
}

// ===== 儲存資料庫 =====
async function saveVault() {
  const res = await api.vault.save(vault);
  if (!res.success) {
    showToast('儲存失敗: ' + (res.error || '未知錯誤'), 'error');
  }
}

// ===== 匯出 / 匯入 =====
async function exportVault() {
  const res = await api.vault.export(vault);
  if (res.success) {
    showToast('資料備份匯出成功', 'success');
  } else if (res.error !== '取消匯出') {
    showToast('匯出失敗: ' + res.error, 'error');
  }
}

async function importVault() {
  const res = await api.vault.import();
  if (res.success && res.data) {
    const imported = res.data;
    if (Array.isArray(imported.accounts)) {
      if (confirm(`匯入將合併/更新帳號資料，共檢測到 ${imported.accounts.length} 個帳號。是否繼續？`)) {
        // 合併 categories
        if (Array.isArray(imported.categories)) {
          imported.categories.forEach((cat) => {
            if (!vault.categories.some((c) => c.id === cat.id)) {
              vault.categories.push(cat);
            }
          });
        }
        // 合併 accounts
        imported.accounts.forEach((acc) => {
          const existingIdx = vault.accounts.findIndex((a) => a.id === acc.id);
          if (existingIdx !== -1) {
            vault.accounts[existingIdx] = acc;
          } else {
            vault.accounts.push(acc);
          }
        });

        await saveVault();
        renderCategories();
        renderTags();
        renderAccounts();
        showToast('資料匯入成功！', 'success');
      }
    } else {
      showToast('無效的備份檔案格式', 'error');
    }
  } else if (res.error && res.error !== '取消匯入') {
    showToast('匯入失敗: ' + res.error, 'error');
  }
}

// ===== 輔助函數 =====
function copyToClipboard(text) {
  if (!text) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  }
  showToast('已複製到剪貼簿', 'success');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

})();
