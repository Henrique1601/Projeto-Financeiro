import { apiGet, apiPost, apiPut, apiDelete, logout } from '../api.js';
import { showToast, showUndoToast, showSpinner, hideSpinner, showDashboardSkeleton, emptyStateSVG } from '../utils/dom.js';
import { formatDate, formatCurrency, getMonthName, isSaida, getTipo, formatMonthBR } from '../utils/format.js';
import { navigate, getRouteParams } from '../router.js';
import { isAuthenticated, getProfile } from '../auth.js';
import { API_BASE_URL, CURRENCIES } from '../config.js';
import { store } from '../store.js';
import { getAllThemes, getCurrentTheme, setTheme } from '../theme.js';
import { setSidebarCollapsed, initSidebarState, syncSidebarState, getSidebarCompactMode, updateSidebarNavGroup } from '../utils/sidebar.js';
import Chart from '../chartSetup.js';
import { getWidgetDefs, getActivePreset, updateWidgetConfig, updateWidgetOrder, getNextSize, getSizeLabel, getPresets, setActivePreset, saveCurrentPreset, deletePreset, exportPreset, importPreset, resetToDefaults, initFromBackend } from '../dashboardConfig.js';
import { initChat } from '../utils/chat.js';

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
          <h2><i class="fas fa-wallet"></i> <span class="sidebar-title">Gestor</span></h2>
          <button class="sidebar-toggle-btn" id="sidebarToggleBtn" aria-label="Recolher sidebar">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Fechar sidebar"><i class="fas fa-times"></i></button>
        </div>
        <nav class="sidebar-nav" id="sidebarNav">
          <div class="nav-group-header">Principal</div>
          <button class="nav-item active" data-page="dashboard" style="animation-delay:0ms">
            <i class="fas fa-chart-bar"></i> <span class="nav-label">Dashboard</span>
          </button>
          <div class="nav-group-header">Financeiro</div>
          <button class="nav-item" data-page="extrato" style="animation-delay:40ms">
            <i class="fas fa-list"></i> <span class="nav-label">Extrato</span>
          </button>
          <button class="nav-item" data-page="orcamentos" style="animation-delay:80ms">
            <i class="fas fa-chart-pie"></i> <span class="nav-label">Orçamentos</span>
          </button>
          <button class="nav-item" data-page="recorrentes" style="animation-delay:120ms">
            <i class="fas fa-redo"></i> <span class="nav-label">Recorrentes</span>
          </button>
          <button class="nav-item" data-page="desafios" style="animation-delay:130ms">
            <i class="fas fa-trophy"></i> <span class="nav-label">Desafios</span>
          </button>
          <button class="nav-item" data-page="comparativo" style="animation-delay:140ms">
            <i class="fas fa-chart-bar"></i> <span class="nav-label">Comparativo</span>
          </button>
          <div class="nav-group-header">Ações</div>
          <button class="nav-item" data-page="nova-transacao" style="animation-delay:160ms">
            <i class="fas fa-plus-circle"></i> <span class="nav-label">Nova Transação</span>
          </button>
          <button class="nav-item" data-page="importar" style="animation-delay:200ms">
            <i class="fas fa-file-import"></i> <span class="nav-label">Importar</span>
          </button>
          <div class="nav-group-header">Conta</div>
          <button class="nav-item" data-page="perfil" style="animation-delay:240ms">
            <i class="fas fa-user"></i> <span class="nav-label">Perfil</span>
          </button>
          <button class="nav-item" data-page="categorias" style="animation-delay:280ms">
            <i class="fas fa-tags"></i> <span class="nav-label">Categorias</span>
          </button>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><i class="fas fa-user"></i> <span id="userName">Usuário</span></div>
          <div class="theme-switcher">
            <label for="themeSelect" class="theme-label"><i class="fas fa-palette"></i> <span class="btn-text">Tema</span></label>
            <select id="themeSelect" class="theme-select">
              ${getAllThemes().map(t =>
                `<option value="${t.id}" ${getCurrentTheme() === t.id ? 'selected' : ''}>${t.label}</option>`
              ).join('')}
            </select>
          </div>
          <button class="btn btn-ghost btn-sm btn-full" id="btnChangePassword" style="margin-bottom:4px">
            <i class="fas fa-key"></i> <span class="btn-text">Alterar Senha</span>
          </button>
          <button class="btn btn-ghost btn-sm btn-full" id="btnLogout">
            <i class="fas fa-sign-out-alt"></i> <span class="btn-text">Sair</span>
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
            <button class="btn btn-ghost btn-sm" id="btnCompartilhar">
              <i class="fas fa-share-alt"></i> Compartilhar
            </button>
          </div>
        </div>
        <div id="pageContent"></div>
        <button class="fab" id="fabNovaTransacao" title="Nova Transação (Ctrl+N)" aria-label="Nova Transação">
          <i class="fas fa-plus"></i>
        </button>
      </main>
    </div>

    <!-- Chat Widget -->
    <div class="chat-backdrop" id="chatBackdrop"></div>
    <button class="chat-fab" id="chatFab" title="Assistente IA (Ctrl+F)" aria-label="Abrir assistente">
      <i class="fas fa-comment"></i>
    </button>
    <div class="chat-panel" id="chatPanel">
      <div class="chat-header">
        <h3><i class="fas fa-robot"></i> Assistente Financeiro</h3>
        <button class="chat-close-btn" id="chatCloseBtn" aria-label="Fechar"><i class="fas fa-times"></i></button>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-msg assistant">
          Olá! Sou seu assistente financeiro. Pergunte sobre seus gastos, padrões ou peça dicas de economia.
        </div>
      </div>
      <div class="chat-suggestions" id="chatSuggestions">
        <button class="chat-chip">Resumo do mês</button>
        <button class="chat-chip">Maiores gastos</button>
        <button class="chat-chip">Padrões nos gastos</button>
        <button class="chat-chip">Dica de economia</button>
      </div>
      <div class="chat-input-area">
        <textarea class="chat-input" id="chatInput" placeholder="Faça uma pergunta..." rows="1"></textarea>
        <button class="chat-send-btn" id="chatSendBtn" aria-label="Enviar"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;

  registerSidebarHandlers();
  registerTopBarHandlers();

  requestAnimationFrame(() => {
    document.querySelectorAll('#sidebarNav .nav-item').forEach(el => el.classList.add('item-enter'));
  });

  const user = await getProfile().catch(() => ({ name: 'Usuário' }));
  document.getElementById('userName').textContent = user.name || 'Usuário';
  if (user.dashboardConfig) initFromBackend(user.dashboardConfig);

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
    if (e.detail === 'abrir-assistente') {
      const fab = document.getElementById('chatFab');
      if (fab && !document.getElementById('chatPanel').classList.contains('open')) fab.click();
    }
  });

  loadOfflineData();
  initChat();
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
      updateSidebarNavGroup(page);
      if (page === 'dashboard') showDashboard();
      else if (page === 'extrato') navigate('/extrato');
      else if (page === 'perfil') navigate('/perfil');
      else if (page === 'recorrentes') navigate('/recorrentes');
      else if (page === 'desafios') navigate('/desafios');
      else if (page === 'orcamentos') { _scrollToOrcamentos = true; showDashboard(); }
      else if (page === 'categorias') navigate('/perfil?section=categorias');
      else if (page === 'comparativo') navigate('/comparativo');
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

  document.getElementById('sidebarToggleBtn').addEventListener('click', () => {
    const wasCollapsed = document.body.classList.contains('sidebar-collapsed');
    setSidebarCollapsed(!wasCollapsed);
    if (!wasCollapsed) {
      document.body.classList.remove('sidebar-hover-expand');
    }
    syncSidebarState(!wasCollapsed);
  });

  const sidebar = document.getElementById('sidebar');
  sidebar.addEventListener('mouseenter', () => {
    if (document.body.classList.contains('sidebar-collapsed') && !getSidebarCompactMode()) {
      document.body.classList.add('sidebar-hover-expand');
    }
  });
  sidebar.addEventListener('mouseleave', () => {
    document.body.classList.remove('sidebar-hover-expand');
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

  initSidebarState();
}

function registerTopBarHandlers() {
  document.getElementById('btnNovaTransacao').addEventListener('click', () => showFormModal());
  document.getElementById('btnExportCSV').addEventListener('click', showExportModal);
  document.getElementById('btnCompartilhar').addEventListener('click', showCompartilharModal);
  const fab = document.getElementById('fabNovaTransacao');
  if (fab) fab.addEventListener('click', () => showFormModal());
}

function closeModal(el) {
  if (!el) return;
  const overlay = el.classList.contains('modal-overlay') ? el : el.closest('.modal-overlay');
  if (!overlay) { el.remove(); return; }
  overlay.classList.add('closing');
  overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
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
    if (filtroAtivo.tags && !Array.isArray(l.tags)) return false;
    if (filtroAtivo.tags && Array.isArray(l.tags) && !l.tags.includes(filtroAtivo.tags)) return false;
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
    tags: params.tags || '',
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

    const widgetGridHtml = renderWidgetGrid(stats, filtrados, categoriasUnicas, _scroll);
    content.innerHTML = `
      <div class="page-enter">
${widgetGridHtml}
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
            <label for="filtroTags">Tags</label>
            <select id="filtroTags">
              <option value="">Todas</option>
              ${[...new Set(lancamentos.flatMap(l => Array.isArray(l.tags) ? l.tags : []))].map(t => `<option value="${t}" ${filtroAtivo.tags === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
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
                <th>Moeda</th>
                <th class="sortable" data-col="entradaSaida">Tipo ${sortColumn === 'entradaSaida' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="dashTableBody">
              ${paginated.length === 0 ? '<tr><td colspan="8"><div class="empty-state" style="animation:none"><div class="empty-state-illustration">' + emptyStateSVG('search') + '</div><h3 class="empty-state-title">Nenhum lançamento</h3><p class="empty-state-subtitle">Tente ajustar os filtros ou crie uma nova transação</p></div></td></tr>' : ''}
              ${paginated.map((l, i) => `
                <tr class="item-enter ${selectedIds.has(l.id) ? 'selected-row ' : ''}${isSaida(l) ? 'row-saida' : 'row-entrada'}" style="animation-delay:${i * 40}ms">
                  <td><input type="checkbox" class="select-item" data-id="${l.id}" ${selectedIds.has(l.id) ? 'checked' : ''} /></td>
                  <td>${formatDate(l.data)}</td>
                  <td>${l.descricao || '-'}${Array.isArray(l.tags) && l.tags.length ? ' <span class="tag-list">' + l.tags.map(t => '<span class="tag-badge">' + t + '</span>').join('') + '</span>' : ''}${l.comprovante_count > 0 ? `<span class="comprovante-indicator" data-lancamento-id="${l.id}" title="${l.comprovante_count} comprovante(s)"><i class="fas fa-paperclip"></i><span class="comprovante-badge">${l.comprovante_count}</span></span>` : ''}</td>
                  <td>${l.categoria || '-'}</td>
                  <td class="${Number(l.valor) < 0 ? 'negative' : 'positive'}">${formatCurrency(l.valor)}</td>
                  <td>${(() => { const m = CURRENCIES.find(c => c.code === (l.moeda || 'BRL')); return m ? m.symbol : 'R$'; })()}</td>
                  <td><span class="badge ${isSaida(l) ? 'saida' : 'entrada'}">${isSaida(l) ? 'Saída' : 'Entrada'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${l.id}" title="Editar" aria-label="Editar lançamento"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-ghost btn-sm" data-action="duplicate" data-id="${l.id}" title="Duplicar" aria-label="Duplicar lançamento"><i class="fas fa-copy"></i></button>
                    <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${l.id}" style="color:var(--danger)" title="Excluir" aria-label="Excluir lançamento"><i class="fas fa-trash"></i></button>
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

    requestAnimationFrame(runStatCounters);

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

    document.getElementById('btnManageWidgets')?.addEventListener('click', showManageWidgetsModal);
    document.getElementById('btnPresets')?.addEventListener('click', showPresetsModal);
    document.getElementById('dashTableBody')?.addEventListener('click', (e) => {
      const indicator = e.target.closest('.comprovante-indicator');
      if (indicator) {
        const id = indicator.dataset.lancamentoId;
        showComprovantePopover(e, id, indicator);
        return;
      }
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') showEditModal(id);
      else if (action === 'duplicate') duplicarLancamento(id);
      else if (action === 'delete') deleteLancamento(id);
    });

    initWidgets(filtrados);
    if (_scroll) {
      setTimeout(() => document.querySelector('.widget-container')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }

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
  const records = [];
  try {
    for (const id of ids) {
      const res = await apiDelete(`/api/deletar?id=${id}`);
      if (res && res.record) records.push(res.record);
    }
    selectedIds.clear();
    currentPage = 1;
    showDashboard();
    hideSpinner();
    const qtd = ids.length;
    if (records.length) {
      showUndoToast(`${qtd} excluído(s)!`, () => desfazerDelete(records));
    } else {
      showToast(`${qtd} excluído(s)!`, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Erro ao excluir');
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
  const tg = document.getElementById('filtroTags')?.value;
  if (tg) params.set('tags', tg);
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

function initWidgets(dados) {
  const grid = document.getElementById('widgetGrid');
  if (!grid) return;
  if (typeof Sortable !== 'undefined') {
    Sortable.create(grid, {
      handle: '.widget-header',
      animation: 200,
      ghostClass: 'widget-ghost',
      onEnd: () => {
        const order = [...grid.querySelectorAll('.widget-container')].map(w => w.dataset.widgetId);
        updateWidgetOrder(order);
      }
    });
  }
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.widget-btn');
    if (!btn) return;
    const container = btn.closest('.widget-container');
    if (!container) return;
    const id = container.dataset.widgetId;
    if (btn.dataset.action === 'hide') {
      updateWidgetConfig(id, { hidden: true });
      container.style.display = 'none';
    } else if (btn.dataset.action === 'size') {
      const sizes = ['sm', 'md', 'lg', 'xl'];
      const cur = [...container.classList].find(c => c.startsWith('widget-')).replace('widget-', '');
      const next = sizes[(sizes.indexOf(cur) + 1) % 4];
      container.className = container.className.replace(/widget-\w+/g, '').trim();
      container.classList.add('widget-container', `widget-${next}`);
      if (id) updateWidgetConfig(id, { size: next });
    }
  });
  _initDashboardCharts(dados);
  if (dados.length > 0) {
    if (document.getElementById('comparativoBody')) atualizarComparativo(dados);
    if (document.getElementById('comparativoMensalBody')) atualizarComparativoMensal(dados);
    if (document.getElementById('investimentoBody')) atualizarInvestimento(dados);
    if (document.getElementById('metaBody')) atualizarMeta();
    if (document.getElementById('projecaoBody')) atualizarProjecao(dados);
    document.getElementById('btnDefinirMeta')?.addEventListener('click', definirMeta);
  }
  document.getElementById('btnAddOrcamento')?.addEventListener('click', addOrcamento);
  carregarOrcamentos();
  document.getElementById('btnAddMetaCat')?.addEventListener('click', addMetaCategoria);
  carregarMetasCategoria();
  document.getElementById('btnDesafioWidgetNovo')?.addEventListener('click', () => navigate('/desafios'));
  carregarDesafiosWidget();
}

function _initDashboardCharts(dados) {
  destroyCharts();
  const evCanvas = document.getElementById('chartEvolucaoDash');
  const catCanvas = document.getElementById('chartCategoriasDash');
  const pagCanvas = document.getElementById('chartPagamentosDash');
  const recCanvas = document.getElementById('chartRecorrentesDash');
  if (!evCanvas && !catCanvas && !pagCanvas && !recCanvas) return;
  if (evCanvas && evCanvas.closest('.widget-container')?.style.display !== 'none') {
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
  }
  if (catCanvas && catCanvas.closest('.widget-container')?.style.display !== 'none') {
    const categorias = {};
    dados.forEach(l => {
      const cat = l.categoria || 'Sem categoria';
      categorias[cat] = (categorias[cat] || 0) + Math.abs(Number(l.valor) || 0);
    });
    const catLabels = Object.keys(categorias);
    const catValues = Object.values(categorias);
    catCanvas.classList.remove('skeleton', 'skeleton-chart');
    if (catLabels.length) {
      const cached = store._categorias || [];
      const catMap = {};
      cached.forEach(c => { catMap[c.nome] = c.cor; });
      const cores = catLabels.map((label, i) => catMap[label] || gerarCores(catLabels.length)[i]);
      chartInstances.categorias = new Chart(catCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [{ data: catValues, backgroundColor: cores, borderWidth: 0 }],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          cutout: '55%',
          plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } },
        },
      });
    }
  }
  if (pagCanvas && pagCanvas.closest('.widget-container')?.style.display !== 'none') {
    const metodos = {};
    dados.forEach(l => {
      const m = l.metodoPagamento || 'Outros';
      metodos[m] = (metodos[m] || 0) + Math.abs(Number(l.valor) || 0);
    });
    const labels = Object.keys(metodos);
    const values = Object.values(metodos);
    pagCanvas.classList.remove('skeleton', 'skeleton-chart');
    if (labels.length) {
      chartInstances.pagamentos = new Chart(pagCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: gerarCores(labels.length), borderWidth: 0 }],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          cutout: '55%',
          plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } },
        },
      });
    }
  }
  if (recCanvas && recCanvas.closest('.widget-container')?.style.display !== 'none') {
    let recorrentes = 0, pontuais = 0;
    dados.forEach(l => {
      const v = Math.abs(Number(l.valor) || 0);
      if (l.recorrente_id) recorrentes += v;
      else pontuais += v;
    });
    recCanvas.classList.remove('skeleton', 'skeleton-chart');
    if (recorrentes + pontuais > 0) {
      chartInstances.recorrentes = new Chart(recCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Recorrentes', 'Pontuais'],
          datasets: [{ data: [recorrentes, pontuais], backgroundColor: ['#6366f1', '#10b981'], borderWidth: 0 }],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          cutout: '55%',
          plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } },
        },
      });
    }
  }
}

function atualizarComparativo(dados) {
  const el = document.getElementById('comparativoBody');
  if (!el) return;
  const meses = {};
  const mesesOrdem = [];
  dados.forEach(l => {
    const mes = l.data ? l.data.slice(0, 7) : '';
    if (!mes) return;
    if (!meses[mes]) { meses[mes] = { entradas: 0, saidas: 0 }; mesesOrdem.push(mes); }
    const v = Number(l.valor) || 0;
    if (v >= 0) meses[mes].entradas += v;
    else meses[mes].saidas += Math.abs(v);
  });
  mesesOrdem.sort();
  if (!mesesOrdem.length) { el.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem">Sem dados</div>'; return; }
  const linhas = mesesOrdem.slice(-6).map(m => {
    const d = meses[m];
    const diff = d.entradas - d.saidas;
    const cor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
    return `<div class="comparativo-row"><span class="cmp-mes">${formatMonthBR(m)}</span><span class="cmp-entradas">${formatCurrency(d.entradas)}</span><span class="cmp-saidas">${formatCurrency(d.saidas)}</span><span class="cmp-saldo" style="color:${cor}">${formatCurrency(diff)}</span></div>`;
  }).join('');
  el.innerHTML = `<div class="comparativo-grid"><div style="font-weight:600">Mês</div><div style="font-weight:600;text-align:right">Entradas</div><div style="font-weight:600;text-align:right">Saídas</div><div style="font-weight:600;text-align:right">Saldo</div>${linhas}</div>`;
}

function atualizarComparativoMensal(dados) {
  const el = document.getElementById('comparativoMensalBody');
  if (!el) return;
  const meses = {};
  const mesesOrdem = [];
  dados.forEach(l => {
    const mes = l.data ? l.data.slice(0, 7) : '';
    if (!mes) return;
    if (!meses[mes]) { meses[mes] = { entradas: 0, saidas: 0 }; mesesOrdem.push(mes); }
    const v = Number(l.valor) || 0;
    if (v >= 0) meses[mes].entradas += v;
    else meses[mes].saidas += Math.abs(v);
  });
  mesesOrdem.sort();
  const ultimos = mesesOrdem.slice(-3);
  if (!ultimos.length) { el.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem">Sem dados</div>'; return; }
  const linhas = ultimos.map((m, i) => {
    const d = meses[m];
    const diff = d.entradas - d.saidas;
    const cor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
    const variacao = i > 0 ? compararVariacao(ultimos[i - 1], m, meses) : '';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border-color)"><span>${formatMonthBR(m)}</span><span style="color:${cor};font-weight:600">${formatCurrency(diff)}</span>${variacao}</div>`;
  }).join('');
  el.innerHTML = `<div style="font-size:0.85rem">${linhas}</div>`;
}

function compararVariacao(mesAnterior, mesAtual, meses) {
  const ant = meses[mesAnterior];
  const atu = meses[mesAtual];
  const saldoAnt = ant.entradas - ant.saidas;
  const saldoAtu = atu.entradas - atu.saidas;
  if (saldoAnt === 0) return '';
  const pct = ((saldoAtu - saldoAnt) / Math.abs(saldoAnt)) * 100;
  const cor = pct >= 0 ? 'var(--success)' : 'var(--danger)';
  const seta = pct >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
  return `<span style="color:${cor};font-size:0.75rem;white-space:nowrap"><i class="fas ${seta}"></i> ${pct > 0 ? '+' : ''}${pct.toFixed(1)}%</span>`;
}

function atualizarInvestimento(dados) {
  const el = document.getElementById('investimentoBody');
  if (!el) return;
  let investPct = 0;
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const stored = localStorage.getItem('investimento_percentual');
      if (stored !== null) investPct = parseFloat(stored) || 0;
    } catch {}
  }
  const now = new Date();
  const mesKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let receitas = 0;
  dados.forEach(l => {
    if (l.data && l.data.slice(0, 7) === mesKey && Number(l.valor) > 0) {
      receitas += Number(l.valor);
    }
  });
  const valorInvestir = receitas * (investPct / 100);
  el.innerHTML = `<div style="font-size:0.85rem">
    <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Receitas do mês</span><span>${formatCurrency(receitas)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Percentual</span><span>${investPct}%</span></div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-weight:600;border-top:1px solid var(--border-color)"><span>Valor a investir</span><span style="color:var(--primary)">${formatCurrency(valorInvestir)}</span></div>
  </div>`;
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
  if (!body) return;
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
  const categorias = await store.getCategorias();
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
            <label for="formValor">Valor</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="number" id="formValor" step="0.01" required placeholder="0,00" style="flex:1" value="${isEdit ? Math.abs(editData.valor) : ''}" />
              <button type="button" class="btn btn-ghost btn-sm" id="btnLerBoleto" title="Ler boleto por câmera ou linha digitável">
                <i class="fas fa-barcode"></i> Boleto
              </button>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label for="formMoeda">Moeda</label>
              <select id="formMoeda">
                ${CURRENCIES.map(c => `<option value="${c.code}" ${isEdit && editData.moeda === c.code ? 'selected' : ''}>${c.code} - ${c.symbol}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:2">
              <label for="formCambio">Câmbio (1 unid. → R$)</label>
              <input type="number" id="formCambio" step="0.0001" placeholder="Automático" value="${isEdit && editData.cambio && editData.cambio !== 1 ? editData.cambio : ''}" />
              <span class="field-note" id="cambioHint" style="font-size:0.7rem;color:var(--text-muted)"></span>
            </div>
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
            <div class="categoria-input-row">
              <select id="formCategoria" class="categoria-select">
                <option value="">Automática</option>
                ${categorias.map(c =>
                  `<option value="${c.nome}" ${isEdit && editData.categoria === c.nome ? 'selected' : ''}>${c.nome}</option>`
                ).join('')}
              </select>
              <button type="button" class="btn btn-ghost btn-sm" id="quickAddCategory" title="Nova categoria"><i class="fas fa-plus"></i></button>
            </div>
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
            <label for="formTags">Tags <span class="field-note">(separadas por vírgula)</span></label>
            <input type="text" id="formTags" list="tagSuggestions" placeholder="Ex: ifood, urgente, viagem" value="${isEdit && Array.isArray(editData.tags) ? editData.tags.join(', ') : ''}" />
            <datalist id="tagSuggestions">
              ${[...new Set(lancamentos.flatMap(l => Array.isArray(l.tags) ? l.tags : []))].map(t => `<option value="${t}">`).join('')}
            </datalist>
          </div>
          <div class="form-group">
            <label>Comprovantes</label>
            <div class="comprovante-upload-zone" id="comprovanteDropzone">
              <div class="comprovante-preview-grid" id="comprovantePreview"></div>
              <div id="comprovanteDropPlaceholder" style="color:var(--text-muted);font-size:0.85rem">
                <i class="fas fa-cloud-upload-alt" style="font-size:1.2rem;display:block;margin-bottom:4px"></i>
                ${isEdit && editData.comprovante_count ? `${editData.comprovante_count} comprovante(s) existente(s). ` : ''}Clique para adicionar comprovantes
              </div>
              <input type="file" id="comprovanteInput" accept="image/*" multiple style="display:none" />
            </div>
            <span class="field-note" style="font-size:0.7rem">Formatos: JPG, PNG, WEBP. Enviados após salvar.</span>
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

  const quickBtn = document.getElementById('quickAddCategory');
  if (quickBtn) {
    quickBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openQuickCategoryModal();
    });
  }

  const moedaSelect = document.getElementById('formMoeda');
  const cambioInput = document.getElementById('formCambio');
  const cambioHint = document.getElementById('cambioHint');
  if (moedaSelect.value === 'BRL') cambioInput.disabled = true;
  moedaSelect.addEventListener('change', async () => {
    const moeda = moedaSelect.value;
    if (moeda === 'BRL') {
      cambioInput.value = '';
      cambioInput.disabled = true;
      cambioHint.textContent = 'Real não precisa de câmbio';
      return;
    }
    if (cambioInput.value && isEdit) {
      cambioInput.disabled = false;
      cambioHint.textContent = 'Valor manual definido';
      return;
    }
    cambioInput.disabled = false;
    cambioHint.textContent = 'Buscando...';
    try {
      const resp = await apiGet(`/api/cambio?moedas=${moeda}`);
      if (resp[moeda]) {
        cambioInput.value = resp[moeda];
        cambioHint.textContent = `1 ${moeda} = R$ ${resp[moeda]}`;
      } else {
        cambioHint.textContent = 'Indisponível, insira manualmente';
      }
    } catch {
      cambioHint.textContent = 'Erro ao buscar câmbio, insira manualmente';
    }
  });

  document.getElementById('formRepetir').addEventListener('change', (e) => {
    document.getElementById('recorrenteFields').style.display = e.target.checked ? 'block' : 'none';
    if (e.target.checked && !document.getElementById('formProximaData').value) {
      document.getElementById('formProximaData').value = document.getElementById('formData').value || new Date().toISOString().split('T')[0];
    }
  });

  const pendingComprovantes = [];
  const dropzone = document.getElementById('comprovanteDropzone');
  const fileInput = document.getElementById('comprovanteInput');
  const previewEl = document.getElementById('comprovantePreview');
  const placeholderEl = document.getElementById('comprovanteDropPlaceholder');

  function renderComprovantePreview() {
    previewEl.innerHTML = pendingComprovantes.map((f, i) => `
      <div class="comprovante-preview-item">
        <img src="${URL.createObjectURL(f)}" alt="preview" />
        <button type="button" class="remove-btn" data-idx="${i}" title="Remover">&times;</button>
        <div class="status-overlay pending"></div>
      </div>
    `).join('');
    placeholderEl.style.display = pendingComprovantes.length ? 'none' : '';
    dropzone.classList.toggle('has-files', pendingComprovantes.length > 0);
    previewEl.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        pendingComprovantes.splice(idx, 1);
        renderComprovantePreview();
      });
    });
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    for (const f of fileInput.files) pendingComprovantes.push(f);
    fileInput.value = '';
    renderComprovantePreview();
  });

  async function uploadComprovantes(lancamentoId) {
    if (!pendingComprovantes.length) return;
    const userId = getUserIdFromToken();
    for (const file of pendingComprovantes) {
      try {
        const publicId = `user_${userId}/lancamentos/${lancamentoId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const sig = await apiPost('/api/comprovantes/signature', { public_id: publicId });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('public_id', publicId);
        formData.append('api_key', sig.api_key);
        formData.append('timestamp', sig.timestamp);
        formData.append('signature', sig.signature);
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const errBody = await uploadRes.json().catch(() => ({}));
          console.error('Cloudinary upload error:', errBody);
          continue;
        }
        const uploadData = await uploadRes.json();
        await apiPost('/api/comprovantes', {
          lancamento_id: lancamentoId,
          url: uploadData.secure_url || uploadData.url,
          public_id: uploadData.public_id,
          nome_arquivo: file.name,
        });
      } catch (err) {
        console.error('Erro upload comprovante:', err);
      }
    }
    pendingComprovantes.length = 0;
  }

  document.getElementById('lancamentoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pagamento = document.getElementById('formPagamento')?.value || '';
    const observacoes = document.getElementById('formObservacoes')?.value || '';
    const rawValor = Number(document.getElementById('formValor').value);
    const formTipo = document.getElementById('formTipo').value;
    const isSaidaFinal = formTipo === 'saida' || rawValor < 0;
    const rawTags = document.getElementById('formTags')?.value || '';
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
    const data = {
      data: document.getElementById('formData').value,
      descricao: document.getElementById('formDescricao').value,
      valor: isSaidaFinal ? -Math.abs(rawValor) : Math.abs(rawValor),
      entradaSaida: isSaidaFinal ? 'Saída' : 'Entrada',
      categoria: document.getElementById('formCategoria').value,
      ...(pagamento ? { metodoPagamento: pagamento } : {}),
      ...(observacoes ? { observacoes } : {}),
      ...(tags.length ? { tags } : { tags: [] }),
      moeda: document.getElementById('formMoeda').value || 'BRL',
      cambio: parseFloat(document.getElementById('formCambio').value) || 1,
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
        if (pendingComprovantes.length) await uploadComprovantes(editData.id);
        showToast('Atualizado!', 'success');
      } else {
        const saved = await apiPost('/api/salvar', data);
        if (repetir) {
          await apiPost('/api/recorrentes', data);
        }
        const savedId = saved?.id || saved?.record?.id;
        if (pendingComprovantes.length && savedId) await uploadComprovantes(savedId);
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

document.getElementById('btnLerBoleto')?.addEventListener('click', () => {
  const modalId = 'boletoScannerModal';
  if (document.getElementById(modalId)) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="${modalId}">
      <div class="modal-content">
        <h2><i class="fas fa-barcode"></i> Ler Boleto</h2>
        <ul class="tabs" style="display:flex;gap:8px;margin-bottom:16px">
          <li><button class="btn btn-sm btn-primary" id="boletoTabCamera" style="flex:1"><i class="fas fa-camera"></i> Câmera</button></li>
          <li><button class="btn btn-sm btn-ghost" id="boletoTabManual" style="flex:1"><i class="fas fa-keyboard"></i> Digitar</button></li>
        </ul>
        <div id="boletoCameraPanel">
          <div id="boletoReader" style="width:100%;max-width:400px;margin:0 auto;border-radius:8px;overflow:hidden;background:#000"></div>
          <p id="boletoCameraStatus" style="text-align:center;font-size:.85rem;color:var(--text-secondary);margin-top:8px">
            <i class="fas fa-spinner fa-spin"></i> Iniciando câmera…
          </p>
        </div>
        <div id="boletoManualPanel" style="display:none">
          <div class="form-group">
            <label>Linha digitável ou código de barras</label>
            <input type="text" id="boletoManualInput" placeholder="Cole ou digite o código do boleto" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);font-size:1rem;font-family:monospace;letter-spacing:1px" />
            <span class="field-note">Aceita código de barras (44 dígitos) ou linha digitável (47 dígitos) — pontos e espaços são ignorados.</span>
          </div>
          <button class="btn btn-primary" id="boletoManualParse" style="width:100%"><i class="fas fa-check"></i> Preencher automaticamente</button>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancelBoletoScan">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  const modal = document.getElementById(modalId);
  let scannerStarted = false;

  function fillForm(data) {
    if (data.valor && data.valor > 0) document.getElementById('formValor').value = data.valor.toFixed(2);
    if (data.bankCode) {
      const pagamentoSelect = document.getElementById('formPagamento');
      if (pagamentoSelect) pagamentoSelect.value = 'Boleto';
    }
    if (data.dueDate) {
      const dataInput = document.getElementById('formData');
      if (dataInput) dataInput.value = data.dueDate.toISOString().split('T')[0];
    }
    const tipoSelect = document.getElementById('formTipo');
    if (tipoSelect) tipoSelect.value = 'saida';
    closeModal(modal);
    showToast('Boleto preenchido!', 'success');
  }

  document.getElementById('cancelBoletoScan').addEventListener('click', () => { stopScanner(); closeModal(modal); });
  modal.addEventListener('click', (e) => { if (e.target === e.currentTarget) { stopScanner(); closeModal(modal); } });

  // Camera tab
  document.getElementById('boletoTabCamera').addEventListener('click', async () => {
    document.getElementById('boletoCameraPanel').style.display = 'block';
    document.getElementById('boletoManualPanel').style.display = 'none';
    document.getElementById('boletoTabCamera').className = 'btn btn-sm btn-primary';
    document.getElementById('boletoTabManual').className = 'btn btn-sm btn-ghost';
    if (!scannerStarted) await initCameraScan();
  });

  // Manual tab
  document.getElementById('boletoTabManual').addEventListener('click', () => {
    stopScanner();
    document.getElementById('boletoCameraPanel').style.display = 'none';
    document.getElementById('boletoManualPanel').style.display = 'block';
    document.getElementById('boletoTabCamera').className = 'btn btn-sm btn-ghost';
    document.getElementById('boletoTabManual').className = 'btn btn-sm btn-primary';
  });

  document.getElementById('boletoManualParse').addEventListener('click', async () => {
    const input = document.getElementById('boletoManualInput').value.trim();
    if (!input) { showToast('Digite ou cole o código do boleto', 'warning'); return; }
    const { parseBoletoCode } = await import('../utils/boletoScanner.js');
    const parsed = parseBoletoCode(input);
    if (!parsed) { showToast('Código inválido. Use 44 ou 47 dígitos.', 'error'); return; }
    fillForm(parsed);
  });

  async function initCameraScan() {
    try {
      const { startScanner } = await import('../utils/boletoScanner.js');
      await startScanner('boletoReader', (data) => fillForm(data));
      scannerStarted = true;
      document.getElementById('boletoCameraStatus').innerHTML = '<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Câmera ativa. Aproxime o código de barras do boleto.</span>';
    } catch (err) {
      document.getElementById('boletoCameraStatus').innerHTML = `<span style="color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> ${err.message}</span>`;
      document.getElementById('boletoCameraPanel').innerHTML += '<p style="text-align:center;margin-top:12px;font-size:.85rem;color:var(--text-secondary)">Use a opção "Digitar" para colar a linha digitável.</p>';
    }
  }

  async function stopScanner() {
    if (scannerStarted) {
      try {
        const { stopScanner } = await import('../utils/boletoScanner.js');
        await stopScanner();
      } catch {}
      scannerStarted = false;
    }
  }
});

function closeFormModal() {
  closeModal(document.getElementById('formModal'));
}

function openQuickCategoryModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'quickCategoryOverlay';
  overlay.innerHTML = `
    <div class="modal-content quick-category-modal">
      <div class="modal-header">
        <h3>Nova Categoria</h3>
        <button class="modal-close" id="quickCategoryClose" aria-label="Fechar">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="quickCatNome">Nome</label>
          <input type="text" id="quickCatNome" placeholder="Ex: Assinaturas" maxlength="40" />
        </div>
        <div class="form-group">
          <label for="quickCatCor">Cor</label>
          <input type="color" id="quickCatCor" value="#6366f1" />
        </div>
        <div class="form-group">
          <label for="quickCatKeywords">Palavras-chave <span class="field-note">(separadas por vírgula)</span></label>
          <input type="text" id="quickCatKeywords" placeholder="ex: netflix, spotify, amazon" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="quickCategoryCancel">Cancelar</button>
        <button class="btn btn-primary" id="quickCategorySave">Criar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => closeModal(overlay);
  document.getElementById('quickCategoryClose').onclick = close;
  document.getElementById('quickCategoryCancel').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };

  document.getElementById('quickCategorySave').onclick = async () => {
    const nome = document.getElementById('quickCatNome').value.trim();
    const cor = document.getElementById('quickCatCor').value;
    const kw = document.getElementById('quickCatKeywords').value.split(',').map(s => s.trim()).filter(Boolean);
    if (!nome) { showToast('Nome é obrigatório', 'warning'); return; }
    try {
      await apiPost('/api/categorias', { nome, cor, keywords: kw });
      store.invalidateCategorias();
      close();
      showToast('Categoria criada!', 'success');
      const select = document.getElementById('formCategoria');
      if (select) {
        const cats = await store.getCategorias();
        select.innerHTML = `<option value="">Automática</option> ${cats.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}`;
        select.value = nome;
      }
    } catch (err) {
      showToast(err.message || 'Erro ao criar categoria', 'warning');
    }
  };
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
    const res = await apiDelete(`/api/deletar?id=${parseInt(id)}`);
    showDashboard();
    hideSpinner();
    if (res && res.record) {
      showUndoToast('Excluído!', () => desfazerDelete(res.record));
    } else {
      showToast('Excluído!', 'success');
    }
  } catch (err) {
    showToast(err.message || 'Erro ao excluir');
    hideSpinner();
  }
}

async function desfazerDelete(records) {
  const arr = Array.isArray(records) ? records : [records];
  try {
    for (const record of arr) {
      await apiPost('/api/desfazer', { record });
    }
    showToast(arr.length > 1 ? `${arr.length} exclusões desfeitas!` : 'Exclusão desfeita!', 'success');
    showDashboard();
  } catch (err) {
    showToast(err.message || 'Erro ao desfazer');
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
            <label>Categoria (opcional)</label>
            <select id="exportCategoria">
              <option value="">Todas</option>
              ${[...new Set(lancamentos.map(l => l.categoria).filter(Boolean))].sort().map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="exportIncluirGraficos" />
              Incluir gráficos no PDF
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="exportDarkMode" />
              Fundo escuro (modo noturno)
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

  document.getElementById('cancelExport').addEventListener('click', () => closeModal(document.getElementById('exportModal')));
  document.getElementById('exportModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal(document.getElementById('exportModal'));
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
    const darkModePDF = document.getElementById('exportDarkMode').checked;

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
    const exportCat = document.getElementById('exportCategoria').value;
    if (exportCat) dados = dados.filter(l => l.categoria === exportCat);
    if (dataInicio) dados = dados.filter(l => l.data && l.data.split('T')[0] >= dataInicio);
    if (dataFim) dados = dados.filter(l => l.data && l.data.split('T')[0] <= dataFim);

    if (!dados.length) {
      showToast('Nenhum dado no período selecionado', 'warning');
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    closeModal(document.getElementById('exportModal'));

    try {
      if (formato === 'csv') exportCSV(dados);
      else if (formato === 'json') exportJSON(dados);
      else if (formato === 'xlsx') await exportXLSX(dados);
      else if (formato === 'email') await exportEmail(dados, dataInicio, dataFim);
      else exportPDF(dados, incluirGraficos, darkModePDF);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function showCompartilharModal() {
  if (!lancamentos.length) { showToast('Nenhum dado para compartilhar', 'warning'); return; }

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="compartilharModal">
      <div class="modal-content">
        <h2><i class="fas fa-share-alt"></i> Compartilhar Resumo</h2>
        <p style="color:var(--text-secondary);margin-bottom:16px">
          Gere um link anônimo com métricas do seu financeiro (sem valores reais).
        </p>
        <div id="compartilharBody" style="text-align:center;padding:16px 0">
          <button class="btn btn-primary" id="btnGerarLink">
            <i class="fas fa-link"></i> Gerar Link
          </button>
        </div>
        <div id="compartilharResult" style="display:none;margin-top:8px">
          <div class="form-group">
            <label>Link do resumo (válido por 7 dias)</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="text" id="compartilharLink" readonly style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);font-size:.9rem" />
              <button class="btn btn-sm btn-primary" id="btnCopiarLink" title="Copiar"><i class="fas fa-copy"></i></button>
            </div>
          </div>
          <div style="margin-top:12px;padding:12px;background:var(--surface);border-radius:var(--radius-sm)">
            <p style="font-size:.85rem;color:var(--text-secondary);margin:0">
              <i class="fas fa-info-circle"></i> Quem abrir o link verá apenas: número de lançamentos, categorias mais frequentes, método mais usado — sem valores financeiros.
            </p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancelCompartilhar">Fechar</button>
        </div>
      </div>
    </div>
  `);

  const modal = document.getElementById('compartilharModal');
  document.getElementById('cancelCompartilhar').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(modal); });

  document.getElementById('btnGerarLink').addEventListener('click', async () => {
    const btn = document.getElementById('btnGerarLink');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando…';
    try {
      const resp = await fetch(`${API_BASE_URL}/api/compartilhar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resp.ok) throw new Error('Erro ao gerar link');
      const result = await resp.json();
      const link = `${window.location.origin}${window.location.pathname}#/compartilhar/${result.token}`;
      document.getElementById('compartilharBody').style.display = 'none';
      document.getElementById('compartilharResult').style.display = 'block';
      document.getElementById('compartilharLink').value = link;
      showToast('Link gerado!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-link"></i> Gerar Link';
    }
  });

  document.getElementById('btnCopiarLink').addEventListener('click', () => {
    const input = document.getElementById('compartilharLink');
    input.select();
    navigator.clipboard?.writeText(input.value);
    showToast('Link copiado!', 'success');
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

function exportPDF(dados, incluirGraficos, darkMode) {
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

  const dm = darkMode ? {
    bg: '#1a1a2e',
    fg: '#e2e8f0',
    muted: '#94a3b8',
    border: '#334155',
    cardBg: '#1e293b',
    tableAlt: '#1e293b',
  } : {
    bg: '#fff',
    fg: '#333',
    muted: '#64748b',
    border: '#e2e8f0',
    cardBg: '#fff',
    tableAlt: '#f8fafc',
  };

  win.document.write(`
    <html><head>
      <title>Relatório Financeiro</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background:${dm.bg}; color: ${dm.fg}; }
        h1 { color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; }
        .summary { display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap; }
        .summary-box { padding: 16px 24px; border-radius: 8px; border: 1px solid ${dm.border}; background:${dm.cardBg}; }
        .summary-box .label { font-size: 0.8rem; color: ${dm.muted}; text-transform: uppercase; }
        .summary-box .value { font-size: 1.5rem; font-weight: 700; }
        .positive { color: #059669; } .negative { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th { text-align: left; padding: 10px 12px; border-bottom: 2px solid ${dm.border}; color: ${dm.muted}; font-size: 0.8rem; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid ${dm.border}; }
        tr:nth-child(even) { background: ${dm.tableAlt}; }
        .footer { margin-top: 40px; text-align: center; color: ${dm.muted}; font-size: 0.8rem; border-top: 1px solid ${dm.border}; padding-top: 16px; }
        .graficos-section { margin-top: 32px; text-align: center; }
        @media print { body { padding: 0; } .no-print { display: none; } }
      </style>
    </head><body>
      <h1>Relatório Financeiro</h1>
      <p style="color:${dm.muted}">Período: ${dados.length} registros · Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
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
        <p style="color:${dm.muted};margin-top:8px;font-size:0.85rem">Clique no botão e selecione "Salvar como PDF"</p>
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

async function carregarMetasCategoria() {
  const list = document.getElementById('metasCatList');
  if (!list) return;
  try {
    const metas = await apiGet('/api/metas-categoria');
    if (!metas || metas.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">Nenhuma meta definida este mês.</p>';
      return;
    }
    list.innerHTML = metas.map((m, i) => {
      const pct = m.progresso || 0;
      const cor = pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--primary)' : pct > 0 ? 'var(--warning)' : 'var(--text-muted)';
      return `<div class="item-enter" style="animation-delay:${i * 60}ms;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <strong style="font-size:0.85rem">${m.categoria}</strong>
          <button class="btn btn-danger btn-xs" data-delete-meta="${m.id}" style="font-size:0.7rem;padding:2px 8px" title="Remover meta"><i class="fas fa-times"></i></button>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">
          Economizado: ${formatCurrency(m.economizado)} de ${formatCurrency(m.valor_meta)}
        </div>
        <div class="progress-bar" style="height:8px">
          <div class="progress-fill" style="width:${pct}%;background:${cor}"></div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-delete-meta]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiDelete(`/api/metas-categoria/${btn.dataset.deleteMeta}`);
          showToast('Meta removida.', 'success');
          await carregarMetasCategoria();
        } catch (err) { showToast(err.message); }
      });
    });
  } catch (err) {
    list.innerHTML = '<p style="color:var(--danger);font-size:0.85rem">Erro ao carregar metas.</p>';
  }
}

