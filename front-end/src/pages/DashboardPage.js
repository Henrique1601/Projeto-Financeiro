import { apiGet, apiPost, apiPut, apiDelete, logout } from '../api.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { formatDate, formatCurrency } from '../utils/format.js';
import { navigate } from '../router.js';
import { isAuthenticated, getProfile } from '../auth.js';
import { API_BASE_URL } from '../config.js';

let lancamentos = [];
let filtroAtivo = {};

export async function render(app) {
  if (!isAuthenticated()) { navigate('/login'); return; }

  app.innerHTML = `
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
  `;

  registerSidebarHandlers();
  registerTopBarHandlers();

  const user = await getProfile().catch(() => ({ name: 'Usuário' }));
  document.getElementById('userName').textContent = user.name || 'Usuário';

  await showDashboard();

  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);

  window.addEventListener('offline', () => {
    document.getElementById('offlineIndicator').style.display = 'block';
  });
  window.addEventListener('online', () => {
    document.getElementById('offlineIndicator').style.display = 'none';
  });

  loadOfflineData();
}

function handleHashChange() {
  if (window.location.hash.startsWith('#/dashboard')) {
    showDashboard();
  } else if (window.location.hash.startsWith('#/extrato')) {
    showExtrato();
  }
}

function registerSidebarHandlers() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const page = item.dataset.page;
      if (page === 'dashboard') showDashboard();
      else if (page === 'extrato') navigate('/extrato');
      else if (page === 'nova-transacao') showFormModal();
      else if (page === 'importar') showImportSection();
    });
  });

  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.getElementById('btnLogout').addEventListener('click', () => {
    logout();
  });
}

function registerTopBarHandlers() {
  document.getElementById('btnNovaTransacao').addEventListener('click', showFormModal);
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
}

function loadOfflineData() {
  try {
    const cached = localStorage.getItem('offline_lancamentos');
    if (cached && !lancamentos.length) {
      lancamentos = JSON.parse(cached);
    }
  } catch {}
}

async function loadLancamentos() {
  const data = await apiGet('/api/listar');
  try { localStorage.setItem('offline_lancamentos', JSON.stringify(data)); } catch {}
  lancamentos = data;
  return data;
}

function filterLancamentos(items) {
  return items.filter(l => {
    if (filtroAtivo.descricao && !l.descricao?.toLowerCase().includes(filtroAtivo.descricao.toLowerCase())) return false;
    if (filtroAtivo.tipo) {
      const tipo = String(l.entradaSaida || '').trim().toLowerCase();
      if (filtroAtivo.tipo === 'entrada' && (tipo === 'saída' || tipo === 'saida')) return false;
      if (filtroAtivo.tipo === 'saida' && tipo !== 'saída' && tipo !== 'saida') return false;
    }
    if (filtroAtivo.dataInicio && l.data && new Date(l.data) < new Date(filtroAtivo.dataInicio)) return false;
    if (filtroAtivo.dataFim && l.data && new Date(l.data) > new Date(filtroAtivo.dataFim)) return false;
    return true;
  });
}

function calcularStats(items) {
  let entradas = 0, saidas = 0;
  items.forEach(l => {
    const v = Number(l.valor) || 0;
    const tipo = String(l.entradaSaida || '').trim().toLowerCase();
    if (tipo === 'saída' || tipo === 'saida') saidas += Math.abs(v);
    else entradas += v;
  });
  return { entradas, saidas, saldo: entradas - saidas };
}

