const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getOne, run } = require('../utils/queryHelpers');
const { secret, expiresIn } = require('../config/jwt');

const registerUser = async (nome, sobrenome, email, senha) => {
  if (!nome || !sobrenome || !email || !senha) {
    throw new Error('Todos os campos são obrigatórios.');
  }

  const existing = await getOne('SELECT email FROM usuarios WHERE email = $1', [email]);
  if (existing) {
    throw new Error('Este email já está registrado.');
  }

  const hashedPassword = await bcrypt.hash(senha, 10);
  const id = await run(
    'INSERT INTO usuarios (nome, sobrenome, email, senha) VALUES ($1, $2, $3, $4) RETURNING id',
    [nome, sobrenome, email, hashedPassword]
  );

  const token = jwt.sign({ id, nome, sobrenome, email }, secret, { expiresIn });
  return { message: 'Usuário registrado com sucesso.', id, token };
};

const loginUser = async (email, senha) => {
  if (!email || !senha) {
    throw new Error('Email e senha são obrigatórios.');
  }

  const user = await getOne('SELECT * FROM usuarios WHERE email = $1', [email]);
  if (!user) {
    throw new Error('Email ou senha incorretos.');
  }

  const validPassword = await bcrypt.compare(senha, user.senha);
  if (!validPassword) {
    throw new Error('Email ou senha incorretos.');
  }

  const token = jwt.sign(
    { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
    secret,
    { expiresIn }
  );

  return { token, nome: user.nome, sobrenome: user.sobrenome, email: user.email };
};

const refreshToken = async (authHeader) => {
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Token requerido.');
  }

  const decoded = jwt.verify(token, secret, { ignoreExpiration: true });
  if (!decoded.id) {
    throw new Error('ID do usuário não encontrado.');
  }

  const user = await getOne('SELECT * FROM usuarios WHERE id = $1', [decoded.id]);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const newToken = jwt.sign(
    { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
    secret,
    { expiresIn }
  );

  return { token: newToken };
};

module.exports = { registerUser, loginUser, refreshToken };
