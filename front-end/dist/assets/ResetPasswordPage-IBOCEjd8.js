import{h as i,n as l}from"./index-Dj9mJrhr.js";import{s as d,a as s,h as c}from"./dom-LP5MsIav.js";async function u(o){var e;const a=new URLSearchParams(window.location.search).get("token");o.innerHTML=`
    <div class="login-page">
      <div class="auth-card">
        <h1>Nova Senha</h1>
        <p>Defina sua nova senha</p>
        ${a?`
        <form id="resetForm">
          <div class="form-group">
            <label for="password">Nova senha</label>
            <input type="password" id="password" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Alterar senha</button>
        </form>
        `:'<p style="color:var(--danger)">Token inválido ou expirado.</p>'}
        <div class="auth-footer">
          <a href="#/login">Voltar ao login</a>
        </div>
      </div>
    </div>
  `,a&&((e=document.getElementById("resetForm"))==null||e.addEventListener("submit",async r=>{r.preventDefault();const n=document.getElementById("password").value;d("Alterando...");try{await i(a,n),s("Senha alterada com sucesso!","success"),l("/login")}catch(t){s(t.message||"Erro ao alterar senha")}finally{c()}}))}export{u as render};
