import{i as w,n as g,g as S,e as L,d as $,c as B,A as x,b as T,a as D}from"./index-Dj9mJrhr.js";import{s as f,h as v,a as d}from"./dom-LP5MsIav.js";import{f as u,a as y}from"./format-D8UXGgLz.js";let c=[],n={};async function _(t){if(!w()){g("/login");return}t.innerHTML=`
    <div class="offline-indicator" id="offlineIndicator">
      <i class="fas fa-wifi-slash"></i> Sem conexão com a internet
    </div>
    <div class="dashboard-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <h2><i class="fas fa-wallet"></i> Gestor</h2>
        </div>
        <nav class="sidebar-nav">
          <button class="nav-item active" data-page="dashboard">
            <i class="fas fa-chart-bar"></i> Dashboard
          </button>
          <button class="nav-item" data-page="extrato">
            <i class="fas fa-list"></i> Extrato
          </button>
          <button class="nav-item" data-page="nova-transacao">
            <i class="fas fa-plus-circle"></i> Nova Transação
          </button>
          <button class="nav-item" data-page="importar">
            <i class="fas fa-file-import"></i> Importar
          </button>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><i class="fas fa-user"></i> <span id="userName">Usuário</span></div>
          <button class="btn btn-ghost btn-sm btn-full" id="btnLogout">
            <i class="fas fa-sign-out-alt"></i> Sair
          </button>
        </div>
      </aside>

      <main class="main-content" id="mainContent">
        <div class="top-bar">
          <button class="mobile-menu-btn" id="mobileMenuBtn">
            <i class="fas fa-bars"></i>
          </button>
          <h1 id="pageTitle">Dashboard</h1>
          <div class="top-bar-actions">
            <button class="btn btn-primary btn-sm" id="btnNovaTransacao">
              <i class="fas fa-plus"></i> Nova
            </button>
            <button class="btn btn-ghost btn-sm" id="btnExportCSV">
              <i class="fas fa-download"></i> Exportar
            </button>
          </div>
        </div>
        <div id="pageContent"></div>
      </main>
    </div>
  `,C(),F();const a=await S().catch(()=>({name:"Usuário"}));document.getElementById("userName").textContent=a.name||"Usuário",await m(),h(),window.addEventListener("hashchange",h),window.addEventListener("offline",()=>{document.getElementById("offlineIndicator").style.display="block"}),window.addEventListener("online",()=>{document.getElementById("offlineIndicator").style.display="none"}),k()}function h(){window.location.hash.startsWith("#/dashboard")?m():window.location.hash.startsWith("#/extrato")&&O()}function C(){document.querySelectorAll(".nav-item[data-page]").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(o=>o.classList.remove("active")),t.classList.add("active");const a=t.dataset.page;a==="dashboard"?m():a==="extrato"?g("/extrato"):a==="nova-transacao"?p():a==="importar"&&I()})}),document.getElementById("mobileMenuBtn").addEventListener("click",()=>{document.getElementById("sidebar").classList.toggle("open")}),document.getElementById("btnLogout").addEventListener("click",()=>{L()})}function F(){document.getElementById("btnNovaTransacao").addEventListener("click",p),document.getElementById("btnExportCSV").addEventListener("click",H)}function k(){try{const t=localStorage.getItem("offline_lancamentos");t&&!c.length&&(c=JSON.parse(t))}catch{}}async function E(){const t=await T("/api/listar");try{localStorage.setItem("offline_lancamentos",JSON.stringify(t))}catch{}return c=t,t}function M(t){return t.filter(a=>{var o;if(n.descricao&&!((o=a.descricao)!=null&&o.toLowerCase().includes(n.descricao.toLowerCase())))return!1;if(n.tipo){const e=String(a.entradaSaida||"").trim().toLowerCase();if(n.tipo==="entrada"&&(e==="saída"||e==="saida")||n.tipo==="saida"&&e!=="saída"&&e!=="saida")return!1}return!(n.dataInicio&&a.data&&new Date(a.data)<new Date(n.dataInicio)||n.dataFim&&a.data&&new Date(a.data)>new Date(n.dataFim))})}function N(t){let a=0,o=0;return t.forEach(e=>{const r=Number(e.valor)||0,i=String(e.entradaSaida||"").trim().toLowerCase();i==="saída"||i==="saida"?o+=Math.abs(r):a+=r}),{entradas:a,saidas:o,saldo:a-o}}async function m(){var a,o,e,r;document.getElementById("pageTitle").textContent="Dashboard";const t=document.getElementById("pageContent");f("Carregando...");try{await E();const i=M(c),s=N(i);t.innerHTML=`
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-wallet"></i></div>
          <div class="stat-label">Saldo Total</div>
          <div class="stat-value ${s.saldo>=0?"positive":"negative"}">${u(s.saldo)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-arrow-up"></i></div>
          <div class="stat-label">Entradas</div>
          <div class="stat-value positive">${u(s.entradas)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
          <div class="stat-label">Saídas</div>
          <div class="stat-value negative">${u(s.saidas)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-exchange-alt"></i></div>
          <div class="stat-label">Transações</div>
          <div class="stat-value">${i.length}</div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="btn btn-primary" id="dashNova"><i class="fas fa-plus"></i> Nova Transação</button>
        <button class="btn btn-success" id="dashImport"><i class="fas fa-file-import"></i> Importar</button>
      </div>

      <div class="filter-bar" id="dashFiltros">
        <div class="form-group">
          <label>Buscar</label>
          <input type="text" id="filtroDescricao" placeholder="Descrição..." value="${n.descricao||""}" />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="filtroTipo">
            <option value="">Todos</option>
            <option value="entrada" ${n.tipo==="entrada"?"selected":""}>Entradas</option>
            <option value="saida" ${n.tipo==="saida"?"selected":""}>Saídas</option>
          </select>
        </div>
        <div class="form-group">
          <label>Data início</label>
          <input type="date" id="filtroDataInicio" value="${n.dataInicio||""}" />
        </div>
        <div class="form-group">
          <label>Data fim</label>
          <input type="date" id="filtroDataFim" value="${n.dataFim||""}" />
        </div>
        <button class="btn btn-primary" id="btnFiltrar"><i class="fas fa-search"></i> Filtrar</button>
        <button class="btn btn-ghost" id="btnLimpar"><i class="fas fa-times"></i> Limpar</button>
      </div>

      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="dashTableBody">
              ${i.length===0?'<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Nenhum lançamento encontrado</td></tr>':""}
              ${i.slice(0,100).map(l=>`
                <tr>
                  <td>${y(l.data)}</td>
                  <td>${l.descricao||"-"}</td>
                  <td>${l.categoria||"-"}</td>
                  <td class="${Number(l.valor)<0?"negative":"positive"}">${u(l.valor)}</td>
                  <td><span class="badge ${String(l.entradaSaida||"").trim().toLowerCase().includes("sa")?"saida":"entrada"}">${String(l.entradaSaida||"").trim().toLowerCase().includes("sa")?"Saída":"Entrada"}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="editLancamento('${l.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteLancamento('${l.id}')" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ${i.length>100?`<p style="text-align:center;color:var(--text-muted);margin-top:12px">Mostrando 100 de ${i.length} registros</p>`:""}
      </div>
    `,(a=document.getElementById("dashNova"))==null||a.addEventListener("click",p),(o=document.getElementById("dashImport"))==null||o.addEventListener("click",I),(e=document.getElementById("btnFiltrar"))==null||e.addEventListener("click",A),(r=document.getElementById("btnLimpar"))==null||r.addEventListener("click",V),window.editLancamento=j,window.deleteLancamento=q}catch(i){t.innerHTML=`<div class="error-page"><h1>Erro ao carregar dados</h1><p>${i.message}</p></div>`}finally{v()}}function A(){var t,a,o,e;n={descricao:((t=document.getElementById("filtroDescricao"))==null?void 0:t.value)||"",tipo:((a=document.getElementById("filtroTipo"))==null?void 0:a.value)||"",dataInicio:((o=document.getElementById("filtroDataInicio"))==null?void 0:o.value)||"",dataFim:((e=document.getElementById("filtroDataFim"))==null?void 0:e.value)||""},m()}function V(){n={},m()}async function p(t=null){var o;const a=!!t;document.body.insertAdjacentHTML("beforeend",`
    <div class="modal-overlay" id="formModal">
      <div class="modal-content">
        <h2>${a?"Editar":"Nova"} Transação</h2>
        <form id="lancamentoForm">
          <div class="form-group">
            <label for="formData">Data</label>
            <input type="date" id="formData" required value="${a?(o=t.data)==null?void 0:o.split("T")[0]:new Date().toISOString().split("T")[0]}" />
          </div>
          <div class="form-group">
            <label for="formDescricao">Descrição</label>
            <input type="text" id="formDescricao" required placeholder="Ex: Salário mensal" value="${a&&t.descricao||""}" />
          </div>
          <div class="form-group">
            <label for="formValor">Valor (R$)</label>
            <input type="number" id="formValor" step="0.01" required placeholder="0,00" value="${a?Math.abs(t.valor):""}" />
          </div>
          <div class="form-group">
            <label for="formTipo">Tipo</label>
            <select id="formTipo">
              <option value="entrada" ${a&&!String(t.entradaSaida||"").trim().toLowerCase().includes("sa")?"selected":""}>Entrada</option>
              <option value="saida" ${a&&String(t.entradaSaida||"").trim().toLowerCase().includes("sa")?"selected":""}>Saída</option>
            </select>
          </div>
          <div class="form-group">
            <label for="formCategoria">Categoria</label>
            <select id="formCategoria">
              <option value="">Automática</option>
              ${["Alimentação","Transporte","Moradia","Saúde","Educação","Lazer","Vestuário","Serviços","Salário","Investimentos"].map(e=>`<option value="${e}" ${a&&t.categoria===e?"selected":""}>${e}</option>`).join("")}
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" id="cancelForm">Cancelar</button>
            <button type="submit" class="btn btn-primary">${a?"Salvar":"Adicionar"}</button>
          </div>
        </form>
      </div>
    </div>
  `),document.getElementById("cancelForm").addEventListener("click",b),document.getElementById("formModal").addEventListener("click",e=>{e.target===e.currentTarget&&b()}),document.getElementById("lancamentoForm").addEventListener("submit",async e=>{e.preventDefault();const r={data:document.getElementById("formData").value,descricao:document.getElementById("formDescricao").value,valor:document.getElementById("formTipo").value==="saida"?-Math.abs(Number(document.getElementById("formValor").value)):Math.abs(Number(document.getElementById("formValor").value)),entradaSaida:document.getElementById("formTipo").value==="entrada"?"Entrada":"Saída",categoria:document.getElementById("formCategoria").value};f(a?"Salvando...":"Adicionando...");try{a?(await $(`/api/lancamento/${t.id}`,r),d("Atualizado!","success")):(await B("/api/lancamento",r),d("Adicionado!","success")),b(),m()}catch(i){d(i.message||"Erro ao salvar")}finally{v()}})}function b(){const t=document.getElementById("formModal");t&&t.remove()}function j(t){const a=c.find(o=>String(o.id)===String(t));a&&p(a)}async function q(t){if(confirm("Excluir este lançamento?")){f("Excluindo...");try{await D(`/api/lancamento/${t}`),d("Excluído!","success"),m()}catch(a){d(a.message||"Erro ao excluir")}finally{v()}}}function H(){if(!c.length){d("Nenhum dado para exportar","warning");return}const t=["Data","Descrição","Valor","Tipo","Categoria"],a=c.map(s=>[y(s.data),`"${(s.descricao||"").replace(/"/g,'""')}"`,String(Number(s.valor).toFixed(2).replace(".",",")),s.entradaSaida||"",s.categoria||""]),o=[t.join(";"),...a.map(s=>s.join(";"))].join(`
