import{f as o}from"./index-Dj9mJrhr.js";import{s as n,a as e,h as l}from"./dom-LP5MsIav.js";async function d(a){a.innerHTML=`
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
  `,document.getElementById("forgotForm").addEventListener("submit",async i=>{i.preventDefault();const r=document.getElementById("email").value.trim();n("Enviando...");try{await o(r),e("Link enviado! Verifique seu e-mail.","success")}catch(t){e(t.message||"Erro ao enviar link")}finally{l()}})}export{d as render};
