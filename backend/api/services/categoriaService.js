const { getOne, run, getAll } = require('../utils/queryHelpers');

const CATEGORIAS_PADRAO = [
  { nome: 'Alimentação', cor: '#ef4444' },
  { nome: 'Transporte', cor: '#f97316' },
  { nome: 'Lazer', cor: '#eab308' },
  { nome: 'Saúde', cor: '#22c55e' },
  { nome: 'Educação', cor: '#3b82f6' },
  { nome: 'Moradia', cor: '#8b5cf6' },
  { nome: 'Salário', cor: '#ec4899' },
  { nome: 'Investimento', cor: '#14b8a6' },
  { nome: 'Serviços', cor: '#6366f1' },
  { nome: 'Outros', cor: '#6b7280' }
];

const CATEGORIAS_PALAVRAS = {
  'Alimentação': ['supermercado', 'mercado', 'restaurante', 'lanche', 'pizza', 'burger', 'comida', 'ifood', 'rappi', 'panificadora', 'açougue', 'feira', 'hortifruti', 'padaria', 'café', 'bar', 'lanchonete'],
  'Transporte': ['uber', '99', 'gasolina', 'combustível', 'posto', 'estacionamento', 'metrô', 'ônibus', 'trem', 'passagem', 'voo', 'aeroporto', 'pedágio', 'lava-jato', 'mecânica', 'oficina'],
  'Lazer': ['cinema', 'netflix', 'spotify', 'steam', 'playstation', 'xbox', 'amazon prime', 'disney', 'hbo', 'youtube', 'twitch', 'jogo', 'game', 'balada', 'show', 'teatro', 'esporte', 'futebol', 'academia', 'crossfit', 'yoga'],
  'Saúde': ['farmácia', 'drogaria', 'médico', 'hospital', 'consulta', 'exame', 'laboratório', 'dentista', 'clínica', 'vacina', 'remédio', 'medicamento', 'óculos', 'lente', 'plano de saúde'],
  'Educação': ['escola', 'universidade', 'faculdade', 'curso', 'livro', 'cultura', 'saraiva', 'microsoft', 'adobe', 'google', 'apple', 'aula', 'professor', 'colégio', 'cursinho'],
  'Moradia': ['aluguel', 'condomínio', 'luz', 'energia', 'água', 'gás', 'internet', 'telefone', 'celular', 'iptu', 'seguro', 'reforma', 'móveis', 'eletrodomésticos', 'casa', 'apartamento', 'imóvel'],
  'Salário': ['salário', 'pagamento', 'folha', 'proventos', 'renda', 'freelance', 'freela', 'bônus', 'comissão', 'prêmio', 'income'],
  'Investimento': ['aplicação', 'poupança', 'renda fixa', 'renda variável', 'bitcoin', 'cripto', 'tesouro', 'cdb', 'lci', 'lca', 'fundo', 'ação', 'bolsa', 'corretora', 'nubank', 'inter', 'next', 'pag'],
  'Serviços': ['assinatura', 'net', 'vivo', 'claro', 'oi', 'tim', 'amazon', 'google one', 'icloud', 'dropbox', 'office', 'host', 'servidor', 'cloud'],
  'Outros': []
};

const seedCategorias = async (userId) => {
  const existing = await getAll('SELECT nome FROM categorias WHERE user_id = $1', [userId]);
  const existentes = new Set(existing.map(c => c.nome));
  for (const cat of CATEGORIAS_PADRAO) {
    if (!existentes.has(cat.nome)) {
      await run(
        'INSERT INTO categorias (user_id, nome, cor, ordem) VALUES ($1, $2, $3, $4)',
        [userId, cat.nome, cat.cor, CATEGORIAS_PADRAO.indexOf(cat)]
      );
    }
  }
};

const listarCategorias = async (userId) => {
  await seedCategorias(userId);
  const categorias = await getAll(
    'SELECT id, nome, cor, keywords, ordem FROM categorias WHERE user_id = $1 ORDER BY ordem ASC, id ASC',
    [userId]
  );
  return categorias.map(c => ({
    ...c,
    keywords: c.keywords || []
  }));
};

