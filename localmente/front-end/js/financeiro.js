import { listar, salvar, editar, deletar, importar } from './api.js';
import { showSpinner, hideSpinner, showToast, showCustomMessage } from './utils.js';
import { formatarData, formatarValor, converterParaFormatoBackend } from './formatters.js';

let dadosFinanceiros = [];
let isEditing = false;
let paginaAtual = 1;
const registrosPorPagina = 15;
let lancamentoSelecionado = null;

export function getDadosFinanceiros() {
  return dadosFinanceiros;
}

export function setDadosFinanceiros(dados) {
  dadosFinanceiros = dados;
}

export function setIsEditing(editing) {
  isEditing = editing;
  atualizarBotoes();
}

export function getIsEditing() {
  return isEditing;
}

export function atualizarBotoes() {
  const confirmarBtn = document.getElementById('Confirmar');
  const deletarBtn = document.getElementById('Deletar');
  const selecionarBtn = document.getElementById('SelecionarTodos');
  
  if (isEditing) {
    if (confirmarBtn) confirmarBtn.style.display = 'none';
    if (deletarBtn) deletarBtn.style.display = 'none';
  } else {
    if (confirmarBtn) confirmarBtn.style.display = '';
    if (deletarBtn) deletarBtn.style.display = '';
  }
}

export async function carregarDados() {
  showSpinner('Carregando lançamentos...');
  try {
    const response = await listar();
    dadosFinanceiros = Array.isArray(response) ? response : response.lancamentos || [];
    paginaAtual = 1;
    renderizarPagina();
    renderizarCalendario();
    renderizarCategoriaResumo();
    renderizarRecorrentes();
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    showToast('Erro ao carregar os dados: ' + err.message, 'error');
  } finally {
    hideSpinner();
  }
}

export function criarLinhaTabela(lancamento, isNova = false) {
  const row = document.createElement('tr');
  row.dataset.id = lancamento.id;
  if (isNova) row.classList.add('nova-linha');

  const cellCheck = row.insertCell(0);
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'select-row';
  cellCheck.appendChild(checkbox);

  const cell1 = row.insertCell(1);
  const cell2 = row.insertCell(2);
  const cell3 = row.insertCell(3);
  const cell4 = row.insertCell(4);
  const cell5 = row.insertCell(5);
  const cell6 = row.insertCell(6);

  cell1.innerHTML = formatarData(lancamento.data);
  cell1.dataset.originalValue = lancamento.data;
  
  cell2.innerHTML = lancamento.descricao || '';
  cell2.dataset.originalValue = lancamento.descricao || '';
  
  const isNegative = Number(lancamento.valor) < 0;
  const valorExibir = isNegative ? lancamento.valor : lancamento.valor;
  const categoria = lancamento.categoria || 'Outros';
  const dataFormatada = formatarData(lancamento.data);
  
  cell3.innerHTML = `<span class="tooltip-trigger">${formatarValor(valorExibir)}<span class="tooltip-custom">Data: ${dataFormatada}<br>Categoria: ${categoria}<br>Método: ${lancamento.metodoPagamento || 'Dinheiro'}${lancamento.observacoes ? '<br>Obs: ' + lancamento.observacoes : ''}</span></span>`;
  cell3.dataset.originalValue = lancamento.valor;
  cell3.className = isNegative ? 'negative-value' : 'positive-value';
  
  cell4.innerHTML = `<span class="categoria-badge">${categoria}</span>`;
  cell4.dataset.originalValue = categoria;
  
  const tipoRaw = lancamento.entradaSaida || lancamento.entradatipo || lancamento.entradasaida || '';
  const tipoStr = String(tipoRaw).trim();
  const isSaida = tipoStr.toLowerCase() === 'saída' || tipoStr.toLowerCase() === 'saida';
  const tipoExibir = isSaida ? 'Saída' : 'Entrada';

  cell5.innerHTML = `<span class="tipo-badge ${isSaida ? 'saida' : 'entrada'}">${tipoExibir}</span>`;
  cell5.dataset.originalValue = tipoExibir;

  cell6.innerHTML = `<span class="metodo-badge">${lancamento.metodoPagamento || 'Dinheiro'}</span>`;
  cell6.dataset.originalValue = lancamento.metodoPagamento || 'Dinheiro';

  return row;
}

export async function confirmarLancamento() {
  const dataInput = document.getElementById('date').value;
  const descricao = document.getElementById('description').value;
  let valor = Number(document.getElementById('value').value);
  let entradaSaida = document.getElementById('select').value;
  const categoria = document.getElementById('categoria')?.value || 'Outros';
  const metodoPagamento = document.getElementById('metodo-pagamento')?.value || 'Dinheiro';
  const observacoes = document.getElementById('observacoes')?.value || '';

  if (!['Entrada', 'Saída'].includes(entradaSaida)) {
    showToast('Tipo deve ser "Entrada" ou "Saída"', 'error');
    return;
  }

  if (!dataInput || !descricao || isNaN(valor) || valor <= 0) {
    showToast('Todos os campos são obrigatórios!', 'error');
    return;
  }

  if (entradaSaida === 'Saída') {
    valor = -Math.abs(valor);
  } else {
    valor = Math.abs(valor);
  }

  showSpinner('Salvando lançamento...');
  try {
    const result = await salvar({ 
      data: dataInput, 
      descricao, 
      valor, 
      entradaSaida,
      categoria,
      metodoPagamento,
      observacoes
    });
    
    const novoLancamento = {
      id: result.id,
      data: dataInput,
      descricao,
      valor,
      entradaSaida,
      categoria,
      metodoPagamento,
      observacoes
    };
    dadosFinanceiros.unshift(novoLancamento);
    
    const tbody = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
    if (tbody) {
      const row = criarLinhaTabela(novoLancamento, true);
      tbody.insertBefore(row, tbody.firstChild);
    }
    
    atualizarSaldo();
    atualizarEstadoBotaoSelecionarTodos();
    atualizarPaginacao();
    renderizarCalendario();
    renderizarCategoriaResumo();
    renderizarRecorrentes();

    showToast(result.message || 'Lançamento salvo com sucesso!', 'success');

    document.getElementById('description').value = '';
    document.getElementById('value').value = '';
    document.getElementById('select').value = 'Entrada';
    document.getElementById('categoria').value = 'Outros';
    
    fecharModal();
  } catch (error) {
    console.error('Erro ao confirmar:', error);
    showToast('Erro ao salvar: ' + error.message, 'error');
  } finally {
    hideSpinner();
  }
}

