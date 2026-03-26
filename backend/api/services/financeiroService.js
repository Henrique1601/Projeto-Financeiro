const { pool } = require('../config/database');
const { withTransaction } = require('../utils/queryHelpers');
const { validateFinanceiroInput } = require('../utils/validators');

const salvarLancamento = async (userId, { data, descricao, valor, entradaSaida, categoria }) => {
  entradaSaida = entradaSaida.toLowerCase() === 'entrada' ? 'Entrada' :
                 entradaSaida.toLowerCase() === 'saída' ? 'Saída' : entradaSaida;

  const categoriaFinal = categoria || 'Outros';

  const errors = validateFinanceiroInput(data, descricao, valor, entradaSaida);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  return await withTransaction(async (client) => {
    const { rows } = await client.query(
      'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida, categoria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, data, descricao, valor, entradaSaida, categoriaFinal]
    );
    return { id: rows[0].id, message: 'Dados salvos com sucesso.' };
  });
};

const listarLancamentos = async (userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM financeiro WHERE user_id = $1 ORDER BY data DESC',
    [userId]
  );
  return rows;
};

const deletarLancamento = async (userId, id) => {
  const idNum = parseInt(id);
  if (isNaN(idNum)) {
    throw new Error('ID deve ser um número válido.');
  }

  const result = await pool.query(
    'DELETE FROM financeiro WHERE id = $1 AND user_id = $2',
    [idNum, userId]
  );

  if (result.rowCount === 0) {
    throw new Error('Registro não encontrado.');
  }

  return { message: 'Registro deletado com sucesso.' };
};

const editarLancamentos = async (userId, updates) => {
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    throw new Error('Array de edições obrigatório.');
  }

  if (updates.length > 50) {
    throw new Error('Máximo 50 edições por vez.');
  }

  const allowedFields = ['data', 'descricao', 'valor', 'entradaSaida', 'categoria'];

  return await withTransaction(async (client) => {
    let total = 0;
    for (const update of updates) {
      const fieldsToUpdate = Object.keys(update).filter(f => allowedFields.includes(f));
      if (fieldsToUpdate.length === 0) continue;

      const values = fieldsToUpdate.map(f => update[f]);
      values.push(update.id, userId);

      const setClause = fieldsToUpdate.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const query = `UPDATE financeiro SET ${setClause} WHERE id = $${fieldsToUpdate.length + 1} AND user_id = $${fieldsToUpdate.length + 2}`;

      const result = await client.query(query, values);
      if (result.rowCount === 0) {
        throw new Error(`Nenhum registro encontrado para atualizar (ID ${update.id}).`);
      }
      total += result.rowCount;
    }
    return { message: `${total} registro(s) atualizado(s) com sucesso.` };
  });
};

const importarLancamentos = async (userId, lancamentos) => {
  if (!lancamentos || !Array.isArray(lancamentos) || lancamentos.length === 0) {
    throw new Error('Nenhum lançamento válido.');
  }

  const insertedIds = [];
  const updatedIds = [];

  for (const { data, descricao, valor, entradaSaida, categoria = 'Outros' } of lancamentos) {
    if (!data || !descricao || isNaN(valor) || !['Entrada', 'Saída'].includes(entradaSaida)) {
      throw new Error('Campos inválidos em um dos lançamentos.');
    }

    const existing = await pool.query(
      'SELECT id FROM financeiro WHERE user_id = $1 AND data = $2 AND descricao = $3 AND valor = $4 AND entradaSaida = $5',
      [userId, data, descricao, valor, entradaSaida]
    );

    if (existing.rows.length > 0) {
      updatedIds.push(existing.rows[0].id);
      continue;
    }

    const result = await pool.query(
      'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida, categoria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, data, descricao, valor, entradaSaida, categoria]
    );
    insertedIds.push(result.rows[0].id);
  }

  return { message: 'Lançamentos importados.', insertedIds, updatedIds };
};

module.exports = { salvarLancamento, listarLancamentos, deletarLancamento, editarLancamentos, importarLancamentos };
