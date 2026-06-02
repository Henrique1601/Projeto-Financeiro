import { initRouter, route, navigate } from './router.js';
import { isAuthenticated } from './auth.js';
import { initTheme } from './theme.js';
import { updateSidebarNavGroup } from './utils/sidebar.js';
import { API_BASE_URL } from './config.js';
import { initKeybindings, loadKeybindings, getActionFromKeyEvent, formatBinding, getBinding } from './utils/keybindings.js';

// Page imports (loaded lazily)
const pages = {
  login: () => import('./pages/LoginPage.js'),
  register: () => import('./pages/RegisterPage.js'),
  dashboard: () => import('./pages/DashboardPage.js'),
  extrato: () => import('./pages/ExtratoPage.js'),
  'esqueci-senha': () => import('./pages/ForgotPasswordPage.js'),
  'resetar-senha': () => import('./pages/ResetPasswordPage.js'),
  callback: () => import('./pages/CallbackPage.js'),
  compartilhar: () => import('./pages/CompartilharPage.js'),
  'alterar-senha': () => import('./pages/ChangePasswordPage.js'),
  profile: () => import('./pages/ProfilePage.js'),
  recorrentes: () => import('./pages/RecorrentesPage.js'),
  desafios: () => import('./pages/DesafiosPage.js'),
  comparativo: () => import('./pages/ComparativoPage.js'),
};

function guard(handler) {
  return async (app) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    const path = window.location.hash.slice(1).split('?')[0];
    const pageMap = { '/extrato': 'extrato', '/perfil': 'perfil', '/recorrentes': 'recorrentes', '/desafios': 'desafios', '/alterar-senha': 'perfil', '/dashboard': 'dashboard', '/comparativo': 'comparativo' };
    const page = pageMap[path] || path.replace('/', '');
    updateSidebarNavGroup(page);
    return handler(app);
  };
}

route('/login', async (app) => {
  const module = await pages.login();
  return module.render(app);
});

route('/register', async (app) => {
  const module = await pages.register();
  return module.render(app);
});

route('/esqueci-senha', async (app) => {
  const module = await pages['esqueci-senha']();
  return module.render(app);
});

route('/resetar-senha', async (app) => {
  const module = await pages['resetar-senha']();
  return module.render(app);
});

route('/callback', async (app) => {
  const module = await pages.callback();
  return module.render(app);
});

route('/dashboard', guard(async (app) => {
  const module = await pages.dashboard();
  return module.render(app);
}));

route('/extrato', guard(async (app) => {
  const module = await pages.extrato();
  return module.render(app);
}));

route('/alterar-senha', guard(async (app) => {
  const module = await pages['alterar-senha']();
  return module.render(app);
}));

route('/perfil', guard(async (app) => {
  const module = await pages.profile();
  return module.render(app);
}));

route('/recorrentes', guard(async (app) => {
  const module = await pages.recorrentes();
  return module.render(app);
}));

route('/desafios', guard(async (app) => {
  const module = await pages.desafios();
  return module.render(app);
}));

route('/comparativo', guard(async (app) => {
  const module = await pages.comparativo();
  return module.render(app);
}));

route('/compartilhar/:token', async (app) => {
  const module = await pages.compartilhar();
  return module.render(app);
});

route('*', async (app) => {
  const path = window.location.hash.slice(1).split('?')[0];
  if (path.startsWith('/compartilhar/')) {
    const module = await pages.compartilhar();
    return module.render(app);
  }
  const target = isAuthenticated() ? '/dashboard' : '/login';
  navigate(target);
});

// Helper to close modals via Esc
function closeTopModal() {
  const modals = document.querySelectorAll('.modal-overlay');
  if (!modals.length) return;
  const top = modals[modals.length - 1];
  top.classList.add('closing');
  top.addEventListener('animationend', () => top.remove(), { once: true });
}

// Helper to check input focus
function isInputFocused() {
  const t = document.activeElement?.tagName || '';
  return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT';
}

// Keyboard shortcuts (dynamic via keybindings module)
document.addEventListener('keydown', async (e) => {
  if (window.__capturingShortcut) return;
  const action = getActionFromKeyEvent(e);
  if (!action) return;
  e.preventDefault();
  switch (action) {
    case 'dashboard':
      navigate('/dashboard');
      break;
    case 'extrato':
      navigate('/extrato');
      break;
    case 'tema': {
      const { getThemes, getCurrentTheme, setTheme } = await import('./theme.js');
      const themes = getThemes();
      const current = getCurrentTheme();
      const idx = themes.findIndex(t => t.id === current);
      const next = themes[(idx + 1) % themes.length];
      setTheme(next.id);
      break;
    }
    case 'nova-transacao': {
      const hash = window.location.hash;
      if (hash.startsWith('#/dashboard') || hash === '' || hash === '#') {
        window.dispatchEvent(new CustomEvent('app-shortcut', { detail: 'nova-transacao' }));
      } else {
        navigate('/dashboard');
      }
      break;
    }
    case 'salvar':
      if (!isInputFocused()) {
        window.dispatchEvent(new CustomEvent('app-shortcut', { detail: 'salvar' }));
      }
      break;
    case 'perfil':
      navigate('/perfil');
      break;
    case 'recorrentes':
      navigate('/recorrentes');
      break;
    case 'desafios':
      navigate('/desafios');
      break;
    case 'comparativo':
      navigate('/comparativo');
      break;
    case 'buscar':
      if (!isInputFocused()) {
        const hash = window.location.hash;
        if (hash.startsWith('#/dashboard') || hash === '' || hash === '#') {
          setTimeout(() => document.getElementById('filtroDescricao')?.focus(), 300);
        } else {
          navigate('/dashboard');
        }
      }
      break;
    case 'assistente':
      window.dispatchEvent(new CustomEvent('app-shortcut', { detail: 'abrir-assistente' }));
      break;
    case 'fechar':
      closeTopModal();
      break;
  }
});

// Init
(async () => {
  initKeybindings();
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const resp = await fetch(API_BASE_URL + '/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const profile = await resp.json();
        initTheme(profile.theme);
        if (profile.keybindings) loadKeybindings(profile.keybindings);
        return;
      }
    } catch {}
  }
  initTheme();
})();
initRouter();
