const { applyMiddlewares } = require('../lib/middlewares');
const jwt = require('jsonwebtoken');

module.exports = applyMiddlewares(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    if (!user.id) {
      return res.status(400).json({ error: 'ID do usuário não encontrado no token.' });
    }

    const newToken = jwt.sign(
      { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({ token: newToken });
  } catch (err) {
    console.error('Erro ao renovar token:', err.message);
    res.status(403).json({ error: 'Token inválido.' });
  }
});