const { pool } = require('../config/database');
const { run, getOne, getAll } = require('../utils/queryHelpers');

const MILESTONES = [7, 14, 21, 30];

const criarDesafio = async (userId, data) => {
  const { descricao, categoria, valor_meta, prazo_dias } = data;
  if (!descricao) throw new Error('Descrição é obrigatória.');
  const { rows } = await pool.query(
    `INSERT INTO desafios_economia (user_id, descricao, categoria, valor_meta, prazo_dias)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, descricao, categoria || null, valor_meta || 0, prazo_dias || 30]
  );
  return rows[0];
};

const listarDesafios = async (userId) => {
  const desafios = await getAll(
    'SELECT * FROM desafios_economia WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  const hoje = new Date().toISOString().split('T')[0];
  const { sendToUser } = require('./notificationService');
  for (const d of desafios) {
    const inicio = d.inicio_data;
    const diasPassados = Math.floor((new Date(hoje) - new Date(inicio)) / (1000 * 60 * 60 * 24)) + 1;
    const streak = await calcularStreak(userId, d.categoria, inicio);
    d.streak_atual = streak;
    if (streak > d.melhor_streak) {
      d.melhor_streak = streak;
      await run('UPDATE desafios_economia SET melhor_streak = $1 WHERE id = $2', [streak, d.id]);
    }
    d.dias_passados = Math.max(diasPassados, 0);
    d.progresso = d.prazo_dias > 0 ? Math.min(Math.round((d.dias_passados / d.prazo_dias) * 100), 100) : 0;
    const economizado = await calcularEconomizado(userId, d.categoria, inicio);
    d.economizado = economizado;
    d.valor_progresso = d.valor_meta > 0 ? Math.min(Math.round((economizado / d.valor_meta) * 100), 100) : 0;

    if (streak > 0 && MILESTONES.includes(streak)) {
      const col = `notificado_${streak}`;
      if (!d[col]) {
        try { await sendToUser(userId, '🎯 Marco do Desafio!', `Você atingiu ${streak} dias consecutivos em "${d.descricao}"!`); } catch {}
        await run(`UPDATE desafios_economia SET ${col} = TRUE WHERE id = $1`, [d.id]);
        d[col] = true;
      }
    }
  }
  return desafios;
};

async function calcularStreak(userId, categoria, inicio) {
  const hoje = new Date().toISOString().split('T')[0];
  const catClause = categoria ? `AND categoria = '${categoria.replace(/'/g, "''")}'` : '';
  const { rows } = await pool.query(
    `SELECT DISTINCT data FROM financeiro
     WHERE user_id = $1 AND entradaSaida = 'Saída' ${catClause}
     AND data >= $2 AND data <= $3
     ORDER BY data DESC`,
    [userId, inicio, hoje]
  );
  if (rows.length === 0) {
    const total = Math.floor((new Date(hoje) - new Date(inicio)) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(total, 0);
  }
  const gastos = rows.map(r => r.data.toISOString().split('T')[0]);
  let streak = 0;
  const d = new Date(hoje);
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (gastos.includes(key)) break;
    if (new Date(key) < new Date(inicio)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

async function calcularEconomizado(userId, categoria, inicio) {
  const hoje = new Date().toISOString().split('T')[0];
  const catClause = categoria ? `AND categoria = '${categoria.replace(/'/g, "''")}'` : '';
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN entradaSaida = 'Entrada' THEN valor ELSE 0 END), 0) as receitas,
            COALESCE(SUM(CASE WHEN entradaSaida = 'Saída' THEN ABS(valor) ELSE 0 END), 0) as gastos
     FROM financeiro WHERE user_id = $1 ${catClause}
     AND data >= $2 AND data <= $3`,
    [userId, inicio, hoje]
  );
  if (rows.length === 0) return 0;
  return parseFloat(rows[0].receitas) - parseFloat(rows[0].gastos);
}

const atualizarDesafio = async (id, userId, data) => {
  const allowed = ['descricao', 'categoria', 'valor_meta', 'prazo_dias', 'ativo'];
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.includes(key)) continue;
    setClauses.push(`${key} = $${idx++}`);
    values.push(value);
  }
  if (setClauses.length === 0) throw new Error('Nenhum campo válido para atualizar.');
  values.push(id, userId);
  const { rows } = await pool.query(
    `UPDATE desafios_economia SET ${setClauses.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values
  );
  if (rows.length === 0) throw new Error('Desafio não encontrado.');
  return rows[0];
};

const deletarDesafio = async (id, userId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM desafios_economia WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (rowCount === 0) throw new Error('Desafio não encontrado.');
  return { message: 'Desafio removido.' };
};

const verificarDesafios = async (userId) => {
  return listarDesafios(userId);
};

module.exports = { criarDesafio, listarDesafios, atualizarDesafio, deletarDesafio, verificarDesafios };
