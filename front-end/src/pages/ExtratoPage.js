import { apiGet, logout } from '../api.js';
import { showToast, showSpinner, hideSpinner } from '../utils/dom.js';
import { formatDate, formatCurrency, getMonthName, isSaida } from '../utils/format.js';
import { navigate } from '../router.js';
import { isAuthenticated } from '../auth.js';
import Chart from 'chart.js/auto';

let lancamentos = [];
let chartInstances = {};

export async function render(app) {
  if (!isAuthenticated()) { navigate('/login'); return; }

  app.innerHTML = `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2><i class="fas fa-wallet"></i> Gestor</h2>
        </div>
        <nav class="sidebar-nav">
          <button class="nav-item" data-page="dashboard"><i class="fas fa-chart-bar"></i> Dashboard</button>
          <button class="nav-item active" data-page="extrato"><i class="fas fa-list"></i> Extrato</button>
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-sm btn-full" id="extratoLogout"><i class="fas fa-sign-out-alt"></i> Sair</button>
        </div>
      </aside>

      <main class="main-content">
        <div class="extrato-page">
          <div class="extrato-header">
            <div>
              <button class="btn btn-ghost btn-sm" id="extratoVoltar"><i class="fas fa-arrow-left"></i> Voltar</button>
              <h1 style="margin-top:12px"><i class="fas fa-chart-pie"></i> Extrato Financeiro</h1>
              <p style="color:var(--text-secondary)">Visualize todos os lançamentos</p>
            </div>
          </div>

          <div class="extrato-filters">
            <div class="filter-group">
              <label>Data</label>
              <input type="date" id="filtroData" />
            </div>
            <div class="filter-group">
              <label>Descrição</label>
              <input type="text" id="filtroDescricao" placeholder="Buscar..." />
            </div>
            <div class="filter-group">
              <label>Tipo</label>
              <select id="filtroTipo">
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Ano</label>
              <select id="filtroAno"><option value="">Todos</option></select>
            </div>
            <div style="display:flex;align-items:flex-end;gap:8px">
              <button class="btn btn-primary" id="aplicarFiltros"><i class="fas fa-search"></i> Filtrar</button>
              <button class="btn btn-ghost" id="limparFiltros"><i class="fas fa-times"></i> Limpar</button>
            </div>
          </div>

          <div class="total-records" id="totalRecords">Carregando...</div>

          <div class="card" style="overflow:hidden">
            <div class="table-wrapper">
              <table class="extrato-table">
                <thead>
                  <tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Tipo</th></tr>
                </thead>
                <tbody id="extratoTableBody"></tbody>
              </table>
            </div>
          </div>

          <div class="charts-section" style="display:none" id="chartsSection">
            <div class="chart-controls">
              <button class="btn btn-primary" id="gerarGraficos"><i class="fas fa-chart-bar"></i> Gerar Gráficos</button>
              <select id="chartTypeSelect">
                <option value="pie">Pizza</option>
                <option value="bar">Barras</option>
                <option value="doughnut">Donut</option>
                <option value="line">Linha</option>
              </select>
              <button class="btn btn-ghost btn-sm" id="exportChartBtn"><i class="fas fa-download"></i> Exportar Gráfico</button>
            </div>
            <div class="charts-grid">
              <div class="chart-card" id="chartCard1"><h3>Categorias</h3><canvas id="chartCategorias"></canvas></div>
              <div class="chart-card" id="chartCard2"><h3>Evolução Mensal</h3><canvas id="chartEvolucao"></canvas></div>
            </div>
          </div>

          <div style="margin-top:24px">
            <button class="btn btn-ghost" id="calcularFaturamento"><i class="fas fa-calculator"></i> Calcular Faturamento</button>
          </div>
          <div id="faturamentoSection" style="display:none;margin-top:16px"></div>

          <div style="margin-top:16px">
            <button class="btn btn-ghost" id="showResumoAnual"><i class="fas fa-calendar-alt"></i> Resumo Anual</button>
          </div>
          <div id="resumoAnualSection" class="resumo-anual" style="display:none;margin-top:16px">
            <div class="card">
              <h3 style="margin-bottom:16px">Resumo do Ano</h3>
              <div class="table-wrapper">
                <table><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody id="resumoAnualBody"></tbody></table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('extratoVoltar')?.addEventListener('click', () => navigate('/dashboard'));
  document.getElementById('extratoLogout')?.addEventListener('click', logout);
  document.getElementById('aplicarFiltros')?.addEventListener('click', aplicarFiltros);
  document.getElementById('limparFiltros')?.addEventListener('click', limparFiltros);
  document.getElementById('gerarGraficos')?.addEventListener('click', gerarGraficos);
  document.getElementById('chartTypeSelect')?.addEventListener('change', gerarGraficos);
  document.getElementById('exportChartBtn')?.addEventListener('click', exportChart);
  document.getElementById('calcularFaturamento')?.addEventListener('click', calcularFaturamento);
  document.getElementById('showResumoAnual')?.addEventListener('click', showResumoAnual);

  await carregarExtrato();
}

async function carregarExtrato() {
  showSpinner('Carregando extrato...');
  try {
    lancamentos = await apiGet('/api/listar');
    preencherAnos();
    exibirTabela(lancamentos);
    document.getElementById('chartsSection').style.display = 'block';
  } catch (err) {
    showToast('Erro ao carregar extrato: ' + err.message);
    document.getElementById('extratoTableBody').innerHTML =
      '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--danger)">Erro: ' + err.message + '</td></tr>';
  } finally {
    hideSpinner();
  }
}

function preencherAnos() {
  const select = document.getElementById('filtroAno');
  const anos = new Set(lancamentos.map(l => l.data ? new Date(l.data).getFullYear() : null).filter(Boolean));
  select.innerHTML = '<option value="">Todos</option>';
  [...anos].sort().reverse().forEach(a => {
    select.innerHTML += `<option value="${a}">${a}</option>`;
  });
}

function filtrar() {
  const data = document.getElementById('filtroData')?.value;
  const descricao = (document.getElementById('filtroDescricao')?.value || '').toLowerCase();
  const tipo = document.getElementById('filtroTipo')?.value;
  const ano = document.getElementById('filtroAno')?.value;

  return lancamentos.filter(l => {
    if (data && l.data && l.data.split('T')[0] !== data) return false;
    if (descricao && !(l.descricao || '').toLowerCase().includes(descricao)) return false;
    if (tipo) {
      const s = isSaida(l.entradaSaida);
      if (tipo === 'entrada' && s) return false;
      if (tipo === 'saida' && !s) return false;
    }
    if (ano && l.data && String(new Date(l.data).getFullYear()) !== ano) return false;
    return true;
  });
}

function exibirTabela(dados) {
  const tbody = document.getElementById('extratoTableBody');
  if (!dados.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">Nenhum lançamento encontrado</td></tr>';
    document.getElementById('totalRecords').textContent = '0 registros';
    return;
  }
  tbody.innerHTML = dados.map(l => {
    const saida = isSaida(l.entradaSaida);
    return `<tr>
      <td>${formatDate(l.data)}</td>
      <td>${l.descricao || '-'}</td>
      <td class="${saida ? 'negative' : 'positive'}">${formatCurrency(l.valor)}</td>
      <td><span class="badge ${saida ? 'saida' : 'entrada'}">${saida ? 'Saída' : 'Entrada'}</span></td>
    </tr>`;
  }).join('');
  document.getElementById('totalRecords').textContent = `${dados.length} registros`;
}

function aplicarFiltros() {
  const filtrados = filtrar();
  exibirTabela(filtrados);
}

function limparFiltros() {
  document.getElementById('filtroData').value = '';
  document.getElementById('filtroDescricao').value = '';
  document.getElementById('filtroTipo').value = '';
  if (document.getElementById('filtroAno')) document.getElementById('filtroAno').value = '';
  exibirTabela(lancamentos);
}

function destroyCharts() {
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} });
  chartInstances = {};
}

function gerarGraficos() {
  const filtrados = filtrar();
  const type = document.getElementById('chartTypeSelect').value;
  destroyCharts();
  gerarGraficoCatgorias(filtrados, type);
  gerarGraficoEvolucao(filtrados, type);
  document.getElementById('chartsSection').style.display = 'block';
}

function gerarGraficoCatgorias(dados, type) {
  const canvas = document.getElementById('chartCategorias');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const categorias = {};
  dados.forEach(l => {
    const cat = l.categoria || 'Sem categoria';
    const v = Math.abs(Number(l.valor) || 0);
    categorias[cat] = (categorias[cat] || 0) + v;
  });
  const labels = Object.keys(categorias);
  const values = Object.values(categorias);
  if (!labels.length) return;
  chartInstances.categorias = new Chart(ctx, {
    type: ['pie', 'doughnut'].includes(type) ? type : 'bar',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: gerarCores(labels.length) }],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
}

function gerarGraficoEvolucao(dados, type) {
  const canvas = document.getElementById('chartEvolucao');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const meses = {};
  dados.forEach(l => {
    if (!l.data) return;
    const d = new Date(l.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!meses[key]) meses[key] = { entradas: 0, saidas: 0 };
    const v = Number(l.valor) || 0;
    if (isSaida(l.entradaSaida)) meses[key].saidas += Math.abs(v);
    else meses[key].entradas += v;
  });
  const keys = Object.keys(meses).sort();
  if (!keys.length) return;
  chartInstances.evolucao = new Chart(ctx, {
    type: ['line', 'bar'].includes(type) ? type : 'bar',
    data: {
      labels: keys,
      datasets: [
        { label: 'Entradas', data: keys.map(k => meses[k].entradas), backgroundColor: 'rgba(16,185,129,0.7)', borderColor: '#10b981', borderWidth: 2, fill: false, tension: 0.3 },
        { label: 'Saídas', data: keys.map(k => meses[k].saidas), backgroundColor: 'rgba(239,68,68,0.7)', borderColor: '#ef4444', borderWidth: 2, fill: false, tension: 0.3 },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
}

function gerarCores(count) {
  const palette = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16'];
  return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}

function exportChart() {
  const canvas = document.getElementById('chartCategorias');
  if (!canvas) return;
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `grafico_${new Date().toISOString().split('T')[0]}.png`;
  link.click();
  showToast('Gráfico exportado!', 'success');
}

function calcularFaturamento() {
  const section = document.getElementById('faturamentoSection');
  const filtrados = filtrar();
  let entradas = 0, saidas = 0;
  filtrados.forEach(l => {
    const v = Number(l.valor) || 0;
    if (isSaida(l.entradaSaida)) saidas += Math.abs(v);
    else entradas += v;
  });
  const saldo = entradas - saidas;
  section.style.display = 'block';
  section.innerHTML = `
    <div class="faturamento-grid">
      <div class="faturamento-card">
        <div class="faturamento-label">Entradas</div>
        <div class="faturamento-value positive">${formatCurrency(entradas)}</div>
      </div>
      <div class="faturamento-card">
        <div class="faturamento-label">Saídas</div>
        <div class="faturamento-value negative">${formatCurrency(saidas)}</div>
      </div>
      <div class="faturamento-card">
        <div class="faturamento-label">Saldo</div>
        <div class="faturamento-value ${saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(saldo)}</div>
      </div>
      <div class="faturamento-card">
        <div class="faturamento-label">Transações</div>
        <div class="faturamento-value">${filtrados.length}</div>
      </div>
    </div>
  `;
}

function showResumoAnual() {
  const section = document.getElementById('resumoAnualSection');
  const tbody = document.getElementById('resumoAnualBody');
  const ano = new Date().getFullYear();

  const resumo = [];
  for (let i = 0; i < 12; i++) {
    const mes = String(i + 1).padStart(2, '0');
    let entrada = 0, saida = 0;
    lancamentos.forEach(l => {
      if (!l.data) return;
      const d = new Date(l.data);
      if (d.getFullYear() === ano && String(d.getMonth() + 1).padStart(2, '0') === mes) {
        const v = Number(l.valor) || 0;
        if (isSaida(l.entradaSaida)) saida += Math.abs(v);
        else entrada += v;
      }
    });
    resumo.push({ mes: getMonthName(i), entrada, saida, saldo: entrada - saida });
  }

  tbody.innerHTML = resumo.map(r => `
    <tr>
      <td>${r.mes}</td>
      <td class="positive">${formatCurrency(r.entrada)}</td>
      <td class="negative">${formatCurrency(-r.saida)}</td>
      <td class="${r.saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(r.saldo)}</td>
    </tr>
  `).join('');
  section.style.display = 'block';
}
