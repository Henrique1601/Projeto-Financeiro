import { apiGet, apiPost, apiPut, apiDelete, logout } from '../api.js';
import { showToast, showSpinner, hideSpinner, showDashboardSkeleton, emptyStateSVG } from '../utils/dom.js';
import { formatDate, formatCurrency, getMonthName, isSaida, getTipo } from '../utils/format.js';
import { navigate, getRouteParams } from '../router.js';
import { isAuthenticated, getProfile } from '../auth.js';
import { CATEGORIAS, API_BASE_URL } from '../config.js';
import { getThemes, getCurrentTheme, setTheme } from '../theme.js';
import Chart from '../chartSetup.js';

let lancamentos = [];
let filtroAtivo = {};
let chartInstances = {};
let sortColumn = 'data';
let sortDirection = 'desc';
let currentPage = 1;
let pageSize = 20;
let selectedIds = new Set();

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
          <button class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Fechar sidebar"><i class="fas fa-times"></i></button>
        </div>
        <nav class="sidebar-nav">
          <button class="nav-item active" data-page="dashboard">
            <i class="fas fa-chart-bar"></i> Dashboard
          </button>
          <button class="nav-item" data-page="extrato">
            <i class="fas fa-list"></i> Extrato
          </button>
          <button class="nav-item" data-page="perfil">
            <i class="fas fa-user"></i> Perfil
          </button>
          <button class="nav-item" data-page="recorrentes">
            <i class="fas fa-redo"></i> Recorrentes
          </button>
          <button class="nav-item" data-page="orcamentos">
            <i class="fas fa-chart-pie"></i> Orçamentos
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
          <div class="theme-switcher">
            <label for="themeSelect" class="theme-label"><i class="fas fa-palette"></i> Tema</label>
            <select id="themeSelect" class="theme-select">
              ${getThemes().map(t =>
                `<option value="${t.id}" ${getCurrentTheme() === t.id ? 'selected' : ''}>${t.label}</option>`
              ).join('')}
            </select>
          </div>
          <button class="btn btn-ghost btn-sm btn-full" id="btnChangePassword" style="margin-bottom:4px">
            <i class="fas fa-key"></i> Alterar Senha
          </button>
          <button class="btn btn-ghost btn-sm btn-full" id="btnLogout">
            <i class="fas fa-sign-out-alt"></i> Sair
          </button>
        </div>
      </aside>

      <main class="main-content" id="mainContent">
        <div class="top-bar">
          <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menu">
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

  window.addEventListener('offline', () => {
    document.getElementById('offlineIndicator').style.display = 'block';
  });
  window.addEventListener('online', () => {
    document.getElementById('offlineIndicator').style.display = 'none';
  });

  // Keyboard shortcut events
  window.addEventListener('app-shortcut', (e) => {
    if (e.detail === 'nova-transacao') showFormModal();
    if (e.detail === 'salvar') {
      const form = document.getElementById('lancamentoForm');
      if (form) form.requestSubmit();
    }
  });

  loadOfflineData();
}

function loadOfflineData() {
  try {
    const cached = localStorage.getItem('offline_lancamentos');
    if (cached && !lancamentos.length) {
      lancamentos = JSON.parse(cached);
    }
  } catch {}
}

function handleHashChange() {
  const hash = window.location.hash;
  if (hash === '' || hash === '#') {
    window.location.hash = '#/dashboard';
  } else if (hash.startsWith('#/extrato')) {
    navigate('/extrato');
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
      else if (page === 'perfil') navigate('/perfil');
      else if (page === 'recorrentes') navigate('/recorrentes');
      else if (page === 'orcamentos') { _scrollToOrcamentos = true; showDashboard(); }
      else if (page === 'nova-transacao') showFormModal();
      else if (page === 'importar') showImportSection();
    });
  });

  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.getElementById('sidebarCloseBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });

  document.getElementById('mainContent')?.addEventListener('click', (e) => {
    if (e.target.closest('#mobileMenuBtn') || e.target.closest('#sidebar')) return;
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
  });

  document.getElementById('themeSelect')?.addEventListener('change', (e) => {
    setTheme(e.target.value);
  });

  document.getElementById('btnChangePassword')?.addEventListener('click', () => {
    navigate('/alterar-senha');
  });

  document.getElementById('btnLogout').addEventListener('click', () => {
    logout();
  });
}

function registerTopBarHandlers() {
  document.getElementById('btnNovaTransacao').addEventListener('click', () => showFormModal());
  document.getElementById('btnExportCSV').addEventListener('click', showExportModal);
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
      if (filtroAtivo.tipo === 'entrada' && isSaida(l)) return false;
      if (filtroAtivo.tipo === 'saida' && !isSaida(l)) return false;
    }
    if (filtroAtivo.categoria && l.categoria !== filtroAtivo.categoria) return false;
    if (filtroAtivo.metodoPagamento && l.metodoPagamento !== filtroAtivo.metodoPagamento) return false;
    if (filtroAtivo.dataInicio && l.data && new Date(l.data) < new Date(filtroAtivo.dataInicio)) return false;
    if (filtroAtivo.dataFim && l.data && new Date(l.data) > new Date(filtroAtivo.dataFim)) return false;
    return true;
  });
}

function calcularStats(items) {
  let entradas = 0, saidas = 0;
  items.forEach(l => {
    const v = Number(l.valor) || 0;
    if (isSaida(l)) saidas += Math.abs(v);
    else entradas += v;
  });
  return { entradas, saidas, saldo: entradas - saidas };
}

let _scrollToOrcamentos = false;

