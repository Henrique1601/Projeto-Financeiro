const { applyMiddlewares } = require('../lib/middlewares');

module.exports = applyMiddlewares(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  res.status(200).json({ status: 'OK' });
});