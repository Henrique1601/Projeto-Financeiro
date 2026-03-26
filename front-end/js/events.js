import { checkAuth, displayUserProfile } from './auth.js';
import { checkServerAvailability, logout } from './utils.js';
import { carregarDados, confirmarLancamento, deletarSelecionados, selecionarTodos, abrirModal, fecharModal, atualizarEstadoBotaoSelecionarTodos, filtrarLancamentos, limparFiltros, mudarPagina, initTema, duplicarLancamento, setupEventosTabela, initMeta, initBackup, initSecoesExtras, abrirOrcamentoCategoria, initNotificacoes, verificarNotificacoes, initTransacoesRecorrentes, processarTransacoesRecorrentes, abrirTransacoesRecorrentes } from './financeiro.js';
import { editarLinhasSelecionadas, salvarEdicoes, cancelarEdicoes } from './table.js';
import { exportarCSV, importarCSV, exportarJSON, exportarExcel, exportarPDF, imprimirTabela } from './export.js';

export function initEvents() {
  const confirmar = document.getElementById('Confirmar');
  const deletar = document.getElementById('Deletar');
  const editar = document.getElementById('Editar');
  const lancar = document.getElementById('Lancar');
  const closeModalBtn = document.getElementById('close-modal');
  const modalLancar = document.getElementById('modal-lancar');
  const selecionarTodos = document.getElementById('SelecionarTodos');
  const saveEditsBtn = document.getElementById('saveEditsBtn');
  const cancelEditsBtn = document.getElementById('cancelEditsBtn');
  const logoutBtn = document.getElementById('logout-btn');

  const exportCsvBtn = document.getElementById('export-csv');
  const importCsvBtn = document.getElementById('import-csv');
  const exportJsonBtn = document.getElementById('export-table');
  const exportExcelBtn = document.getElementById('export-excel');
  const exportPdfBtn = document.getElementById('export-pdf');
  const printBtn = document.getElementById('print-table');

  const btnConfirmarLancamento = document.getElementById('btn-confirmar-lancamento');
  const btnLimparFormulario = document.getElementById('btn-limpar-formulario');

  if (confirmar) confirmar.addEventListener('click', confirmarLancamento);
  if (deletar) deletar.addEventListener('click', deletarSelecionados);
  if (editar) editar.addEventListener('click', editarLinhasSelecionadas);
  if (selecionarTodos) selecionarTodos.addEventListener('click', selecionarTodos);
  if (saveEditsBtn) saveEditsBtn.addEventListener('click', salvarEdicoes);
  if (cancelEditsBtn) cancelEditsBtn.addEventListener('click', cancelarEdicoes);
  
  if (lancar) {
    lancar.addEventListener('click', abrirModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', fecharModal);
  }

  if (modalLancar) {
    modalLancar.addEventListener('click', (e) => {
      if (e.target === modalLancar) {
        fecharModal();
      }
    });
  }

  if (btnConfirmarLancamento) {
    btnConfirmarLancamento.addEventListener('click', confirmarLancamento);
  }

  if (btnLimparFormulario) {
    btnLimparFormulario.addEventListener('click', () => {
      document.getElementById('date').value = new Date().toISOString().split('T')[0];
      document.getElementById('description').value = '';
      document.getElementById('value').value = '';
      document.getElementById('select').value = 'Entrada';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportarCSV);
  if (importCsvBtn) importCsvBtn.addEventListener('click', () => {
    if (confirm('Importar CSV?')) importarCSV();
  });
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportarJSON);
  if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportarExcel);
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportarPDF);
  if (printBtn) printBtn.addEventListener('click', imprimirTabela);

  const fileInputJson = document.createElement('input');
  fileInputJson.type = 'file';
  fileInputJson.id = 'file-input-json';
  fileInputJson.accept = '.json';
  fileInputJson.style.display = 'none';
  document.body.appendChild(fileInputJson);

  const importJsonBtn = document.getElementById('import-table');
  if (importJsonBtn) {
    importJsonBtn.addEventListener('click', () => {
      if (confirm('Importar JSON?')) fileInputJson.click();
    });
    fileInputJson.addEventListener('change', (e) => {
      import('./export.js').then(({ importarJSON }) => importarJSON(e));
    });
  }

  document.getElementById('generator-table')?.addEventListener('change', (e) => {
    if (e.target.classList.contains('select-row')) {
      atualizarEstadoBotaoSelecionarTodos();
    }
  });

  const aplicarFiltrosBtn = document.getElementById('aplicar-filtros');
  const limparFiltrosBtn = document.getElementById('limpar-filtros');
  
  if (aplicarFiltrosBtn) aplicarFiltrosBtn.addEventListener('click', filtrarLancamentos);
  if (limparFiltrosBtn) limparFiltrosBtn.addEventListener('click', limparFiltros);

  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  if (prevPageBtn) prevPageBtn.addEventListener('click', () => mudarPagina('prev'));
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => mudarPagina('next'));

  const modalDetalhes = document.getElementById('modal-detalhes');
  const closeDetalhesBtn = document.getElementById('close-modal-detalhes');
  const fecharDetalhesBtn = document.getElementById('btn-fechar-detalhes');
  const duplicarBtn = document.getElementById('btn-duplicar');
  
  if (closeDetalhesBtn && modalDetalhes) {
    closeDetalhesBtn.addEventListener('click', () => { modalDetalhes.style.display = 'none'; });
  }
  if (fecharDetalhesBtn && modalDetalhes) {
    fecharDetalhesBtn.addEventListener('click', () => { modalDetalhes.style.display = 'none'; });
  }
  if (duplicarBtn) duplicarBtn.addEventListener('click', duplicarLancamento);

  initTema();
  setupEventosTabela();
  initMeta();
  initBackup();
  initSecoesExtras();
  initNotificacoes();
  initTransacoesRecorrentes();

  const btnOrcamentoCategoria = document.getElementById('btn-orcamento-categoria');
  if (btnOrcamentoCategoria) btnOrcamentoCategoria.addEventListener('click', abrirOrcamentoCategoria);

  setTimeout(() => {
    processarTransacoesRecorrentes();
    verificarNotificacoes();
  }, 3000);

  const btnTransacoesRecorrentes = document.getElementById('btn-transacoes-recorrentes');
  if (btnTransacoesRecorrentes) btnTransacoesRecorrentes.addEventListener('click', abrirTransacoesRecorrentes);

  console.log('Eventos inicializados');
}