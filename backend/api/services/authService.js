const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getOne, run, query } = require('../utils/queryHelpers');
const { secret, expiresIn } = require('../config/jwt');
const { sendResetCode } = require('./emailService');

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

const loginUser = async (email, senha, trustToken) => {
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

  const twoFAService = require('./twoFAService');
  const has2FA = await twoFAService.has2FA(user.id);

  if (has2FA && await twoFAService.verifyTrustToken(user.id, trustToken)) {
    const token = jwt.sign(
      { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
      secret,
      { expiresIn }
    );
    return { token, nome: user.nome, sobrenome: user.sobrenome, email: user.email };
  }

  if (has2FA) {
    const tempToken = twoFAService.generateTempToken(user.id);

    const record = await getOne('SELECT methods FROM user_2fa WHERE user_id = $1', [user.id]);
    const methods = record?.methods || [];

    if (methods.includes('email')) {
      twoFAService.sendLoginEmailCode(user.id).catch(err =>
        console.error('Erro ao enviar email 2FA:', err.message)
      );
    }

    return { requires2FA: true, methods, tempToken };
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

  const code = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await query(
    `INSERT INTO password_resets (user_id, email, code, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET code = $3, expires_at = $4`,
    [user.id, email, code, expires]
  );

  const emailResult = await sendResetCode(email, code);

  if (emailResult?.devMode) {
    return { message: 'Código de recuperação gerado.', code };
  }

  return { message: 'Código enviado para seu e-mail.' };
};

const resetPassword = async (email, code, senha) => {
  if (!email || !code || !senha) {
    throw new Error('Email, código e senha são obrigatórios.');
  }

  const user = await getOne('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const existing = await getOne(
    'SELECT * FROM password_resets WHERE user_id = $1 AND email = $2',
    [user.id, email]
  );

  if (!existing) {
    throw new Error('Nenhum código foi solicitado para este email. Solicite um novo código.');
  }

  if (existing.code !== code) {
    throw new Error('Código inválido. Verifique se digitou corretamente.');
  }

  if (new Date(existing.expires_at) < new Date()) {
    throw new Error('Código expirado. Solicite um novo código.');
  }

  const hashedPassword = await bcrypt.hash(senha, 10);
  await run('UPDATE usuarios SET senha = $1 WHERE id = $2', [hashedPassword, user.id]);
  await run('DELETE FROM password_resets WHERE user_id = $1', [user.id]);

  return { message: 'Senha redefinida com sucesso.' };
};

const getUserProfile = async (userId) => {
  const user = await getOne(
    'SELECT id, nome, sobrenome, email, foto, provider, theme, "customThemes", "dashboardConfig", "sidebarCollapsed", investimento_percentual, created_at FROM usuarios WHERE id = $1',
    [userId]
  );
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }
  return user;
};

const updateUserProfile = async (userId, dados) => {
  const { nome, sobrenome, foto, theme, customThemes, dashboardConfig, sidebarCollapsed, investimento_percentual } = dados;

  const updates = [];
  const values = [];
  let idx = 1;

  if (nome !== undefined) { updates.push(`nome = $${idx++}`); values.push(nome); }
  if (sobrenome !== undefined) { updates.push(`sobrenome = $${idx++}`); values.push(sobrenome); }
  if (foto !== undefined) { updates.push(`foto = $${idx++}`); values.push(foto); }
  if (theme !== undefined) { updates.push(`theme = $${idx++}`); values.push(theme); }
  if (customThemes !== undefined) { updates.push(`"customThemes" = $${idx++}`); values.push(customThemes); }
  if (dashboardConfig !== undefined) { updates.push(`"dashboardConfig" = $${idx++}`); values.push(dashboardConfig); }
  if (sidebarCollapsed !== undefined) { updates.push(`"sidebarCollapsed" = $${idx++}`); values.push(sidebarCollapsed); }
  if (investimento_percentual !== undefined) { updates.push(`investimento_percentual = $${idx++}`); values.push(investimento_percentual); }

  if (!updates.length) {
    throw new Error('Nenhum dado para atualizar.');
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