async function showDashboard() {
  const params = getRouteParams();
  if (params.page) currentPage = parseInt(params.page) || 1;
  if (params.pageSize) pageSize = parseInt(params.pageSize) || 20;
  filtroAtivo = {
    descricao: params.descricao || '',
    tipo: params.tipo || '',
    categoria: params.categoria || '',
    metodoPagamento: params.metodoPagamento || '',
    dataInicio: params.dataInicio || '',
    dataFim: params.dataFim || '',
  };

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = 'Dashboard';
  const content = document.getElementById('pageContent');
  showDashboardSkeleton();
  try {
    await loadLancamentos();
    if (lancamentos.length === 0) {
      content.innerHTML = `<div class="page-enter"><div class="dashboard-empty">${emptyStateSVG('chart')}<h2 class="empty-state-title">Bem-vindo ao Gestor Financeiro</h2><p class="empty-state-subtitle">Adicione sua primeira transação para começar a acompanhar suas finanças</p><button class="btn btn-primary" id="emptyCtaBtn"><i class="fas fa-plus"></i> Nova Transação</button></div></div>`;
      document.getElementById('emptyCtaBtn').addEventListener('click', () => window.dispatchEvent(new CustomEvent('app-shortcut', { detail: 'nova-transacao' })));
      return;
    }
    const filtrados = filterLancamentos(lancamentos);
    const sorted = sortLancamentos(filtrados);
    const stats = calcularStats(filtrados);
    const totalPages = Math.ceil(sorted.length / pageSize);
    const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const categoriasUnicas = [...new Set(lancamentos.map(l => l.categoria).filter(Boolean))];
    const metodosPagamento = [...new Set(lancamentos.map(l => l.metodoPagamento).filter(Boolean))];
    const _scroll = _scrollToOrcamentos;
    _scrollToOrcamentos = false;

    content.innerHTML = `
      <div class="page-enter">
      <div class="stats-grid">
        <div class="stat-card item-enter" style="animation-delay:0ms">
          <div class="stat-icon neutral-bg"><i class="fas fa-wallet"></i></div>
          <div class="stat-label">Saldo Total</div>
          <div class="stat-value ${stats.saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(stats.saldo)}</div>
        </div>
        <div class="stat-card item-enter" style="animation-delay:80ms">
          <div class="stat-icon positive-bg"><i class="fas fa-arrow-up"></i></div>
          <div class="stat-label">Entradas</div>
          <div class="stat-value positive">${formatCurrency(stats.entradas)}</div>
        </div>
        <div class="stat-card item-enter" style="animation-delay:160ms">
          <div class="stat-icon negative-bg"><i class="fas fa-arrow-down"></i></div>
          <div class="stat-label">Saídas</div>
          <div class="stat-value negative">${formatCurrency(stats.saidas)}</div>
        </div>
        <div class="stat-card item-enter" style="animation-delay:240ms">
          <div class="stat-icon neutral-bg"><i class="fas fa-exchange-alt"></i></div>
          <div class="stat-label">Transações</div>
          <div class="stat-value">${filtrados.length}</div>
        </div>
      </div>

      <div class="dashboard-charts" id="dashCharts" style="${filtrados.length === 0 ? 'display:none' : ''}">
        <div class="chart-card item-enter" style="animation-delay:50ms">
          <h3><i class="fas fa-chart-line"></i> Evolução Mensal</h3>
          <canvas id="chartEvolucaoDash" class="skeleton skeleton-chart"></canvas>
        </div>
        <div class="chart-card item-enter" style="animation-delay:100ms">
          <h3><i class="fas fa-chart-pie"></i> Categorias</h3>
          <canvas id="chartCategoriasDash" class="skeleton skeleton-chart"></canvas>
        </div>
      </div>

      <div class="insights-grid" id="dashInsights" style="${filtrados.length === 0 ? 'display:none' : ''}">
        <div class="insight-card item-enter" style="animation-delay:50ms">
          <div class="insight-header"><i class="fas fa-calendar-compare"></i> Comparativo Mensal</div>
          <div class="insight-body" id="comparativoBody">Carregando...</div>
        </div>
        <div class="insight-card item-enter" style="animation-delay:100ms">
          <div class="insight-header"><i class="fas fa-piggy-bank"></i> Meta de Economia</div>
          <div class="insight-body" id="metaBody">
            <div class="meta-input-row">
              <input type="number" id="metaValor" placeholder="Meta mensal (R$)" step="0.01" min="0" />
              <button class="btn btn-primary btn-sm" id="btnDefinirMeta"><i class="fas fa-check"></i></button>
            </div>
            <div id="metaProgressContainer" style="display:none">
              <div class="meta-status"><span class="meta-label" id="metaLabel">Economizado: R$0,00 de R$0,00</span></div>
              <div class="progress-bar"><div class="progress-fill" id="metaProgressFill" style="width:0%"></div></div>
            </div>
          </div>
        </div>
        <div class="insight-card item-enter" style="animation-delay:150ms">
          <div class="insight-header"><i class="fas fa-chart-simple"></i> Projeção de Saldo</div>
          <div class="insight-body" id="projecaoBody">Carregando...</div>
        </div>
      </div>

      <div class="card" id="orcamentosSection">
        <details class="orcamentos-details" ${_scrollToOrcamentos ? 'open' : ''}>
          <summary class="orcamentos-summary"><i class="fas fa-chart-pie"></i> Orçamentos do Mês</summary>
          <div class="orcamentos-body">
            <div class="orcamento-form-row">
              <select id="orcCategoria" class="form-input" style="flex:1">
                <option value="">Selecione a categoria</option>
                ${categoriasUnicas.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
              <input type="number" id="orcLimite" class="form-input" placeholder="Limite (R$)" step="0.01" min="0" style="width:150px" />
              <button class="btn btn-primary btn-sm" id="btnAddOrcamento"><i class="fas fa-plus"></i> Adicionar</button>
            </div>
            <div id="orcamentosList"></div>
          </div>
        </details>
      </div>

      <div class="filter-bar" id="dashFiltros">
        <div class="filter-fields">
          <div class="form-group">
            <label for="filtroDescricao">Buscar</label>
            <input type="text" id="filtroDescricao" placeholder="Descrição…" value="${filtroAtivo.descricao || ''}" />
          </div>
          <div class="form-group">
            <label for="filtroTipo">Tipo</label>
            <select id="filtroTipo">
              <option value="">Todos</option>
              <option value="entrada" ${filtroAtivo.tipo === 'entrada' ? 'selected' : ''}>Entradas</option>
              <option value="saida" ${filtroAtivo.tipo === 'saida' ? 'selected' : ''}>Saídas</option>
            </select>
          </div>
          <div class="form-group">
            <label for="filtroCategoria">Categoria</label>
            <select id="filtroCategoria">
              <option value="">Todas</option>
              ${categoriasUnicas.map(c => `<option value="${c}" ${filtroAtivo.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          ${metodosPagamento.length ? `
          <div class="form-group">
            <label for="filtroPagamento">Pagamento</label>
            <select id="filtroPagamento">
              <option value="">Todos</option>
              ${metodosPagamento.map(m => `<option value="${m}" ${filtroAtivo.metodoPagamento === m ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>
          ` : ''}
          <div class="form-group">
            <label for="filtroDataInicio">Data início</label>
            <input type="date" id="filtroDataInicio" value="${filtroAtivo.dataInicio || ''}" />
          </div>
          <div class="form-group">
            <label for="filtroDataFim">Data fim</label>
            <input type="date" id="filtroDataFim" value="${filtroAtivo.dataFim || ''}" />
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" id="dashNova" title="Ctrl+N"><i class="fas fa-plus"></i> Nova</button>
          <button class="btn btn-success" id="dashImport"><i class="fas fa-file-import"></i> Importar</button>
          <button class="btn btn-primary" id="btnFiltrar"><i class="fas fa-search"></i> Filtrar</button>
          <button class="btn btn-ghost" id="btnLimpar"><i class="fas fa-times"></i> Limpar</button>
          <button class="btn btn-danger btn-sm" id="bulkDeleteBtn" style="display:none">
            <i class="fas fa-trash"></i> Excluir Selecionados (<span id="bulkCount">0</span>)
          </button>
        </div>
      </div>

      <div class="card">
        <div style="margin-bottom:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <label class="checkbox-label" style="font-size:0.85rem">
            <input type="checkbox" id="selectAll" ${paginated.length > 0 && selectedIds.size === paginated.length ? 'checked' : ''} />
            Selecionar todos (${sorted.length} registros)
          </label>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style="width:40px"></th>
                <th class="sortable" data-col="data">Data ${sortColumn === 'data' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th class="sortable" data-col="descricao">Descrição ${sortColumn === 'descricao' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th class="sortable" data-col="categoria">Categoria ${sortColumn === 'categoria' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th class="sortable" data-col="valor">Valor ${sortColumn === 'valor' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th class="sortable" data-col="entradaSaida">Tipo ${sortColumn === 'entradaSaida' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="dashTableBody">
              ${paginated.length === 0 ? '<tr><td colspan="7"><div class="empty-state" style="animation:none"><div class="empty-state-illustration">' + emptyStateSVG('search') + '</div><h3 class="empty-state-title">Nenhum lançamento</h3><p class="empty-state-subtitle">Tente ajustar os filtros ou crie uma nova transação</p></div></td></tr>' : ''}
              ${paginated.map((l, i) => `
                <tr class="item-enter ${selectedIds.has(l.id) ? 'selected-row ' : ''}${isSaida(l) ? 'row-saida' : 'row-entrada'}" style="animation-delay:${i * 40}ms">
                  <td><input type="checkbox" class="select-item" data-id="${l.id}" ${selectedIds.has(l.id) ? 'checked' : ''} /></td>
                  <td>${formatDate(l.data)}</td>
                  <td>${l.descricao || '-'}</td>
                  <td>${l.categoria || '-'}</td>
                  <td class="${Number(l.valor) < 0 ? 'negative' : 'positive'}">${formatCurrency(l.valor)}</td>
                  <td><span class="badge ${isSaida(l) ? 'saida' : 'entrada'}">${isSaida(l) ? 'Saída' : 'Entrada'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${l.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-ghost btn-sm" data-action="duplicate" data-id="${l.id}" title="Duplicar"><i class="fas fa-copy"></i></button>
                    <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${l.id}" style="color:var(--danger)" title="Excluir"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${sorted.length > pageSize ? `
        <div class="pagination">
          <button class="btn btn-ghost btn-sm" id="prevPage" ${currentPage <= 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Anterior
          </button>
          <span class="page-info">Página ${currentPage} de ${totalPages} (${sorted.length} registros)</span>
          <button class="btn btn-ghost btn-sm" id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>
            Próximo <i class="fas fa-chevron-right"></i>
          </button>
          <select id="pageSizeSelect" class="page-size-select">
            <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
            <option value="20" ${pageSize === 20 ? 'selected' : ''}>20</option>
            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
          </select>
        </div>
        ` : ''}
      </div>
      </div>
    `;

    document.getElementById('dashNova')?.addEventListener('click', () => showFormModal());
    document.getElementById('dashImport')?.addEventListener('click', showImportSection);
    document.getElementById('btnFiltrar')?.addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimpar')?.addEventListener('click', limparFiltros);
    document.getElementById('selectAll')?.addEventListener('change', toggleSelectAll);
    document.querySelectorAll('.select-item').forEach(el => el.addEventListener('change', toggleSelect));
    document.getElementById('bulkDeleteBtn')?.addEventListener('click', deleteSelected);
    document.querySelectorAll('.sortable').forEach(el => el.addEventListener('click', () => {
      const col = el.dataset.col;
      if (sortColumn === col) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      else { sortColumn = col; sortDirection = col === 'data' ? 'desc' : 'asc'; }
      currentPage = 1;
      showDashboard();
    }));
    document.getElementById('prevPage')?.addEventListener('click', () => {
      if (currentPage <= 1) return;
      const p = new URLSearchParams(window.location.hash.split('?')[1] || '');
      p.set('page', String(currentPage - 1));
      navigate(`/dashboard?${p.toString()}`);
    });
    document.getElementById('nextPage')?.addEventListener('click', () => {
      if (currentPage >= totalPages) return;
      const p = new URLSearchParams(window.location.hash.split('?')[1] || '');
      p.set('page', String(currentPage + 1));
      navigate(`/dashboard?${p.toString()}`);
    });
    document.getElementById('pageSizeSelect')?.addEventListener('change', (e) => {
      const p = new URLSearchParams(window.location.hash.split('?')[1] || '');
      p.set('pageSize', e.target.value);
      p.delete('page');
      navigate(`/dashboard?${p.toString()}`);
    });

    document.getElementById('dashTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') showEditModal(id);
      else if (action === 'duplicate') duplicarLancamento(id);
      else if (action === 'delete') deleteLancamento(id);
    });

    if (filtrados.length > 0) {
      initDashboardCharts(filtrados);
      atualizarComparativo(filtrados);
      atualizarMeta();
      atualizarProjecao(filtrados);
      document.getElementById('btnDefinirMeta')?.addEventListener('click', definirMeta);
    }

    document.getElementById('btnAddOrcamento')?.addEventListener('click', addOrcamento);
    if (_scroll) {
      setTimeout(() => document.getElementById('orcamentosSection')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    await carregarOrcamentos();

  } catch (err) {
    content.innerHTML = `<div class="error-page"><h1>Erro ao carregar dados</h1><p>${err.message}</p></div>`;
  } finally {
    hideSpinner();
  }
}

function sortLancamentos(items) {
  return [...items].sort((a, b) => {
    let va = a[sortColumn], vb = b[sortColumn];
    if (sortColumn === 'data') { va = new Date(va || 0); vb = new Date(vb || 0); }
    else if (sortColumn === 'valor') { va = Number(va) || 0; vb = Number(vb) || 0; }
    else { va = String(va || '').toLowerCase(); vb = String(vb || '').toLowerCase(); }
    if (va < vb) return sortDirection === 'asc' ? -1 : 1;
    if (va > vb) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

function toggleSelectAll(e) {
  const checked = e.target.checked;
  if (checked) {
    const filtrados = filterLancamentos(lancamentos);
    const sorted = sortLancamentos(filtrados);
    sorted.forEach(l => selectedIds.add(l.id));
  } else {
    selectedIds.clear();
  }
  document.getElementById('bulkDeleteBtn').style.display = selectedIds.size ? '' : 'none';
  document.getElementById('bulkCount').textContent = selectedIds.size;
  document.querySelectorAll('.select-item').forEach(el => el.checked = checked);
  document.querySelectorAll('.select-item').forEach(el => {
    el.closest('tr').classList.toggle('selected-row', checked);
  });
}

function toggleSelect(e) {
  const id = parseInt(e.target.dataset.id);
  if (e.target.checked) selectedIds.add(id);
  else selectedIds.delete(id);
  e.target.closest('tr').classList.toggle('selected-row', e.target.checked);
  document.getElementById('bulkDeleteBtn').style.display = selectedIds.size ? '' : 'none';
  document.getElementById('bulkCount').textContent = selectedIds.size;
  const allChecked = document.querySelectorAll('.select-item:checked').length === document.querySelectorAll('.select-item').length;
  document.getElementById('selectAll').checked = allChecked;
}

async function deleteSelected() {
  const ids = [...selectedIds];
  if (!ids.length) return;
  if (!confirm(`Excluir ${ids.length} lançamento(s)?`)) return;
  showSpinner('Excluindo…');
  try {
    for (const id of ids) {
      await apiDelete(`/api/deletar?id=${id}`);
    }
    selectedIds.clear();
    currentPage = 1;
    showToast(`${ids.length} excluído(s)!`, 'success');
    showDashboard();
  } catch (err) {
    showToast(err.message || 'Erro ao excluir');
  } finally {
    hideSpinner();
  }
}

function duplicarLancamento(id) {
  const lanc = lancamentos.find(l => String(l.id) === String(id));
  if (!lanc) { showToast('Lançamento não encontrado'); return; }
  showFormModal({
    ...lanc,
    id: null,
    data: new Date().toISOString().split('T')[0],
    descricao: lanc.descricao ? `${lanc.descricao} (cópia)` : '',
  });
}

function aplicarFiltros() {
  const params = new URLSearchParams();
  const d = document.getElementById('filtroDescricao')?.value;
  if (d) params.set('descricao', d);
  const t = document.getElementById('filtroTipo')?.value;
  if (t) params.set('tipo', t);
  const c = document.getElementById('filtroCategoria')?.value;
  if (c) params.set('categoria', c);
  const p = document.getElementById('filtroPagamento')?.value;
  if (p) params.set('metodoPagamento', p);
  const di = document.getElementById('filtroDataInicio')?.value;
  if (di) params.set('dataInicio', di);
  const df = document.getElementById('filtroDataFim')?.value;
  if (df) params.set('dataFim', df);
  selectedIds.clear();
  navigate(`/dashboard?${params.toString()}`);
}

function limparFiltros() {
  selectedIds.clear();
  navigate('/dashboard');
}

function destroyCharts() {
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} });
  chartInstances = {};
}

function gerarCores(count) {
  const palette = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16'];
  return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}

function initDashboardCharts(dados) {
  destroyCharts();

  const evCanvas = document.getElementById('chartEvolucaoDash');
  const catCanvas = document.getElementById('chartCategoriasDash');
  if (!evCanvas || !catCanvas) return;

  document.getElementById('dashCharts').style.display = ''; // hide was inline

  // Evolution chart
  const meses = {};
  dados.forEach(l => {
    if (!l.data) return;
    const d = new Date(l.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!meses[key]) meses[key] = { entradas: 0, saidas: 0 };
    const v = Number(l.valor) || 0;
    if (isSaida(l)) meses[key].saidas += Math.abs(v);
    else meses[key].entradas += v;
  });
  const keys = Object.keys(meses).sort();
  evCanvas.classList.remove('skeleton', 'skeleton-chart');
  if (keys.length) {
    chartInstances.evolucao = new Chart(evCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: keys,
        datasets: [
          { label: 'Entradas', data: keys.map(k => meses[k].entradas), backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 3 },
          { label: 'Saídas', data: keys.map(k => meses[k].saidas), backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12 } } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) } } },
      },
    });
  }

  // Category chart (doughnut)
  const categorias = {};
  dados.forEach(l => {
    const cat = l.categoria || 'Sem categoria';
    const v = Math.abs(Number(l.valor) || 0);
    categorias[cat] = (categorias[cat] || 0) + v;
  });
  const catLabels = Object.keys(categorias);
  const catValues = Object.values(categorias);
  catCanvas.classList.remove('skeleton', 'skeleton-chart');
  if (catLabels.length) {
    chartInstances.categorias = new Chart(catCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{ data: catValues, backgroundColor: gerarCores(catLabels.length), borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } },
        },
      },
    });
  }
}

