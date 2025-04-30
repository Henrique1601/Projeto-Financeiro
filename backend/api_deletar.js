const { applyMiddlewares } = require('../lib/middlewares');
const auth = require('../lib/auth');
const { runAsync } = require('../lib/db');

module.exports = applyMiddlewares(auth(async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id } = req.body;
    const user_id = req.user.id;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório para deleção' });
    }

    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await runAsync('DELETE FROM financeiro WHERE id = $1 AND user_id = $2', [idNum, user_id]);
    if (result === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.status(200).json({ message: 'Registro deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar:', err.message);
    res.status(500).json({ error: `Erro ao deletar: ${err.message}` });
  }
}));