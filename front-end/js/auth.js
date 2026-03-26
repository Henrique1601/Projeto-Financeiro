import { login, register } from './api.js';
import { showToast, logout } from './utils.js';

export async function handleLogin(email, senha) {
  try {
    const data = await login({ email, senha });
    localStorage.setItem('token', data.token);
    showToast('Login realizado com sucesso!', 'success');
    return data;
  } catch (err) {
    showToast(err.message || 'Email ou senha incorretos', 'error');
    throw err;
  }
}

export async function handleRegister(nome, sobrenome, email, senha) {
  try {
    const data = await register({ nome, sobrenome, email, senha });
    showToast('Cadastro realizado! Faça login.', 'success');
    return data;
  } catch (err) {
    showToast(err.message || 'Erro ao cadastrar.', 'error');
    throw err;
  }
}

export function displayUserProfile() {
  const token = localStorage.getItem('token');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  
  if (!userName || !userEmail) return;
  if (!token) return;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    
    userName.textContent = `${decoded.nome || ''} ${decoded.sobrenome || ''}`;
    userEmail.textContent = decoded.email || '';
  } catch (err) {
    console.error('Erro ao decodificar token:', err);
    showToast('Erro ao carregar perfil.', 'error');
    logout();
  }
}

export function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = './login/login.html';
    return false;
  }
  return true;
}
