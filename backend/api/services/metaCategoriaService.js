const pool = require('../config/database');
const { run, getOne, getAll } = require('../utils/queryHelpers');

const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const criarMeta = async (userId, data) => {
  const { categoria, valor_meta, mes } = data;
  if (!categoria || !valor_meta || valor_meta <= 0) throw new Error('Categoria e valor da meta são obrigatórios.');
  const m = mes || mesAtual();
  const result = await pool.query(
    `INSERT INTO metas_categoria (user_id, categoria, valor_meta, mes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, categoria, mes) DO UPDATE SET valor_meta = $3
     RETURNING *`,
    [userId, categoria, valor_meta, m]
  );
  return result.rows[0];
};

const listarMetas = async (userId, mes) => {
  const m = mes || mesAtual();
  const metas = await getAll(
    'SELECT * FROM metas_categoria WHERE user_id = $1 AND mes = $2 ORDER BY categoria',
    [userId, m]
  );
  const gastos = await getAll(
    `SELECT categoria, SUM(ABS(valor)) as total
     FROM financeiro
     WHERE user_id = $1 AND entradaSaida = 'Saída'
     AND to_char(data, 'YYYY-MM') = $2
     GROUP BY categoria`,
    [userId, m]
  );
  const receitas = await getAll(
    `SELECT categoria, SUM(valor) as total
     FROM financeiro
     WHERE user_id = $1 AND entradaSaida = 'Entrada'
     AND to_char(data, 'YYYY-MM') = $2
     GROUP BY categoria`,
    [userId, m]
  );
  const gastoMap = {};
  for (const g of gastos) gastoMap[g.categoria] = parseFloat(g.total) || 0;
  const receitaMap = {};
  for (const r of receitas) receitaMap[r.categoria] = parseFloat(r.total) || 0;
  return metas.map(m => {
    const gasto = gastoMap[m.categoria] || 0;
    const receita = receitaMap[m.categoria] || 0;
    const economizado = receita - gasto;
    const meta = parseFloat(m.valor_meta);
    return {
      ...m,
      gasto,
      receita,
      economizado,
      progresso: meta > 0 ? Math.min(Math.round((economizado / meta) * 100), 100) : 0,
    };
  });
};

const atualizarMeta = async (id, userId, data) => {
  const { valor_meta, categoria } = data;
  const updates = [];
  const values = [];
  let idx = 1;
  if (valor_meta !== undefined) { updates.push(`valor_meta = $${idx++}`); values.push(valor_meta); }
  if (categoria !== undefined) { updates.push(`categoria = $${idx++}`); values.push(categoria); }
  if (!updates.length) throw new Error('Nenhum dado para atualizar.');
  values.push(id, userId);
  await run(
    `UPDATE metas_categoria SET ${updates.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1}`,
    values
  );
  return { message: 'Meta atualizada com sucesso.' };
};

const deletarMeta = async (id, userId) => {
  await run('DELETE FROM metas_categoria WHERE id = $1 AND user_id = $2', [id, userId]);
  return { message: 'Meta removida.' };
};

module.exports = { criarMeta, listarMetas, atualizarMeta, deletarMeta };
