import Toastify from 'toastify-js';

export function showToast(message, type = 'error') {
  const bgColor = type === 'success' ? '#10b981' :
                  type === 'warning' ? '#f59e0b' : '#ef4444';
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    style: { background: bgColor, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  }).showToast();
}

export function showSpinner(message = 'Processando...') {
  const existing = document.getElementById('app-spinner');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'app-spinner';
  overlay.className = 'spinner-overlay';
  overlay.innerHTML = `
    <div class="spinner"></div>
    <p>${message}</p>
  `;
  document.body.appendChild(overlay);
}

export function hideSpinner() {
  const el = document.getElementById('app-spinner');
  if (el) el.remove();
}
