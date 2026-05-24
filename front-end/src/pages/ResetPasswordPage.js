import { resetPassword } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate, getRouteParams } from '../router.js';

export async function render(app) {
  const params = getRouteParams();
  const email = params.email || '';
  const code = params.code || '';

  app.innerHTML = `
    <div class="login-page page-enter">
      <div class="deco-shape deco-shape-1"></div>
      <div class="deco-shape deco-shape-2"></div>
      <div class="deco-shape deco-shape-3"></div>
      <div class="auth-card">
        <h1>Nova Senha</h1>
        <p>Defina sua nova senha</p>
        <form id="resetForm">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" required value="${email || ''}" />
          </div>
          <div class="form-group">
            <label for="code">Código de recuperação</label>
            <input type="text" id="code" placeholder="6 dígitos" required maxlength="6" value="${code || ''}" />
          </div>
          <div class="form-group">
            <label for="senha">Nova senha</label>
            <input type="password" id="senha" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Alterar senha</button>
        </form>
        <div class="auth-footer">
          <a href="#/login">Voltar ao login</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailVal = document.getElementById('email').value.trim();
    const codeVal = document.getElementById('code').value.trim();
    const senhaVal = document.getElementById('senha').value;
    showSpinner('Alterando...');
    try {
      await resetPassword(emailVal, codeVal, senhaVal);
      showToast('Senha alterada com sucesso!', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar senha');
    } finally {
      hideSpinner();
    }
  });
}