export async function deletarSelecionados() {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  const checkboxes = tabela?.getElementsByClassName('select-row');
  if (!checkboxes || checkboxes.length === 0) {
    showToast('Nenhuma linha selecionada para deletar', 'warning');
    return;
  }

  const linhasParaDeletar = [];
  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
      const linha = checkboxes[i].parentElement.parentElement;
      const id = linha.dataset.id;
      if (id && !id.startsWith('temp_')) {
        linhasParaDeletar.push({ elemento: linha, id });
      } else if (id?.startsWith('temp_')) {
        linha.remove();
      }
    }
  }

  if (linhasParaDeletar.length === 0) {
    showToast('Nenhuma linha confirmada para deletar', 'warning');
    return;
  }

  showSpinner('Deletando linhas...');
  let successes = 0;
  let failures = 0;

  for (const { elemento, id } of linhasParaDeletar) {
    try {
      await deletar(id);
      elemento.remove();
      successes++;
    } catch (error) {
      console.error('Erro ao deletar:', error);
      failures++;
    }
  }

  hideSpinner();
  
  if (failures > 0) {
    showCustomMessage(`${successes} deletados, ${failures} falharam`, '#f44336');
  } else {
    showToast(`${successes} lançamento(s) deletado(s) com sucesso`, 'success');
  }

  atualizarSaldo();
  atualizarEstadoBotaoSelecionarTodos();
  atualizarPaginacao();
  renderizarCalendario();
  renderizarCategoriaResumo();
  renderizarRecorrentes();
}

export function atualizarSaldo() {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  const saldoElement = document.getElementById('SaldoAtual');
  const entradaElement = document.getElementById('total-entradas');
  const saidaElement = document.getElementById('total-saidas');
  
  if (!tabela) return;

  const rows = tabela.getElementsByTagName('tr');
  let saldo = 0;
  let totalEntradas = 0;
  let totalSaidas = 0;

  for (const row of rows) {
    if (row.style.display === 'none') continue;
    const valorCell = row.cells[3];
    if (valorCell && valorCell.dataset.originalValue !== undefined) {
      const valor = Number(valorCell.dataset.originalValue) || 0;
      saldo += valor;
      if (valor >= 0) {
        totalEntradas += valor;
      } else {
        totalSaidas += Math.abs(valor);
      }
    }
  }

  if (saldoElement) {
    saldoElement.innerHTML = formatarValor(saldo);
    if (saldo < 0) {
      saldoElement.classList.add('negative');
    } else {
      saldoElement.classList.remove('negative');
    }
  }
  
  if (entradaElement) {
    entradaElement.textContent = formatarValor(totalEntradas);
  }
  if (saidaElement) {
    saidaElement.textContent = formatarValor(totalSaidas);
  }
  
  atualizarMetaDisplay();
}

function atualizarMetaDisplay() {
  const meta = JSON.parse(localStorage.getItem('metaMensal') || '{}');
  const mesAtual = new Date().toISOString().slice(0, 7);
  
  if (meta.mes !== mesAtual) {
    return;
  }
  
  const gastoMes = dadosFinanceiros
    .filter(l => {
      const d = new Date(l.data).toISOString().slice(0, 7);
      const tipoRaw = l.entradaSaida || '';
      const tipoStr = String(tipoRaw).trim().toLowerCase();
      return d === mesAtual && (tipoStr === 'saída' || tipoStr === 'saida');
    })
    .reduce((sum, l) => sum + Math.abs(Number(l.valor)), 0);
  
  const metaValor = meta.valor || 0;
  const alertaPercent = meta.alerta || 80;
  
  const gastoEl = document.getElementById('meta-gasto');
  const restanteEl = document.getElementById('meta-restante');
  const progressEl = document.getElementById('meta-progress');
  const alertEl = document.getElementById('meta-alert');
  const alertMsgEl = document.getElementById('meta-alert-msg');
  
  if (gastoEl) gastoEl.textContent = formatarValor(gastoMes);
  
  const restante = metaValor - gastoMes;
  if (restanteEl) {
    restanteEl.textContent = `Restante: ${formatarValor(restante)}`;
    restanteEl.style.color = restante >= 0 ? 'var(--success)' : 'var(--danger)';
  }
  
  if (metaValor > 0) {
    const percent = Math.min((gastoMes / metaValor) * 100, 100);
    progressEl.style.width = `${percent}%`;
    
    if (percent >= 100) {
      progressEl.className = 'progress-fill danger';
      alertEl.style.display = 'flex';
      alertEl.className = 'meta-alert danger';
      alertMsgEl.textContent = 'Meta atingida! Orçamento excedido.';
    } else if (percent >= alertaPercent) {
      progressEl.className = 'progress-fill warning';
      alertEl.style.display = 'flex';
      alertEl.className = 'meta-alert warning';
      alertMsgEl.textContent = `Atenção: ${percent.toFixed(0)}% da meta já utilizada.`;
    } else {
      progressEl.className = 'progress-fill';
      alertEl.style.display = 'none';
    }
  }
}

