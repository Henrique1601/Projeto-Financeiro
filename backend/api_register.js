const { applyMiddlewares } = require('../lib/middlewares');
const { getAsync, runAsync } = require('../lib/db');
const bcrypt = require('bcrypt');

module.exports = applyMiddlewares(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, sobrenome, email, senha } = req.body;

    if (!nome || !sobrenome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const existingUser = await getAsync('SELECT email FROM usuarios WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const id = await runAsync(
      'INSERT INTO usuarios (nome, sobrenome, email, senha) VALUES ($1, $2, $3, $4) RETURNING id',
      [nome, sobrenome, email, hashedPassword]
    );

    res.status(201).json({ message: 'Usuário registrado com sucesso.', id });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err.message);
    if (err.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Este email já está registrado.' });
    }
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});