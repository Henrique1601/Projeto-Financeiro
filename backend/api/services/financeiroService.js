const { pool } = require('../config/database');
const { withTransaction } = require('../utils/queryHelpers');
const { validateFinanceiroInput } = require('../utils/validators');
const { autoCategorize } = require('./authService');
const { autoCategorizeWithUser } = require('./categoriaService');

const salvarLancamento = async (userId, { data, descricao, valor, entradaSaida, categoria, metodoPagamento, observacoes, tags, moeda, cambio }) => {
  entradaSaida = parseFloat(valor) < 0 ? 'Saída' : 'Entrada';

  const categoriaFinal = categoria || await autoCategorizeWithUser(userId, descricao);
  const metodoFinal = metodoPagamento || 'Dinheiro';
  const observacoesFinal = observacoes || '';
  const tagsFinal = Array.isArray(tags) ? tags : [];

  const errors = validateFinanceiroInput(data, descricao, valor, entradaSaida);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  return await withTransaction(async (client) => {
    const { rows } = await client.query(
      'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida, categoria, "metodoPagamento", observacoes, tags, moeda, cambio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      [userId, data, descricao, valor, entradaSaida, categoriaFinal, metodoFinal, observacoesFinal, tagsFinal, moeda || 'BRL', cambio || 1]
    );
    return { id: rows[0].id, message: 'Dados salvos com sucesso.', categoria: categoriaFinal };
  });
};

const listarLancamentos = async (userId) => {
  const recorrenteService = require('./recorrenteService');
  await recorrenteService.gerarLancamentos(userId).catch(() => {});
  const orcamentoService = require('./orcamentoService');
  orcamentoService.verificarAlertas(userId).catch(() => {});
  const { rows } = await pool.query(
    `SELECT f.*,
      (SELECT COUNT(*)::int FROM comprovantes c WHERE c.lancamento_id = f.id) as comprovante_count
     FROM financeiro f
     WHERE f.user_id = $1
     ORDER BY f.data DESC`,
    [userId]
  );
  return rows;
};

const deletarLancamento = async (userId, id) => {
  const idNum = parseInt(id);
  if (isNaN(idNum)) {
    throw new Error('ID deve ser um número válido.');
  }

  const { rows: records } = await pool.query(
    `SELECT id, data, descricao, valor, entradaSaida "entradaSaida", categoria, "metodoPagamento", observacoes, tags FROM financeiro WHERE id = $1 AND user_id = $2`,
    [idNum, userId]
  );
  if (records.length === 0) {
    throw new Error('Registro não encontrado.');
  }

  await pool.query('DELETE FROM financeiro WHERE id = $1 AND user_id = $2', [idNum, userId]);

  return { message: 'Registro deletado com sucesso.', record: records[0] };
};

