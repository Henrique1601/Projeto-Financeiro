const { pool } = require('../config/database');
const { withTransaction } = require('../utils/queryHelpers');
const { validateFinanceiroInput } = require('../utils/validators');
const { autoCategorize } = require('./authService');

const salvarLancamento = async (userId, { data, descricao, valor, entradaSaida, categoria, metodoPagamento, observacoes }) => {
  entradaSaida = entradaSaida.toLowerCase() === 'entrada' ? 'Entrada' :
                 entradaSaida.toLowerCase() === 'saída' ? 'Saída' : entradaSaida;

  const categoriaFinal = categoria || autoCategorize(descricao);
  const metodoFinal = metodoPagamento || 'Dinheiro';
  const observacoesFinal = observacoes || '';

  const errors = validateFinanceiroInput(data, descricao, valor, entradaSaida);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  return await withTransaction(async (client) => {
    const { rows } = await client.query(
      'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida, categoria, metodoPagamento, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [userId, data, descricao, valor, entradaSaida, categoriaFinal, metodoFinal, observacoesFinal]
    );
    return { id: rows[0].id, message: 'Dados salvos com sucesso.', categoria: categoriaFinal };
  });
};

const listarLancamentos = async (userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM financeiro WHERE user_id = $1 ORDER BY data DESC',
    [userId]
  );
  return rows;
};

const deletarLancamento = async (userId, id) => {
  const idNum = parseInt(id);
  if (isNaN(idNum)) {
    throw new Error('ID deve ser um número válido.');
  }

  const result = await pool.query(
    'DELETE FROM financeiro WHERE id = $1 AND user_id = $2',
    [idNum, userId]
  );

  if (result.rowCount === 0) {
    throw new Error('Registro não encontrado.');
  }

  return { message: 'Registro deletado com sucesso.' };
};

const editarLancamentos = async (userId, updates) => {
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    throw new Error('Array de edições obrigatório.');
  }

  if (updates.length > 50) {
    throw new Error('Máximo 50 edições por vez.');
  }

  const allowedFields = ['data', 'descricao', 'valor', 'entradaSaida', 'categoria', 'metodoPagamento', 'observacoes'];

  return await withTransaction(async (client) => {
    let total = 0;
    for (const update of updates) {
      const fieldsToUpdate = Object.keys(update).filter(f => allowedFields.includes(f));
      if (fieldsToUpdate.length === 0) continue;

      const values = fieldsToUpdate.map(f => update[f]);
      values.push(update.id, userId);

      const setClause = fieldsToUpdate.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const query = `UPDATE financeiro SET ${setClause} WHERE id = $${fieldsToUpdate.length + 1} AND user_id = $${fieldsToUpdate.length + 2}`;

      const result = await client.query(query, values);
      if (result.rowCount === 0) {
        throw new Error(`Nenhum registro encontrado para atualizar (ID ${update.id}).`);
      }
      total += result.rowCount;
    }
    return { message: `${total} registro(s) atualizado(s) com sucesso.` };
  });
};

const importarLancamentos = async (userId, lancamentos) => {
  if (!lancamentos || !Array.isArray(lancamentos) || lancamentos.length === 0) {
    throw new Error('Nenhum lançamento válido.');
  }

  const insertedIds = [];
  const updatedIds = [];

  for (const { data, descricao, valor, entradaSaida, categoria } of lancamentos) {
    if (!data || !descricao || isNaN(valor) || !['Entrada', 'Saída'].includes(entradaSaida)) {
      throw new Error('Campos inválidos em um dos lançamentos.');
    }

    const existing = await pool.query(
      'SELECT id FROM financeiro WHERE user_id = $1 AND data = $2 AND descricao = $3 AND valor = $4 AND entradaSaida = $5',
      [userId, data, descricao, valor, entradaSaida]
    );

    if (existing.rows.length > 0) {
      updatedIds.push(existing.rows[0].id);
      continue;
    }

    const categoriaFinal = categoria || autoCategorize(descricao);

    const result = await pool.query(
      'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida, categoria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, data, descricao, valor, entradaSaida, categoriaFinal]
    );
    insertedIds.push(result.rows[0].id);
  }

  return { message: 'Lançamentos importados.', insertedIds, updatedIds };
};

const parseOFX = (content) => {
  const transactions = [];
  const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const trn = match[1];
    
    const getValue = (tag) => {
      const tagRegex = new RegExp(`<${tag}>([^<\\n]+)`, 'i');
      const tagMatch = trn.match(tagRegex);
      return tagMatch ? tagMatch[1].trim() : null;
    };

    const dtposted = getValue('DTPOSTED');
    const trnamt = getValue('TRNAMT');
    const name = getValue('NAME');
    const memo = getValue('MEMO');
    const trntype = getValue('TRNTYPE');

    if (dtposted && trnamt) {
      const year = dtposted.substring(0, 4);
      const month = dtposted.substring(4, 6);
      const day = dtposted.substring(6, 8);
      const data = `${year}-${month}-${day}`;

      const valor = parseFloat(trnamt);
      const descricao = name || memo || 'Transação';
      const entradaSaida = valor >= 0 ? 'Entrada' : 'Saída';
      const categoria = autoCategorize(descricao + ' ' + (memo || ''));

      transactions.push({
        data,
        descricao,
        valor: Math.abs(valor),
        entradaSaida,
        categoria,
        metodoPagamento: 'Transferência',
        observacoes: trntype || ''
      });
    }
  }

  return transactions;
};

const parseCSV = (content) => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const descricao = row.descricao || row.nome || row.memo || row.name || 'Transação';
    let valor = parseFloat((row.valor || row.amount || row.value || '0').replace(',', '.'));
    let data = row.data || row.date || row['data transação'];
    
    if (typeof data === 'string' && data.includes('/')) {
      const [d, m, y] = data.split('/');
      data = `${y}-${m}-${d}`;
    }

    if (!data || isNaN(valor)) continue;

    const entradaSaida = valor < 0 ? 'Saída' : 'Entrada';
    const categoria = autoCategorize(descricao);

    transactions.push({
      data,
      descricao,
      valor: Math.abs(valor),
      entradaSaida,
      categoria,
      metodoPagamento: 'Outro'
    });
  }

  return transactions;
};

const importarAuto = async (userId, fileType, content) => {
  if (!content) {
    throw new Error('Conteúdo do arquivo é obrigatório.');
  }

  let lancamentos = [];
  
  if (fileType === 'ofx' || content.includes('<OFX>') || content.includes('<OFX ')) {
    lancamentos = parseOFX(content);
  } else if (fileType === 'csv' || content.includes(';')) {
    lancamentos = parseCSV(content);
  } else {
    try {
      const json = JSON.parse(content);
      if (Array.isArray(json)) {
        lancamentos = json.map(item => ({
          data: item.data || item.date,
          descricao: item.descricao || item.description || item.name,
          valor: parseFloat(item.valor || item.amount || item.value || 0),
          entradaSaida: (item.entradaSaida || item.type || 'Saída'),
          categoria: item.categoria || autoCategorize(item.descricao || ''),
          metodoPagamento: item.metodoPagamento || 'Outro'
        }));
      }
    } catch {
      throw new Error('Formato não suportado. Use OFX, CSV ou JSON.');
    }
  }

  if (lancamentos.length === 0) {
    throw new Error('Nenhuma transação encontrada no arquivo.');
  }

  return await importarLancamentos(userId, lancamentos);
};

module.exports = { salvarLancamento, listarLancamentos, deletarLancamento, editarLancamentos, importarLancamentos, importarAuto };
