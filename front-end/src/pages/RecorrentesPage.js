import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { showToast, showSpinner, hideSpinner, emptyStateSVG, renderEmptyState } from '../utils/dom.js';
import { navigate } from '../router.js';
import { formatDate, formatCurrency, getTipo } from '../utils/format.js';

let recorrentes = [];
let _keyHandler = null;

export async function render(app) {
  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  showSpinner('Carregando…');
  try {
    recorrentes = await apiGet('/api/recorrentes');
    renderPage(app);
  } catch (err) {
    app.innerHTML = `<div class="recorrentes-page page-enter"><div class="error-page"><h1>Erro ao carregar</h1><p>${err.message}</p></div></div>`;
  } finally {
    hideSpinner();
  }
}

function renderPage(app) {
  app.innerHTML = `
    <div class="recorrentes-page page-enter">
      <div class="recorrentes-header">
        <button class="recorrentes-back-btn" id="recorrentesBackBtn" title="Voltar ao Dashboard (Esc)">
          <i class="fas fa-arrow-left"></i>
          <span>Dashboard</span>
        </button>
        <h1>Transações Recorrentes</h1>
        <button class="btn btn-primary" id="gerarRecorrentesBtn">
          <i class="fas fa-play"></i> Gerar lançamentos
        </button>
      </div>
      <div id="gerarFeedback" class="gerar-feedback" style="display:none"></div>
      <div class="recorrentes-table-wrapper">
        <table class="recorrentes-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Frequência</th>
              <th>Próxima data</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Gerados</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="recorrentesTbody">
            ${recorrentes.length === 0 ? '<tr><td colspan="9"><div class="empty-state"><div class="empty-state-illustration">' + emptyStateSVG('list') + '</div><h3 class="empty-state-title">Nenhuma recorrência</h3><p class="empty-state-subtitle">Crie uma transação no Dashboard marcando "Repetir"</p></div></td></tr>' : ''}
            ${recorrentes.map((r, i) => renderRow(r, i)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('recorrentesBackBtn').addEventListener('click', () => navigate('#/'));
  document.getElementById('gerarRecorrentesBtn').addEventListener('click', gerarAgora);

  document.querySelectorAll('.toggle-ativo').forEach(el => {
    el.addEventListener('change', toggleAtivo);
  });
  document.querySelectorAll('.btn-deletar-rec').forEach(el => {
    el.addEventListener('click', deletarRecorrente);
  });

  _keyHandler = (e) => {
    if (e.key === 'Escape') navigate('#/');
  };
  document.addEventListener('keydown', _keyHandler);
}

function renderRow(r, i) {
  const freqLabels = { semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal', anual: 'Anual' };
  const tipo = getTipo(r);
  const tipoClass = tipo === 'Saída' ? 'tipo-saida' : 'tipo-entrada';
  return `
    <tr class="item-enter ${r.ativo ? '' : 'inativo'}" style="animation-delay:${(i || 0) * 40}ms">
      <td>${r.descricao}</td>
      <td class="valor-cell ${tipoClass}">${formatCurrency(r.valor)}</td>
      <td><span class="badge ${tipoClass}">${tipo}</span></td>
      <td>${freqLabels[r.frequencia] || r.frequencia}</td>
      <td>${formatDate(r.proxima_data)}</td>
      <td>${r.dia_vencimento ? `Dia ${r.dia_vencimento}` : '-'}</td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" class="toggle-ativo" data-id="${r.id}" ${r.ativo ? 'checked' : ''}>
          <span class="toggle-slider"></span>
          <span class="toggle-label">${r.ativo ? 'Ativo' : 'Inativo'}</span>
        </label>
      </td>
      <td>${r.ocorrencias_geradas}${r.max_ocorrencias ? `/${r.max_ocorrencias}` : ''}</td>
      <td>
        <button class="btn-icon btn-deletar-rec" data-id="${r.id}" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

async function toggleAtivo(e) {
  const id = e.target.dataset.id;
  const ativo = e.target.checked;
  try {
    await apiPut(`/api/recorrentes/${id}`, { ativo });
    showToast(ativo ? 'Ativado' : 'Desativado', 'success');
    recorrentes = await apiGet('/api/recorrentes');
    document.getElementById('recorrentesTbody').innerHTML = recorrentes.map((r, i) => renderRow(r, i)).join('');
    rebindEvents();
  } catch (err) {
    showToast(err.message);
    e.target.checked = !ativo;
  }
}

async function deletarRecorrente(e) {
  const id = e.currentTarget.dataset.id;
  if (!confirm('Excluir esta transação recorrente?')) return;
  try {
    await apiDelete(`/api/recorrentes/${id}`);
    showToast('Removida', 'success');
    recorrentes = await apiGet('/api/recorrentes');
    document.getElementById('recorrentesTbody').innerHTML = recorrentes.map((r, i) => renderRow(r, i)).join('');
    rebindEvents();
  } catch (err) {
    showToast(err.message);
  }
}

async function gerarAgora() {
  const btn = document.getElementById('gerarRecorrentesBtn');
  const feedback = document.getElementById('gerarFeedback');
  btn.disabled = true;
  try {
    const result = await apiPost('/api/recorrentes/gerar');
    feedback.style.display = 'block';
    feedback.textContent = result.mensagem;
    feedback.className = 'gerar-feedback success';
    recorrentes = await apiGet('/api/recorrentes');
    document.getElementById('recorrentesTbody').innerHTML = recorrentes.map((r, i) => renderRow(r, i)).join('');
    rebindEvents();
  } catch (err) {
    feedback.style.display = 'block';
    feedback.textContent = err.message;
    feedback.className = 'gerar-feedback error';
  } finally {
    btn.disabled = false;
  }
}

function rebindEvents() {
  document.querySelectorAll('.toggle-ativo').forEach(el => {
    el.addEventListener('change', toggleAtivo);
  });
  document.querySelectorAll('.btn-deletar-rec').forEach(el => {
    el.addEventListener('click', deletarRecorrente);
  });
}