async function showDashboard() {
  document.getElementById('pageTitle').textContent = 'Dashboard';
  const content = document.getElementById('pageContent');
  showSpinner('Carregando...');
  try {
    await loadLancamentos();
    const filtrados = filterLancamentos(lancamentos);
    const stats = calcularStats(filtrados);

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-wallet"></i></div>
          <div class="stat-label">Saldo Total</div>
          <div class="stat-value ${stats.saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(stats.saldo)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-arrow-up"></i></div>
          <div class="stat-label">Entradas</div>
          <div class="stat-value positive">${formatCurrency(stats.entradas)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
          <div class="stat-label">Saídas</div>
          <div class="stat-value negative">${formatCurrency(stats.saidas)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-exchange-alt"></i></div>
          <div class="stat-label">Transações</div>
          <div class="stat-value">${filtrados.length}</div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="btn btn-primary" id="dashNova"><i class="fas fa-plus"></i> Nova Transação</button>
        <button class="btn btn-success" id="dashImport"><i class="fas fa-file-import"></i> Importar</button>
      </div>

      <div class="filter-bar" id="dashFiltros">
        <div class="form-group">
          <label>Buscar</label>
          <input type="text" id="filtroDescricao" placeholder="Descrição..." value="${filtroAtivo.descricao || ''}" />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="filtroTipo">
            <option value="">Todos</option>
            <option value="entrada" ${filtroAtivo.tipo === 'entrada' ? 'selected' : ''}>Entradas</option>
            <option value="saida" ${filtroAtivo.tipo === 'saida' ? 'selected' : ''}>Saídas</option>
          </select>
        </div>
        <div class="form-group">
          <label>Data início</label>
          <input type="date" id="filtroDataInicio" value="${filtroAtivo.dataInicio || ''}" />
        </div>
        <div class="form-group">
          <label>Data fim</label>
          <input type="date" id="filtroDataFim" value="${filtroAtivo.dataFim || ''}" />
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
              ${filtrados.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Nenhum lançamento encontrado</td></tr>' : ''}
              ${filtrados.slice(0, 100).map(l => `
                <tr>
                  <td>${formatDate(l.data)}</td>
                  <td>${l.descricao || '-'}</td>
                  <td>${l.categoria || '-'}</td>
                  <td class="${Number(l.valor) < 0 ? 'negative' : 'positive'}">${formatCurrency(l.valor)}</td>
                  <td><span class="badge ${String(l.entradaSaida || '').trim().toLowerCase().includes('sa') ? 'saida' : 'entrada'}">${String(l.entradaSaida || '').trim().toLowerCase().includes('sa') ? 'Saída' : 'Entrada'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="editLancamento('${l.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteLancamento('${l.id}')" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${filtrados.length > 100 ? `<p style="text-align:center;color:var(--text-muted);margin-top:12px">Mostrando 100 de ${filtrados.length} registros</p>` : ''}
      </div>
    `;

    document.getElementById('dashNova')?.addEventListener('click', showFormModal);
    document.getElementById('dashImport')?.addEventListener('click', showImportSection);
    document.getElementById('btnFiltrar')?.addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimpar')?.addEventListener('click', limparFiltros);

    // Inline global for onclick
    window.editLancamento = showEditModal;
    window.deleteLancamento = deleteLancamento;

  } catch (err) {
    content.innerHTML = `<div class="error-page"><h1>Erro ao carregar dados</h1><p>${err.message}</p></div>`;
  } finally {
    hideSpinner();
  }
}

function aplicarFiltros() {
  filtroAtivo = {
    descricao: document.getElementById('filtroDescricao')?.value || '',
    tipo: document.getElementById('filtroTipo')?.value || '',
    dataInicio: document.getElementById('filtroDataInicio')?.value || '',
    dataFim: document.getElementById('filtroDataFim')?.value || '',
  };
  showDashboard();
}

function limparFiltros() {
  filtroAtivo = {};
  showDashboard();
}

async function showFormModal(editData = null) {
  const isEdit = !!editData;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="formModal">
      <div class="modal-content">
        <h2>${isEdit ? 'Editar' : 'Nova'} Transação</h2>
        <form id="lancamentoForm">
          <div class="form-group">
            <label for="formData">Data</label>
            <input type="date" id="formData" required value="${isEdit ? editData.data?.split('T')[0] : new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label for="formDescricao">Descrição</label>
            <input type="text" id="formDescricao" required placeholder="Ex: Salário mensal" value="${isEdit ? (editData.descricao || '') : ''}" />
          </div>
          <div class="form-group">
            <label for="formValor">Valor (R$)</label>
            <input type="number" id="formValor" step="0.01" required placeholder="0,00" value="${isEdit ? Math.abs(editData.valor) : ''}" />
          </div>
          <div class="form-group">
            <label for="formTipo">Tipo</label>
            <select id="formTipo">
              <option value="entrada" ${isEdit && !String(editData.entradaSaida || '').trim().toLowerCase().includes('sa') ? 'selected' : ''}>Entrada</option>
              <option value="saida" ${isEdit && String(editData.entradaSaida || '').trim().toLowerCase().includes('sa') ? 'selected' : ''}>Saída</option>
            </select>
          </div>
          <div class="form-group">
            <label for="formCategoria">Categoria</label>
            <select id="formCategoria">
              <option value="">Automática</option>
              ${['Alimentação','Transporte','Moradia','Saúde','Educação','Lazer','Vestuário','Serviços','Salário','Investimentos'].map(c =>
                `<option value="${c}" ${isEdit && editData.categoria === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" id="cancelForm">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.getElementById('cancelForm').addEventListener('click', closeFormModal);
  document.getElementById('formModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeFormModal();
  });

  document.getElementById('lancamentoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      data: document.getElementById('formData').value,
      descricao: document.getElementById('formDescricao').value,
      valor: document.getElementById('formTipo').value === 'saida'
        ? -Math.abs(Number(document.getElementById('formValor').value))
        : Math.abs(Number(document.getElementById('formValor').value)),
      entradaSaida: document.getElementById('formTipo').value === 'entrada' ? 'Entrada' : 'Saída',
      categoria: document.getElementById('formCategoria').value,
    };

    showSpinner(isEdit ? 'Salvando...' : 'Adicionando...');
    try {
      if (isEdit) {
        await apiPut(`/api/lancamento/${editData.id}`, data);
        showToast('Atualizado!', 'success');
      } else {
        await apiPost('/api/lancamento', data);
        showToast('Adicionado!', 'success');
      }
      closeFormModal();
      showDashboard();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar');
    } finally {
      hideSpinner();
    }
  });
}

function closeFormModal() {
  const modal = document.getElementById('formModal');
  if (modal) modal.remove();
}

function showEditModal(id) {
  const lanc = lancamentos.find(l => String(l.id) === String(id));
  if (lanc) showFormModal(lanc);
}

async function deleteLancamento(id) {
  if (!confirm('Excluir este lançamento?')) return;
  showSpinner('Excluindo...');
  try {
    await apiDelete(`/api/lancamento/${id}`);
    showToast('Excluído!', 'success');
    showDashboard();
  } catch (err) {
    showToast(err.message || 'Erro ao excluir');
  } finally {
    hideSpinner();
  }
}

function exportCSV() {
  if (!lancamentos.length) {
    showToast('Nenhum dado para exportar', 'warning');
    return;
  }
  const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria'];
  const rows = lancamentos.map(l => [
    formatDate(l.data),
    `"${(l.descricao || '').replace(/"/g, '""')}"`,
    String(Number(l.valor).toFixed(2).replace('.', ',')),
    l.entradaSaida || '',
    l.categoria || '',
  ]);
  const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado!', 'success');
}

function showImportSection() {
  document.getElementById('pageTitle').textContent = 'Importar';
  const content = document.getElementById('pageContent');
  content.innerHTML = `
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
  `;

  document.getElementById('importForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files[0]) { showToast('Selecione um arquivo', 'warning'); return; }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    showSpinner('Importando...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/importar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao importar');
      document.getElementById('importResult').innerHTML = `<p style="color:var(--success)"><i class="fas fa-check-circle"></i> ${result.message || 'Importado com sucesso!'} (${result.count || 0} registros)</p>`;
      showToast('Importado!', 'success');
      loadLancamentos();
    } catch (err) {
      showToast(err.message || 'Erro ao importar');
    } finally {
      hideSpinner();
    }
  });
}

function showExtrato() {
  navigate('/extrato');
}

function loadOfflineData() {
  try {
    const cached = localStorage.getItem('offline_lancamentos');
    if (cached && !lancamentos.length) {
      lancamentos = JSON.parse(cached);
    }
  } catch {}
}
