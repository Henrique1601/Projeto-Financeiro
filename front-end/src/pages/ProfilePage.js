import { apiPut, apiPost, apiGet, apiDelete } from '../api.js';
import { getProfile } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getThemes, getAllThemes, getCustomThemes, getCurrentTheme, applyTheme, setTheme, saveCustomTheme, deleteCustomTheme, exportCustomTheme, importCustomTheme, applyCustomTheme } from '../theme.js';

let userProfile = null;
let _keyHandler = null;

export async function render(app) {
  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  showSpinner('Carregando…');
  try {
    userProfile = await getProfile();
    renderProfile(app);
  } catch (err) {
    app.innerHTML = `<div class="profile-page"><div class="error-page"><h1>Erro ao carregar perfil</h1><p>${err.message}</p></div></div>`;
  } finally {
    hideSpinner();
  }
}

function renderCustomThemeCards() {
  const themes = getCustomThemes();
  if (!themes.length) return '';
  return themes.map(t => `
    <div class="custom-theme-card" data-id="${t.id}">
      <div class="custom-theme-preview">
        ${['primary', 'bg', 'bgCard', 'text', 'border'].map(key => {
          const color = t.colors[key] || '#888';
          const cssName = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `<span style="background:var(${cssName}, ${color});width:20px;height:20px;border-radius:50%;border:1px solid var(--border)"></span>`;
        }).join('')}
      </div>
      <div class="custom-theme-info">
        <strong>${t.name}</strong>
      </div>
      <div class="custom-theme-actions">
        <button class="btn btn-ghost btn-xs" onclick="document._editTheme('${t.id}')" title="Editar"><i class="fas fa-pen"></i></button>
        <button class="btn btn-ghost btn-xs" onclick="document._exportTheme('${t.id}')" title="Exportar"><i class="fas fa-file-export"></i></button>
        <button class="btn btn-ghost btn-xs" onclick="document._deleteTheme('${t.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function renderProfile(app) {
  const u = userProfile;
  const initials = ((u.nome || '')[0] || '') + ((u.sobrenome || '')[0] || '');

  app.innerHTML = `
    <div class="profile-page page-enter">
      <button class="profile-back-btn" id="profileBackBtn" title="Voltar ao Dashboard (Esc)">
        <span class="back-arrow"><i class="fas fa-arrow-left"></i></span>
        <span class="back-label">Dashboard</span>
        <span class="back-hint">⎋</span>
      </button>
      <div class="profile-header">
        <div class="profile-avatar">
          ${u.foto ? `<img src="${u.foto}" alt="${u.nome}" />` : `<span>${initials || '?'}</span>`}
        </div>
        <div>
          <h1 class="profile-name">${u.nome || ''} ${u.sobrenome || ''}</h1>
          <p class="profile-email">${u.email || ''}</p>
          ${u.provider ? `<span class="profile-provider"><i class="fab fa-${u.provider}"></i> ${u.provider === 'google' ? 'Google' : 'GitHub'}</span>` : ''}
        </div>
      </div>

      <div class="profile-section">
        <h3>Informações Pessoais</h3>
        <form id="profileForm">
          <div class="form-row">
            <div class="form-group">
              <label for="pfNome">Nome</label>
              <input type="text" id="pfNome" value="${u.nome || ''}" autocomplete="given-name" />
            </div>
            <div class="form-group">
              <label for="pfSobrenome">Sobrenome</label>
              <input type="text" id="pfSobrenome" value="${u.sobrenome || ''}" autocomplete="family-name" />
            </div>
          </div>
          <div class="form-group">
            <label for="pfFoto">URL da Foto</label>
            <input type="url" id="pfFoto" value="${u.foto || ''}" placeholder="https://…" autocomplete="off" />
          </div>
          <div class="profile-actions">
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
            <button type="button" class="btn btn-ghost" onclick="window.location.hash='/alterar-senha'"><i class="fas fa-key"></i> Alterar Senha</button>
          </div>
        </form>
      </div>

      <div class="profile-section">
        <h3>Aparência</h3>
        <div class="form-group">
          <label for="pfTheme">Tema</label>
          <select id="pfTheme">
            ${(() => {
              const current = u.theme || getCurrentTheme();
              const customThemes = getCustomThemes();
              return [
                ...getThemes().map(t =>
                  `<option value="${t.id}" ${current === t.id ? 'selected' : ''}>${t.label}</option>`
                ),
                ...(customThemes.length ? customThemes.map(t =>
                  `<option value="${t.id}" ${current === t.id ? 'selected' : ''}>${t.name} ✨</option>`
                ) : []),
              ].join('');
            })()}
          </select>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" id="newThemeBtn"><i class="fas fa-plus"></i> Novo Tema</button>
            <button class="btn btn-ghost btn-sm" id="importThemeBtn"><i class="fas fa-file-upload"></i> Importar</button>
            <button class="btn btn-ghost btn-sm" id="exportAllThemesBtn" ${getCustomThemes().length ? '' : 'style="display:none"'}><i class="fas fa-file-download"></i> Exportar Todos</button>
          </div>
          <input type="file" id="importThemeInput" accept=".json" style="display:none">
        </div>
      </div>

      <div class="profile-section" id="customThemesSection" ${getCustomThemes().length ? '' : 'style="display:none"'}>
        <h3>Meus Temas</h3>
        <div class="custom-themes-grid" id="customThemesGrid">
          ${renderCustomThemeCards()}
        </div>
      </div>

      <div class="profile-section">
        <h3>Notificações</h3>
        <div class="notification-toggle">
          <div class="toggle-label">
            <i class="fas fa-bell"></i>
            <span>Notificações push</span>
          </div>
          <label class="switch">
            <input type="checkbox" id="pushToggle" ${'Notification' in window && Notification.permission === 'granted' ? 'checked' : ''} ${'Notification' in window && Notification.permission === 'denied' ? 'disabled' : ''} />
            <span class="switch-slider"></span>
          </label>
        </div>
        ${'Notification' in window && Notification.permission === 'denied' ? `
          <div class="push-denied-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Notificações bloqueadas no navegador. Vá em <strong>Configurações &gt; Privacidade e Segurança &gt; Notificações</strong> e permita este site.</span>
          </div>
        ` : `
          <p style="font-size:0.8rem;color:var(--text-muted);margin:0">
            <i class="fas fa-info-circle"></i>
            Receba alertas sobre seus gastos e lembretes de contas.
            ${!('Notification' in window) ? 'Notificações não suportadas neste navegador.' : ''}
          </p>
        `}
      </div>

      <div class="profile-section">
        <h3>Autenticação de Dois Fatores</h3>
        <div id="twoFAStatus">
          <p style="font-size:0.85rem;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>
        </div>
      </div>

      <div class="profile-section">
        <p style="font-size:0.8rem;color:var(--text-muted)">
          <i class="fas fa-calendar-alt"></i> Membro desde ${new Date(u.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>

    <div class="modal-overlay hidden" id="themeEditorOverlay">
      <div class="modal theme-editor-modal" id="themeEditorModal">
        <div class="modal-header">
          <h3 id="themeEditorTitle">Novo Tema</h3>
          <button class="modal-close" id="themeEditorClose">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="themeEditorName">Nome do Tema</label>
            <input type="text" id="themeEditorName" placeholder="Meu Tema Personalizado" maxlength="40" />
          </div>
          <div class="theme-editor-groups" id="themeEditorGroups"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="themeEditorReset">Resetar para o base</button>
          <button class="btn btn-ghost" id="themeEditorCancel">Cancelar</button>
          <button class="btn btn-primary" id="themeEditorSave">Salvar</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('profileBackBtn').addEventListener('click', () => navigate('/dashboard'));
  document.getElementById('profileForm').addEventListener('submit', saveProfile);
  document.getElementById('pfTheme').addEventListener('change', changeTheme);
  document.getElementById('pushToggle').addEventListener('change', togglePush);
  document.getElementById('newThemeBtn').addEventListener('click', () => openThemeEditor(null));
  document.getElementById('importThemeBtn').addEventListener('click', () => document.getElementById('importThemeInput').click());
  document.getElementById('importThemeInput').addEventListener('change', importThemeFile);
  document.getElementById('exportAllThemesBtn').addEventListener('click', () => exportCustomTheme('all'));
  document.getElementById('themeEditorClose').addEventListener('click', closeThemeEditor);
  document.getElementById('themeEditorCancel').addEventListener('click', closeThemeEditor);
  document.getElementById('themeEditorSave').addEventListener('click', saveThemeEditor);
  document.getElementById('themeEditorReset').addEventListener('click', resetThemeEditor);

  document._editTheme = (id) => {
    const themes = getCustomThemes();
    const theme = themes.find(t => t.id === id);
    if (theme) openThemeEditor(theme);
  };
  document._exportTheme = (id) => exportCustomTheme(id);
  document._deleteTheme = (id) => {
    if (!confirm(`Excluir o tema "${getCustomThemes().find(t => t.id === id)?.name}"?`)) return;
    deleteCustomTheme(id);
    refreshThemeUI();
    showToast('Tema excluído', 'info');
  };

  load2FAStatus();

  _keyHandler = (e) => { if (e.key === 'Escape') navigate('/dashboard'); };
  document.addEventListener('keydown', _keyHandler);
}

async function saveProfile(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  showSpinner('Salvando…');
  try {
    const dados = {
      nome: document.getElementById('pfNome').value.trim(),
      sobrenome: document.getElementById('pfSobrenome').value.trim(),
      foto: document.getElementById('pfFoto').value.trim() || null,
    };
    await apiPut('/api/profile', dados);
    showToast('Perfil atualizado!', 'success');
  } catch (err) {
    showToast(err.message || 'Erro ao salvar');
  } finally {
    hideSpinner();
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function changeTheme(e) {
  const theme = e.target.value;
  applyTheme(theme);
  setTheme(theme);
  try {
    await apiPut('/api/profile', { theme });
  } catch {}
}

const COLOR_GROUPS = [
  { label: 'Principal', keys: ['primary', 'primaryHover', 'primaryLight'] },
  { label: 'Sucesso', keys: ['success', 'successLight'] },
  { label: 'Alerta', keys: ['warning', 'warningLight'] },
  { label: 'Erro', keys: ['danger', 'dangerLight'] },
  { label: 'Fundo', keys: ['bg', 'bgCard', 'bgInput', 'bgHover', 'border'] },
  { label: 'Texto', keys: ['text', 'textSecondary', 'textMuted'] },
  { label: 'Sombra', keys: ['shadow', 'shadowLg'] },
  { label: 'Fonte', keys: ['font', 'fontHeading'] },
];

const DEFAULT_COLORS = {
  primary: '#6366f1', primaryHover: '#4f46e5', primaryLight: 'rgba(99,102,241,0.15)',
  success: '#10b981', successLight: 'rgba(16,185,129,0.15)',
  warning: '#f59e0b', warningLight: 'rgba(245,158,11,0.15)',
  danger: '#ef4444', dangerLight: 'rgba(239,68,68,0.15)',
  bg: '#0f172a', bgCard: '#1e293b', bgInput: '#334155', bgHover: '#334155', border: '#1e293b',
  text: '#f1f5f9', textSecondary: '#94a3b8', textMuted: '#64748b',
  shadow: '0 2px 8px rgba(0,0,0,0.15)', shadowLg: '0 4px 16px rgba(0,0,0,0.15)',
  font: "'Outfit', system-ui, -apple-system, sans-serif",
  fontHeading: "'DM Serif Display', Georgia, serif",
};

let _editingThemeId = null;

function openThemeEditor(theme) {
  _editingThemeId = theme ? theme.id : null;
  const colors = theme ? { ...DEFAULT_COLORS, ...theme.colors } : { ...DEFAULT_COLORS };
  const overlay = document.getElementById('themeEditorOverlay');
  const title = document.getElementById('themeEditorTitle');
  const nameInput = document.getElementById('themeEditorName');
  const groupsEl = document.getElementById('themeEditorGroups');

  title.textContent = theme ? 'Editar Tema' : 'Novo Tema';
  nameInput.value = theme ? theme.name : '';
  nameInput.dataset.base = theme ? theme.baseOn || 'dark' : 'dark';

  groupsEl.innerHTML = COLOR_GROUPS.map(group => `
    <details class="theme-editor-group" ${group.label === 'Principal' ? 'open' : ''}>
      <summary>${group.label}</summary>
      <div class="theme-editor-fields">
        ${group.keys.map(key => {
          const val = colors[key] || '';
          const isColor = !key.startsWith('shadow') && !key.startsWith('font');
          return `
            <div class="theme-editor-field">
              <label for="tef_${key}">${key}</label>
              <div class="theme-editor-input-row">
                ${isColor ? `<input type="color" id="tef_${key}" value="${toHex(val)}" class="tef-color" />` : ''}
                <input type="text" id="tef_${key}_text" value="${val}" class="tef-text" placeholder="${isColor ? '#hex ou rgba()' : 'valor CSS'}" />
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </details>
  `).join('');

  groupsEl.querySelectorAll('.tef-color, .tef-text').forEach(el => {
    el.addEventListener('input', onEditorFieldChange);
  });

  overlay.classList.remove('hidden');
  document.body.className = '';
  applyCustomTheme(colors);
}

function closeThemeEditor() {
  _editingThemeId = null;
  document.getElementById('themeEditorOverlay').classList.add('hidden');
  applyTheme(getCurrentTheme());
}

function onEditorFieldChange(e) {
  if (e && e.target.classList.contains('tef-color')) {
    const field = e.target.closest('.theme-editor-field');
    const textInput = field.querySelector('.tef-text');
    textInput.value = e.target.value;
  }
  const colors = readEditorColors();
  document.body.className = '';
  applyCustomTheme(colors);
}

function readEditorColors() {
  const colors = {};
  document.querySelectorAll('.theme-editor-field').forEach(field => {
    const key = field.querySelector('.tef-text').id.replace('tef_', '').replace('_text', '');
    const textVal = field.querySelector('.tef-text').value.trim();
    if (textVal) colors[key] = textVal;
  });
  return colors;
}

function toHex(val) {
  if (!val || val.startsWith('rgba') || val.startsWith('linear-gradient')) return '#6366f1';
  const match = val.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : '#6366f1';
}

function saveThemeEditor() {
  const name = document.getElementById('themeEditorName').value.trim();
  if (!name) { showToast('Defina um nome para o tema', 'warning'); return; }
  const colors = readEditorColors();
  const base = document.getElementById('themeEditorName').dataset.base || 'dark';
  const data = {
    id: _editingThemeId || undefined,
    name,
    baseOn: base,
    colors,
  };
  saveCustomTheme(data);
  closeThemeEditor();
  refreshThemeUI();
  showToast(_editingThemeId ? 'Tema atualizado!' : 'Tema criado!', 'success');
  document.getElementById('pfTheme').value = data.id;
  applyTheme(data.id);
}

function resetThemeEditor() {
  const base = document.getElementById('themeEditorName').dataset.base || 'dark';
  const baseColors = getThemes().find(t => t.id === base)
    ? DEFAULT_COLORS
    : DEFAULT_COLORS;
  document.querySelectorAll('.theme-editor-field').forEach(field => {
    const key = field.querySelector('.tef-text').id.replace('tef_', '').replace('_text', '');
    const def = baseColors[key];
    if (def !== undefined) {
      field.querySelector('.tef-text').value = def;
      const colorInput = field.querySelector('.tef-color');
      if (colorInput) colorInput.value = toHex(def);
    }
  });
  applyCustomTheme(readEditorColors());
}

async function importThemeFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const imported = importCustomTheme(text);
    refreshThemeUI();
    showToast(`${imported.length} tema(s) importado(s)!`, 'success');
  } catch (err) {
    showToast(err.message || 'Erro ao importar', 'warning');
  }
  e.target.value = '';
}

function refreshThemeUI() {
  const themes = getCustomThemes();
  const section = document.getElementById('customThemesSection');
  const grid = document.getElementById('customThemesGrid');
  const exportBtn = document.getElementById('exportAllThemesBtn');
  const select = document.getElementById('pfTheme');

  if (themes.length) {
    section.style.display = '';
    grid.innerHTML = renderCustomThemeCards();
    exportBtn.style.display = '';
  } else {
    section.style.display = 'none';
    exportBtn.style.display = 'none';
  }

  const current = getCurrentTheme();
  select.innerHTML = [
    ...getThemes().map(t =>
      `<option value="${t.id}" ${current === t.id ? 'selected' : ''}>${t.label}</option>`
    ),
    ...themes.map(t =>
      `<option value="${t.id}" ${current === t.id ? 'selected' : ''}>${t.name} ✨</option>`
    ),
  ].join('');
}

async function togglePush(e) {
  const enabled = e.target.checked;
  if (!('Notification' in window)) return;

  if (enabled) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showToast('Permissão de notificação negada', 'warning');
      e.target.checked = false;
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { publicKey } = await apiGet('/api/push/vapid-public-key');
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      await apiPost('/api/push/subscribe', sub.toJSON());
      showToast('Notificações ativadas!', 'success');
    } catch (err) {
      showToast('Erro ao ativar notificações: ' + err.message, 'warning');
      e.target.checked = false;
    }
  } else {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch {}
    showToast('Notificações desativadas', 'info');
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

/* ---- 2FA ---- */

async function load2FAStatus() {
  const container = document.getElementById('twoFAStatus');
  if (!container) return;
  try {
    const status = await apiGet('/api/auth/2fa/status');
    render2FAStatus(container, status);
  } catch (err) {
    container.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted)">Erro ao carregar status 2FA.</p>`;
  }
}

function render2FAStatus(container, status) {
  if (status.enabled) {
    const methods = status.methods.map(m => m === 'totp' ? 'Aplicativo autenticador' : 'Código por email').join(', ');
    container.innerHTML = `
      <div class="twofa-status">
        <span class="twofa-badge twofa-enabled"><i class="fas fa-shield-alt"></i> Ativo</span>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin:8px 0">Métodos: ${methods}</p>
        <button class="btn btn-ghost btn-sm" id="disable2FABtn"><i class="fas fa-trash-alt"></i> Desativar 2FA</button>
      </div>
    `;
    document.getElementById('disable2FABtn').addEventListener('click', disable2FA);
  } else {
    container.innerHTML = `
      <div class="twofa-status">
        <span class="twofa-badge twofa-disabled"><i class="fas fa-shield-alt"></i> Inativo</span>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin:8px 0">Adicione uma camada extra de segurança à sua conta.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn btn-primary btn-sm" id="setupTOTPBtn"><i class="fas fa-mobile-alt"></i> Ativar com app autenticador</button>
          <button class="btn btn-ghost btn-sm" id="setupEmailBtn"><i class="fas fa-envelope"></i> Ativar com email</button>
        </div>
      </div>
    `;
    document.getElementById('setupTOTPBtn').addEventListener('click', () => start2FASetup('totp'));
    document.getElementById('setupEmailBtn').addEventListener('click', () => start2FASetup('email'));
  }
}

async function start2FASetup(method) {
  const container = document.getElementById('twoFAStatus');
  showSpinner('Preparando...');
  try {
    const data = await apiPost('/api/auth/2fa/setup', { method });

    if (method === 'totp') {
      container.innerHTML = `
        <div class="twofa-setup">
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">
            Escaneie o QR code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
          </p>
          <div style="text-align:center;margin:16px 0">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.otpauth)}"
                 alt="QR Code 2FA" style="border-radius:8px;max-width:200px" />
          </div>
          <p style="font-size:0.75rem;color:var(--text-muted);text-align:center;word-break:break-all;margin-bottom:12px">
            Ou insira manualmente: <code style="font-size:0.7rem">${data.secret}</code>
          </p>
          <div class="form-group">
            <label for="verifyTOTPCode">Código de verificação (6 dígitos)</label>
            <input type="text" id="verifyTOTPCode" placeholder="000000" inputmode="numeric" pattern="[0-9]*" maxlength="6" />
          </div>
          <button class="btn btn-primary btn-full" id="verifyTOTPBtn">Verificar e ativar</button>
          <button class="btn btn-ghost btn-full" id="cancel2FABtn" style="margin-top:4px">Cancelar</button>
        </div>
      `;
      document.getElementById('verifyTOTPBtn').addEventListener('click', () => verify2FASetup('totp'));
      document.getElementById('cancel2FABtn').addEventListener('click', () => load2FAStatus());
    } else {
      container.innerHTML = `
        <div class="twofa-setup">
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">
            Um código foi enviado para seu email. Insira-o abaixo para ativar a verificação em duas etapas.
          </p>
          <div class="form-group">
            <label for="verifyEmailCode">Código recebido por email</label>
            <input type="text" id="verifyEmailCode" placeholder="000000" inputmode="numeric" pattern="[0-9]*" maxlength="6" />
          </div>
          <button class="btn btn-primary btn-full" id="verifyEmailBtn">Verificar e ativar</button>
          <button class="btn btn-ghost btn-full" id="cancel2FABtn" style="margin-top:4px">Cancelar</button>
        </div>
      `;
      document.getElementById('verifyEmailBtn').addEventListener('click', () => verify2FASetup('email'));
      document.getElementById('cancel2FABtn').addEventListener('click', () => load2FAStatus());
    }
  } catch (err) {
    showToast(err.message || 'Erro ao configurar 2FA', 'warning');
  } finally {
    hideSpinner();
  }
}

async function verify2FASetup(method) {
  const codeInput = document.getElementById(method === 'totp' ? 'verifyTOTPCode' : 'verifyEmailCode');
  const code = codeInput?.value.trim();
  if (!code) { showToast('Insira o código', 'warning'); return; }

  showSpinner('Verificando...');
  try {
    const data = await apiPost('/api/auth/2fa/verify', { method, code });
    showToast(data.message || '2FA ativado!', 'success');

    if (data.backupCodes && data.backupCodes.length) {
      const container = document.getElementById('twoFAStatus');
      container.innerHTML = `
        <div class="twofa-setup">
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px">
            <i class="fas fa-exclamation-triangle" style="color:var(--warning)"></i>
            Guarde estes códigos de recuperação em local seguro. Cada um pode ser usado <strong>uma única vez</strong>
            para acessar sua conta caso perca o acesso ao método 2FA.
          </p>
          <div class="backup-codes">
            ${data.backupCodes.map(c => `<code>${c}</code>`).join('')}
          </div>
          <button class="btn btn-primary btn-full" id="backupCodesDoneBtn">Guardei os códigos</button>
        </div>
      `;
      document.getElementById('backupCodesDoneBtn').addEventListener('click', () => load2FAStatus());
    } else {
      load2FAStatus();
    }
  } catch (err) {
    showToast(err.message || 'Código inválido', 'warning');
  } finally {
    hideSpinner();
  }
}

async function disable2FA() {
  if (!confirm('Tem certeza que deseja desativar a verificação em duas etapas? Isso reduz a segurança da sua conta.')) return;
  showSpinner('Desativando...');
  try {
    await apiDelete('/api/auth/2fa');
    showToast('2FA desativado', 'info');
    load2FAStatus();
  } catch (err) {
    showToast(err.message || 'Erro ao desativar', 'warning');
  } finally {
    hideSpinner();
  }
}
