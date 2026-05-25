const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('calcularProximaData', () => {
  const { calcularProximaData } = require('./recorrenteService');

  it('adds 7 days for semanal', () => {
    assert.strictEqual(calcularProximaData('2024-01-01', 'semanal'), '2024-01-08');
  });

  it('adds 14 days for quinzenal', () => {
    assert.strictEqual(calcularProximaData('2024-01-01', 'quinzenal'), '2024-01-15');
  });

  it('adds 1 month for mensal', () => {
    assert.strictEqual(calcularProximaData('2024-01-15', 'mensal'), '2024-02-15');
  });

  it('adds 1 year for anual', () => {
    assert.strictEqual(calcularProximaData('2024-06-15', 'anual'), '2025-06-15');
  });

  it('handles month boundary mensal', () => {
    assert.strictEqual(calcularProximaData('2024-01-31', 'mensal'), '2024-03-02');
  });

  it('handles year boundary anual', () => {
    assert.strictEqual(calcularProximaData('2024-12-01', 'semanal'), '2024-12-08');
  });
});
