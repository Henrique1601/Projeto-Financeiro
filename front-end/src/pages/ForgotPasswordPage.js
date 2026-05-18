import { requestPasswordReset } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';

export async function render(app) {
  app.innerHTML = `
    <div class="login-page">
      <div class="auth-card">
        <h1>Recuperar Senha</h1>
        <p>Digite seu e-mail para receber o link de recuperação</p>
        <form id="forgotForm">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" required autocomplete="email" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Enviar link</button>
        </form>
        <div class="auth-footer">
          <a href="#/login">Voltar ao login</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    showSpinner('Enviando...');
    try {
      await requestPasswordReset(email);
      showToast('Link enviado! Verifique seu e-mail.', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao enviar link');
    } finally {
      hideSpinner();
    }
  });
}
