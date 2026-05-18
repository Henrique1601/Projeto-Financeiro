import { initRouter, route, navigate } from './router.js';
import { isAuthenticated } from './auth.js';
import { showToast } from './utils/dom.js';

// Page imports (loaded lazily)
const pages = {
  login: () => import('./pages/LoginPage.js'),
  register: () => import('./pages/RegisterPage.js'),
  dashboard: () => import('./pages/DashboardPage.js'),
  extrato: () => import('./pages/ExtratoPage.js'),
  'esqueci-senha': () => import('./pages/ForgotPasswordPage.js'),
  'resetar-senha': () => import('./pages/ResetPasswordPage.js'),
  callback: () => import('./pages/CallbackPage.js'),
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

route('*', async (app) => {
  const target = isAuthenticated() ? '/dashboard' : '/login';
  navigate(target);
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'h') {
    e.preventDefault();
    navigate('/dashboard');
  }
  if (e.ctrlKey && e.key === 'e') {
    e.preventDefault();
    navigate('/extrato');
  }
});

// Init
initRouter();
