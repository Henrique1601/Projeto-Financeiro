import{r as n,n as l}from"./index-Dj9mJrhr.js";import{s as d,a as e,h as m}from"./dom-LP5MsIav.js";async function u(a){a.innerHTML=`
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
  `,document.getElementById("registerForm").addEventListener("submit",async r=>{r.preventDefault();const t=document.getElementById("name").value.trim(),o=document.getElementById("email").value.trim(),s=document.getElementById("password").value;d("Cadastrando...");try{await n(t,o,s),e("Conta criada com sucesso!","success"),l("/dashboard")}catch(i){e(i.message||"Erro ao cadastrar")}finally{m()}})}export{u as render};
