import { API_BASE_URL } from '../config.js';

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';
const SIDEBAR_COMPACT_KEY = 'sidebarCompactMode';

export function getSidebarCompactMode() {
  return localStorage.getItem(SIDEBAR_COMPACT_KEY) === 'true';
}

export function setSidebarCollapsed(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  if (collapsed) {
    document.body.classList.remove('sidebar-hover-expand');
  }
}

export function initSidebarState() {
  const compactMode = getSidebarCompactMode();
  if (compactMode) {
    document.body.classList.add('sidebar-collapsed', 'sidebar-compact-mode');
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
  } else {
    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    if (collapsed) document.body.classList.add('sidebar-collapsed');
  }
}

export function syncSidebarState(collapsed) {
  const token = localStorage.getItem('token');
  if (!token) return;
  fetch(API_BASE_URL + '/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ sidebarCollapsed: collapsed }),
  }).catch(() => {});
}

const PAGE_GROUP_MAP = {
  dashboard: 'Principal',
  extrato: 'Financeiro',
  orcamentos: 'Financeiro',
  recorrentes: 'Financeiro',
  desafios: 'Financeiro',
  comparativo: 'Financeiro',
  'nova-transacao': 'Ações',
  importar: 'Ações',
  perfil: 'Conta',
  categorias: 'Conta',
};

export function getPageGroup(page) {
  return PAGE_GROUP_MAP[page] || null;
}

export function updateSidebarNavGroup(activePage) {
  const group = getPageGroup(activePage);
  document.querySelectorAll('.nav-group-header').forEach(el => {
    el.classList.toggle('group-active', el.textContent.trim() === group);
  });
}