`),e=new Blob(["\uFEFF"+o],{type:"text/csv;charset=utf-8;"}),r=URL.createObjectURL(e),i=document.createElement("a");i.href=r,i.download=`financeiro_${new Date().toISOString().split("T")[0]}.csv`,i.click(),URL.revokeObjectURL(r),d("CSV exportado!","success")}function I(){document.getElementById("pageTitle").textContent="Importar";const t=document.getElementById("pageContent");t.innerHTML=`
    <div class="card">
      <h2 style="margin-bottom:20px"><i class="fas fa-file-import"></i> Importar Lançamentos</h2>
      <p style="color:var(--text-secondary);margin-bottom:20px">Formatos aceitos: OFX, CSV</p>
      <form id="importForm">
        <div class="form-group">
          <label for="importFile">Selecione o arquivo</label>
          <input type="file" id="importFile" accept=".ofx,.csv" required style="padding:8px;background:transparent;border:1px dashed var(--border);border-radius:var(--radius-sm)" />
        </div>
        <button type="submit" class="btn btn-primary"><i class="fas fa-upload"></i> Importar</button>
      </form>
      <div id="importResult" style="margin-top:16px"></div>
    </div>
  `,document.getElementById("importForm").addEventListener("submit",async a=>{a.preventDefault();const o=document.getElementById("importFile");if(!o.files[0]){d("Selecione um arquivo","warning");return}const e=new FormData;e.append("file",o.files[0]),f("Importando...");try{const r=localStorage.getItem("token"),i=await fetch(`${x}/api/importar`,{method:"POST",headers:{Authorization:`Bearer ${r}`},body:e}),s=await i.json();if(!i.ok)throw new Error(s.error||"Erro ao importar");document.getElementById("importResult").innerHTML=`<p style="color:var(--success)"><i class="fas fa-check-circle"></i> ${s.message||"Importado com sucesso!"} (${s.count||0} registros)</p>`,d("Importado!","success"),E()}catch(r){d(r.message||"Erro ao importar")}finally{v()}})}function O(){g("/extrato")}export{_ as render};