export function atualizarEstadoBotaoSelecionarTodos() {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  const checkboxes = tabela?.getElementsByClassName('select-row');
  const selecionarTodos = document.getElementById('SelecionarTodos');

  if (!selecionarTodos) return;

  if (!checkboxes || checkboxes.length === 0) {
    selecionarTodos.disabled = true;
    selecionarTodos.innerHTML = '<i class="fas fa-check-double"></i> Selecionar Tudo';
    return;
  }

  selecionarTodos.disabled = false;
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  selecionarTodos.innerHTML = allChecked 
    ? '<i class="fas fa-check-double"></i> Desmarcar Todos' 
    : '<i class="fas fa-check-double"></i> Selecionar Tudo';
}

export function selecionarTodos() {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  const checkboxes = tabela?.getElementsByClassName('select-row');
  const selecionarTodosBtn = document.getElementById('SelecionarTodos');

  if (!selecionarTodosBtn || !checkboxes || checkboxes.length === 0) return;

  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  const newState = !allChecked;

  Array.from(checkboxes).forEach(cb => cb.checked = newState);
  atualizarEstadoBotaoSelecionarTodos();
}

export async function importarLancamentos(lancamentos) {
  showSpinner('Importando lançamentos...');
  try {
    const result = await importar(lancamentos);
    await carregarDados();
    showToast(`${result.insertedIds?.length || 0} lançamentos importados`, 'success');
    return result;
  } catch (error) {
    console.error('Erro ao importar:', error);
    showToast('Erro ao importar: ' + error.message, 'error');
    throw error;
  } finally {
    hideSpinner();
  }
}

export function abrirModal() {
  const modal = document.getElementById('modal-lancar');
  if (modal) {
    modal.style.display = 'flex';
    const dataInput = document.getElementById('date');
    if (dataInput && !dataInput.value) {
      dataInput.value = new Date().toISOString().split('T')[0];
    }
    document.getElementById('description')?.focus();
  }
}

export function fecharModal() {
  const modal = document.getElementById('modal-lancar');
  if (modal) {
    modal.style.display = 'none';
  }
}

export function filtrarLancamentos() {
  const busca = document.getElementById('filtro-busca')?.value.toLowerCase() || '';
  const tipoFiltro = document.getElementById('filtro-tipo')?.value || '';
  const categoriaFiltro = document.getElementById('filtro-categoria')?.value || '';
  const metodoFiltro = document.getElementById('filtro-metodo')?.value || '';
  const dataInicio = document.getElementById('filtro-data-inicio')?.value || '';
  const dataFim = document.getElementById('filtro-data-fim')?.value || '';

  dadosFinanceiros = dadosFinanceiros.filter(lancamento => {
    let mostrar = true;
    
    if (busca) {
      mostrar = mostrar && (lancamento.descricao || '').toLowerCase().includes(busca);
    }
    
    if (tipoFiltro) {
      const tipoRaw = lancamento.entradaSaida || '';
      const tipoStr = String(tipoRaw).trim().toLowerCase();
      const isSaida = tipoStr === 'saída' || tipoStr === 'saida';
      const tipoFinal = isSaida ? 'Saída' : 'Entrada';
      mostrar = mostrar && tipoFinal === tipoFiltro;
    }
    
    if (categoriaFiltro) {
      mostrar = mostrar && (lancamento.categoria || 'Outros') === categoriaFiltro;
    }

    if (metodoFiltro) {
      mostrar = mostrar && (lancamento.metodoPagamento || 'Dinheiro') === metodoFiltro;
    }
    
    if (dataInicio) {
      mostrar = mostrar && lancamento.data >= dataInicio;
    }
    
    if (dataFim) {
      mostrar = mostrar && lancamento.data <= dataFim;
    }
    
    return mostrar;
  });

  paginaAtual = 1;
  renderizarPagina();
  renderizarCalendario();
  renderizarCategoriaResumo();
  renderizarRecorrentes();
}

export function limparFiltros() {
  document.getElementById('filtro-busca').value = '';
  document.getElementById('filtro-tipo').value = '';
  document.getElementById('filtro-categoria').value = '';
  document.getElementById('filtro-metodo').value = '';
  document.getElementById('filtro-data-inicio').value = '';
  document.getElementById('filtro-data-fim').value = '';

  carregarDados();
}

let ordenacaoAtual = { coluna: null, asc: true };

