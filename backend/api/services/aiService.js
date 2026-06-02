const { pool } = require('../config/database');

const aggregateUserData = async (userId) => {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0, 7);
  const hojeStr = hoje.toISOString().slice(0, 10);

  const [resumoRes, categoriasRes, orcamentosRes, recorrentesRes, recentesRes, anteriorRes, saldoTotalRes] = await Promise.all([
    pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN entradaSaida = 'Entrada' THEN valor ELSE 0 END), 0) as receitas,
        COALESCE(SUM(CASE WHEN entradaSaida = 'Saída' THEN valor ELSE 0 END), 0) as despesas,
        COUNT(*) as total
       FROM financeiro WHERE user_id = $1 AND data >= $2::date AND data < $3::date`,
      [userId, mesAtual + '-01', hojeStr]
    ),
    pool.query(
      `SELECT categoria,
        SUM(ABS(valor)) as total,
        COUNT(*) as quantidade
       FROM financeiro
       WHERE user_id = $1 AND entradaSaida = 'Saída' AND data >= $2::date AND data < $3::date
       GROUP BY categoria ORDER BY total DESC LIMIT 5`,
      [userId, mesAtual + '-01', hojeStr]
    ),
    pool.query(
      `SELECT o.categoria, o.limite,
        COALESCE(SUM(ABS(f.valor)), 0) as gasto_atual
       FROM orcamentos o
       LEFT JOIN financeiro f ON f.user_id = o.user_id AND f.categoria = o.categoria
        AND f.entradaSaida = 'Saída' AND f.data >= $3::date AND f.data < $4::date
       WHERE o.user_id = $1 AND o.mes = $2
       GROUP BY o.categoria, o.limite, o.mes`,
      [userId, mesAtual, mesAtual + '-01', hojeStr]
    ),
    pool.query(
      `SELECT descricao, valor, categoria, proxima_data
       FROM recorrentes
       WHERE user_id = $1 AND ativo = true
       ORDER BY proxima_data ASC LIMIT 5`,
      [userId]
    ),
    pool.query(
      `SELECT descricao, valor, entradaSaida, categoria, data
       FROM financeiro
       WHERE user_id = $1
       ORDER BY data DESC LIMIT 10`,
      [userId]
    ),
    pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN entradaSaida = 'Entrada' THEN valor ELSE 0 END), 0) as receitas,
        COALESCE(SUM(CASE WHEN entradaSaida = 'Saída' THEN valor ELSE 0 END), 0) as despesas
       FROM financeiro WHERE user_id = $1 AND data >= $2::date AND data < $3::date`,
      [userId, mesAnterior + '-01', mesAtual + '-01']
    ),
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as saldo_total
       FROM financeiro WHERE user_id = $1`,
      [userId]
    )
  ]);

  const resumo = resumoRes.rows[0];
  const anterior = anteriorRes.rows[0];
  const despesas = Math.abs(Number(resumo.despesas));
  const receitas = Number(resumo.receitas);

  return {
    mes: mesAtual,
    receitas,
    despesas,
    saldo_mes: receitas - despesas,
    saldo_total: Number(saldoTotalRes.rows[0].saldo_total),
    total_transacoes: Number(resumo.total),
    categorias: categoriasRes.rows.map(r => ({
      nome: r.categoria,
      total: Number(r.total),
      quantidade: Number(r.quantidade)
    })),
    orcamentos: orcamentosRes.rows.map(r => ({
      categoria: r.categoria,
      limite: Number(r.limite),
      gasto: Number(r.gasto_atual),
      percentual: r.limite > 0 ? Math.round((Number(r.gasto_atual) / Number(r.limite)) * 100) : 0
    })),
    recorrentes_proximos: recorrentesRes.rows.map(r => ({
      descricao: r.descricao,
      valor: Number(r.valor),
      categoria: r.categoria,
      proxima_data: r.proxima_data
    })),
    ultimas_transacoes: recentesRes.rows.slice(0, 5).map(r => ({
      descricao: r.descricao,
      valor: Number(r.valor),
      tipo: r.entradaSaida,
      categoria: r.categoria,
      data: r.data
    })),
    mes_anterior: {
      receitas: Number(anterior.receitas),
      despesas: Math.abs(Number(anterior.despesas))
    }
  };
};

const calcularVariacao = (atual, anterior) => {
  if (!anterior || anterior === 0) return atual > 0 ? 100 : 0;
  return Math.round(((atual - anterior) / anterior) * 100);
};

const detectPatterns = async (userId) => {
  const hoje = new Date();
  const tresMeses = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1).toISOString().slice(0, 7);

  const { rows } = await pool.query(
    `SELECT
      categoria,
      DATE_TRUNC('month', data) as mes,
      SUM(valor) as total
     FROM financeiro
     WHERE user_id = $1 AND entradaSaida = 'Saída' AND data >= $2::date
     GROUP BY categoria, DATE_TRUNC('month', data)
     ORDER BY categoria, mes`,
    [userId, tresMeses + '-01']
  );

  const categorias = {};
  for (const r of rows) {
    const cat = r.categoria;
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push({ mes: r.mes, total: Number(r.total) });
  }

  const patterns = [];
  for (const [categoria, meses] of Object.entries(categorias)) {
    if (meses.length >= 2) {
      const variacao = calcularVariacao(meses[meses.length - 1].total, meses[meses.length - 2].total);
      if (Math.abs(variacao) >= 10) {
        patterns.push({
          categoria,
          variacao,
          direcao: variacao > 0 ? 'alta' : 'queda',
          valor_atual: meses[meses.length - 1].total,
          valor_anterior: meses[meses.length - 2].total
        });
      }
    }
  }

  return patterns.sort((a, b) => Math.abs(b.variacao) - Math.abs(a.variacao)).slice(0, 3);
};

const buildPrompt = (userData, patterns, conversation, question) => {
  const categoriasTexto = userData.categorias.map(c =>
    `- ${c.nome}: R$ ${c.total.toFixed(2)} (${c.quantidade} transações)`
  ).join('\n');

  const orcamentosTexto = userData.orcamentos.map(o =>
    `- ${o.categoria}: R$ ${o.gasto.toFixed(2)} de R$ ${o.limite.toFixed(2)} (${o.percentual}%)`
  ).join('\n');

  const recorrentesTexto = userData.recorrentes_proximos.map(r =>
    `- ${r.descricao}: R$ ${r.valor.toFixed(2)} (próximo: ${r.proxima_data})`
  ).join('\n');

  const patternsTexto = patterns.map(p =>
    `- ${p.categoria}: ${p.variacao > 0 ? '+' : ''}${p.variacao}% (${p.direcao})`
  ).join('\n');

  const historicoTexto = (conversation || []).map(m =>
    `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`
  ).join('\n');

  return `Você é um assistente financeiro pessoal. Responda em português brasileiro, seja conciso (2-4 frases) e use sempre os dados reais fornecidos.

