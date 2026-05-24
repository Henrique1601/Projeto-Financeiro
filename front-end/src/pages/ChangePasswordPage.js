import { changePassword, isAuthenticated } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate } from '../router.js';

export async function render(app) {
  if (!isAuthenticated()) { navigate('/login'); return; }

  app.innerHTML = `
    <div class="login-page page-enter">
      <div class="deco-shape deco-shape-1"></div>
      <div class="deco-shape deco-shape-2"></div>
      <div class="deco-shape deco-shape-3"></div>
      <div class="login-card">
        <div class="login-header">
          <h1><i class="fas fa-lock"></i> Alterar Senha</h1>
          <p>Digite sua senha atual e a nova senha</p>
        </div>
        <form id="changePasswordForm">
          <div class="form-group">
            <label for="senhaAtual">Senha Atual</label>
            <input type="password" id="senhaAtual" required placeholder="Sua senha atual" />
          </div>
          <div class="form-group">
            <label for="novaSenha">Nova Senha</label>
            <input type="password" id="novaSenha" required placeholder="Nova senha (mín. 6 caracteres)" minlength="6" />
          </div>
          <div class="form-group">
            <label for="confirmarSenha">Confirmar Nova Senha</label>
            <input type="password" id="confirmarSenha" required placeholder="Repita a nova senha" />
          </div>
          <button type="submit" class="btn btn-primary btn-full">
            <i class="fas fa-save"></i> Alterar Senha
          </button>
        </form>
        <div class="login-footer">
          <a href="#" onclick="event.preventDefault(); window.location.hash='#/dashboard'">
            <i class="fas fa-arrow-left"></i> Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmar = document.getElementById('confirmarSenha').value;

    if (novaSenha !== confirmar) {
      showToast('Senhas não conferem');
      return;
    }
    if (novaSenha.length < 6) {
      showToast('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    showSpinner('Alterando senha...');
    try {
      const result = await changePassword(senhaAtual, novaSenha);
      showToast(result.message || 'Senha alterada com sucesso!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar senha');
    } finally {
      hideSpinner();
    }
  });
}
