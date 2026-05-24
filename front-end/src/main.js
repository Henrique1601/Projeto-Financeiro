import { initRouter, route, navigate } from './router.js';
import { isAuthenticated } from './auth.js';
import { initTheme } from './theme.js';
import { API_BASE_URL } from './config.js';

// Page imports (loaded lazily)
const pages = {
  login: () => import('./pages/LoginPage.js'),
  register: () => import('./pages/RegisterPage.js'),
  dashboard: () => import('./pages/DashboardPage.js'),
  extrato: () => import('./pages/ExtratoPage.js'),
  'esqueci-senha': () => import('./pages/ForgotPasswordPage.js'),
  'resetar-senha': () => import('./pages/ResetPasswordPage.js'),
  callback: () => import('./pages/CallbackPage.js'),
  'alterar-senha': () => import('./pages/ChangePasswordPage.js'),
  profile: () => import('./pages/ProfilePage.js'),
  recorrentes: () => import('./pages/RecorrentesPage.js'),
};

function guard(handler) {
  return async (app) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
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

route('*', async (app) => {
  const target = isAuthenticated() ? '/dashboard' : '/login';
  navigate(target);
});

// Helper to close modals via Esc
function closeTopModal() {
  const modals = document.querySelectorAll('.modal-overlay');
  if (modals.length) modals[modals.length - 1].remove();
}

// Helper to check input focus
function isInputFocused() {
  const t = document.activeElement?.tagName || '';
  return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT';
}

// Keyboard shortcuts
document.addEventListener('keydown', async (e) => {
  // Navigation (works everywhere)
  if (e.ctrlKey && e.key === 'h') {
    e.preventDefault();
    navigate('/dashboard');
    return;
  }
  if (e.ctrlKey && e.key === 'e') {
    e.preventDefault();
    navigate('/extrato');
    return;
  }
  if (e.ctrlKey && e.key === 't') {
    e.preventDefault();
    const { getThemes, getCurrentTheme, setTheme } = await import('./theme.js');
    const themes = getThemes();
    const current = getCurrentTheme();
    const idx = themes.findIndex(t => t.id === current);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next.id);
    return;
  }
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    const hash = window.location.hash;
    if (hash.startsWith('#/dashboard') || hash === '' || hash === '#') {
      window.dispatchEvent(new CustomEvent('app-shortcut', { detail: 'nova-transacao' }));
    } else {
      navigate('/dashboard');
    }
    return;
  }
  if (e.ctrlKey && e.key === 's' && !isInputFocused()) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('app-shortcut', { detail: 'salvar' }));
    return;
  }
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    navigate('/perfil');
    return;
  }
  if (e.ctrlKey && e.key === 'r') {
    e.preventDefault();
    navigate('/recorrentes');
    return;
  }
  if (e.ctrlKey && e.key === 'f' && !isInputFocused()) {
    e.preventDefault();
    const hash = window.location.hash;
    if (hash.startsWith('#/dashboard') || hash === '' || hash === '#') {
      setTimeout(() => document.getElementById('filtroDescricao')?.focus(), 300);
    } else {
      navigate('/dashboard');
    }
    return;
  }
  if (e.key === 'Escape') {
    closeTopModal();
    return;
  }
});

// Init
(async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const resp = await fetch(API_BASE_URL + '/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const profile = await resp.json();
        initTheme(profile.theme);
        return;
      }
    } catch {}
  }
  initTheme();
})();
initRouter();
