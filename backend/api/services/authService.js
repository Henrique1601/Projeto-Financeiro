const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getOne, run, query } = require('../utils/queryHelpers');
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

const forgotPassword = async (email) => {
  if (!email) {
    throw new Error('Email é obrigatório.');
  }

  const user = await getOne('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (!user) {
    return { message: 'Se o email existir, um código de recuperação foi enviado.' };
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await query(
    `INSERT INTO password_resets (user_id, email, code, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET code = $3, expires_at = $4`,
    [user.id, email, code, expires]
  );

  console.log(`[密码重置] Email: ${email}, Código: ${code}`);

  return { message: 'Código de recuperação gerado.', code };
};

const resetPassword = async (email, code, senha) => {
  if (!email || !code || !senha) {
    throw new Error('Email, código e senha são obrigatórios.');
  }

  const user = await getOne('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const reset = await getOne(
    'SELECT * FROM password_resets WHERE user_id = $1 AND email = $2 AND code = $3 AND expires_at > NOW()',
    [user.id, email, code]
  );

  if (!reset) {
    throw new Error('Código inválido ou expirado.');
  }

  const hashedPassword = await bcrypt.hash(senha, 10);
  await run('UPDATE usuarios SET senha = $1 WHERE id = $2', [hashedPassword, user.id]);
  await run('DELETE FROM password_resets WHERE user_id = $1', [user.id]);

  return { message: 'Senha redefinida com sucesso.' };
};

module.exports = { registerUser, loginUser, refreshToken, forgotPassword, resetPassword };
