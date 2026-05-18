import { API_BASE_URL } from './config.js';

function getToken() {
  return localStorage.getItem('token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const retryHeaders = {
        ...defaultHeaders,
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
      };
      const retryRes = await fetch(url, { ...options, headers: retryHeaders });
      if (!retryRes.ok) {
        const text = await retryRes.text().catch(() => '');
        throw new ApiError(`Erro após refresh token (${retryRes.status})`, retryRes.status, text);
      }
      return retryRes.json();
    }
    logout();
    throw new ApiError('Sessão expirada', 401);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`Erro HTTP ${res.status}`, res.status, text);
  }

  return res.json();
}

async function refreshToken() {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('token', data.token);
    return true;
  } catch {
    return false;
  }
}

export function logout() {
  localStorage.removeItem('token');
  window.location.hash = '#/login';
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function apiGet(path) {
  return apiFetch(path);
}

export async function apiPost(path, body) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function apiPut(path, body) {
  return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
}

export async function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' });
}
