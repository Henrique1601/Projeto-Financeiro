import { requestPasswordReset } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate } from '../router.js';

export async function render(app) {
  app.innerHTML = `
    <div class="login-page page-enter">
      <div class="deco-shape deco-shape-1"></div>
      <div class="deco-shape deco-shape-2"></div>
      <div class="deco-shape deco-shape-3"></div>
      <div class="auth-card">
        <h1>Recuperar Senha</h1>
        <p>Digite seu e-mail para receber o link de recuperação</p>
        <form id="forgotForm">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" required autocomplete="email" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Enviar código</button>
        </form>
        <div id="forgotResult" style="margin-top:16px"></div>
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
      const result = await requestPasswordReset(email);
      let msg = 'Código enviado! Verifique seu e-mail.';
      if (result?.code) {
        msg += `<br><br><div id="codeBox" style="background:var(--surface-secondary);padding:12px;border-radius:6px;text-align:center;font-size:24px;letter-spacing:6px;font-weight:700;font-family:monospace;cursor:pointer;user-select:all" onclick="navigator.clipboard?.writeText('${result.code}')" title="Clique para copiar">${result.code}</div>
        <br><small style="color:var(--text-secondary)">Clique no código para copiar</small>`;
      }
      msg += `<br><br><button class="btn btn-primary btn-full" onclick="window.location.hash='/resetar-senha?email=${encodeURIComponent(email)}'" style="cursor:pointer">Redefinir senha</button>`;
      document.getElementById('forgotResult').innerHTML = `<div style="color:var(--success);text-align:center">${msg}</div>`;
      showToast('Código enviado!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao enviar código');
    } finally {
      hideSpinner();
    }
  });
}
