import{l as m,n as e,s as n}from"./index-Dj9mJrhr.js";import{s as o,a as t,h as i}from"./dom-LP5MsIav.js";async function p(r){r.innerHTML=`
    <div class="login-page">
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
  `;const s=document.getElementById("loginForm"),l=document.getElementById("loginGoogle"),d=document.getElementById("loginGithub");s.addEventListener("submit",async a=>{a.preventDefault();const c=document.getElementById("email").value.trim(),u=document.getElementById("password").value;o("Entrando...");try{await m(c,u),e("/dashboard")}catch(g){t(g.message||"Erro ao fazer login")}finally{i()}}),l.addEventListener("click",async()=>{o("Abrindo Google...");try{await n("google"),e("/dashboard")}catch(a){t(a.message||"Erro no login Google")}finally{i()}}),d.addEventListener("click",async()=>{o("Abrindo GitHub...");try{await n("github"),e("/dashboard")}catch(a){t(a.message||"Erro no login GitHub")}finally{i()}})}export{p as render};