window.ordenarTabela = function(coluna) {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  if (!tabela) return;

  const rows = Array.from(tabela.getElementsByTagName('tr'));
  
  if (ordenacaoAtual.coluna === coluna) {
    ordenacaoAtual.asc = !ordenacaoAtual.asc;
  } else {
    ordenacaoAtual.coluna = coluna;
    ordenacaoAtual.asc = true;
  }

  rows.sort((a, b) => {
    let valorA, valorB;
    
    switch(coluna) {
      case 1: // Data
        valorA = a.cells[1].dataset.originalValue || '';
        valorB = b.cells[1].dataset.originalValue || '';
        break;
      case 2: // Descrição
        valorA = a.cells[2].textContent.toLowerCase();
        valorB = b.cells[2].textContent.toLowerCase();
        break;
      case 3: // Valor
        valorA = Number(a.cells[3].dataset.originalValue) || 0;
        valorB = Number(b.cells[3].dataset.originalValue) || 0;
        break;
      case 4: // Categoria
        valorA = a.cells[4].textContent.toLowerCase();
        valorB = b.cells[4].textContent.toLowerCase();
        break;
      case 5: // Tipo
        valorA = a.cells[5].textContent.toLowerCase();
        valorB = b.cells[5].textContent.toLowerCase();
        break;
      case 6: // Método
        valorA = a.cells[6].textContent.toLowerCase();
        valorB = b.cells[6].textContent.toLowerCase();
        break;
      default:
        return 0;
    }

    if (valorA < valorB) return ordenacaoAtual.asc ? -1 : 1;
    if (valorA > valorB) return ordenacaoAtual.asc ? 1 : -1;
    return 0;
  });

  rows.forEach(row => tabela.appendChild(row));

  document.querySelectorAll('.Generator-table th.sortable i').forEach(icon => {
    icon.className = 'fas fa-sort';
  });
  const th = document.querySelector(`.Generator-table th:nth-child(${coluna}) i`);
  if (th) {
    th.className = ordenacaoAtual.asc ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }
};

function calcularSaldoFiltrado() {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  const saldoElement = document.getElementById('SaldoAtual');
  const entradaElement = document.getElementById('total-entradas');
  const saidaElement = document.getElementById('total-saidas');
  if (!tabela) return;

  const rows = tabela.getElementsByTagName('tr');
  let saldo = 0;
  let totalEntradas = 0;
  let totalSaidas = 0;

  for (const row of rows) {
    if (row.style.display === 'none') continue;
    const valorCell = row.cells[3];
    if (valorCell && valorCell.dataset.originalValue !== undefined) {
      const valor = Number(valorCell.dataset.originalValue) || 0;
      saldo += valor;
      if (valor >= 0) {
        totalEntradas += valor;
      } else {
        totalSaidas += Math.abs(valor);
      }
    }
  }

  if (saldoElement) {
    saldoElement.textContent = formatarValor(saldo);
    if (saldo < 0) {
      saldoElement.classList.add('negative');
    } else {
      saldoElement.classList.remove('negative');
    }
  }
  if (entradaElement) entradaElement.textContent = formatarValor(totalEntradas);
  if (saidaElement) saidaElement.textContent = formatarValor(totalSaidas);
}

export function atualizarPaginacao() {
  const totalPaginas = Math.ceil(dadosFinanceiros.length / registrosPorPagina) || 1;
  const pageInfo = document.getElementById('page-info');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const totalRecords = document.getElementById('total-records');
  
  if (pageInfo) {
    pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
  }
  if (prevBtn) prevBtn.disabled = paginaAtual <= 1;
  if (nextBtn) nextBtn.disabled = paginaAtual >= totalPaginas;
  if (totalRecords) {
    totalRecords.textContent = `${dadosFinanceiros.length} registro${dadosFinanceiros.length !== 1 ? 's' : ''}`;
  }
}

export function mudarPagina(direcao) {
  const totalPaginas = Math.ceil(dadosFinanceiros.length / registrosPorPagina) || 1;
  if (direcao === 'prev' && paginaAtual > 1) {
    paginaAtual--;
  } else if (direcao === 'next' && paginaAtual < totalPaginas) {
    paginaAtual++;
  }
  renderizarPagina();
}

function renderizarPagina() {
  const tbody = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  if (!tbody) return;

  tbody.innerHTML = '';
  const inicio = (paginaAtual - 1) * registrosPorPagina;
  const fim = inicio + registrosPorPagina;
  const paginaDados = dadosFinanceiros.slice(inicio, fim);

  paginaDados.forEach(lancamento => {
    const row = criarLinhaTabela(lancamento);
    tbody.appendChild(row);
  });

  atualizarPaginacao();
  atualizarSaldo();
}

export function alternarTema() {
  const body = document.body;
  const botao = document.getElementById('toggle-theme');
  const icon = botao?.querySelector('i');
  
  if (body.getAttribute('data-theme') === 'light') {
    body.removeAttribute('data-theme');
    localStorage.setItem('tema', 'escuro');
    if (icon) icon.className = 'fas fa-moon';
  } else {
    body.setAttribute('data-theme', 'light');
    localStorage.setItem('tema', 'claro');
    if (icon) icon.className = 'fas fa-sun';
  }
}

export function initTema() {
  const tema = localStorage.getItem('tema');
  const botao = document.getElementById('toggle-theme');
  const icon = botao?.querySelector('i');
  
  if (tema === 'light') {
    document.body.setAttribute('data-theme', 'light');
    if (icon) icon.className = 'fas fa-sun';
  }
  
  if (botao) {
    botao.addEventListener('click', alternarTema);
  }
}