function atualizarComparativo(dados) {
  const now = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();
  const mesPassado = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoPassado = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  function sumMonth(data, mes, ano) {
    let e = 0, s = 0;
    data.forEach(l => {
      if (!l.data) return;
      const d = new Date(l.data);
      if (d.getMonth() === mes && d.getFullYear() === ano) {
        const v = Number(l.valor) || 0;
        if (isSaida(l)) s += Math.abs(v);
        else e += v;
      }
    });
    return { entradas: e, saidas: s, saldo: e - s };
  }

  const atual = sumMonth(dados, mesAtual, anoAtual);
  const passado = sumMonth(dados, mesPassado, anoPassado);
  const diffSaldo = atual.saldo - passado.saldo;
  const diffPct = passado.saldo !== 0 ? ((diffSaldo / Math.abs(passado.saldo)) * 100).toFixed(1) : '∞';

  document.getElementById('comparativoBody').innerHTML = `
    <div class="comp-grid">
      <div class="comp-item">
        <span class="comp-label">Mês Atual (${getMonthName(mesAtual)})</span>
        <span class="comp-value ${atual.saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(atual.saldo)}</span>
        <span class="comp-detail">E: ${formatCurrency(atual.entradas)} / S: ${formatCurrency(atual.saidas)}</span>
      </div>
      <div class="comp-item">
        <span class="comp-label">Mês Anterior (${getMonthName(mesPassado)})</span>
        <span class="comp-value ${passado.saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(passado.saldo)}</span>
        <span class="comp-detail">E: ${formatCurrency(passado.entradas)} / S: ${formatCurrency(passado.saidas)}</span>
      </div>
      <div class="comp-item comp-diff">
        <span class="comp-label">Diferença</span>
        <span class="comp-value ${diffSaldo >= 0 ? 'positive' : 'negative'}">${diffSaldo >= 0 ? '+' : ''}${formatCurrency(diffSaldo)}</span>
        <span class="comp-detail">${diffPct}% em relação ao mês anterior</span>
      </div>
    </div>
  `;
}

