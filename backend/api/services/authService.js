const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getOne, run, query } = require('../utils/queryHelpers');
const { secret, expiresIn } = require('../config/jwt');

const CATEGORIAS_PALAVRAS = {
  'Alimentação': ['supermercado', 'mercado', 'restaurante', 'lanche', 'pizza', 'burger', 'comida', 'ifood', 'rappi', 'globo', 'panificadora', 'açougue', 'feira', 'hortifruti', 'padaria', 'café', 'bar', 'lanchonete'],
  'Transporte': ['uber', '99', 'cabify', 'gasolina', 'combustível', 'posto', 'estacionamento', 'metrô', 'ônibus', 'metrô', 'trem', 'passagem', 'voo', 'aeroporto', 'pedágio', 'lava-jato', 'mecânica', 'oficina', 'uber', '99'],
  'Lazer': ['cinema', 'netflix', 'spotify', 'steam', 'playstation', 'xbox', 'net', 'amazon prime', 'disney', 'hbo', 'youtube', 'twitch', 'jogo', 'game', 'bar', 'balada', 'show', 'teatro', 'esporte', 'futebol', 'academia', 'crossfit', 'yoga'],
  'Saúde': ['farmácia', 'drogaria', 'médico', 'hospital', 'consulta', 'exame', 'laboratório', 'dentista', 'clínica', 'vacina', 'remédio', 'medicamento', 'óculos', 'lente', 'plano de saúde', 'UBS', 'posto'],
  'Educação': ['escola', 'universidade', 'faculdade', 'curso', 'livro', 'amazon', 'cultura', 'saraiva', 'microsoft', 'adobe', 'google', 'apple', 'aula', 'professor', 'escola', 'colégio', 'cursinho'],
  'Moradia': ['aluguel', 'condomínio', 'luz', 'energia', 'água', 'gás', 'internet', 'telefone', 'celular', 'iptu', 'seguro', 'reforma', 'móveis', 'eletrodomésticos', 'casa', 'apartamento', 'imóvel'],
  'Salário': ['salário', 'pagamento', 'folha', 'proventos', 'renda', 'freelance', 'freela', 'bônus', 'comissão', 'prêmio', 'income'],
  'Investimento': ['aplicação', 'poupança', 'renda fixa', 'renda variável', 'bitcoin', 'cripto', 'tesouro', 'cdb', 'lci', 'lca', 'fundo', 'ação', 'bolsa', 'corretora', 'nubank', 'inter', 'next', 'pag'],
  'Serviços': ['assinatura', 'net', 'vivo', 'claro', 'oi', 'tim', '.Streaming', 'amazon', 'google one', 'icloud', 'dropbox', 'office', 'host', 'servidor', 'cloud'],
  'Outros': []
};

const autoCategorize = (descricao) => {
  const texto = descricao.toLowerCase();
  for (const [categoria, palavras] of Object.entries(CATEGORIAS_PALAVRAS)) {
    if (palavras.some(palavra => texto.includes(palavra))) {
      return categoria;
    }
  }
  return 'Outros';
};

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

  if (!user.senha) {
    throw new Error('Este email foi registrado via rede social. Faça login com a mesma conta.');
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

const loginSocial = async (profile) => {
  const { id, provider, displayName, emails, photos } = profile;
  const email = emails?.[0]?.value;
  const nome = displayName?.split(' ')[0] || 'Usuario';
  const sobrenome = displayName?.split(' ').slice(1).join(' ') || '';
  const foto = photos?.[0]?.value || '';

  let user = await getOne('SELECT * FROM usuarios WHERE social_id = $1 AND provider = $2', [id, provider]);

  if (!user) {
    const existingEmail = email ? await getOne('SELECT id FROM usuarios WHERE email = $1', [email]) : null;
    if (existingEmail) {
      throw new Error('Este email já está cadastrado. Faça login com email e senha.');
    }

    const userId = await run(
      'INSERT INTO usuarios (nome, sobrenome, email, senha, social_id, provider, foto) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [nome, sobrenome, email || `${provider}_${id}@placeholder.com`, null, id, provider, foto]
    );
    user = await getOne('SELECT * FROM usuarios WHERE id = $1', [userId]);
  }

  const token = jwt.sign(
    { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, provider: user.provider },
    secret,
    { expiresIn }
  );

  return { token, nome: user.nome, sobrenome: user.sobrenome, email: user.email, foto: user.foto, isNewUser: !user.primeiro_login };
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
    { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, provider: user.provider },
    secret,
    { expiresIn }
  );

  return { token: newToken };
};

const changePassword = async (userId, senhaAtual, novaSenha) => {
  if (!senhaAtual || !novaSenha) {
    throw new Error('Senha atual e nova senha são obrigatórias.');
  }

  if (novaSenha.length < 4) {
    throw new Error('A nova senha deve ter pelo menos 4 caracteres.');
  }

  const user = await getOne('SELECT * FROM usuarios WHERE id = $1', [userId]);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  if (user.senha) {
    const validPassword = await bcrypt.compare(senhaAtual, user.senha);
    if (!validPassword) {
      throw new Error('Senha atual incorreta.');
    }
  } else {
    throw new Error('Contas sociais não têm senha. Redefina sua senha via email.');
  }

  const hashedPassword = await bcrypt.hash(novaSenha, 10);
  await run('UPDATE usuarios SET senha = $1 WHERE id = $2', [hashedPassword, userId]);

  return { message: 'Senha alterada com sucesso.' };
};

const forgotPassword = async (email) => {
  if (!email) {
    throw new Error('Email é obrigatório.');
  }

  const user = await getOne('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (!user) {
    return { message: 'Se o email existir, um código de recuperação foi enviado.' };
  }

  if (!user.senha) {
    throw new Error('Este email foi registrado via rede social. Faça login com a mesma conta.');
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

const getUserProfile = async (userId) => {
  const user = await getOne(
    'SELECT id, nome, sobrenome, email, foto, provider, created_at FROM usuarios WHERE id = $1',
    [userId]
  );
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }
  return user;
};

const updateUserProfile = async (userId, dados) => {
  const { nome, sobrenome } = dados;
  
  if (!nome && !sobrenome) {
    throw new Error('Nenhum dado para atualizar.');
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (nome) {
    updates.push(`nome = $${idx++}`);
    values.push(nome);
  }
  if (sobrenome) {
    updates.push(`sobrenome = $${idx++}`);
    values.push(sobrenome);
  }

  values.push(userId);
  
  await run(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${idx}`, values);
  
  return { message: 'Perfil atualizado com sucesso.' };
};

module.exports = { 
  registerUser, 
  loginUser, 
  loginSocial,
  refreshToken, 
  forgotPassword, 
  resetPassword,
  changePassword,
  getUserProfile,
  updateUserProfile,
  autoCategorize,
  CATEGORIAS_PALAVRAS
};
