import { checkAuth, displayUserProfile } from './auth.js';
import { checkServerAvailability } from './utils.js';
import { carregarDados } from './financeiro.js';
import { initEvents } from './events.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW failed', err));
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;

  const serverOk = await checkServerAvailability();
  if (!serverOk) return;

  displayUserProfile();
  await carregarDados();
  initEvents();

  console.log('Aplicação inicializada com sucesso');
});
