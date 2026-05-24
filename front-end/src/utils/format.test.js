import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSaida, getTipo, formatCurrency, formatDate } from './format.js';

describe('isSaida', () => {
  it('returns true for saida text', () => {
    assert.equal(isSaida({ entradaSaida: 'Saída', valor: 100 }), true);
    assert.equal(isSaida({ entradaSaida: 'saida', valor: 100 }), true);
  });

  it('returns false for entrada text', () => {
    assert.equal(isSaida({ entradaSaida: 'Entrada', valor: -100 }), false);
    assert.equal(isSaida({ entradaSaida: 'entrada', valor: -100 }), false);
  });

  it('falls back to valor sign when text is ambiguous', () => {
    assert.equal(isSaida({ entradaSaida: '', valor: -50 }), true);
    assert.equal(isSaida({ entradaSaida: '', valor: 50 }), false);
  });

  it('handles string input', () => {
    assert.equal(isSaida('Saída'), true);
    assert.equal(isSaida('Entrada'), false);
  });
});

describe('getTipo', () => {
  it('returns Saída for saida items', () => {
    assert.equal(getTipo({ entradaSaida: 'Saída' }), 'Saída');
  });

  it('returns Entrada for entrada items', () => {
    assert.equal(getTipo({ entradaSaida: 'Entrada' }), 'Entrada');
  });
});

describe('formatCurrency', () => {
  it('formats values', () => {
    const result = formatCurrency(1234.5);
    assert.ok(result.includes('1.234'));
  });
});

describe('formatDate', () => {
  it('formats ISO date to PT-BR', () => {
    assert.equal(formatDate('2024-01-15'), '15/01/2024');
  });

  it('returns empty for null', () => {
    assert.equal(formatDate(null), '');
  });
});
