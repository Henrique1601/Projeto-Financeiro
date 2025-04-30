const { applyMiddlewares } = require('../lib/middlewares');
const auth = require('../lib/auth');
const { runAsync, getAsync } = require('../lib/db');

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
    let { data, descricao, valor, entradaSaida } = req.body;
    const user_id = req.user.id;

    entradaSaida = entradaSaida.toLowerCase() === 'entrada' ? 'Entrada' :
                   entradaSaida.toLowerCase() === 'saída' ? 'Saída' : entradaSaida;

    const errors = validateFinanceiroInput(data, descricao, valor, entradaSaida);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const id = await runAsync(
        'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user_id, data, descricao, valor, entradaSaida]
      );
      const record = await getAsync('SELECT * FROM financeiro WHERE id = $1 AND user_id = $2', [id, user_id]);
      await client.query('COMMIT');

      res.status(200).json({ id, message: 'Dados salvos com sucesso', record });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao salvar:', err.message);
    res.status(500).json({ error: `Erro ao salvar: ${err.message}` });
  }
}));