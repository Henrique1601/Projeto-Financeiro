import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { showToast, showSpinner, hideSpinner, emptyStateSVG } from '../utils/dom.js';
import { navigate } from '../router.js';
import { formatCurrency } from '../utils/format.js';

let desafios = [];
let _keyHandler = null;

export async function render(app) {
  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  showSpinner('Carregando…');
  try {
    desafios = await apiGet('/api/desafios');
    renderPage(app);
  } catch (err) {
    app.innerHTML = `<div class="desafios-page page-enter"><div class="error-page"><h1>Erro ao carregar</h1><p>${err.message}</p></div></div>`;
  } finally {
    hideSpinner();
  }
}

function renderPage(app) {
  app.innerHTML = `
    <div class="desafios-page page-enter">
      <div class="desafios-header">
        <button class="desafios-back-btn" id="desafiosBackBtn" title="Voltar ao Dashboard (Esc)">
          <i class="fas fa-arrow-left"></i>
          <span>Dashboard</span>
        </button>
        <h1><i class="fas fa-trophy"></i> Desafios de Economia</h1>
        <button class="btn btn-primary" id="btnNovoDesafio">
          <i class="fas fa-plus"></i> Novo Desafio
        </button>
      </div>
      <div class="desafios-grid" id="desafiosGrid">
        ${desafios.length === 0 ? '<div style="grid-column:1/-1"><div class="empty-state"><div class="empty-state-illustration">' + emptyStateSVG('target') + '</div><h3 class="empty-state-title">Nenhum desafio</h3><p class="empty-state-subtitle">Crie seu primeiro desafio de economia!</p></div></div>' : ''}
        ${desafios.map((d, i) => renderCard(d, i)).join('')}
      </div>
    </div>
  `;

  document.getElementById('desafiosBackBtn').addEventListener('click', () => navigate('#/'));
  document.getElementById('btnNovoDesafio').addEventListener('click', showNovoDesafioModal);

  document.querySelectorAll('[data-deletar-desafio]').forEach(el => {
    el.addEventListener('click', deletarDesafio);
  });

  _keyHandler = (e) => {
    if (e.key === 'Escape') navigate('#/');
  };
  document.addEventListener('keydown', _keyHandler);
}

function renderCard(d, i) {
  const streakClass = d.streak_atual >= 21 ? 'fire-hot' : d.streak_atual >= 7 ? 'fire' : '';
  return `
    <div class="desafio-card item-enter" style="animation-delay:${i * 80}ms">
      <div class="desafio-card-header">
        <div>
          <div class="desafio-card-title">${d.descricao}</div>
          ${d.categoria ? `<div class="desafio-card-categoria"><i class="fas fa-tag"></i> ${d.categoria}</div>` : '<div class="desafio-card-categoria">Todas as categorias</div>'}
        </div>
        <div class="desafio-streak ${streakClass}">
          ${d.streak_atual}
          <span class="desafio-streak-label">dias</span>
        </div>
      </div>
      <div class="progress-bar" style="height:8px">
        <div class="progress-fill" style="width:${d.progresso}%;background:${d.progresso >= 100 ? 'var(--success)' : 'var(--primary)'}"></div>
      </div>
      <div class="desafio-meta-info">
        <span>${d.dias_passados || 0} / ${d.prazo_dias} dias</span>
        <span>${d.progresso}%</span>
      </div>
      ${d.valor_meta > 0 ? `
      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">
        Economizado: ${formatCurrency(d.economizado || 0)} de ${formatCurrency(d.valor_meta)}
      </div>
      ` : ''}
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">
        <i class="fas fa-fire"></i> Melhor streak: ${d.melhor_streak} dias
      </div>
      <div class="desafio-card-actions">
        <button class="btn btn-danger btn-xs" data-deletar-desafio="${d.id}"><i class="fas fa-trash"></i> Remover</button>
      </div>
    </div>
  `;
}

function showNovoDesafioModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <h2><i class="fas fa-trophy" style="margin-right:8px"></i>Novo Desafio</h2>
        <button class="modal-close" aria-label="Fechar">&times;</button>
      </div>
      <div class="modal-body">
        <div class="desafio-form-row">
          <input type="text" id="novaDescricao" class="form-input" placeholder="Descrição do desafio" style="flex:1" />
        </div>
        <div class="desafio-form-row" style="margin-top:8px">
          <select id="novaCategoria" class="form-input" style="flex:1">
            <option value="">Todas as categorias</option>
          </select>
        </div>
        <div class="desafio-form-row" style="margin-top:8px">
          <input type="number" id="novoValorMeta" class="form-input" placeholder="Meta de economia (R$) (opcional)" step="0.01" min="0" style="flex:1" />
        </div>
        <div class="desafio-form-row" style="margin-top:8px">
          <select id="novoPrazo" class="form-input" style="flex:1">
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="21">21 dias</option>
            <option value="30" selected>30 dias</option>
            <option value="60">60 dias</option>
            <option value="90">90 dias</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="btnSalvarDesafio"><i class="fas fa-check"></i> Criar</button>
        <button class="btn btn-ghost modal-close-btn">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.modal-close-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  const categorias = [...new Set(desafios.map(d => d.categoria).filter(Boolean))];
  document.getElementById('novaCategoria').innerHTML += categorias.map(c => `<option value="${c}">${c}</option>`).join('');

  document.getElementById('btnSalvarDesafio').addEventListener('click', async () => {
    const descricao = document.getElementById('novaDescricao').value.trim();
    if (!descricao) { showToast('Descrição é obrigatória.', 'warning'); return; }
    const categoria = document.getElementById('novaCategoria').value || undefined;
    const valor_meta = parseFloat(document.getElementById('novoValorMeta').value) || 0;
    const prazo_dias = parseInt(document.getElementById('novoPrazo').value) || 30;
    try {
      await apiPost('/api/desafios', { descricao, categoria, valor_meta, prazo_dias });
      showToast('Desafio criado!', 'success');
      overlay.remove();
      desafios = await apiGet('/api/desafios');
      renderPage(document.getElementById('pageContent'));
    } catch (err) { showToast(err.message); }
  });
}

async function deletarDesafio(e) {
  const id = e.currentTarget.dataset.deletarDesafio;
  if (!confirm('Remover este desafio?')) return;
  try {
    await apiDelete(`/api/desafios/${id}`);
    showToast('Desafio removido.', 'success');
    desafios = desafios.filter(d => d.id != id);
    const grid = document.getElementById('desafiosGrid');
    if (desafios.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1"><div class="empty-state"><div class="empty-state-illustration">' + emptyStateSVG('target') + '</div><h3 class="empty-state-title">Nenhum desafio</h3><p class="empty-state-subtitle">Crie seu primeiro desafio de economia!</p></div></div>';
    } else {
      grid.innerHTML = desafios.map((d, i) => renderCard(d, i)).join('');
      grid.querySelectorAll('[data-deletar-desafio]').forEach(el => {
        el.addEventListener('click', deletarDesafio);
      });
    }
  } catch (err) { showToast(err.message); }
}
