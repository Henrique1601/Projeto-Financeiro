import { API_BASE_URL } from './config.js';
import { fetchWithRetry, showToast, logout } from './utils.js';

let token = localStorage.getItem('token');

export function setToken(newToken) {
  token = newToken;
}

export function getToken() {
  return token || localStorage.getItem('token');
}

export async function request(endpoint, method = 'GET', body = null) {
  const currentToken = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  let response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, options);

  if (response.status === 401 || response.status === 403) {
    if (endpoint !== '/api/refresh-token') {
      const newToken = await refreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, options);
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${response.status}`);
  }

  return response.json();
}

export async function refreshToken() {
  try {
    const currentToken = getToken();
    if (!currentToken) {
      logout();
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (!response.ok) {
      logout();
      return null;
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    token = data.token;
    return data.token;
  } catch (error) {
    logout();
    return null;
  }
}

export async function login(credentials) {
  return request('/api/login', 'POST', credentials);
}

export async function register(data) {
  return request('/api/register', 'POST', data);
}

export async function listar() {
  return request('/api/listar', 'GET');
}

export async function salvar(data) {
  return request('/api/salvar', 'POST', data);
}

export async function editar(updates) {
  return request('/api/editar', 'PUT', { updates });
}

export async function deletar(id) {
  return request('/api/deletar', 'DELETE', { id });
}

export async function importar(lancamentos) {
  return request('/api/importar', 'POST', { lancamentos });
}