const desfazerDelecao = async (userId, record) => {
  if (!record || !record.data || !record.descricao || record.valor == null) {
    throw new Error('Dados do lançamento inválidos para desfazer.');
  }
  const { data, descricao, valor, entradaSaida, categoria, metodoPagamento, observacoes, tags, moeda, cambio } = record;
  const { rows } = await pool.query(
    `INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida, categoria, "metodoPagamento", observacoes, tags, moeda, cambio)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [userId, data, descricao, valor, entradaSaida, categoria, metodoPagamento || 'Dinheiro', observacoes || '', Array.isArray(tags) ? tags : [], moeda || 'BRL', cambio || 1]
  );
  return rows[0];
};

const editarLancamentos = async (userId, updates) => {
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    throw new Error('Array de edições obrigatório.');
  }

  if (updates.length > 50) {
    throw new Error('Máximo 50 edições por vez.');
  }

  const allowedFields = ['data', 'descricao', 'valor', 'entradaSaida', 'categoria', 'metodoPagamento', 'observacoes', 'tags', 'moeda', 'cambio'];

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

  for (const item of lancamentos) {
    const { data, descricao, valor, entradaSaida, categoria, metodoPagamento, observacoes, tags, moeda, cambio } = item;

    if (!data || !descricao || isNaN(valor)) {
      throw new Error('Campos inválidos em um dos lançamentos.');
    }

    const tipoFinal = entradaSaida || (parseFloat(valor) < 0 ? 'Saída' : 'Entrada');
    const metodoFinal = metodoPagamento || 'Outro';
    const observacoesFinal = observacoes || '';
    const tagsFinal = Array.isArray(tags) ? tags : [];
    const categoriaFinal = categoria || await autoCategorizeWithUser(userId, descricao);

    const existing = await pool.query(
      'SELECT id FROM financeiro WHERE user_id = $1 AND data = $2 AND descricao = $3 AND valor = $4 AND entradaSaida = $5',
      [userId, data, descricao, valor, tipoFinal]
    );

    if (existing.rows.length > 0) {
      updatedIds.push(existing.rows[0].id);
      continue;
    }

    const result = await pool.query(
      'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida, categoria, "metodoPagamento", observacoes, tags, moeda, cambio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      [userId, data, descricao, valor, tipoFinal, categoriaFinal, metodoFinal, observacoesFinal, tagsFinal, moeda || 'BRL', cambio || 1]
    );
    insertedIds.push(result.rows[0].id);
  }

  return { message: 'Lançamentos importados.', insertedIds, updatedIds };
};

const parseOFX = (content) => {
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
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

      const rawValor = parseFloat(trnamt);
      const descricao = name || memo || 'Transação';
      const ehSaida = rawValor < 0;
      const categoria = autoCategorize(descricao + ' ' + (memo || ''));

      transactions.push({
        data,
        descricao,
        valor: ehSaida ? -Math.abs(rawValor) : Math.abs(rawValor),
        entradaSaida: ehSaida ? 'Saída' : 'Entrada',
        categoria,
        metodoPagamento: 'Transferência',
        observacoes: trntype || ''
      });
    }
  }

  return transactions;
};

const parseCSV = (content) => {
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  content = content.replace(/^\uFEFF/, '');

  const lines = content.split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const rawHeaders = lines[0];
  const commaCount = (rawHeaders.match(/,/g) || []).length;
  const semicolonCount = (rawHeaders.match(/;/g) || []).length;
  const sep = semicolonCount >= commaCount ? ';' : ',';

  const headers = rawHeaders.split(sep).map(h => h.trim().replace(/"/g, '').toLowerCase());
  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === sep && !inQuotes) { vals.push(current.trim()); current = ''; }
      else current += ch;
    }
    vals.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] ? vals[idx].replace(/"/g, '') : ''; });

    const descricao = row.descricao || row['descrição'] || row.nome || row.name || row.memo || row.lançamento || row.description || row.descr || 'Transação';

    let valor = parseFloat((row.valor || row.amount || row.value || row['valor '] || row.valor_ || '0').replace(',', '.'));

    let data = row.data || row.date || row['data transação'] || row['data '] || row.data_ || row.dt;
    if (typeof data === 'string' && data.includes('/')) {
      const parts = data.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        data = `${y}-${m}-${d}`;
      }
    }

    if (!data || isNaN(valor)) continue;

    const rowTipo = (row.tipo || row['tipo '] || row.tipo_ || '').trim().toLowerCase();
    const ehSaida = rowTipo === 'saída' || rowTipo === 'saida' || valor < 0;
    const entradaSaida = ehSaida ? 'Saída' : 'Entrada';
    const categoria = row.categoria || row.category || row.categoria_ || row['categoria '] || autoCategorize(descricao);

    transactions.push({
      data,
      descricao,
      valor: ehSaida ? -Math.abs(valor) : Math.abs(valor),
      entradaSaida,
      categoria,
      metodoPagamento: row.metodopagamento || row.metodo_pagamento || row['método de pagamento'] || row.pagamento || 'Outro'
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
        lancamentos = json.map(item => {
          const rawValor = parseFloat(item.valor || item.amount || item.value || 0);
          const rawTipo = (item.entradaSaida || item.type || '').trim().toLowerCase();
          const ehSaida = rawTipo === 'saída' || rawTipo === 'saida' || rawValor < 0;
          return {
            data: item.data || item.date,
            descricao: item.descricao || item.description || item.name,
            valor: ehSaida ? -Math.abs(rawValor) : Math.abs(rawValor),
            entradaSaida: ehSaida ? 'Saída' : 'Entrada',
            categoria: item.categoria || autoCategorize(item.descricao || ''),
            metodoPagamento: item.metodoPagamento || 'Outro',
            tags: Array.isArray(item.tags) ? item.tags : [],
            moeda: item.moeda || 'BRL',
            cambio: item.cambio || 1
          };
        });
      }
    } catch {
      throw new Error('Formato não suportado. Use OFX, CSV ou JSON.');
    }
  }

  if (lancamentos.length === 0) {
    throw new Error('Nenhuma transação encontrada no arquivo.');
  }

  const result = await importarLancamentos(userId, lancamentos);
  result.debug = {
    totalParsed: lancamentos.length,
    sample: lancamentos.slice(0, 3).map(l => ({ data: l.data, descricao: l.descricao, valor: l.valor, categoria: l.categoria, moeda: l.moeda, cambio: l.cambio }))
  };
  return result;
};

const exportarXlsx = async (lancamentos) => {
  const XLSX = require('xlsx');
  const rows = lancamentos.map(l => ({
    Data: l.data ? l.data.split('T')[0] : '',
    Descrição: l.descricao || '',
    Valor: Number(l.valor || 0),
    Tipo: (parseFloat(l.valor) < 0) ? 'Saída' : 'Entrada',
    Categoria: l.categoria || '',
    'Método Pagamento': l.metodoPagamento || '',
    Tags: Array.isArray(l.tags) ? l.tags.join(', ') : '',
    Moeda: l.moeda || 'BRL',
    Câmbio: l.cambio || 1,
    Observações: l.observacoes || ''
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = [
    { wch: 12 }, { wch: 40 }, { wch: 14 },
    { wch: 8 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 30 }
  ];
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = { salvarLancamento, listarLancamentos, deletarLancamento, desfazerDelecao, editarLancamentos, importarLancamentos, importarAuto, exportarXlsx, parseCSV, parseOFX };
