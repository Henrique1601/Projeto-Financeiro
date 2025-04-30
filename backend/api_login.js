const { applyMiddlewares } = require('../lib/middlewares');
const { getAsync } = require('../lib/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = applyMiddlewares(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const user = await getAsync('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      token,
      nome: user.nome,
      sobrenome: user.sobrenome,
      email: user.email
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err.message);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});