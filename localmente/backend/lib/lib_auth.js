const jwt = require('jsonwebtoken');

module.exports = (handler) => async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    return handler(req, res);
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};