const { pool } = require('../config/database');
const { withTransaction } = require('../utils/queryHelpers');
const { autoCategorize } = require('./authService');

function calcularProximaData(dataAtual, frequencia) {
  const d = new Date(dataAtual);
  switch (frequencia) {
    case 'semanal': d.setDate(d.getDate() + 7); break;
    case 'quinzenal': d.setDate(d.getDate() + 14); break;
    case 'mensal': d.setMonth(d.getMonth() + 1); break;
    case 'anual': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
}

const criarRecorrente = async (userId, data) => {
  const { descricao, valor, entradaSaida, categoria, metodoPagamento, observacoes, frequencia, proxima_data, data_fim, max_ocorrencias } = data;
  const categoriaFinal = categoria || autoCategorize(descricao);
  const { rows } = await pool.query(
    `INSERT INTO recorrentes (user_id, descricao, valor, entradaSaida, categoria, metodoPagamento, observacoes, frequencia, proxima_data, data_fim, max_ocorrencias)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [userId, descricao, valor, entradaSaida || (Number(valor) < 0 ? 'Saída' : 'Entrada'), categoriaFinal, metodoPagamento || 'Dinheiro', observacoes || '', frequencia, proxima_data, data_fim || null, max_ocorrencias || null]
  );
  return rows[0];
};

const listarRecorrentes = async (userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM recorrentes WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

const atualizarRecorrente = async (id, userId, updates) => {
  const allowed = ['descricao', 'valor', 'entradaSaida', 'categoria', 'metodoPagamento', 'observacoes', 'frequencia', 'proxima_data', 'data_fim', 'max_ocorrencias', 'ativo'];
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    if (!allowed.includes(key)) continue;
    setClauses.push(`${key} = $${idx++}`);
    values.push(value);
  }
  if (setClauses.length === 0) throw new Error('Nenhum campo válido para atualizar.');
  values.push(id, userId);
  const { rows } = await pool.query(
    `UPDATE recorrentes SET ${setClauses.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values
  );
  if (rows.length === 0) throw new Error('Recorrência não encontrada.');
  return rows[0];
};

const deletarRecorrente = async (id, userId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM recorrentes WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (rowCount === 0) throw new Error('Recorrência não encontrada.');
  return { message: 'Recorrência removida.' };
};

const gerarLancamentos = async (userId) => {
  const hoje = new Date().toISOString().split('T')[0];
  const { rows: pendentes } = await pool.query(
    'SELECT * FROM recorrentes WHERE user_id = $1 AND ativo = TRUE AND proxima_data <= $2',
    [userId, hoje]
  );
  if (pendentes.length === 0) return { gerados: 0, mensagem: 'Nenhum lançamento pendente.' };

  let gerados = 0;
  await withTransaction(async (client) => {
    for (const rec of pendentes) {
      let dataGerar = rec.proxima_data;
      let qtdRec = 0;
      while (dataGerar <= hoje) {
        await client.query(
          `INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida, categoria, metodoPagamento, observacoes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, dataGerar, rec.descricao, rec.valor, rec.entradaSaida, rec.categoria, rec.metodoPagamento, rec.observacoes]
        );
        gerados++;
        qtdRec++;
        dataGerar = calcularProximaData(dataGerar, rec.frequencia);
      }
      const totalOcorrencias = rec.ocorrencias_geradas + qtdRec;
      let ativo = true;
      if (rec.max_ocorrencias && totalOcorrencias >= rec.max_ocorrencias) ativo = false;
      if (rec.data_fim && dataGerar > rec.data_fim) ativo = false;
      await client.query(
        'UPDATE recorrentes SET proxima_data = $1, ocorrencias_geradas = $2, ativo = $3 WHERE id = $4',
        [dataGerar, totalOcorrencias, ativo, rec.id]
      );
    }
  });

  try {
    const { sendToUser } = require('./notificationService');
    const valorTotal = pendentes.reduce((s, r) => s + Number(r.valor), 0);
    await sendToUser(userId, '🔁 Lançamentos recorrentes gerados',
      `${gerados} lançamento(s) gerado(s) — total de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(valorTotal))}`
    );
  } catch {}
  return { gerados, mensagem: `${gerados} lançamento(s) gerado(s).` };
};

module.exports = { criarRecorrente, listarRecorrentes, atualizarRecorrente, deletarRecorrente, gerarLancamentos };
