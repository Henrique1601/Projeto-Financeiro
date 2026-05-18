import { apiGet, apiPost } from './api.js';
import { store } from './store.js';
import { API_BASE_URL } from './config.js';

export async function login(email, password) {
  const data = await apiPost('/api/login', { email, password });
  store.token = data.token;
  return data;
}

export async function register(name, email, password) {
  const data = await apiPost('/api/register', { name, email, password });
  store.token = data.token;
  return data;
}

export async function socialLogin(provider) {
  const width = 500, height = 600;
  const left = (screen.width / 2) - (width / 2);
  const top = (screen.height / 2) - (height / 2);
  const url = `${API_BASE_URL}/api/auth/${provider}`;

  return new Promise((resolve, reject) => {
    const popup = window.open(
      url,
      `Login ${provider}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    function handler(event) {
      if (event.data?.token) {
        window.removeEventListener('message', handler);
        store.token = event.data.token;
        resolve(event.data);
      }
    }
    window.addEventListener('message', handler);

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        window.removeEventListener('message', handler);
        resolve(null);
      }
    }, 500);
  });
}

export async function requestPasswordReset(email) {
  return apiPost('/api/forgot-password', { email });
}

export async function resetPassword(token, password) {
  return apiPost('/api/reset-password', { token, password });
}

export async function changePassword(currentPassword, newPassword) {
  return apiPost('/api/change-password', { currentPassword, newPassword });
}

export async function getProfile() {
  return apiGet('/api/profile');
}

export async function updateProfile(data) {
  return apiPost('/api/profile', data);
}

export function isAuthenticated() {
  return !!store.token;
}
