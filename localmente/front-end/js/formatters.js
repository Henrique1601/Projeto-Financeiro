export function formatarData(dataISO) {
  if (!dataISO) return '';
  const data = new Date(dataISO);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function formatarValor(valor) {
  try {
    const numero = Number(valor);
    if (isNaN(numero)) return valor;
    const formato = `R$${Math.abs(numero).toFixed(2).replace('.', ',')}`;
    return numero < 0 ? `-${formato}` : formato;
  } catch (error) {
    return valor;
  }
}

export function converterParaFormatoBackend(data) {
  try {
    if (!data) return null;
    if (data.match(/^\d{4}-\d{2}-\d{2}$/)) return data;
    const [dia, mes, ano] = data.split('/');
    if (dia && mes && ano) {
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    throw new Error('Formato de data inválido');
  } catch (error) {
    console.error('Erro ao converter data:', error);
    return null;
  }
}

export function isValidDate(dateString) {
  if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}
