import { store } from '../store.js';
import { getRouteParams, navigate } from '../router.js';
import { API_BASE_URL } from '../config.js';

export async function render(app) {
  const params = getRouteParams();
  const token = params.token;
  const error = params.error;

  if (error) {
    app.innerHTML = `<div class="error-page page-enter"><h1>Erro no login social</h1><p>${decodeURIComponent(error)}</p><br><a href="#/login" class="btn btn-primary">Voltar</a></div>`;
    return;
  }

  if (token) {
    app.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted)">Autenticado! Verificando token...</p>';
    store.token = token;

    // Testa se o token é válido antes de redirecionar
    try {
      const resp = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }
      const redirect = sessionStorage.getItem('oauth_redirect') || '#/dashboard';
      sessionStorage.removeItem('oauth_redirect');
      navigate(redirect);
    } catch (err) {
      app.innerHTML = `<div class="error-page page-enter"><h1>Token inválido</h1><p>${err.message}</p><br><a href="#/login" class="btn btn-primary">Voltar ao login</a></div>`;
    }
    return;
  }

  app.innerHTML = `<div class="error-page page-enter"><h1>Login não reconhecido</h1><p>Nenhum token ou erro recebido na URL.</p><a href="#/login" class="btn btn-primary">Tentar novamente</a></div>`;
}
