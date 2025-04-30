const { applyMiddlewares } = require('../lib/middlewares');
const auth = require('../lib/auth');
const { runAsync } = require('../lib/db');

module.exports = applyMiddlewares(auth(async (req, res) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { updates } = req.body;
    const user_id = req.user.id;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Um array de edições é obrigatório.' });
    }

    if (updates.length > 50) {
      return res.status(400).json({ error: 'Não é permitido editar mais de 50 linhas de uma vez.' });
    }

    const allowedFields = ['data', 'descricao', 'valor', 'entradaSaida'];
    const errors = [];

    updates.forEach((update, index) => {
      if (!update.id) {
        errors.push(`Edição ${index + 1}: ID é obrigatório.`);
        return;
      }
      const fieldsToUpdate = Object.keys(update).filter(field => allowedFields.includes(field));
      if (fieldsToUpdate.length === 0) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Nenhum campo válido para atualizar.`);
        return;
      }
      if (update.data && !/^\d{4}-\d{2}-\d{2}$/.test(update.data)) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Data deve estar no formato YYYY-MM-DD.`);
      }
      if (update.descricao && (typeof update.descricao !== 'string' || update.descricao.length > 255)) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Descrição inválida.`);
      }
      if (update.valor !== undefined && isNaN(update.valor)) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Valor deve ser um número.`);
      }
      if (update.entradaSaida && !['Entrada', 'Saída'].includes(update.entradaSaida)) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Tipo inválido.`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const client = await pool.connect();
    let totalChanges = 0;

    try {
      await client.query('BEGIN');
      for (const update of updates) {
        const fieldsToUpdate = Object.keys(update).filter(field => allowedFields.includes(field));
        const updatesClause = fieldsToUpdate.map((field, i) => `${field} = $${i + 1}`).join(', ');
        const values = fieldsToUpdate.map(field => update[field]);
        values.push(update.id, user_id);

        const query = `UPDATE financeiro SET ${updatesClause} WHERE id = $${fieldsToUpdate.length + 1} AND user_id = $${fieldsToUpdate.length + 2}`;
        const result = await client.query(query, values);
        if (result.rowCount === 0) {
          throw new Error(`Nenhum registro encontrado para atualizar (ID ${update.id}).`);
        }
        totalChanges += result.rowCount;
      }
      await client.query('COMMIT');
      res.status(200).json({ message: `Registros atualizados com sucesso: ${totalChanges} linha(s) afetada(s)` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao atualizar:', err.message);
    res.status(500).json({ error: `Erro ao atualizar: ${err.message}` });
  }
}));