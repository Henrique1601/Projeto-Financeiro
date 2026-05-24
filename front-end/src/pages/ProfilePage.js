import { apiPut, apiPost, apiGet } from '../api.js';
import { getProfile } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getThemes, getCurrentTheme, applyTheme } from '../theme.js';

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
            ${getThemes().map(t =>
              `<option value="${t.id}" ${(u.theme || getCurrentTheme()) === t.id ? 'selected' : ''}>${t.label}</option>`
            ).join('')}
          </select>
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
            <input type="checkbox" id="pushToggle" ${'Notification' in window && Notification.permission === 'granted' ? 'checked' : ''} />
            <span class="switch-slider"></span>
          </label>
        </div>
        <p style="font-size:0.8rem;color:var(--text-muted);margin:0">
          <i class="fas fa-info-circle"></i>
          Receba alertas sobre seus gastos e lembretes de contas.
          ${!('Notification' in window) ? 'Notificações não suportadas neste navegador.' : ''}
          ${'Notification' in window && Notification.permission === 'denied' ? 'Notificações bloqueadas. Permita nas configurações do navegador.' : ''}
        </p>
      </div>

      <div class="profile-section">
        <p style="font-size:0.8rem;color:var(--text-muted)">
          <i class="fas fa-calendar-alt"></i> Membro desde ${new Date(u.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  `;

  document.getElementById('profileBackBtn').addEventListener('click', () => navigate('/dashboard'));
  document.getElementById('profileForm').addEventListener('submit', saveProfile);
  document.getElementById('pfTheme').addEventListener('change', changeTheme);
  document.getElementById('pushToggle').addEventListener('change', togglePush);

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
  try {
    await apiPut('/api/profile', { theme });
  } catch {}
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
