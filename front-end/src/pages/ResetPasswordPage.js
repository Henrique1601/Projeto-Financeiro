import { resetPassword } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate } from '../router.js';

export async function render(app) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  app.innerHTML = `
    <div class="login-page">
      <div class="auth-card">
        <h1>Nova Senha</h1>
        <p>Defina sua nova senha</p>
        ${token ? `
        <form id="resetForm">
          <div class="form-group">
            <label for="password">Nova senha</label>
            <input type="password" id="password" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Alterar senha</button>
        </form>
        ` : '<p style="color:var(--danger)">Token inválido ou expirado.</p>'}
        <div class="auth-footer">
          <a href="#/login">Voltar ao login</a>
        </div>
      </div>
    </div>
  `;

  if (token) {
    document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      showSpinner('Alterando...');
      try {
        await resetPassword(token, password);
        showToast('Senha alterada com sucesso!', 'success');
        navigate('/login');
      } catch (err) {
        showToast(err.message || 'Erro ao alterar senha');
      } finally {
        hideSpinner();
      }
    });
  }
}
