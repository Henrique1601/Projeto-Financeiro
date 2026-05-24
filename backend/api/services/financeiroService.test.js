const { describe, it } = require('node:test');
const assert = require('node:assert');

// Test parseCSV
describe('parseCSV', () => {
  it('should parse semicolon CSV', async () => {
    const { parseCSV } = require('./financeiroService');
    const csv = 'descricao;valor;data;tipo\nCompra;50.00;2024-01-15;saída';
    const result = parseCSV(csv);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].descricao, 'Compra');
    assert.strictEqual(result[0].entradaSaida, 'Saída');
  });

  it('should parse comma CSV', async () => {
    const { parseCSV } = require('./financeiroService');
    const csv = 'descricao,valor,data,tipo\nSalario,5000.00,2024-01-01,entrada';
    const result = parseCSV(csv);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].valor, 5000);
    assert.strictEqual(result[0].entradaSaida, 'Entrada');
  });

  it('should skip empty input', async () => {
    const { parseCSV } = require('./financeiroService');
    assert.strictEqual(parseCSV('').length, 0);
    assert.strictEqual(parseCSV('header1;header2').length, 0);
  });
});

describe('parseOFX', () => {
  it('should parse OFX transaction', async () => {
    const { parseOFX } = require('./financeiroService');
    const ofx = `<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240115
<TRNAMT>-150.00
<NAME>Supermercado
</STMTTRN>`;
    const result = parseOFX(ofx);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].descricao, 'Supermercado');
    assert.strictEqual(result[0].entradaSaida, 'Saída');
    assert.strictEqual(result[0].valor, -150);
  });
});
