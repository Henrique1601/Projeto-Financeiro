import { login, login2FA, socialLogin, saveTrustToken } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate } from '../router.js';
import { apiPost } from '../api.js';

let tempToken = null;
let twoFAMethods = [];

export async function render(app) {
  renderLoginForm(app);
}

function renderLoginForm(app) {
  app.innerHTML = `
    <div class="login-page page-enter">
      <div class="deco-shape deco-shape-1"></div>
      <div class="deco-shape deco-shape-2"></div>
      <div class="deco-shape deco-shape-3"></div>
      <div class="auth-card">
        <h1>Gestor Financeiro</h1>
        <p>Faça login para continuar</p>
        <form id="loginForm">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <input type="password" id="password" placeholder="Sua senha" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Entrar</button>
        </form>

        <div class="divider">ou</div>

        <div class="social-buttons">
          <button class="btn btn-google" id="loginGoogle">
            <i class="fab fa-google"></i> Entrar com Google
          </button>
          <button class="btn btn-github" id="loginGithub">
            <i class="fab fa-github"></i> Entrar com GitHub
          </button>
        </div>

        <div class="auth-footer">
          <a href="#/esqueci-senha">Esqueci minha senha</a>
          <br /><br />
          Não tem conta? <a href="#/register">Cadastre-se</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('loginGoogle').addEventListener('click', () => socialLogin('google'));
  document.getElementById('loginGithub').addEventListener('click', () => socialLogin('github'));
}

function render2FAForm(app) {
  const hasEmail = twoFAMethods.includes('email');
  const hasTOTP = twoFAMethods.includes('totp');
  const defaultMethod = hasTOTP ? 'totp' : 'email';

  app.innerHTML = `
    <div class="login-page page-enter">
      <div class="deco-shape deco-shape-1"></div>
      <div class="deco-shape deco-shape-2"></div>
      <div class="deco-shape deco-shape-3"></div>
      <div class="auth-card">
        <h1>Verificação em duas etapas</h1>
        <p>Insira o código de autenticação</p>
        <form id="login2FAForm">
          ${hasTOTP && hasEmail ? `
            <div class="form-group">
              <label for="twoFAMethod">Método</label>
              <select id="twoFAMethod">
                <option value="totp">Aplicativo autenticador</option>
                <option value="email">Código por email</option>
              </select>
            </div>
          ` : ''}
          <div class="form-group">
            <label for="twoFACode">Código de 6 dígitos</label>
            <input type="text" id="twoFACode" placeholder="000000" required autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]*" maxlength="6" />
          </div>
          <div class="form-group" style="margin-top:8px">
            <label class="checkbox-label">
              <input type="checkbox" id="trustDevice" checked />
              <span>Confiar neste dispositivo por 30 dias</span>
            </label>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Verificar</button>
          <button type="button" class="btn btn-ghost btn-full" id="backupCodeLink" style="margin-top:8px">Usar código de recuperação</button>
          ${hasEmail ? `<button type="button" class="btn btn-ghost btn-full" id="resendCodeBtn" style="margin-top:4px">Reenviar código por email</button>` : ''}
        </form>
        <div class="auth-footer">
          <a href="#" id="backToLogin">Voltar ao login</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login2FAForm').addEventListener('submit', handle2FASubmit);
  document.getElementById('backToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    tempToken = null;
    renderLoginForm(app);
  });
  document.getElementById('backupCodeLink').addEventListener('click', (e) => {
    e.preventDefault();
    renderBackupCodeForm(app);
  });
  const resendBtn = document.getElementById('resendCodeBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      try {
        await apiPost('/api/login/2fa/resend', { tempToken });
        showToast('Código reenviado!');
      } catch (err) {
        showToast(err.message || 'Erro ao reenviar');
      }
    });
  }
}

function renderBackupCodeForm(app) {
  app.innerHTML = `
    <div class="login-page page-enter">
      <div class="deco-shape deco-shape-1"></div>
      <div class="deco-shape deco-shape-2"></div>
      <div class="deco-shape deco-shape-3"></div>
      <div class="auth-card">
        <h1>Código de recuperação</h1>
        <p>Insira um dos seus códigos de recuperação</p>
        <form id="backupCodeForm">
          <div class="form-group">
            <label for="backupCode">Código de recuperação</label>
            <input type="text" id="backupCode" placeholder="ABCD1234" required autocomplete="off" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Verificar</button>
        </form>
        <div class="auth-footer">
          <a href="#" id="backTo2FA">Voltar</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backupCodeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('backupCode').value.trim().toUpperCase();
    showSpinner('Verificando...');
    try {
      const data = await login2FA(tempToken, code, 'backup');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Código inválido');
    } finally {
      hideSpinner();
    }
  });
  document.getElementById('backTo2FA').addEventListener('click', (e) => {
    e.preventDefault();
    render2FAForm(app);
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  showSpinner('Entrando...');
  try {
    const data = await login(email, password);
    if (data.requires2FA) {
      tempToken = data.tempToken;
      twoFAMethods = data.methods || [];
      render2FAForm(document.querySelector('.login-page')?.parentElement || document.getElementById('app'));
      return;
    }
    navigate('/dashboard');
  } catch (err) {
    showToast(err.message || 'Erro ao fazer login');
  } finally {
    hideSpinner();
  }
}

async function handle2FASubmit(e) {
  e.preventDefault();
  const code = document.getElementById('twoFACode').value.trim();
  const methodSelect = document.getElementById('twoFAMethod');
  const method = methodSelect ? methodSelect.value : 'totp';
  const trustDevice = document.getElementById('trustDevice')?.checked || false;
  showSpinner('Verificando...');
  try {
    const data = await login2FA(tempToken, code, method, trustDevice);
    navigate('/dashboard');
  } catch (err) {
    showToast(err.message || 'Código inválido');
  } finally {
    hideSpinner();
  }
}
