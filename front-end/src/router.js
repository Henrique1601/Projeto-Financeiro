const ROUTES = new Map();
let currentCleanup = null;

const ROUTE_PARAMS = {};

export function route(path, handler) {
  ROUTES.set(path, handler);
}

export function navigate(path) {
  window.location.hash = path;
}

export function getRouteParams() {
  return { ...ROUTE_PARAMS };
}

export function initRouter() {
  window.addEventListener('hashchange', onHashChange);
  onHashChange();
}

async function onHashChange() {
  const fullHash = window.location.hash.slice(1) || '/login';
  const [path, queryString] = fullHash.split('?');

  // Parse query params from hash
  Object.keys(ROUTE_PARAMS).forEach(k => delete ROUTE_PARAMS[k]);
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      ROUTE_PARAMS[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }

  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '<div class="page-transition"><div class="spinner"></div></div>';

  let handler = ROUTES.get(path);

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