async function addMetaCategoria() {
  const categoria = document.getElementById('metaCatCategoria')?.value;
  const valor = document.getElementById('metaCatValor')?.value;
  if (!categoria || !valor || valor <= 0) { showToast('Selecione uma categoria e defina o valor da meta.', 'warning'); return; }
  try {
    await apiPost('/api/metas-categoria', { categoria, valor_meta: parseFloat(valor) });
    showToast('Meta adicionada!', 'success');
    document.getElementById('metaCatValor').value = '';
    document.getElementById('metaCatCategoria').value = '';
    await carregarMetasCategoria();
  } catch (err) { showToast(err.message); }
}

async function carregarDesafiosWidget() {
  const list = document.getElementById('desafiosWidgetList');
  if (!list) return;
  try {
    const desafios = await apiGet('/api/desafios');
    if (!desafios || desafios.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">Nenhum desafio ativo.</p>';
      return;
    }
    list.innerHTML = desafios.slice(0, 3).map((d, i) => {
      const streakClass = d.streak_atual >= 21 ? 'fire-hot' : d.streak_atual >= 7 ? 'fire' : '';
      return `<div class="item-enter" style="animation-delay:${i * 60}ms;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <strong style="font-size:0.85rem">${d.descricao}</strong>
          <span class="desafio-streak ${streakClass}" style="font-size:1rem;font-weight:700">${d.streak_atual} <span class="desafio-streak-label">dias</span></span>
        </div>
        ${d.valor_meta > 0 ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">Economizado: ${formatCurrency(d.economizado || 0)} de ${formatCurrency(d.valor_meta)}</div>` : ''}
        <div class="progress-bar" style="height:6px">
          <div class="progress-fill" style="width:${d.progresso}%;background:${d.progresso >= 100 ? 'var(--success)' : 'var(--primary)'}"></div>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = '<p style="color:var(--danger);font-size:0.85rem">Erro ao carregar.</p>';
  }
}

function renderWidgetGrid(stats, dados, categoriasUnicas, _scroll) {
  const preset = getActivePreset();
  if (!preset) return '<div class="widget-grid-empty"><p>Nenhum widget disponível</p></div>';
  const visibleWidgets = Object.entries(preset.widgets).filter(([, cfg]) => !cfg.hidden);
  if (!visibleWidgets.length) {
    return '<div class="widget-grid-empty"><p>Nenhum widget visível.</p></div>';
  }
  const widgetsHtml = visibleWidgets.map(([id, cfg]) => {
    const size = cfg.size || 'lg';
    let title, bodyHtml;
    switch (id) {
      case 'saldo':
        title = 'Saldo Total';
        bodyHtml = `<div class="stat-card"><div class="stat-icon neutral-bg"><i class="fas fa-wallet"></i></div><div class="stat-label">Saldo Total</div><div class="stat-value ${stats.saldo >= 0 ? 'positive' : 'negative'}" data-target="${stats.saldo}">${formatCurrency(stats.saldo)}</div></div>`;
        break;
      case 'entradas':
        title = 'Entradas';
        bodyHtml = `<div class="stat-card"><div class="stat-icon positive-bg"><i class="fas fa-arrow-up"></i></div><div class="stat-label">Entradas</div><div class="stat-value positive" data-target="${stats.entradas}">${formatCurrency(stats.entradas)}</div></div>`;
        break;
      case 'saidas':
        title = 'Saídas';
        bodyHtml = `<div class="stat-card"><div class="stat-icon negative-bg"><i class="fas fa-arrow-down"></i></div><div class="stat-label">Saídas</div><div class="stat-value negative" data-target="${stats.saidas}">${formatCurrency(stats.saidas)}</div></div>`;
        break;
      case 'transacoes':
        title = 'Transações';
        bodyHtml = `<div class="stat-card"><div class="stat-icon neutral-bg"><i class="fas fa-exchange-alt"></i></div><div class="stat-label">Transações</div><div class="stat-value" data-target="${dados.length}">${dados.length}</div></div>`;
        break;
      case 'evolucao':
        title = 'Evolução Mensal';
        bodyHtml = `<h3><i class="fas fa-chart-line"></i> Evolução Mensal</h3><canvas id="chartEvolucaoDash" class="skeleton skeleton-chart"></canvas>`;
        break;
      case 'categorias':
        title = 'Categorias';
        bodyHtml = `<h3><i class="fas fa-chart-pie"></i> Categorias</h3><canvas id="chartCategoriasDash" class="skeleton skeleton-chart"></canvas>`;
        break;
      case 'comparativo':
        title = 'Comparativo Mensal';
        bodyHtml = `<div class="insight-header"><i class="fas fa-calendar-compare"></i> Comparativo Mensal</div><div class="insight-body" id="comparativoBody">Carregando...</div>`;
        break;
      case 'meta':
        title = 'Meta de Economia';
        bodyHtml = `<div class="insight-header"><i class="fas fa-piggy-bank"></i> Meta de Economia</div><div class="insight-body" id="metaBody"><div class="meta-input-row"><input type="number" id="metaValor" placeholder="Meta mensal (R$)" step="0.01" min="0" /><button class="btn btn-primary btn-sm" id="btnDefinirMeta"><i class="fas fa-check"></i></button></div><div id="metaProgressContainer" style="display:none"><div class="meta-status"><span class="meta-label" id="metaLabel">Economizado: R$0,00 de R$0,00</span></div><div class="progress-bar"><div class="progress-fill" id="metaProgressFill" style="width:0%"></div></div></div></div>`;
        break;
      case 'projecao':
        title = 'Projeção de Saldo';
        bodyHtml = `<div class="insight-header"><i class="fas fa-chart-simple"></i> Projeção de Saldo</div><div class="insight-body" id="projecaoBody">Carregando...</div>`;
        break;
      case 'orcamentos':
        title = 'Orçamentos do Mês';
        bodyHtml = `<details class="orcamentos-details" ${_scroll ? 'open' : ''}><summary class="orcamentos-summary"><i class="fas fa-chart-pie"></i> Orçamentos do Mês</summary><div class="orcamentos-body"><div class="orcamento-form-row"><select id="orcCategoria" class="form-input" style="flex:1"><option value="">Selecione a categoria</option>${categoriasUnicas.map(c => `<option value="${c}">${c}</option>`).join('')}</select><input type="number" id="orcLimite" class="form-input" placeholder="Limite (R$)" step="0.01" min="0" style="width:150px" /><button class="btn btn-primary btn-sm" id="btnAddOrcamento"><i class="fas fa-plus"></i> Adicionar</button></div><div id="orcamentosList"></div></div></details>`;
        break;
      case 'metas-categoria':
        title = 'Metas por Categoria';
        bodyHtml = `<div class="insight-header"><i class="fas fa-bullseye"></i> Metas por Categoria</div><div class="insight-body"><div class="meta-input-row"><select id="metaCatCategoria" class="form-input" style="flex:1"><option value="">Selecione a categoria</option>${categoriasUnicas.map(c => `<option value="${c}">${c}</option>`).join('')}</select><input type="number" id="metaCatValor" class="form-input" placeholder="Meta (R$)" step="0.01" min="0" style="width:150px" /><button class="btn btn-primary btn-sm" id="btnAddMetaCat"><i class="fas fa-plus"></i></button></div><div id="metasCatList" style="margin-top:12px">Carregando...</div></div>`;
        break;
      case 'desafios':
        title = 'Desafios de Economia';
        bodyHtml = `<div class="insight-header"><i class="fas fa-trophy"></i> Desafios</div><div class="insight-body"><div id="desafiosWidgetList" style="min-height:40px">Carregando...</div><button class="btn btn-primary btn-sm" id="btnDesafioWidgetNovo" style="margin-top:8px;width:100%"><i class="fas fa-plus"></i> Novo Desafio</button></div>`;
        break;
      case 'pagamentos':
        title = 'Por Método de Pagamento';
        bodyHtml = `<h3><i class="fas fa-credit-card"></i> Por Método de Pagamento</h3><canvas id="chartPagamentosDash" class="skeleton skeleton-chart"></canvas>`;
        break;
      case 'recorrentes-vs-pontuais':
        title = 'Recorrentes vs Pontuais';
        bodyHtml = `<h3><i class="fas fa-repeat"></i> Recorrentes vs Pontuais</h3><canvas id="chartRecorrentesDash" class="skeleton skeleton-chart"></canvas>`;
        break;
      case 'comparativo-mensal':
        title = 'Comparativo Mensal';
        bodyHtml = `<div class="insight-header"><i class="fas fa-calendar-compare"></i> Comparativo Mensal</div><div class="insight-body" id="comparativoMensalBody">Carregando...</div>`;
        break;
      case 'investimento':
        title = 'Regra de Investimento';
        bodyHtml = `<div class="insight-header"><i class="fas fa-chart-line"></i> Regra de Investimento</div><div class="insight-body" id="investimentoBody">Carregando...</div>`;
        break;
      default:
        return '';
    }
    const type = id === 'orcamentos' ? 'orcamentos' : id === 'metas-categoria' ? 'metas-categoria' : id === 'desafios' ? 'desafios' : ['evolucao', 'categorias', 'pagamentos', 'recorrentes-vs-pontuais'].includes(id) ? 'chart' : ['comparativo', 'comparativo-mensal', 'meta', 'projecao', 'investimento'].includes(id) ? 'insight' : 'stat';
    return `<div class="widget-container widget-${size}" data-widget-id="${id}" data-widget-type="${type}">
      <div class="widget-header">
        <span class="widget-title">${title}</span>
        <div class="widget-tools">
          <button class="widget-btn" data-action="size" title="Alternar tamanho" aria-label="Alternar tamanho"><i class="fas fa-expand"></i></button>
          <button class="widget-btn" data-action="hide" title="Ocultar" aria-label="Ocultar"><i class="fas fa-eye-slash"></i></button>
        </div>
      </div>
      <div class="widget-body">${bodyHtml}</div>
    </div>`;
  }).filter(Boolean).join('');
  return `<div class="widget-grid" id="widgetGrid">
    <div class="widget-grid-toolbar">
      <button class="btn btn-ghost btn-sm" id="btnManageWidgets"><i class="fas fa-cog"></i> Widgets</button>
      <button class="btn btn-ghost btn-sm" id="btnPresets"><i class="fas fa-palette"></i> Presets</button>
    </div>
    ${widgetsHtml}
  </div>`;
}

function runStatCounters() {
  const els = document.querySelectorAll('#pageContent .stat-value[data-target]');
  if (!els.length) return;
  els.forEach(el => {
    const target = parseFloat(el.dataset.target);
    if (isNaN(target)) return;
    const isCurrency = el.textContent.includes('R$');
    const duration = 800;
    const start = performance.now();
    const startVal = 0;
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = startVal + (target - startVal) * eased;
      el.textContent = isCurrency ? formatCurrency(current) : String(Math.round(current));
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

function showManageWidgetsModal() {
  const preset = getActivePreset();
  if (!preset) return;
  const labelMap = { saldo: 'Saldo Total', entradas: 'Entradas', saidas: 'Saídas', transacoes: 'Transações', evolucao: 'Evolução Mensal', categorias: 'Categorias', comparativo: 'Comparativo Mensal', meta: 'Meta de Economia', projecao: 'Projeção de Saldo', orcamentos: 'Orçamentos', 'metas-categoria': 'Metas por Categoria', desafios: 'Desafios de Economia', pagamentos: 'Por Método de Pagamento', 'recorrentes-vs-pontuais': 'Recorrentes vs Pontuais', 'comparativo-mensal': 'Comparativo Mensal', investimento: 'Regra de Investimento' };
  const iconMap = { saldo: 'fa-wallet', entradas: 'fa-arrow-down', saidas: 'fa-arrow-up', transacoes: 'fa-list', evolucao: 'fa-chart-line', categorias: 'fa-chart-pie', comparativo: 'fa-chart-bar', meta: 'fa-bullseye', projecao: 'fa-chart-simple', orcamentos: 'fa-calculator', 'metas-categoria': 'fa-bullseye', desafios: 'fa-trophy', pagamentos: 'fa-credit-card', 'recorrentes-vs-pontuais': 'fa-repeat', 'comparativo-mensal': 'fa-calendar-compare', investimento: 'fa-chart-line' };
  const sizeLabel = { sm: 'Pequeno', md: 'Médio', lg: 'Grande', xl: 'Extra' };
  const cards = Object.entries(preset.widgets).map(([id, cfg]) =>
    `<div class="modal-card-item" data-widget="${id}">
      <div class="card-icon"><i class="fas ${iconMap[id] || 'fa-chart-simple'}"></i></div>
      <div class="card-info">
        <div class="card-title">${labelMap[id] || id}</div>
        <div class="card-sub">Tamanho: ${sizeLabel[cfg.size] || cfg.size || 'Grande'}</div>
      </div>
      <label class="toggle-switch" data-toggle="${id}">
        <input type="checkbox" ${cfg.hidden ? '' : 'checked'} data-widget="${id}" />
        <span class="toggle-slider"></span>
      </label>
    </div>`
  ).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" style="max-width:480px">
    <div class="modal-header">
      <h2><i class="fas fa-th-large" style="margin-right:8px"></i>Gerenciar Widgets</h2>
      <button class="modal-close" aria-label="Fechar">&times;</button>
    </div>
    <div class="modal-body" style="max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
      ${cards}
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" id="btnApplyWidgets"><i class="fas fa-check"></i> Aplicar</button>
      <button class="btn btn-ghost" id="cancelManageWidgets">Cancelar</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').addEventListener('click', () => closeModal(overlay));
  overlay.querySelector('#cancelManageWidgets').addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { closeModal(overlay); return; }
    const toggleLabel = e.target.closest('.toggle-switch');
    if (toggleLabel) { e.stopPropagation(); return; }
    const card = e.target.closest('.modal-card-item');
    if (card) {
      const cb = card.querySelector('input[type="checkbox"]');
      if (cb) { cb.checked = !cb.checked; }
    }
  });
  overlay.querySelector('#btnApplyWidgets').addEventListener('click', () => {
    overlay.querySelectorAll('input[data-widget]').forEach(el => {
      const id = el.dataset.widget;
      if (preset.widgets[id]) preset.widgets[id].hidden = !el.checked;
      updateWidgetConfig(id, { hidden: !el.checked });
    });
    closeModal(overlay);
    showDashboard();
  });
}

function showPresetsModal() {
  let presets = getPresets();
  const activeId = (() => { try { const c = JSON.parse(localStorage.getItem('dashboard-config') || '{}'); return c.activePresetId; } catch { return 'default'; } })();
  const defaultPreset = { id: 'default', name: 'Layout Padrão', desc: 'Layout original do dashboard', icon: 'fa-palette', _active: activeId === 'default' };
  presets = presets.filter(p => p.id !== 'default').map(p => ({ ...p, icon: p.icon || 'fa-layer-group', _active: p.id === activeId }));
  const allPresets = [defaultPreset, ...presets];
  let editMode = false;
  let selectedForDelete = new Set();

  const renderPresetCard = (p, inlineEditMode) => `<div class="modal-card-item ${p._active ? 'active' : ''} ${inlineEditMode ? 'edit-mode' : ''}" data-preset-id="${p.id}">
    ${inlineEditMode ? `<input type="checkbox" class="edit-checkbox" data-id="${p.id}" ${selectedForDelete.has(p.id) ? 'checked' : ''} />` : ''}
    <div class="card-icon"><i class="fas ${p.icon}"></i></div>
    <div class="card-info">
      <div class="card-title">${p.name} ${p._active ? '<span class="badge badge-primary">Ativo</span>' : ''}</div>
      <div class="card-sub">${p.desc || (p.widgets ? Object.keys(p.widgets).length + ' widgets' : '')}</div>
    </div>
    ${!inlineEditMode ? `<button class="btn btn-ghost btn-sm btnLoadPreset" data-id="${p.id}" title="Carregar" aria-label="Carregar"><i class="fas fa-check"></i> Carregar</button>` : ''}
  </div>`;

  const renderList = (inlineEditMode) => allPresets.map(p => renderPresetCard(p, inlineEditMode)).join('') || '<p style="padding:24px;text-align:center;color:var(--text-muted)">Nenhum preset salvo</p>';

  const updateEditBar = () => {
    const bar = overlay.querySelector('.edit-mode-bar');
    if (!bar) return;
    const count = selectedForDelete.size;
    bar.innerHTML = count > 0
      ? `<span class="edit-count"><i class="fas fa-trash-alt" style="margin-right:6px"></i>${count} selecionado(s)</span>
         <button class="btn btn-danger btn-sm" id="confirmBulkDelete"><i class="fas fa-trash"></i> Excluir selecionados</button>
         <button class="btn btn-ghost btn-sm" id="cancelBulkDelete">Cancelar</button>`
      : `<span class="edit-count"><i class="fas fa-pen" style="margin-right:6px"></i>Modo edição — marque os presets para excluir</span>
         <button class="btn btn-ghost btn-sm" id="exitEditMode"><i class="fas fa-times"></i> Sair da edição</button>`;
    bar.querySelector('#confirmBulkDelete')?.addEventListener('click', () => {
      if (!selectedForDelete.size) return;
      if (!confirm(`Excluir ${selectedForDelete.size} preset(s)? Esta ação não pode ser desfeita.`)) return;
      selectedForDelete.forEach(id => deletePreset(id));
      showToast(`${selectedForDelete.size} preset(s) excluído(s)!`, 'success');
      selectedForDelete.clear();
      editMode = false;
      presets = getPresets().map(p => ({ ...p, icon: p.icon || 'fa-layer-group', _active: p.id === activeId }));
      refreshList(false);
    });
    bar.querySelector('#cancelBulkDelete')?.addEventListener('click', () => {
      selectedForDelete.clear();
      refreshList(true);
    });
    bar.querySelector('#exitEditMode')?.addEventListener('click', () => {
      editMode = false;
      selectedForDelete.clear();
      refreshList(false);
    });
  };

  const refreshList = (keepEditMode) => {
    const listEl = overlay.querySelector('#presetList');
    if (!listEl) return;
    const isEdit = keepEditMode !== undefined ? keepEditMode : editMode;
    listEl.innerHTML = renderList(isEdit);
    if (isEdit) updateEditBar();
  };

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" style="max-width:520px">
    <div class="modal-header">
      <h2><i class="fas fa-palette" style="margin-right:8px"></i>Presets do Dashboard</h2>
      <button class="modal-close" aria-label="Fechar">&times;</button>
    </div>
    <div class="modal-body" style="max-height:420px;overflow-y:auto">
      <div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h4 style="margin:0">Seus Presets</h4>
          <button class="btn btn-ghost btn-sm" id="toggleEditMode" title="Editar presets"><i class="fas fa-pen"></i> Editar</button>
        </div>
        <div id="editBarContainer"></div>
        <div id="presetList">${renderList(false)}</div>
      </div>
      <div class="modal-divider"></div>
      <div style="margin-top:16px">
        <h4 style="margin-bottom:12px">Criar / Gerenciar</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input type="text" id="presetNameInput" placeholder="Nome do novo preset" style="flex:1;min-width:140px;height:38px;padding:0 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--text)" />
          <button class="btn btn-primary" id="btnSavePreset"><i class="fas fa-save"></i> Salvar</button>
          <button class="btn btn-success btn-sm" id="btnExportPreset"><i class="fas fa-file-export"></i> Exportar</button>
          <button class="btn btn-warning btn-sm" id="btnImportPreset"><i class="fas fa-file-import"></i> Importar</button>
          <button class="btn btn-danger btn-sm" id="btnResetPreset"><i class="fas fa-undo"></i> Resetar</button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" id="btnApplyPreset"><i class="fas fa-check"></i> Aplicar</button>
      <button class="btn btn-ghost" id="cancelPresets">Cancelar</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').addEventListener('click', () => closeModal(overlay));
  overlay.querySelector('#cancelPresets').addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  overlay.querySelector('#toggleEditMode').addEventListener('click', () => {
    editMode = !editMode;
    selectedForDelete.clear();
    const barContainer = overlay.querySelector('#editBarContainer');
    barContainer.innerHTML = editMode ? '<div class="edit-mode-bar"><span class="edit-count"><i class="fas fa-pen" style="margin-right:6px"></i>Modo edição — marque os presets para excluir</span><button class="btn btn-ghost btn-sm" id="exitEditMode"><i class="fas fa-times"></i> Sair da edição</button></div>' : '';
    refreshList(editMode);
    if (editMode) {
      barContainer.querySelector('#exitEditMode')?.addEventListener('click', () => {
        editMode = false;
        selectedForDelete.clear();
        refreshList(false);
        barContainer.innerHTML = '';
      });
    }
  });
  overlay.querySelector('#btnApplyPreset')?.addEventListener('click', () => {
    const sel = overlay.querySelector('input[name="presetRadio"]:checked');
    if (sel) { setActivePreset(sel.value); closeModal(overlay); showDashboard(); }
  });
  overlay.querySelector('#btnSavePreset')?.addEventListener('click', () => {
    const name = overlay.querySelector('#presetNameInput').value.trim();
    if (!name) { showToast('Digite um nome para o preset', 'warning'); return; }
    saveCurrentPreset(name);
    showToast(`Preset "${name}" salvo!`, 'success');
    closeModal(overlay);
  });
  overlay.querySelector('#btnExportPreset')?.addEventListener('click', () => {
    const json = exportPreset();
    if (!json) { showToast('Nenhum preset ativo para exportar', 'warning'); return; }
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dashboard-preset.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  overlay.querySelector('#btnImportPreset')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      if (importPreset(text)) { showToast('Preset importado!', 'success'); closeModal(overlay); showDashboard(); }
      else showToast('Erro ao importar preset. Verifique o formato.', 'error');
    };
    input.click();
  });
  overlay.querySelector('#btnResetPreset')?.addEventListener('click', () => {
    if (confirm('Resetar para o layout padrão?')) { resetToDefaults(); showToast('Preset resetado!', 'success'); closeModal(overlay); showDashboard(); }
  });
  overlay.addEventListener('click', (e) => {
    const cardItem = e.target.closest('.modal-card-item');
    if (!cardItem) return;

    if (editMode) {
      const cb = cardItem.querySelector('.edit-checkbox');
      if (cb) { cb.checked = !cb.checked; if (cb.checked) selectedForDelete.add(cb.dataset.id); else selectedForDelete.delete(cb.dataset.id); }
      updateEditBar();
      return;
    }
    const loadBtn = e.target.closest('.btnLoadPreset');
    if (loadBtn) { setActivePreset(loadBtn.dataset.id); closeModal(overlay); showDashboard(); return; }
    const id = cardItem.dataset.presetId;
    if (id && id !== 'default') {
      if (e.target.closest('.btnDeletePreset')) {
        if (confirm('Excluir este preset?')) { deletePreset(id); showToast('Preset excluído!', 'success'); refreshList(false); }
        return;
      }
    }
    if (id) { setActivePreset(id); closeModal(overlay); showDashboard(); }
  });
}

function showExtrato() {
  navigate('/extrato');
}

function showComprovantePopover(event, lancamentoId, indicatorEl) {
  const existing = document.getElementById('comprovantePopover');
  if (existing) existing.remove();
  const existingBackdrop = document.getElementById('comprovantePopoverBackdrop');
  if (existingBackdrop) existingBackdrop.remove();

  const rect = indicatorEl.getBoundingClientRect();
  const popover = document.createElement('div');
  popover.className = 'comprovante-popover';
  popover.id = 'comprovantePopover';
  popover.innerHTML = '<div class="comprovante-popover-header">Comprovantes</div><div class="comprovante-popover-grid" id="comprovantePopoverGrid"><div style="color:var(--text-muted);font-size:0.8rem"><i class="fas fa-spinner fa-spin"></i> Carregando...</div></div>';
  document.body.appendChild(popover);

  const left = Math.min(rect.left, window.innerWidth - popover.offsetWidth - 16);
  const top = rect.bottom + 6;
  popover.style.left = Math.max(8, left) + 'px';
  popover.style.top = top + 'px';

  const backdrop = document.createElement('div');
  backdrop.className = 'comprovante-popover-backdrop';
  backdrop.id = 'comprovantePopoverBackdrop';
  backdrop.addEventListener('click', () => { popover.remove(); backdrop.remove(); });
  document.body.appendChild(backdrop);

  loadComprovantesPopover(lancamentoId);
}

async function loadComprovantesPopover(lancamentoId) {
  const grid = document.getElementById('comprovantePopoverGrid');
  if (!grid) return;
  try {
    const list = await apiGet(`/api/comprovantes/${lancamentoId}`);
    grid.innerHTML = list.map(c => `
      <div class="comprovante-thumb" data-id="${c.id}">
        <img src="${c.url}" alt="${c.nome_arquivo || 'comprovante'}" loading="lazy" onclick="window.open('${c.url}', '_blank')" />
        <div class="comprovante-thumb-actions">
          <button onclick="window.open('${c.url}', '_blank')" title="Abrir"><i class="fas fa-external-link-alt"></i></button>
          <button onclick="DashboardPage_deleteComprovante(${c.id}, '${c.public_id}')" title="Excluir" style="color:#ef4444"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
    if (!list.length) grid.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;padding:8px 0">Nenhum comprovante</div>';
    grid.innerHTML += '<div class="comprovante-popover-add" id="comprovantePopoverAdd" title="Adicionar comprovante"><i class="fas fa-plus"></i></div>';
    document.getElementById('comprovantePopoverAdd')?.addEventListener('click', () => addComprovanteFromPopover(lancamentoId));
  } catch (err) {
    grid.innerHTML = '<div style="color:var(--danger);font-size:0.8rem">Erro ao carregar</div>';
  }
}

async function addComprovanteFromPopover(lancamentoId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.addEventListener('change', async () => {
    const userId = getUserIdFromToken();
    for (const file of input.files) {
      try {
        const publicId = `user_${userId}/lancamentos/${lancamentoId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const sig = await apiPost('/api/comprovantes/signature', { public_id: publicId });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('public_id', publicId);
        formData.append('api_key', sig.api_key);
        formData.append('timestamp', sig.timestamp);
        formData.append('signature', sig.signature);
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const errBody = await uploadRes.json().catch(() => ({}));
          console.error('Cloudinary upload error:', errBody);
          continue;
        }
        const uploadData = await uploadRes.json();
        await apiPost('/api/comprovantes', { lancamento_id: lancamentoId, url: uploadData.secure_url || uploadData.url, public_id: uploadData.public_id, nome_arquivo: file.name });
      } catch (err) {
        console.error('Erro upload comprovante:', err);
      }
    }
    loadComprovantesPopover(lancamentoId);
  });
  input.click();
}

async function DashboardPage_deleteComprovante(id, publicId) {
  if (!confirm('Excluir este comprovante?')) return;
  try {
    await apiDelete(`/api/comprovantes/${id}`);
    showToast('Comprovante removido!', 'success');
    const thumb = document.querySelector(`.comprovante-thumb[data-id="${id}"]`);
    if (thumb) thumb.remove();
  } catch (err) {
    showToast(err.message || 'Erro ao excluir');
  }
}

window.DashboardPage_deleteComprovante = DashboardPage_deleteComprovante;

function getUserIdFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'unknown';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || 'unknown';
  } catch {
    return 'unknown';
  }
}
