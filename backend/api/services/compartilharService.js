const { pool } = require('../config/database');
const crypto = require('crypto');

async function gerarDadosAnonimos(userId) {
  const result = await pool.query(
    'SELECT valor, entradaSaida, categoria, "metodoPagamento", data FROM financeiro WHERE user_id = $1',
    [userId]
  );
  const lancamentos = result.rows;
  if (!lancamentos.length) throw new Error('Nenhum lançamento encontrado');

  const entradas = lancamentos.filter(l => l.entradasaida === 'Entrada');
  const saidas = lancamentos.filter(l => l.entradasaida === 'Saída');

  const cats = {};
  lancamentos.forEach(l => {
    const c = l.categoria || 'Outros';
    if (!cats[c]) cats[c] = { count: 0, saidas: 0, entradas: 0 };
    cats[c].count++;
    if (l.entradasaida === 'Saída') cats[c].saidas++;
    else cats[c].entradas++;
  });
  const sortedCats = Object.entries(cats)
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.count - a.count);

  const metodos = {};
  lancamentos.forEach(l => {
    const m = l.metodoPagamento || 'Dinheiro';
    metodos[m] = (metodos[m] || 0) + 1;
  });
  const metodoMaisUsado = Object.entries(metodos).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const datas = lancamentos.map(l => new Date(l.data)).filter(d => !isNaN(d));
  const minData = new Date(Math.min(...datas));
  const maxData = new Date(Math.max(...datas));
  const meses = Math.max(1, (maxData.getFullYear() - minData.getFullYear()) * 12 + maxData.getMonth() - minData.getMonth() + 1);
  const mediaPorMes = Math.round(lancamentos.length / meses);

  return {
    total_lancamentos: lancamentos.length,
    total_entradas: entradas.length,
    total_saidas: saidas.length,
    categorias: sortedCats.slice(0, 10),
    metodo_mais_usado: metodoMaisUsado,
    media_lancamentos_por_mes: mediaPorMes,
    periodo: {
      inicio: minData.toISOString().split('T')[0],
      fim: maxData.toISOString().split('T')[0],
      meses
    }
  };
}

async function criarCompartilhar(userId) {
  const dados = await gerarDadosAnonimos(userId);
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO resumos_compartilhados (user_id, token, dados, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, token, JSON.stringify(dados), expiresAt]
  );

  return { token, dados, expires_at: expiresAt.toISOString() };
}

async function buscarCompartilhar(token) {
  const result = await pool.query(
    'SELECT dados, expires_at FROM resumos_compartilhados WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  if (!result.rows.length) throw new Error('Link não encontrado ou expirado');
  return result.rows[0].dados;
}

async function listarCompartilhados(userId) {
  const result = await pool.query(
    'SELECT token, dados, created_at, expires_at FROM resumos_compartilhados WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function deletarCompartilhar(token, userId) {
  const result = await pool.query(
    'DELETE FROM resumos_compartilhados WHERE token = $1 AND user_id = $2 RETURNING id',
    [token, userId]
  );
  if (!result.rows.length) throw new Error('Link não encontrado');
}

module.exports = { criarCompartilhar, buscarCompartilhar, listarCompartilhados, deletarCompartilhar };
