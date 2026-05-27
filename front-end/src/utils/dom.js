import Toastify from 'toastify-js';

export function showToast(message, type = 'error') {
  const bgColor = type === 'success' ? '#10b981' :
                  type === 'warning' ? '#f59e0b' : '#ef4444';
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    style: { background: bgColor, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  }).showToast();
}

export function showUndoToast(message, onUndo, duration = 5000) {
  let timer;
  const handleClick = () => {
    clearTimeout(timer);
    toast.hideToast();
    onUndo();
  };
  const toast = Toastify({
    text: message + ' (clique para desfazer)',
    duration,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    style: { background: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', cursor: 'pointer' },
    onClick: handleClick,
  });
  toast.showToast();
}

export function showDashboardSkeleton() {
  const content = document.getElementById('pageContent');
  if (!content) return;
  content.innerHTML = `
    <div class="page-enter">
      <div class="stats-grid">
        <div class="stat-card"><div class="skeleton skeleton-card"></div></div>
        <div class="stat-card"><div class="skeleton skeleton-card"></div></div>
        <div class="stat-card"><div class="skeleton skeleton-card"></div></div>
        <div class="stat-card"><div class="skeleton skeleton-card"></div></div>
      </div>
      <div class="dashboard-charts">
        <div class="chart-card"><div class="skeleton skeleton-chart"></div></div>
        <div class="chart-card"><div class="skeleton skeleton-chart"></div></div>
      </div>
      <div class="table-wrapper" style="margin-top:20px">
        <div class="skeleton skeleton-row"></div>
        <div class="skeleton skeleton-row"></div>
        <div class="skeleton skeleton-row"></div>
        <div class="skeleton skeleton-row"></div>
        <div class="skeleton skeleton-row"></div>
      </div>
    </div>
  `;
}

export function showSpinner(message = 'Processando...') {
  const existing = document.getElementById('app-spinner');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'app-spinner';
  overlay.className = 'spinner-overlay';
  overlay.innerHTML = `
    <div class="spinner"></div>
    <p>${message}</p>
  `;
  document.body.appendChild(overlay);
}

export function hideSpinner() {
  const el = document.getElementById('app-spinner');
  if (el) el.remove();
}

export function emptyStateSVG(type) {
  const svgs = {
    chart: `<svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="60" width="24" height="48" rx="4" fill="currentColor" opacity=".08"/>
      <rect x="40" y="40" width="24" height="68" rx="4" fill="currentColor" opacity=".12"/>
      <rect x="72" y="20" width="24" height="88" rx="4" fill="currentColor" opacity=".06"/>
      <rect x="104" y="45" width="24" height="63" rx="4" fill="currentColor" opacity=".12"/>
      <rect x="136" y="55" width="16" height="53" rx="4" fill="currentColor" opacity=".06"/>
      <circle cx="128" cy="18" r="20" fill="currentColor" opacity=".04"/>
      <path d="M118 18l6 8 10-12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".15"/>
    </svg>`,
    search: `<svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="65" cy="50" r="26" stroke="currentColor" stroke-width="3" opacity=".1"/>
      <circle cx="65" cy="50" r="26" stroke="currentColor" stroke-width="2" opacity=".06" transform="scale(1.15) translate(-10,-8)"/>
      <line x1="84" y1="70" x2="104" y2="90" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".1"/>
      <rect x="120" y="75" width="28" height="6" rx="3" fill="currentColor" opacity=".04"/>
      <rect x="110" y="86" width="22" height="6" rx="3" fill="currentColor" opacity=".04"/>
      <rect x="125" y="97" width="30" height="6" rx="3" fill="currentColor" opacity=".04"/>
    </svg>`,
    list: `<svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="12" width="128" height="14" rx="4" fill="currentColor" opacity=".04"/>
      <rect x="16" y="34" width="128" height="14" rx="4" fill="currentColor" opacity=".04"/>
      <rect x="16" y="56" width="96" height="14" rx="4" fill="currentColor" opacity=".04"/>
      <rect x="16" y="78" width="128" height="14" rx="4" fill="currentColor" opacity=".04"/>
      <rect x="16" y="100" width="64" height="14" rx="4" fill="currentColor" opacity=".04"/>
      <circle cx="120" cy="63" r="4" fill="currentColor" opacity=".06"/>
      <circle cx="130" cy="63" r="4" fill="currentColor" opacity=".06"/>
      <circle cx="140" cy="63" r="4" fill="currentColor" opacity=".06"/>
    </svg>`,
  };
  return svgs[type] || svgs.chart;
}

export function renderEmptyState(container, { type = 'chart', title, subtitle } = {}) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-illustration">
        ${emptyStateSVG(type)}
      </div>
      <h3 class="empty-state-title">${title || 'Nada aqui ainda'}</h3>
      ${subtitle ? `<p class="empty-state-subtitle">${subtitle}</p>` : ''}
    </div>
  `;
}
