export function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

export function formatCurrency(value) {
  try {
    const num = Number(value);
    if (isNaN(num)) return value;
    const sign = num < 0 ? '-' : '';
    return `${sign}R$${Math.abs(num).toFixed(2).replace('.', ',')}`;
  } catch {
    return value;
  }
}

export function getMonthName(monthIndex) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
  return months[monthIndex] || '';
}

export function getTipoLabel(tipoRaw) {
  const str = String(tipoRaw || '').trim().toLowerCase();
  return (str === 'saída' || str === 'saida') ? 'Saída' : 'Entrada';
}

export function isSaida(tipoRaw) {
  const str = String(tipoRaw || '').trim().toLowerCase();
  return str === 'saída' || str === 'saida';
}
