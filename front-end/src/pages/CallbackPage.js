import { store } from '../store.js';

export async function render(app) {
  app.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted)">Processando login...</p>';

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    store.token = token;
    if (window.opener) {
      window.opener.postMessage({ token }, '*');
      window.close();
    } else {
      window.location.hash = '#/dashboard';
    }
  } else {
    if (window.opener) {
      window.opener.postMessage({ error: 'Token não recebido' }, '*');
      window.close();
    } else {
      window.location.hash = '#/login';
    }
  }
}
