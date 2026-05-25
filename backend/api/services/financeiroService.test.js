const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('autoCategorize', () => {
  const { autoCategorize, CATEGORIAS_PALAVRAS } = require('./authService');

  it('categorizes supermercado as Alimentação', () => {
    assert.strictEqual(autoCategorize('Compra no supermercado Extra'), 'Alimentação');
  });

  it('categorizes ifood as Alimentação', () => {
    assert.strictEqual(autoCategorize('iFood pedido #123'), 'Alimentação');
  });

  it('categorizes uber as Transporte', () => {
    assert.strictEqual(autoCategorize('Uber viagem centro'), 'Transporte');
  });

  it('categorizes gasolina as Transporte', () => {
    assert.strictEqual(autoCategorize('Gasolina posto BR'), 'Transporte');
  });

  it('categorizes netflix as Lazer', () => {
    assert.strictEqual(autoCategorize('Netflix assinatura'), 'Lazer');
  });

  it('categorizes farmácia as Saúde', () => {
    assert.strictEqual(autoCategorize('Farmácia Pague Menos'), 'Saúde');
  });

  it('categorizes escola as Educação', () => {
    assert.strictEqual(autoCategorize('Escola Inglês mensalidade'), 'Educação');
  });

  it('categorizes aluguel as Moradia', () => {
    assert.strictEqual(autoCategorize('Aluguel apê'), 'Moradia');
  });

  it('categorizes salário as Salário', () => {
    assert.strictEqual(autoCategorize('Salário mensal'), 'Salário');
  });

  it('categorizes bitcoin as Investimento', () => {
    assert.strictEqual(autoCategorize('Compra Bitcoin'), 'Investimento');
  });

  it('categorizes servidor as Serviços', () => {
    assert.strictEqual(autoCategorize('Servidor dedicado'), 'Serviços');
  });

  it('returns Outros for unknown', () => {
    assert.strictEqual(autoCategorize('xyzzy'), 'Outros');
  });

  it('is case insensitive', () => {
    assert.strictEqual(autoCategorize('IFOOD'), 'Alimentação');
  });

  it('handles empty string', () => {
    assert.strictEqual(autoCategorize(''), 'Outros');
  });

  it('contains expected categories', () => {
    const expected = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Moradia', 'Salário', 'Investimento', 'Serviços', 'Outros'];
    assert.deepStrictEqual(Object.keys(CATEGORIAS_PALAVRAS), expected);
  });
});

describe('parseCSV', () => {
  const { parseCSV } = require('./financeiroService');

  it('handles BOM character', () => {
    const csv = '\uFEFFdescricao;valor;data;tipo\nCompra;25.00;2024-03-01;saída';
    const result = parseCSV(csv);
    assert.strictEqual(result.length, 1);
  });

  it('handles Brazilian decimal comma', () => {
    const csv = 'descricao;valor;data;tipo\nProduto;49,90;2024-03-01;saída';
    const result = parseCSV(csv);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].valor, -49.90);
  });

  it('uses tipo column over valor sign', () => {
    const csv = 'descricao;valor;data;tipo\nBonus;100;2024-03-01;entrada';
    const result = parseCSV(csv);
    assert.strictEqual(result[0].entradaSaida, 'Entrada');
    assert.strictEqual(result[0].valor, 100);
  });

  it('handles quoted fields', () => {
    const csv = 'descricao;valor;data;tipo\n"Compra no mercado";50;2024-03-01;saída';
    const result = parseCSV(csv);
    assert.strictEqual(result[0].descricao, 'Compra no mercado');
  });

  it('converts dd/mm/yyyy date format', () => {
    const csv = 'descricao;valor;data;tipo\nTeste;100;15/03/2024;entrada';
    const result = parseCSV(csv);
    assert.strictEqual(result[0].data, '2024-03-15');
  });

  it('handles short year dd/mm/yy', () => {
    const csv = 'descricao;valor;data;tipo\nTeste;100;15/03/24;entrada';
    const result = parseCSV(csv);
    assert.strictEqual(result[0].data, '2024-03-15');
  });
});

describe('parseOFX', () => {
  const { parseOFX } = require('./financeiroService');

  it('parses credit transaction', () => {
    const ofx = `<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20240315
<TRNAMT>2500.00
<NAME>Salário
</STMTTRN>`;
    const result = parseOFX(ofx);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].entradaSaida, 'Entrada');
    assert.strictEqual(result[0].valor, 2500);
  });

  it('uses MEMO when NAME is missing', () => {
    const ofx = `<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240315
<TRNAMT>-50.00
<MEMO>Padaria
</STMTTRN>`;
    const result = parseOFX(ofx);
    assert.strictEqual(result[0].descricao, 'Padaria');
  });

  it('handles multiple transactions', () => {
    const ofx = `<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240301
<TRNAMT>-100.00
<NAME>Compra1
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240302
<TRNAMT>-200.00
<NAME>Compra2
</STMTTRN>`;
    const result = parseOFX(ofx);
    assert.strictEqual(result.length, 2);
  });

  it('handles \\r\\n line endings', () => {
    const ofx = '<STMTTRN>\r\n<TRNTYPE>DEBIT\r\n<DTPOSTED>20240315\r\n<TRNAMT>-75.00\r\n<NAME>Teste\r\n</STMTTRN>';
    const result = parseOFX(ofx);
    assert.strictEqual(result.length, 1);
  });
});