Contexto financeiro do usuário (${userData.mes}):
- Receitas do mês: R$ ${userData.receitas.toFixed(2)}
- Despesas do mês: R$ ${userData.despesas.toFixed(2)}
- Saldo do mês: R$ ${userData.saldo_mes.toFixed(2)}
- Saldo total (todos os meses): R$ ${userData.saldo_total.toFixed(2)}

Mês anterior:
- Receitas: R$ ${userData.mes_anterior.receitas.toFixed(2)}
- Despesas: R$ ${userData.mes_anterior.despesas.toFixed(2)}

Gastos por categoria:
${categoriasTexto || '(nenhum gasto registrado)'}

${orcamentosTexto ? `Orçamentos:\n${orcamentosTexto}` : ''}
${recorrentesTexto ? `Próximos recorrentes:\n${recorrentesTexto}` : ''}
${patternsTexto ? `Padrões detectados:\n${patternsTexto}` : ''}

${historicoTexto ? `Histórico:\n${historicoTexto}` : ''}

Pergunta do usuário: ${question}`;
};

const askQuestion = async (userId, question, conversation) => {
  const [userData, patterns] = await Promise.all([
    aggregateUserData(userId),
    detectPatterns(userId)
  ]);

  const prompt = buildPrompt(userData, patterns, conversation, question);

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
  const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    throw Object.assign(new Error('Assistente não configurado. Defina AI_API_KEY (ou OPENAI_API_KEY) no .env do backend.'), { statusCode: 400 });
  }

  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey, baseURL });

  const messages = [
    { role: 'system', content: 'Você é um assistente financeiro pessoal. Responda em português brasileiro, de forma concisa, usando apenas os dados fornecidos.' },
    { role: 'user', content: prompt }
  ];

  const stream = await openai.chat.completions.create({
    model,
    messages,
    stream: true,
    max_tokens: 500,
    temperature: 0.3
  });

  return { stream, userData, patterns };
};

module.exports = { aggregateUserData, detectPatterns, askQuestion };
