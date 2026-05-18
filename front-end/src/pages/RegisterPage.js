import { register } from '../auth.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { navigate } from '../router.js';

export async function render(app) {
  app.innerHTML = `
    <div class="login-page">
      <div class="auth-card">
        <h1>Criar Conta</h1>
        <p>Cadastre-se no Gestor Financeiro</p>
        <form id="registerForm">
          <div class="form-group">
            <label for="name">Nome</label>
            <input type="text" id="name" placeholder="Seu nome" required autocomplete="name" />
          </div>
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <input type="password" id="password" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Cadastrar</button>
        </form>
        <div class="auth-footer">
          Já tem conta? <a href="#/login">Fazer login</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    showSpinner('Cadastrando...');
    try {
      await register(name, email, password);
      showToast('Conta criada com sucesso!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Erro ao cadastrar');
    } finally {
      hideSpinner();
    }
  });
}
