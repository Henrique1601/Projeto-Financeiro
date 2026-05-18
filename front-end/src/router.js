const ROUTES = new Map();
let currentCleanup = null;

export function route(path, handler) {
  ROUTES.set(path, handler);
}

export function navigate(path) {
  window.location.hash = path;
}

export function initRouter() {
  window.addEventListener('hashchange', onHashChange);
  onHashChange();
}

async function onHashChange() {
  const hash = window.location.hash.slice(1) || '/login';

  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '<div class="page-transition"><div class="spinner"></div></div>';

  let handler = ROUTES.get(hash);

  if (!handler) {
    const catchAll = ROUTES.get('*');
    if (catchAll) {
      handler = catchAll;
    } else {
      app.innerHTML = '<h1>404 - Página não encontrada</h1>';
      return;
    }
  }

  try {
    const cleanup = await handler(app);
    if (typeof cleanup === 'function') {
      currentCleanup = cleanup;
    }
  } catch (err) {
    app.innerHTML = `<div class="error-page"><h1>Erro</h1><p>${err.message}</p></div>`;
  }
}