function definirMeta() {
  const valor = parseFloat(document.getElementById('metaValor')?.value);
  if (!valor || valor <= 0) { showToast('Digite um valor válido', 'warning'); return; }
  localStorage.setItem('savingsGoal', valor);
  showToast('Meta definida!', 'success');
  atualizarMeta();
  document.getElementById('metaValor').value = '';
}

function atualizarMeta() {
  const goal = parseFloat(localStorage.getItem('savingsGoal')) || 0;
  const container = document.getElementById('metaProgressContainer');
  const inputRow = document.querySelector('.meta-input-row');

  if (!goal) {
    if (inputRow) inputRow.style.display = '';
    if (container) container.style.display = 'none';
    return;
  }

  if (inputRow) inputRow.style.display = 'none';
  if (!container) return;

  const now = new Date();
  let economizado = 0;
  lancamentos.forEach(l => {
    if (!l.data) return;
    const d = new Date(l.data);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const v = Number(l.valor) || 0;
      if (!isSaida(l)) economizado += v;
    }
  });

  const pct = Math.min(100, Math.max(0, (economizado / goal) * 100));
  container.style.display = 'block';
  document.getElementById('metaLabel').textContent = `Economizado: ${formatCurrency(economizado)} de ${formatCurrency(goal)}`;
  document.getElementById('metaProgressFill').style.width = pct + '%';
  if (pct >= 100) document.getElementById('metaProgressFill').style.background = 'var(--success)';
  else document.getElementById('metaProgressFill').style.background = 'var(--primary)';
}

