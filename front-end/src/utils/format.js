export function formatDate(iso) {
  if (!iso) return '';
  try {
    const parts = iso.split('T')[0].split('-');
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts.map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  } catch {
    return iso;
  }
}

export function formatCurrency(value, moeda = 'BRL') {
  try {
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(num);
  } catch {
    return value;
  }
}

export function formatCurrencyWithCambio(value, moeda, cambio) {
  const formatted = formatCurrency(value, moeda);
  if (!moeda || moeda === 'BRL' || !cambio || cambio === 1) return formatted;
  const brl = Number(value) * Number(cambio);
  return `${formatted} (≈ ${formatCurrency(brl)})`;
}

export function getMonthName(monthIndex) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
  return months[monthIndex] || '';
}

export function getTipoLabel(tipoRaw) {
  const str = String(tipoRaw || '').trim().toLowerCase();
  return (str === 'saída' || str === 'saida') ? 'Saída' : 'Entrada';
}

export function isSaida(item) {
  if (!item) return false;
  if (typeof item === 'object') {
    const str = String(item.entradaSaida || '').trim().toLowerCase();
    if (str === 'saída' || str === 'saida') return true;
    if (str === 'entrada') return false;
    return Number(item.valor) < 0;
  }
  const str = String(item || '').trim().toLowerCase();
  return str === 'saída' || str === 'saida';
}

export function getTipo(item) {
  return isSaida(item) ? 'Saída' : 'Entrada';
}

export function formatMonthBR(mes) {
  if (!mes) return '';
  const [ano, mesNum] = mes.split('-');
  const mesesNome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${mesesNome[parseInt(mesNum, 10) - 1]} ${ano}`;
}
