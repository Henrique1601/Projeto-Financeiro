import { apiGet, apiPost, apiPut } from './api.js';
import { store } from './store.js';
import { API_BASE_URL } from './config.js';

function getTrustToken() {
  return localStorage.getItem('trustToken');
}

function saveTrustToken(token) {
  if (token) {
    localStorage.setItem('trustToken', token);
  } else {
    localStorage.removeItem('trustToken');
  }
}

export async function login(email, senha) {
  const data = await apiPost('/api/login', { email, senha, trustToken: getTrustToken() });
  if (!data.requires2FA) {
    store.token = data.token;
  }
  return data;
}

export async function login2FA(tempToken, code, method, trustDevice) {
  const data = await apiPost('/api/login/2fa', { tempToken, code, method, trustDevice });
  store.token = data.token;
  if (data.trustToken) saveTrustToken(data.trustToken);
  return data;
}

export { getTrustToken, saveTrustToken };

export async function register(nome, sobrenome, email, senha) {
  const data = await apiPost('/api/register', { nome, sobrenome, email, senha });
  store.token = data.token;
  return data;
}

export function socialLogin(provider) {
  sessionStorage.setItem('oauth_redirect', window.location.hash);
  window.location.href = `${API_BASE_URL}/api/auth/${provider}`;
}

export async function requestPasswordReset(email) {
  return apiPost('/api/forgot-password', { email });
}

export async function resetPassword(email, code, senha) {
  return apiPost('/api/reset-password', { email, code, senha });
}

export async function changePassword(senhaAtual, novaSenha) {
  return apiPut('/api/change-password', { senhaAtual, novaSenha });
}

export async function getProfile() {
  return apiGet('/api/profile');
}

export async function updateProfile(dados) {
  return apiPut('/api/profile', dados);
}

export function isAuthenticated() {
  return !!store.token;
}
