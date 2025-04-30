const { applyMiddlewares } = require('../lib/middlewares');
const auth = require('../lib/auth');
const { runAsync } = require('../lib/db');

const validateFinanceiroInput = (data, descricao, valor, entradaSaida) => {
  const errors = [];
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    errors.push('Data deve estar no formato YYYY-MM-DD.');
  }
  if (!descricao || typeof descricao !== 'string' || descricao.length > 255) {
    errors.push('Descrição é obrigatória e deve ter no máximo 255 caracteres.');
  }
  if (isNaN(valor)) {
    errors.push('Valor deve ser um número.');
  }
  if (!['Entrada', 'Saída'].includes(entradaSaida)) {
    errors.push('Tipo de entrada/saída deve ser "Entrada" ou "Saída".');
  }
  return errors;
};

module.exports = applyMiddlewares(auth(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { lancamentos } = req.body;
    const user_id = req.user.id;

    if (!lancamentos || !Array.isArray(lancamentos) || lancamentos.length === 0) {
      return res.status(400).json({ error: 'Um array de lançamentos é obrigatório.' });
    }

    if (lancamentos.length > 100) {
      return res.status(400).json({ error: 'Não é permitido importar mais de 100 lançamentos de uma vez.' });
    }

    const errors = [];
    const insertedIds = [];
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      for (const [index, lancamento] of lancamentos.entries()) {
        let { data, descricao, valor, entradaSaida } = lancamento;
        entradaSaida = entradaSaida.toLowerCase() === 'entrada' ? 'Entrada' :
                       entradaSaida.toLowerCase() === 'saída' ? 'Saída' : entradaSaida;

        const validationErrors = validateFinanceiroInput(data, descricao, valor, entradaSaida);
        if (validationErrors.length > 0) {
          errors.push(`Lançamento ${index + 1}: ${validationErrors.join(' ')}`);
          continue;
        }

        try {
          const id = await runAsync(
            'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [user_id, data, descricao, valor, entradaSaida]
          );
          insertedIds.push(id);
        } catch (err) {
          errors.push(`Lançamento ${index + 1}: Erro no banco: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Importação concluída com erros. ${insertedIds.length} de ${lancamentos.length} lançamentos importados.`,
          errors
        });
      }

      await client.query('COMMIT');
      res.status(200).json({
        message: `Importação concluída com sucesso! ${insertedIds.length} lançamentos importados.`,
        insertedIds
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao importar:', err.message);
    res.status(500).json({ error: `Erro ao importar: ${err.message}` });
  }
}));