export function abrirDetalhes(lancamento) {
  lancamentoSelecionado = lancamento;
  const modal = document.getElementById('modal-detalhes');
  const content = document.getElementById('detalhes-content');
  
  if (!modal || !content) return;
  
  const isNegative = Number(lancamento.valor) < 0;
  const tipoRaw = lancamento.entradaSaida || '';
  const tipoStr = String(tipoRaw).trim();
  const isSaida = tipoStr.toLowerCase() === 'saída' || tipoStr.toLowerCase() === 'saida';
  
  content.innerHTML = `
    <div class="detalhes-grid">
      <div class="detalhes-item">
        <label>Data</label>
        <span>${formatarData(lancamento.data)}</span>
      </div>
      <div class="detalhes-item">
        <label>Descrição</label>
        <span>${lancamento.descricao || '-'}</span>
      </div>
      <div class="detalhes-item">
        <label>Valor</label>
        <span class="${isNegative ? 'negative-value' : 'positive-value'}">${formatarValor(lancamento.valor)}</span>
      </div>
      <div class="detalhes-item">
        <label>Categoria</label>
        <span>${lancamento.categoria || 'Outros'}</span>
      </div>
      <div class="detalhes-item">
        <label>Tipo</label>
        <span class="tipo-badge ${isSaida ? 'saida' : 'entrada'}">${isSaida ? 'Saída' : 'Entrada'}</span>
      </div>
      <div class="detalhes-item">
        <label>Método</label>
        <span class="metodo-badge">${lancamento.metodoPagamento || 'Dinheiro'}</span>
      </div>
      ${lancamento.observacoes ? `
      <div class="detalhes-item">
        <label>Observações</label>
        <span>${lancamento.observacoes}</span>
      </div>
      ` : ''}
    </div>
  `;
  
  modal.style.display = 'flex';
}

export function duplicarLancamento() {
  if (!lancamentoSelecionado) return;
  
  const modal = document.getElementById('modal-detalhes');
  if (modal) modal.style.display = 'none';
  
  document.getElementById('date').value = lancamentoSelecionado.data;
  document.getElementById('description').value = lancamentoSelecionado.descricao;
  document.getElementById('value').value = Math.abs(lancamentoSelecionado.valor);
  
  const tipoRaw = lancamentoSelecionado.entradaSaida || '';
  const tipoStr = String(tipoRaw).trim();
  const isSaida = tipoStr.toLowerCase() === 'saída' || tipoStr.toLowerCase() === 'saida';
  document.getElementById('select').value = isSaida ? 'Saída' : 'Entrada';
  
  document.getElementById('categoria').value = lancamentoSelecionado.categoria || 'Outros';
  document.getElementById('metodo-pagamento').value = lancamentoSelecionado.metodoPagamento || 'Dinheiro';
  document.getElementById('observacoes').value = lancamentoSelecionado.observacoes || '';
  
  abrirModal();
}

export function setupEventosTabela() {
  const tabela = document.getElementById('generator-table');
  if (!tabela) return;
  
  tabela.addEventListener('dblclick', (e) => {
    const row = e.target.closest('tr');
    if (row && row.dataset.id) {
      const lancamento = dadosFinanceiros.find(l => l.id == row.dataset.id);
      if (lancamento) {
        abrirDetalhes(lancamento);
      }
    }
  });
}

export function initMeta() {
  const metaSection = document.getElementById('meta-section');
  const editarBtn = document.getElementById('editar-meta');
  const salvarBtn = document.getElementById('btn-salvar-meta');
  const cancelarBtn = document.getElementById('btn-cancelar-meta');
  const closeMetaBtn = document.getElementById('close-modal-meta');
  const modalMeta = document.getElementById('modal-meta');
  
  function loadMeta() {
    const meta = JSON.parse(localStorage.getItem('metaMensal') || '{}');
    const mesAtual = new Date().toISOString().slice(0, 7);
    
    if (meta.mes !== mesAtual) {
      meta.valor = 0;
      meta.alerta = 80;
      meta.mes = mesAtual;
    }
    
    document.getElementById('meta-input-valor').value = meta.valor || '';
    document.getElementById('meta-input-alerta').value = meta.alerta || 80;
    
    atualizarMeta(meta.valor, meta.alerta);
  }
  
  function atualizarMeta(metaValor, alertaPercent) {
    const now = new Date();
    const mesAtual = now.toISOString().slice(0, 7);
    
    const gastoMes = dadosFinanceiros
      .filter(l => {
        const d = new Date(l.data).toISOString().slice(0, 7);
        const tipoRaw = l.entradaSaida || '';
        const tipoStr = String(tipoRaw).trim().toLowerCase();
        return d === mesAtual && (tipoStr === 'saída' || tipoStr === 'saida');
      })
      .reduce((sum, l) => sum + Math.abs(Number(l.valor)), 0);
    
    const metaEl = document.getElementById('meta-valor');
    const gastoEl = document.getElementById('meta-gasto');
    const restanteEl = document.getElementById('meta-restante');
    const progressEl = document.getElementById('meta-progress');
    const alertEl = document.getElementById('meta-alert');
    const alertMsgEl = document.getElementById('meta-alert-msg');
    
    if (metaEl) metaEl.textContent = formatarValor(metaValor || 0);
    if (gastoEl) gastoEl.textContent = formatarValor(gastoMes);
    
    const restante = (metaValor || 0) - gastoMes;
    if (restanteEl) {
      restanteEl.textContent = `Restante: ${formatarValor(restante)}`;
      restanteEl.style.color = restante >= 0 ? 'var(--success)' : 'var(--danger)';
    }
    
    if (metaValor > 0) {
      const percent = Math.min((gastoMes / metaValor) * 100, 100);
      progressEl.style.width = `${percent}%`;
      
      if (percent >= 100) {
        progressEl.className = 'progress-fill danger';
        alertEl.style.display = 'flex';
        alertEl.className = 'meta-alert danger';
        alertMsgEl.textContent = 'Meta atingida! Orçamento exceededido.';
      } else if (percent >= alertaPercent) {
        progressEl.className = 'progress-fill warning';
        alertEl.style.display = 'flex';
        alertEl.className = 'meta-alert warning';
        alertMsgEl.textContent = `Atenção: ${percent.toFixed(0)}% da meta já utilizada.`;
      } else {
        progressEl.className = 'progress-fill';
        alertEl.style.display = 'none';
      }
    } else {
      progressEl.style.width = '0%';
      alertEl.style.display = 'none';
    }
  }
  
  if (editarBtn) {
    editarBtn.addEventListener('click', () => {
      loadMeta();
      modalMeta.style.display = 'flex';
    });
  }
  
  if (salvarBtn) {
    salvarBtn.addEventListener('click', () => {
      const valor = Number(document.getElementById('meta-input-valor').value) || 0;
      const alerta = Number(document.getElementById('meta-input-alerta').value) || 80;
      const mesAtual = new Date().toISOString().slice(0, 7);
      
      localStorage.setItem('metaMensal', JSON.stringify({ valor, alerta, mes: mesAtual }));
      modalMeta.style.display = 'none';
      atualizarMeta(valor, alerta);
      showToast('Meta definida com sucesso!', 'success');
    });
  }
  
  if (cancelarBtn) {
    cancelarBtn.addEventListener('click', () => {
      modalMeta.style.display = 'none';
    });
  }
  
  if (closeMetaBtn) {
    closeMetaBtn.addEventListener('click', () => {
      modalMeta.style.display = 'none';
    });
  }
  
  modalMeta.addEventListener('click', (e) => {
    if (e.target === modalMeta) modalMeta.style.display = 'none';
  });
  
  loadMeta();
}