function atualizarProjecao(dados) {
  const body = document.getElementById('projecaoBody');
  if (!dados.length) { body.innerHTML = '<span style="color:var(--text-muted)">Sem dados para projeção</span>'; return; }

  const hoje = new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diaAtual = hoje.getDate();
  const diasRestantes = diasNoMes - diaAtual;

  let saldoAtual = 0;
  let receitaMediaDia = 0;
  let despesaMediaDia = 0;
  let diasComDado = 0;

  dados.forEach(l => {
    if (!l.data) return;
    const d = new Date(l.data);
    if (d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) {
      const v = Number(l.valor) || 0;
      if (isSaida(l)) saldoAtual -= Math.abs(v);
      else saldoAtual += v;
      diasComDado++;
    }
  });

  if (diasComDado > 0) {
    const entradas = dados.filter(l => l.data && !isSaida(l));
    const saidas = dados.filter(l => l.data && isSaida(l));
    const totalEntradas = entradas.reduce((s, l) => s + Math.abs(Number(l.valor) || 0), 0);
    const totalSaidas = saidas.reduce((s, l) => s + Math.abs(Number(l.valor) || 0), 0);
    receitaMediaDia = totalEntradas / diasComDado;
    despesaMediaDia = totalSaidas / diasComDado;
  }

  const projecao = saldoAtual + (receitaMediaDia - despesaMediaDia) * diasRestantes;

  body.innerHTML = `
    <div class="proj-grid">
      <div class="proj-item">
        <span class="comp-label">Saldo Atual (mês)</span>
        <span class="comp-value ${saldoAtual >= 0 ? 'positive' : 'negative'}">${formatCurrency(saldoAtual)}</span>
      </div>
      <div class="proj-item">
        <span class="comp-label">Projeção Final do Mês</span>
        <span class="comp-value ${projecao >= 0 ? 'positive' : 'negative'}" style="font-size:1.2rem">${formatCurrency(projecao)}</span>
        <span class="comp-detail">${diasRestantes} dias restantes · Média dia: ${formatCurrency(receitaMediaDia - despesaMediaDia)}/dia</span>
      </div>
    </div>
  `;
}

