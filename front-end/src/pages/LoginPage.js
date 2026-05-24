import { login, socialLogin } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate } from '../router.js';

export async function render(app) {
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

  const form = document.getElementById('loginForm');
  const googleBtn = document.getElementById('loginGoogle');
  const githubBtn = document.getElementById('loginGithub');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    showSpinner('Entrando...');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Erro ao fazer login');
    } finally {
      hideSpinner();
    }
  });

  googleBtn.addEventListener('click', () => socialLogin('google'));
  githubBtn.addEventListener('click', () => socialLogin('github'));
}