export function fazerBackup() {
  const dados = {
    exportarEm: new Date().toISOString(),
    lancamentos: dadosFinanceiros
  };
  
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('Backup realizado com sucesso!', 'success');
}

export function initBackup() {
  const backupBtn = document.getElementById('backup-btn');
  const exportFullBtn = document.getElementById('export-full-btn');
  
  if (backupBtn) backupBtn.addEventListener('click', fazerBackup);
  if (exportFullBtn) exportFullBtn.addEventListener('click', () => {
    fazerBackup();
  });
}

export function renderizarCategoriaResumo() {
  const grid = document.getElementById('categoria-grid');
  if (!grid) return;
  
  const categorias = {};
  const icones = {
    'Alimentação': '🍔',
    'Transporte': '🚗',
    'Lazer': '🎮',
    'Saúde': '💊',
    'Educação': '📚',
    'Moradia': '🏠',
    'Salário': '💰',
    'Investimento': '📈',
    'Presente': '🎁',
    'Serviços': '🔧',
    'Outros': '📦'
  };
  
  dadosFinanceiros.forEach(l => {
    const tipoRaw = l.entradaSaida || '';
    const tipoStr = String(tipoRaw).trim().toLowerCase();
    if (tipoStr === 'saída' || tipoStr === 'saida') {
      const cat = l.categoria || 'Outros';
      categorias[cat] = (categorias[cat] || 0) + Math.abs(Number(l.valor));
    }
  });
  
  const sorted = Object.entries(categorias).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Nenhum gasto registrado</p>';
    return;
  }
  
  grid.innerHTML = sorted.map(([cat, valor]) => `
    <div class="categoria-card">
      <div class="cat-icon">${icones[cat] || '📦'}</div>
      <div class="cat-nome">${cat}</div>
      <div class="cat-valor">${formatarValor(valor)}</div>
    </div>
  `).join('');
}

export function renderizarRecorrentes() {
  const list = document.getElementById('recorrentes-list');
  if (!list) return;
  
  const descricoes = {};
  dadosFinanceiros.forEach(l => {
    const tipoRaw = l.entradaSaida || '';
    const tipoStr = String(tipoRaw).trim().toLowerCase();
    if (tipoStr === 'saída' || tipoStr === 'saida') {
      const desc = l.descricao?.toLowerCase().trim();
      if (desc) {
        if (!descricoes[desc]) {
          descricoes[desc] = { desc: l.descricao, valor: Math.abs(Number(l.valor)), count: 0, categoria: l.categoria };
        }
        descricoes[desc].count++;
      }
    }
  });
  
  const recorrentes = Object.values(descricoes)
    .filter(d => d.count >= 2)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
  
  if (recorrentes.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Nenhum gasto recorrente detectado</p>';
    return;
  }
  
  list.innerHTML = recorrentes.map(r => `
    <div class="recorrente-item">
      <div class="recorrente-info">
        <div class="recorrente-icon"><i class="fas fa-redo"></i></div>
        <div>
          <div class="recorrente-nome">${r.desc}</div>
          <div class="recorrente-freq">${r.count}x no histórico</div>
        </div>
      </div>
      <div class="recorrente-valor">${formatarValor(r.valor)}/mês</div>
    </div>
  `).join('');
}

let dataCalendario = new Date();

export function renderizarCalendario() {
  const container = document.getElementById('calendario-dias');
  const mesAnoEl = document.getElementById('calendario-mes-ano');
  if (!container) return;
  
  const ano = dataCalendario.getFullYear();
  const mes = dataCalendario.getMonth();
  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  if (mesAnoEl) mesAnoEl.textContent = `${mesesNome[mes]} ${ano}`;
  
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();
  
  const lancamentosPorDia = {};
  dadosFinanceiros.forEach(l => {
    const d = new Date(l.data);
    if (d.getMonth() === mes && d.getFullYear() === ano) {
      const dia = d.getDate();
      if (!lancamentosPorDia[dia]) lancamentosPorDia[dia] = { entrada: 0, saida: 0 };
      const tipoRaw = l.entradaSaida || '';
      const tipoStr = String(tipoRaw).trim().toLowerCase();
      if (tipoStr === 'saída' || tipoStr === 'saida') {
        lancamentosPorDia[dia].saida++;
      } else {
        lancamentosPorDia[dia].entrada++;
      }
    }
  });
  
  let html = '';
  
  for (let i = 0; i < primeiroDia; i++) {
    html += '<div class="calendario-dia"></div>';
  }
  
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const isHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;
    const temLanc = lancamentosPorDia[dia];
    const classes = ['calendario-dia'];
    if (isHoje) classes.push('dia-atual');
    if (temLanc) classes.push('tem-lancamento');
    
    html += `<div class="${classes.join(' ')}">
      <span>${dia}</span>
      ${temLanc ? `<div class="lancamento-pontos">
        ${temLanc.entrada > 0 ? '<span class="ponto entrada"></span>' : ''}
        ${temLanc.saida > 0 ? '<span class="ponto saida"></span>' : ''}
      </div>` : ''}
    </div>`;
  }
  
  container.innerHTML = html;
}