async function showFormModal(editData = null) {
  const isEdit = !!editData && !!editData.id;
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
              <option value="entrada" ${isEdit && !isSaida(editData) ? 'selected' : ''}>Entrada</option>
              <option value="saida" ${isEdit && isSaida(editData) ? 'selected' : ''}>Saída</option>
            </select>
          </div>
          <div class="form-group">
            <label for="formCategoria">Categoria</label>
            <select id="formCategoria">
              <option value="">Automática</option>
              ${CATEGORIAS.map(c =>
                `<option value="${c}" ${isEdit && editData.categoria === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="formPagamento">Método de Pagamento</label>
            <select id="formPagamento">
              <option value="">Selecione</option>
              <option value="Dinheiro" ${isEdit && editData.metodoPagamento === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
              <option value="PIX" ${isEdit && editData.metodoPagamento === 'PIX' ? 'selected' : ''}>PIX</option>
              <option value="Débito" ${isEdit && editData.metodoPagamento === 'Débito' ? 'selected' : ''}>Débito</option>
              <option value="Crédito" ${isEdit && editData.metodoPagamento === 'Crédito' ? 'selected' : ''}>Crédito</option>
              <option value="Boleto" ${isEdit && editData.metodoPagamento === 'Boleto' ? 'selected' : ''}>Boleto</option>
              <option value="Transferência" ${isEdit && editData.metodoPagamento === 'Transferência' ? 'selected' : ''}>Transferência</option>
            </select>
          </div>
          <div class="form-group">
            <label for="formObservacoes">Observações</label>
            <textarea id="formObservacoes" rows="2" placeholder="Observações opcionais…">${isEdit ? (editData.observacoes || '') : ''}</textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="formRepetir" ${isEdit ? 'disabled' : ''}>
              <span>Repetir</span>
            </label>
          </div>
          <div id="recorrenteFields" class="recorrente-fields" style="display:none">
            <div class="form-row">
              <div class="form-group">
                <label for="formFrequencia">Frequência</label>
                <select id="formFrequencia">
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal" selected>Mensal</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div class="form-group">
                <label for="formProximaData">Próxima ocorrência</label>
                <input type="date" id="formProximaData">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="formDataFim">Data fim <span class="field-note">(opcional)</span></label>
                <input type="date" id="formDataFim">
              </div>
              <div class="form-group">
                <label for="formMaxOcorrencias">Máx. ocorrências <span class="field-note">(opcional)</span></label>
                <input type="number" id="formMaxOcorrencias" min="1" placeholder="Ex: 12">
              </div>
            </div>
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

  document.getElementById('formRepetir').addEventListener('change', (e) => {
    document.getElementById('recorrenteFields').style.display = e.target.checked ? 'block' : 'none';
    if (e.target.checked && !document.getElementById('formProximaData').value) {
      document.getElementById('formProximaData').value = document.getElementById('formData').value || new Date().toISOString().split('T')[0];
    }
  });

  document.getElementById('lancamentoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pagamento = document.getElementById('formPagamento')?.value || '';
    const observacoes = document.getElementById('formObservacoes')?.value || '';
    const rawValor = Number(document.getElementById('formValor').value);
    const formTipo = document.getElementById('formTipo').value;
    const isSaidaFinal = formTipo === 'saida' || rawValor < 0;
    const data = {
      data: document.getElementById('formData').value,
      descricao: document.getElementById('formDescricao').value,
      valor: isSaidaFinal ? -Math.abs(rawValor) : Math.abs(rawValor),
      entradaSaida: isSaidaFinal ? 'Saída' : 'Entrada',
      categoria: document.getElementById('formCategoria').value,
      ...(pagamento ? { metodoPagamento: pagamento } : {}),
      ...(observacoes ? { observacoes } : {}),
    };

    const repetir = document.getElementById('formRepetir').checked;
    if (repetir) {
      data.frequencia = document.getElementById('formFrequencia').value;
      data.proxima_data = document.getElementById('formProximaData').value;
      data.data_fim = document.getElementById('formDataFim').value || null;
      data.max_ocorrencias = document.getElementById('formMaxOcorrencias').value || null;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    showSpinner(isEdit ? 'Salvando…' : 'Adicionando…');
    try {
      if (isEdit) {
        if (!editData.id) throw new Error('ID do lançamento não encontrado');
        await apiPut(`/api/editar`, { updates: [{ id: editData.id, ...data }] });
        showToast('Atualizado!', 'success');
      } else {
        await apiPost('/api/salvar', data);
        if (repetir) {
          await apiPost('/api/recorrentes', data);
        }
        showToast('Adicionado!', 'success');
      }
      closeFormModal();
      showDashboard();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar');
    } finally {
      hideSpinner();
      if (submitBtn) submitBtn.disabled = false;
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
  else showToast('Lançamento não encontrado na lista local');
}

async function deleteLancamento(id) {
  if (!id || id === 'undefined') {
    showToast('ID inválido');
    return;
  }
  if (!confirm('Excluir este lançamento?')) return;
  showSpinner('Excluindo…');
  try {
    await apiDelete(`/api/deletar?id=${parseInt(id)}`);
    showToast('Excluído!', 'success');
    showDashboard();
  } catch (err) {
    showToast(err.message || 'Erro ao excluir');
  } finally {
    hideSpinner();
  }
}

function showExportModal() {
  if (!lancamentos.length) { showToast('Nenhum dado para exportar', 'warning'); return; }

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="exportModal">
      <div class="modal-content">
        <h2><i class="fas fa-download"></i> Exportar Dados</h2>
        <form id="exportForm">
          <div class="form-group">
            <label>Formato</label>
            <select id="exportFormato">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="email">Email (.xlsx)</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Data início</label>
              <input type="date" id="exportDataInicio" />
            </div>
            <div class="form-group">
              <label>Data fim</label>
              <input type="date" id="exportDataFim" />
            </div>
          </div>
          <div class="form-group" style="margin-top:8px">
            <label class="checkbox-label">
              <input type="checkbox" id="exportFiltros" checked />
              Usar filtros atuais
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="exportIncluirGraficos" />
              Incluir gráficos no PDF
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" id="cancelExport">Cancelar</button>
            <button type="submit" class="btn btn-primary"><i class="fas fa-download"></i> Exportar</button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.getElementById('cancelExport').addEventListener('click', () => document.getElementById('exportModal').remove());
  document.getElementById('exportModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('exportModal').remove();
  });

  document.getElementById('exportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    const formato = document.getElementById('exportFormato').value;
    const dataInicio = document.getElementById('exportDataInicio').value;
    const dataFim = document.getElementById('exportDataFim').value;
    const usarFiltros = document.getElementById('exportFiltros').checked;
    const incluirGraficos = document.getElementById('exportIncluirGraficos').checked;

    let dados = lancamentos;
    if (usarFiltros && filtroAtivo.descricao) {
      dados = dados.filter(l => (l.descricao || '').toLowerCase().includes(filtroAtivo.descricao.toLowerCase()));
    }
    if (usarFiltros && filtroAtivo.tipo) {
      dados = dados.filter(l => {
        if (filtroAtivo.tipo === 'entrada') return !isSaida(l);
        return isSaida(l);
      });
    }
    if (dataInicio) dados = dados.filter(l => l.data && l.data.split('T')[0] >= dataInicio);
    if (dataFim) dados = dados.filter(l => l.data && l.data.split('T')[0] <= dataFim);

    if (!dados.length) {
      showToast('Nenhum dado no período selecionado', 'warning');
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    document.getElementById('exportModal').remove();

    try {
      if (formato === 'csv') exportCSV(dados);
      else if (formato === 'json') exportJSON(dados);
      else if (formato === 'xlsx') await exportXLSX(dados);
      else if (formato === 'email') await exportEmail(dados, dataInicio, dataFim);
      else exportPDF(dados, incluirGraficos);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function exportCSV(dados) {
  const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria'];
  const rows = dados.map(l => [
    formatDate(l.data),
    `"${(l.descricao || '').replace(/"/g, '""')}"`,
    String(Number(l.valor).toFixed(2).replace('.', ',')),
    getTipo(l),
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

function exportJSON(dados) {
  const json = JSON.stringify(dados.map(l => ({
    data: l.data?.split('T')[0] || '',
    descricao: l.descricao || '',
    valor: Number(l.valor || 0),
    tipo: getTipo(l),
    categoria: l.categoria || '',
    metodoPagamento: l.metodoPagamento || '',
  })), null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeiro_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON exportado!', 'success');
}

async function exportXLSX(dados) {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/exportar/xlsx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ lancamentos: dados })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Excel exportado!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function exportEmail(dados, dataInicio, dataFim) {
  const periodoLabel = dataInicio && dataFim ? `${dataInicio} a ${dataFim}` : 'completo';
  showSpinner('Enviando email…');
  try {
    const resp = await fetch(`${API_BASE_URL}/api/exportar/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ lancamentos: dados, periodoLabel })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const result = await resp.json();
    if (result.error) throw new Error(result.error);
    showToast('Relatório enviado por email!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}

function exportPDF(dados, incluirGraficos) {
  const win = window.open('', '_blank');
  if (!win) { showToast('Popup bloqueado. Permita popups para exportar PDF.', 'warning'); return; }
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366f1';

  let chartImages = '';
  if (incluirGraficos) {
    const evCanvas = document.getElementById('chartEvolucaoDash');
    const catCanvas = document.getElementById('chartCategoriasDash');
    if (evCanvas) chartImages += `<img src="${evCanvas.toDataURL()}" style="width:100%;max-width:600px;margin:16px 0" />`;
    if (catCanvas) chartImages += `<img src="${catCanvas.toDataURL()}" style="width:100%;max-width:600px;margin:16px 0" />`;
  }

  const total = dados.reduce((s, l) => s + Number(l.valor || 0), 0);
  const entradas = dados.filter(l => !isSaida(l)).reduce((s, l) => s + Number(l.valor || 0), 0);
  const saidasValor = dados.filter(l => isSaida(l)).reduce((s, l) => s + Math.abs(Number(l.valor || 0)), 0);

  win.document.write(`
    <html><head>
      <title>Relatório Financeiro</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; }
        .summary { display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap; }
        .summary-box { padding: 16px 24px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .summary-box .label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; }
        .summary-box .value { font-size: 1.5rem; font-weight: 700; }
        .positive { color: #059669; } .negative { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 0.8rem; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 0.8rem; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .graficos-section { margin-top: 32px; text-align: center; }
        @media print { body { padding: 0; } .no-print { display: none; } }
      </style>
    </head><body>
      <h1>Relatório Financeiro</h1>
      <p style="color:#64748b">Período: ${dados.length} registros · Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
      <div class="summary">
        <div class="summary-box"><div class="label">Saldo Total</div><div class="value ${total >= 0 ? 'positive' : 'negative'}">R$${total.toFixed(2)}</div></div>
        <div class="summary-box"><div class="label">Entradas</div><div class="value positive">R$${entradas.toFixed(2)}</div></div>
        <div class="summary-box"><div class="label">Saídas</div><div class="value negative">R$${saidasValor.toFixed(2)}</div></div>
      </div>
      <table>
        <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Tipo</th><th>Categoria</th></tr></thead>
        <tbody>
          ${dados.map(l => `
            <tr>
              <td>${formatDate(l.data)}</td>
              <td>${l.descricao || '-'}</td>
              <td class="${Number(l.valor) < 0 ? 'negative' : 'positive'}">R$${Number(l.valor).toFixed(2)}</td>
              <td>${isSaida(l) ? 'Saída' : 'Entrada'}</td>
              <td>${l.categoria || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${chartImages ? `<div class="graficos-section"><h2>Gráficos</h2>${chartImages}</div>` : ''}
      <div class="footer">Gestor Financeiro · Relatório gerado automaticamente</div>
      <div class="no-print" style="text-align:center;margin-top:24px">
        <button onclick="window.print()" style="padding:12px 32px;background:${primaryColor};color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem">
          Salvar como PDF
        </button>
        <p style="color:#94a3b8;margin-top:8px;font-size:0.85rem">Clique no botão e selecione "Salvar como PDF"</p>
      </div>
    </body></html>
  `);
  win.document.close();
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
      <div id="importResult" style="margin-top:16px" aria-live="polite"></div>
    </div>
  `;

  document.getElementById('importForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files[0]) { showToast('Selecione um arquivo', 'warning'); return; }
    const file = fileInput.files[0];
    const ext = file.name.split('.').pop().toLowerCase();
    const fileType = ext === 'ofx' ? 'ofx' : ext === 'csv' ? 'csv' : null;
    if (!fileType) { showToast('Formato não suportado. Use OFX ou CSV.', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const submitBtn = document.querySelector('#importForm button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      showSpinner('Importando…');
      try {
        const result = await apiPost('/api/importar/auto', { fileType, content: reader.result });
        const total = (result.insertedIds?.length || 0) + (result.updatedIds?.length || 0);
        let html = `<p style="color:var(--success)"><i class="fas fa-check-circle"></i> ${result.message || 'Importado com sucesso!'} (${total} registros)</p>`;
        if (result.debug?.sample?.length) {
          html += '<details style="margin-top:12px;font-size:12px;color:var(--text-secondary)"><summary>Amostra dos dados</summary><pre style="background:var(--surface-secondary);padding:8px;border-radius:4px;overflow-x:auto;white-space:pre">' + JSON.stringify(result.debug.sample, null, 2) + '</pre></details>';
        }
        document.getElementById('importResult').innerHTML = html;
        showToast(`${total} registro(s) importado(s)!`, 'success');
        await loadLancamentos();
        showDashboard();
      } catch (err) {
        showToast(err.message || 'Erro ao importar');
      } finally {
        hideSpinner();
        if (submitBtn) submitBtn.disabled = false;
      }
    };
    reader.readAsText(file);
  });
}

async function carregarOrcamentos() {
  const container = document.getElementById('orcamentosList');
  if (!container) return;
  try {
    const orcamentos = await apiGet('/api/orcamentos');
    if (!orcamentos.length) {
      container.innerHTML = '<p class="empty-row">Nenhum orçamento definido. Adicione um limite acima.</p>';
      return;
    }
    const gastos = await apiGet('/api/orcamentos/verificar').catch(() => ({}));
    container.innerHTML = orcamentos.map((o, i) => {
      const alerta = Array.isArray(gastos) ? gastos.find(a => a.categoria === o.categoria) : null;
      const pct = alerta ? alerta.pct : 0;
      const gasto = alerta ? alerta.gasto : 0;
      const barClass = pct >= 100 ? 'progress-fill danger' : pct >= 80 ? 'progress-fill warning' : 'progress-fill';
      return `<div class="orcamento-item item-enter" style="animation-delay:${i * 40}ms">
        <div class="orcamento-info">
          <span class="orcamento-categoria">${o.categoria}</span>
          <span class="orcamento-valores">R$ ${Number(gasto).toFixed(2)} / R$ ${Number(o.limite).toFixed(2)}</span>
          <span class="orcamento-pct" style="color:${pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--text-secondary)'}">${pct}%</span>
        </div>
        <div class="progress-bar"><div class="${barClass}" style="width:${Math.min(pct, 100)}%"></div></div>
        <button class="btn btn-ghost btn-sm btn-delete-orc" data-id="${o.id}" title="Remover"><i class="fas fa-trash"></i></button>
      </div>`;
    }).join('');
    container.querySelectorAll('.btn-delete-orc').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiDelete(`/api/orcamentos/${btn.dataset.id}`);
          showToast('Orçamento removido', 'success');
          carregarOrcamentos();
        } catch (err) { showToast(err.message); }
      });
    });
  } catch (err) {
    container.innerHTML = `<p class="empty-row">Erro ao carregar: ${err.message}</p>`;
  }
}

async function addOrcamento() {
  const categoria = document.getElementById('orcCategoria')?.value;
  const limite = document.getElementById('orcLimite')?.value;
  if (!categoria || !limite || limite <= 0) { showToast('Selecione uma categoria e defina um limite.', 'warning'); return; }
  try {
    await apiPost('/api/orcamentos', { categoria, limite: parseFloat(limite) });
    showToast('Orçamento adicionado!', 'success');
    document.getElementById('orcLimite').value = '';
    await carregarOrcamentos();
  } catch (err) { showToast(err.message); }
}

function showExtrato() {
  navigate('/extrato');
}
