import { apiGet } from '../api.js';
import { formatCurrency, formatMonthBR } from '../utils/format.js';
import { navigate } from '../router.js';

let dados = [];
let _keyHandler = null;

export async function render(app) {
  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);

  app.innerHTML = `
    <div class="comparativo-page page-enter">
      <button class="profile-back-btn" id="comparativoBackBtn" title="Voltar ao Dashboard (Esc)">
        <span class="back-arrow"><i class="fas fa-arrow-left"></i></span>
        <span class="back-label">Dashboard</span>
        <span class="back-hint">⎋</span>
      </button>
      <div style="max-width:1000px;margin:0 auto;padding:24px">
        <h1 style="margin:0 0 24px"><i class="fas fa-chart-bar"></i> Comparativo Mensal</h1>
        <div id="comparativoPageContent">Carregando...</div>
      </div>
    </div>
  `;

  document.getElementById('comparativoBackBtn').addEventListener('click', () => navigate('/dashboard'));

  _keyHandler = (e) => {
    if (e.key === 'Escape') navigate('/dashboard');
  };
  document.addEventListener('keydown', _keyHandler);

  try {
    dados = await apiGet('/api/listar') || [];
    renderComparativo();
  } catch (err) {
    document.getElementById('comparativoPageContent').innerHTML = `<div class="error-message">Erro ao carregar dados: ${err.message}</div>`;
  }

  return () => {
    if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
    _keyHandler = null;
  };
}

function renderComparativo() {
  const el = document.getElementById('comparativoPageContent');
  if (!dados.length) {
    el.innerHTML = '<div style="color:var(--text-muted)">Nenhum dado disponível.</div>';
    return;
  }

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
  if (!mesesOrdem.length) {
    el.innerHTML = '<div style="color:var(--text-muted)">Nenhum dado disponível.</div>';
    return;
  }

  const totalEntradas = Object.values(meses).reduce((s, m) => s + m.entradas, 0);
  const totalSaidas = Object.values(meses).reduce((s, m) => s + m.saidas, 0);
  const linhas = mesesOrdem.map(m => {
    const d = meses[m];
    const diff = d.entradas - d.saidas;
    const cor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
    return `<div class="cmp-row"><span>${formatMonthBR(m)}</span><span>${formatCurrency(d.entradas)}</span><span>${formatCurrency(d.saidas)}</span><span style="color:${cor};font-weight:600">${formatCurrency(diff)}</span></div>`;
  }).join('');
  const diffTotal = totalEntradas - totalSaidas;
  const corTotal = diffTotal >= 0 ? 'var(--success)' : 'var(--danger)';

  el.innerHTML = `<div class="cmp-table">
    <div class="cmp-header"><span>Mês</span><span>Entradas</span><span>Saídas</span><span>Saldo</span></div>
    ${linhas}
    <div class="cmp-total"><span>Total</span><span>${formatCurrency(totalEntradas)}</span><span>${formatCurrency(totalSaidas)}</span><span style="color:${corTotal};font-weight:700">${formatCurrency(diffTotal)}</span></div>
  </div>`;
}