export function initCalendario() {
  const btnAnt = document.getElementById('calendario-anterior');
  const btnProx = document.getElementById('calendario-proximo');
  
  if (btnAnt) {
    btnAnt.addEventListener('click', () => {
      dataCalendario.setMonth(dataCalendario.getMonth() - 1);
      renderizarCalendario();
    });
  }
  
  if (btnProx) {
    btnProx.addEventListener('click', () => {
      dataCalendario.setMonth(dataCalendario.getMonth() + 1);
      renderizarCalendario();
    });
  }
  
  renderizarCalendario();
}

export function initSecoesExtras() {
  renderizarCategoriaResumo();
  renderizarRecorrentes();
  initCalendario();
  initOrcamentoCategoria();
}

const categoriasIcones = {
  'Alimentação': 'fa-utensils',
  'Transporte': 'fa-car',
  'Lazer': 'fa-gamepad',
  'Saúde': 'fa-heartbeat',
  'Educação': 'fa-graduation-cap',
  'Moradia': 'fa-home',
  'Salário': 'fa-money-bill',
  'Investimento': 'fa-chart-line',
  'Presente': 'fa-gift',
  'Serviços': 'fa-concierge-bell',
  'Outros': 'fa-folder'
};

export function initOrcamentoCategoria() {
  const modalOrcamento = document.getElementById('modal-orcamento-categoria');
  const closeBtn = document.getElementById('close-modal-orcamento-categoria');
  const select = document.getElementById('orcamento-categoria-select');
  const inputValor = document.getElementById('orcamento-categoria-valor');
  const btnAdd = document.getElementById('btn-add-orcamento-categoria');
  const btnSalvar = document.getElementById('btn-salvar-orcamento-categoria');
  const list = document.getElementById('orcamento-categoria-list');

  let orcamentosCategoria = JSON.parse(localStorage.getItem('orcamentosCategoria') || '{}');

  function renderizarLista() {
    if (!list) return;
    list.innerHTML = '';

    const mesAtual = new Date().toISOString().slice(0, 7);
    const orcamentos = orcamentosCategoria[mesAtual] || {};

    Object.entries(orcamentos).forEach(([categoria, valor]) => {
      const gastoMes = dadosFinanceiros
        .filter(l => l.categoria === categoria && l.entradaSaida !== 'Entrada')
        .reduce((acc, l) => acc + Math.abs(Number(l.valor)), 0);

      const div = document.createElement('div');
      div.className = 'orcamento-item';
      div.innerHTML = `
        <div class="orcamento-item-info">
          <div class="cat-icon"><i class="fas ${categoriasIcones[categoria] || 'fa-folder'}"></i></div>
          <span>${categoria}</span>
        </div>
        <div class="orcamento-item-valores">
          <span class="orcamento-item-atual ${gastoMes > valor * 0.8 ? (gastoMes > valor ? 'danger' : 'warning') : ''}">
            R$ ${gastoMes.toFixed(2)} / R$ ${Number(valor).toFixed(2)}
          </span>
          <button class="orcamento-item-delete" data-categoria="${categoria}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      list.appendChild(div);
    });

    list.querySelectorAll('.orcamento-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.dataset.categoria;
        delete orcamentos[cat];
        orcamentosCategoria[mesAtual] = orcamentos;
        localStorage.setItem('orcamentosCategoria', JSON.stringify(orcamentosCategoria));
        renderizarLista();
      });
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const categoria = select.value;
      const valor = Number(inputValor.value);

      if (!valor || valor <= 0) {
        showToast('Defina um valor válido', 'error');
        return;
      }

      const mesAtual = new Date().toISOString().slice(0, 7);
      if (!orcamentosCategoria[mesAtual]) orcamentosCategoria[mesAtual] = {};
      orcamentosCategoria[mesAtual][categoria] = valor;
      localStorage.setItem('orcamentosCategoria', JSON.stringify(orcamentosCategoria));

      inputValor.value = '';
      renderizarLista();
      showToast(`Orçamento para ${categoria} adicionado!`, 'success');
    });
  }

  if (btnSalvar) {
    btnSalvar.addEventListener('click', () => {
      showToast('Orçamentos salvos!', 'success');
      if (modalOrcamento) modalOrcamento.style.display = 'none';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modalOrcamento) modalOrcamento.style.display = 'none';
    });
  }

  if (modalOrcamento) {
    modalOrcamento.addEventListener('click', (e) => {
      if (e.target === modalOrcamento) modalOrcamento.style.display = 'none';
    });
  }

  renderizarLista();
}

export function abrirOrcamentoCategoria() {
  const modal = document.getElementById('modal-orcamento-categoria');
  if (modal) modal.style.display = 'flex';
}

export function initNotificacoes() {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function verificarNotificacoes() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const meta = JSON.parse(localStorage.getItem('metaMensal') || '{}');
  const mesAtual = new Date().toISOString().slice(0, 7);

  if (meta.mes !== mesAtual || !meta.valor) return;

  const gastoMes = dadosFinanceiros
    .filter(l => {
      const d = new Date(l.data).toISOString().slice(0, 7);
      const tipoRaw = l.entradaSaida || '';
      const tipoStr = String(tipoRaw).trim().toLowerCase();
      return d === mesAtual && (tipoStr === 'saída' || tipoStr === 'saida');
    })
    .reduce((sum, l) => sum + Math.abs(Number(l.valor)), 0);

  const percent = (gastoMes / meta.valor) * 100;
  const alerta = meta.alerta || 80;

  if (percent >= 100) {
    new Notification('⚠️ Meta Excedida!', {
      body: `Você já usou R$ ${gastoMes.toFixed(2)} de R$ ${meta.valor} da sua meta deste mês.`,
      icon: './icon.png'
    });
  } else if (percent >= alerta) {
    new Notification('💰 Alerta de Gastos', {
      body: `Você já usou ${percent.toFixed(0)}% da sua meta mensal.`,
      icon: './icon.png'
    });
  }

  const orcamentos = JSON.parse(localStorage.getItem('orcamentosCategoria') || '{}')[mesAtual] || {};
  Object.entries(orcamentos).forEach(([categoria, valor]) => {
    const gastoCat = dadosFinanceiros
      .filter(l => l.categoria === categoria && (l.entradaSaida || '').toLowerCase() !== 'entrada')
      .reduce((acc, l) => acc + Math.abs(Number(l.valor)), 0);

    const percentCat = (gastoCat / valor) * 100;
    if (percentCat >= 100) {
      new Notification(`⚠️ ${categoria}`, {
        body: `Orçamento excedido: R$ ${gastoCat.toFixed(2)} de R$ ${valor}`,
        icon: './icon.png'
      });
    }
  });
}

export function initTransacoesRecorrentes() {
  const btnSalvar = document.getElementById('btn-salvar-recorrente');
  const btnListar = document.getElementById('btn-listar-recorrentes');
  const closeBtn = document.getElementById('close-modal-recorrente');
  const modal = document.getElementById('modal-recorrente');

  if (btnSalvar) {
    btnSalvar.addEventListener('click', () => {
      const descricao = document.getElementById('recorrente-descricao').value;
      const valor = Number(document.getElementById('recorrente-valor').value);
      const categoria = document.getElementById('recorrente-categoria').value;
      const tipo = document.getElementById('recorrente-tipo').value;
      const dia = Number(document.getElementById('recorrente-dia').value);
      const duracao = document.getElementById('recorrente-duracao').value;
      const ativo = document.getElementById('recorrente-ativo').checked;

      if (!descricao || !valor) {
        showToast('Preencha os campos obrigatórios', 'error');
        return;
      }

      const recorrente = { descricao, valor, categoria, tipo, dia, duracao, ativo, createdAt: new Date().toISOString() };
      const recorrentes = JSON.parse(localStorage.getItem('transacoesRecorrentes') || '[]');
      recorrentes.push(recorrente);
      localStorage.setItem('transacoesRecorrentes', JSON.stringify(recorrentes));

      showToast('Transação recorrente configurada!', 'success');
      document.getElementById('recorrente-descricao').value = '';
      document.getElementById('recorrente-valor').value = '';
    });
  }

  if (btnListar) {
    btnListar.addEventListener('click', () => {
      const recorrentes = JSON.parse(localStorage.getItem('transacoesRecorrentes') || '[]');
      if (recorrentes.length === 0) {
        showToast('Nenhuma transação recorrente configurada', 'info');
        return;
      }

      let msg = 'Transações Recorrentes:\n\n';
      recorrentes.forEach((r, i) => {
        msg += `${i + 1}. ${r.descricao} - R$ ${r.valor} (${r.tipo}) - Dia ${r.dia} - ${r.ativo ? 'Ativo' : 'Inativo'}\n`;
      });
      alert(msg);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }
}

export function processarTransacoesRecorrentes() {
  const recorrentes = JSON.parse(localStorage.getItem('transacoesRecorrentes') || '[]');
  if (recorrentes.length === 0) return;

  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const mesAtual = hoje.toISOString().slice(0, 7);

  recorrentes.forEach(r => {
    if (!r.ativo || r.dia !== diaAtual) return;

    const jaProcessado = localStorage.getItem(`recorrente_${r.descricao}_${mesAtual}`);
    if (jaProcessado) return;

    const entradaSaida = r.tipo;
    const valor = entradaSaida === 'Saída' ? -Math.abs(r.valor) : Math.abs(r.valor);

    const hojeStr = hoje.toISOString().split('T')[0];

    salvar({ data: hojeStr, descricao: r.descricao, valor, entradaSaida, categoria: r.categoria })
      .then(result => {
        dadosFinanceiros.unshift({ id: result.id, data: hojeStr, descricao: r.descricao, valor, entradaSaida, categoria: r.categoria });
        atualizarSaldo();
        atualizarPaginacao();
        renderizarCalendario();
        renderizarCategoriaResumo();
        showToast(`Recorrente "${r.descricao}" adicionado!`, 'success');
      });

    localStorage.setItem(`recorrente_${r.descricao}_${mesAtual}`, 'true');
  });
}

export function abrirTransacoesRecorrentes() {
  const modal = document.getElementById('modal-recorrente');
  if (modal) modal.style.display = 'flex';
}
