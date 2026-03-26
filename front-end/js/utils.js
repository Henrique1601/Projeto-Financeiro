import { API_BASE_URL, RETRY_ATTEMPTS, RETRY_DELAY, FETCH_TIMEOUT } from './config.js';

export async function fetchWithRetry(url, options = {}, retries = RETRY_ATTEMPTS, delay = RETRY_DELAY, timeout = FETCH_TIMEOUT) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Tentativa ${i + 1} falhou: ${error.message}. Tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export function getErrorMessage(error, defaultMessage = 'Erro desconhecido.') {
  return error && error.message ? error.message : defaultMessage;
}

export function showSpinner(message = 'Processando...') {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.style.display = 'flex';
    spinner.querySelector('p').textContent = message;
  }
}

export function hideSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

export function showToast(message, type = 'success') {
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3'
  };
  
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    backgroundColor: colors[type] || colors.info,
  }).showToast();
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = './login/login.html';
}

export function showCustomMessage(message, backgroundColor = 'red') {
  const mensagemDiv = document.createElement('div');
  mensagemDiv.style.position = 'fixed';
  mensagemDiv.style.top = '10px';
  mensagemDiv.style.left = '50%';
  mensagemDiv.style.transform = 'translateX(-50%)';
  mensagemDiv.style.backgroundColor = backgroundColor;
  mensagemDiv.style.color = 'white';
  mensagemDiv.style.padding = '10px';
  mensagemDiv.style.zIndex = '1000';
  mensagemDiv.style.minWidth = '300px';
  mensagemDiv.style.textAlign = 'center';

  const texto = document.createElement('span');
  texto.textContent = message;
  mensagemDiv.appendChild(texto);

  const fecharBtn = document.createElement('button');
  fecharBtn.textContent = '✕';
  fecharBtn.style.background = 'none';
  fecharBtn.style.border = 'none';
  fecharBtn.style.color = 'white';
  fecharBtn.style.cursor = 'pointer';
  fecharBtn.style.fontSize = '16px';
  fecharBtn.style.marginLeft = '10px';
  fecharBtn.onclick = () => mensagemDiv.remove();
  mensagemDiv.appendChild(fecharBtn);

  document.body.appendChild(mensagemDiv);
  setTimeout(() => mensagemDiv.remove(), 10000);
}

export async function checkServerAvailability() {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/health`, { method: 'GET' }, 3, 1000, 3000);
    if (!response.ok) throw new Error('Servidor indisponível');
    return true;
  } catch (error) {
    console.error('Servidor indisponível:', error.message);
    showToast('Não foi possível conectar ao servidor.', 'error');
    return false;
  }
}
