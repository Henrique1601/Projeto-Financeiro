const { pool } = require('../config/database');

const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const mesAtual = () => new Date().toISOString().slice(0, 7);

const criarOrcamento = async (userId, data) => {
  const { categoria, limite, mes } = data;
  if (!categoria || limite == null) throw new Error('Categoria e limite são obrigatórios.');
  const { rows } = await pool.query(
    `INSERT INTO orcamentos (user_id, categoria, limite, mes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, categoria, mes) DO UPDATE SET limite = $3
     RETURNING *`,
    [userId, categoria, Math.abs(limite), mes || mesAtual()]
  );
  return rows[0];
};

const listarOrcamentos = async (userId, mes) => {
  const { rows } = await pool.query(
    'SELECT * FROM orcamentos WHERE user_id = $1 AND mes = $2 ORDER BY categoria',
    [userId, mes || mesAtual()]
  );
  return rows;
};

const deletarOrcamento = async (id, userId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM orcamentos WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (rowCount === 0) throw new Error('Orçamento não encontrado.');
};

const verificarAlertas = async (userId) => {
  const mes = mesAtual();
  const { rows: orcamentos } = await pool.query(
    'SELECT * FROM orcamentos WHERE user_id = $1 AND mes = $2',
    [userId, mes]
  );
  if (orcamentos.length === 0) return [];

  const { rows: gastos } = await pool.query(
    `SELECT categoria, SUM(ABS(valor)) as total
     FROM financeiro
     WHERE user_id = $1 AND entradaSaida = 'Saída'
       AND TO_CHAR(data, 'YYYY-MM') = $2
     GROUP BY categoria`,
    [userId, mes]
  );

  const gastoMap = {};
  for (const g of gastos) gastoMap[g.categoria] = parseFloat(g.total);

  const alertas = [];
  for (const orc of orcamentos) {
    const gasto = gastoMap[orc.categoria] || 0;
    const pct = Math.round((gasto / orc.limite) * 100);
    if (pct >= 100) {
      alertas.push({ categoria: orc.categoria, pct, gasto, limite: orc.limite, tipo: 'excedido' });
    } else if (pct >= 80) {
      alertas.push({ categoria: orc.categoria, pct, gasto, limite: orc.limite, tipo: 'atencao' });
    }
  }

  if (alertas.length > 0) {
    const lines = alertas.map(a =>
      a.tipo === 'excedido'
        ? `❌ ${a.categoria}: ${a.pct}% (${formatBRL(a.gasto)} de ${formatBRL(a.limite)})`
        : `⚠️ ${a.categoria}: ${a.pct}% (${formatBRL(a.gasto)} de ${formatBRL(a.limite)})`
    );
    try {
      const { sendToUser } = require('./notificationService');
      await sendToUser(userId, '📊 Alerta de orçamento', lines.join('\n'));
    } catch {}
  }

  return alertas;
};

module.exports = { criarOrcamento, listarOrcamentos, deletarOrcamento, verificarAlertas };
