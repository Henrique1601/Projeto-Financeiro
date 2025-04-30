const { applyMiddlewares } = require('../lib/middlewares');
const auth = require('../lib/auth');
const { allAsync } = require('../lib/db');

module.exports = applyMiddlewares(auth(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const user_id = req.user.id;
    const rows = await allAsync('SELECT * FROM financeiro WHERE user_id = $1 ORDER BY data DESC', [user_id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Erro ao consultar dados:', err.message);
    res.status(500).json({ error: 'Erro ao consultar no banco' });
  }
}));