const criarCategoria = async (userId, { nome, cor, keywords }) => {
  if (!nome || !nome.trim()) {
    throw new Error('Nome da categoria é obrigatório.');
  }
  const trimmed = nome.trim();
  const existing = await getOne(
    'SELECT id FROM categorias WHERE user_id = $1 AND LOWER(nome) = LOWER($2)',
    [userId, trimmed]
  );
  if (existing) {
    throw new Error('Já existe uma categoria com este nome.');
  }
  const maxOrdem = await getOne(
    'SELECT MAX(ordem) as max_ord FROM categorias WHERE user_id = $1',
    [userId]
  );
  const novaOrdem = (maxOrdem?.max_ord ?? -1) + 1;
  const id = await run(
    'INSERT INTO categorias (user_id, nome, cor, keywords, ordem) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [userId, trimmed, cor || '#6b7280', keywords || [], novaOrdem]
  );
  return { id, nome: trimmed, cor: cor || '#6b7280', keywords: keywords || [], ordem: novaOrdem };
};

const atualizarCategoria = async (id, userId, { nome, cor, keywords }) => {
  const cat = await getOne(
    'SELECT id FROM categorias WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!cat) {
    throw new Error('Categoria não encontrada.');
  }
  if (nome !== undefined) {
    const trimmed = nome.trim();
    if (!trimmed) throw new Error('Nome da categoria é obrigatório.');
    const dupe = await getOne(
      'SELECT id FROM categorias WHERE user_id = $1 AND LOWER(nome) = LOWER($2) AND id != $3',
      [userId, trimmed, id]
    );
    if (dupe) throw new Error('Já existe uma categoria com este nome.');
    await run('UPDATE categorias SET nome = $1 WHERE id = $2', [trimmed, id]);
  }
  if (cor !== undefined) {
    await run('UPDATE categorias SET cor = $1 WHERE id = $2', [cor, id]);
  }
  if (keywords !== undefined) {
    await run('UPDATE categorias SET keywords = $1 WHERE id = $2', [keywords, id]);
  }
  return { message: 'Categoria atualizada.' };
};

const deletarCategoria = async (id, userId) => {
  const cat = await getOne(
    'SELECT id, nome FROM categorias WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!cat) {
    throw new Error('Categoria não encontrada.');
  }
  if (cat.nome === 'Outros') {
    throw new Error('A categoria "Outros" não pode ser excluída.');
  }
  await run('DELETE FROM categorias WHERE id = $1', [id]);
  return { message: 'Categoria removida.' };
};

const reordenarCategorias = async (userId, order) => {
  if (!Array.isArray(order)) {
    throw new Error('"order" deve ser um array de IDs.');
  }
  const catIds = await getAll(
    'SELECT id FROM categorias WHERE user_id = $1 ORDER BY id',
    [userId]
  );
  const validIds = new Set(catIds.map(c => c.id));
  for (const id of order) {
    if (!validIds.has(id)) {
      throw new Error(`Categoria ${id} não encontrada.`);
    }
  }
  for (let i = 0; i < order.length; i++) {
    await run('UPDATE categorias SET ordem = $1 WHERE id = $2', [i, order[i]]);
  }
  return { message: 'Ordem atualizada.' };
};

const autoCategorizeWithUser = async (userId, descricao) => {
  if (!descricao) return 'Outros';
  const texto = descricao.toLowerCase();

  const userCats = await getAll(
    'SELECT nome, keywords FROM categorias WHERE user_id = $1 AND array_length(keywords, 1) > 0',
    [userId]
  );

  for (const cat of userCats) {
    const palavras = cat.keywords || [];
    if (palavras.some(p => texto.includes(p.toLowerCase()))) {
      return cat.nome;
    }
  }

  for (const [categoria, palavras] of Object.entries(CATEGORIAS_PALAVRAS)) {
    if (palavras.some(palavra => texto.includes(palavra))) {
      return categoria;
    }
  }
  return 'Outros';
};

module.exports = {
  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
  reordenarCategorias,
  autoCategorizeWithUser,
  CATEGORIAS_PALAVRAS,
  CATEGORIAS_PADRAO
};
