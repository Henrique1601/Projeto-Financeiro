import { API_BASE_URL } from '../config.js';

export async function render(app) {
  const token = window.location.hash.slice(1).split('/')[2];
  if (!token) {
    app.innerHTML = '<div class="card" style="max-width:500px;margin:40px auto;text-align:center;padding:40px"><h2>Link inválido</h2><p>Token não encontrado.</p></div>';
    return;
  }

  app.innerHTML = '<div class="page-enter" style="max-width:600px;margin:40px auto"><div class="card" style="padding:40px;text-align:center"><div class="spinner"></div><p style="margin-top:16px">Carregando resumo…</p></div></div>';

  try {
    const r = await fetch(`${API_BASE_URL}/api/compartilhar/${token}`);
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Resumo não encontrado ou expirado');
    }
    const dados = await r.json();

    app.innerHTML = `
      <div class="page-enter">
        <div class="card" style="max-width:600px;margin:0 auto;padding:32px">
          <div style="text-align:center;margin-bottom:32px">
            <i class="fas fa-chart-pie" style="font-size:2.5rem;color:var(--primary);margin-bottom:12px"></i>
            <h1 style="margin:0;font-size:1.5rem">Resumo Financeiro</h1>
            <p style="color:var(--text-secondary);margin-top:8px">
              ${dados.periodo?.inicio || '?'} a ${dados.periodo?.fim || '?'} · ${dados.periodo?.meses || 0} meses
            </p>
          </div>

          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px">
            <div class="card" style="padding:16px;text-align:center;background:var(--surface)">
              <div style="font-size:1.8rem;font-weight:700;color:var(--primary)">${dados.total_lancamentos}</div>
              <div style="font-size:.8rem;color:var(--text-secondary)">Lançamentos</div>
            </div>
            <div class="card" style="padding:16px;text-align:center;background:var(--surface)">
              <div style="font-size:1.8rem;font-weight:700;color:var(--success)">${dados.total_entradas}</div>
              <div style="font-size:.8rem;color:var(--text-secondary)">Entradas</div>
            </div>
            <div class="card" style="padding:16px;text-align:center;background:var(--surface)">
              <div style="font-size:1.8rem;font-weight:700;color:var(--danger)">${dados.total_saidas}</div>
              <div style="font-size:.8rem;color:var(--text-secondary)">Saídas</div>
            </div>
            <div class="card" style="padding:16px;text-align:center;background:var(--surface)">
              <div style="font-size:1.8rem;font-weight:700;color:var(--primary)">${dados.media_lancamentos_por_mes}</div>
              <div style="font-size:.8rem;color:var(--text-secondary)">Lançamentos/mês</div>
            </div>
          </div>

          <div class="card" style="padding:16px;margin-bottom:16px;background:var(--surface)">
            <div style="font-size:.85rem;color:var(--text-secondary);margin-bottom:8px">
              <i class="fas fa-credit-card"></i> Método mais usado
            </div>
            <div style="font-weight:600">${dados.metodo_mais_usado}</div>
          </div>

          <h3 style="font-size:.95rem;margin-bottom:12px">Categorias mais frequentes</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${(dados.categorias || []).map(c => {
              const pct = dados.total_lancamentos ? Math.round(c.count / dados.total_lancamentos * 100) : 0;
              return `
                <div style="display:flex;align-items:center;gap:12px">
                  <span style="flex:1;font-size:.9rem">${c.nome}</span>
                  <span style="font-size:.8rem;color:var(--text-secondary);min-width:60px;text-align:right">${c.count}x</span>
                  <div style="width:80px;height:6px;background:var(--border);border-radius:4px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:4px;transition:width .6s ease"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid var(--border)">
            <p style="font-size:.8rem;color:var(--text-secondary)">
              <i class="fas fa-eye-slash"></i> Resumo anônimo · sem valores financeiros
            </p>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `
      <div class="page-enter" style="max-width:500px;margin:40px auto">
        <div class="card" style="padding:40px;text-align:center">
          <i class="fas fa-link-slash" style="font-size:2rem;color:var(--text-secondary);margin-bottom:12px"></i>
          <h2>Link expirado</h2>
          <p style="color:var(--text-secondary)">Este resumo não está mais disponível. Links expiram em 7 dias.</p>
        </div>
      </div>
    `;
  }
}
