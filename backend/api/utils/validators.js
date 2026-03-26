const validateFinanceiroInput = (data, descricao, valor, entradaSaida) => {
  const errors = [];
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    errors.push('Data deve estar no formato YYYY-MM-DD.');
  }
  if (!descricao || typeof descricao !== 'string' || descricao.length > 255) {
    errors.push('Descrição é obrigatória e deve ter no máximo 255 caracteres.');
  }
  if (isNaN(valor)) {
    errors.push('Valor deve ser um número.');
  }
  if (!entradaSaida || !['entrada', 'saída', 'saida', 'Entrada', 'Saída'].includes(entradaSaida.toLowerCase())) {
    errors.push('Tipo deve ser "Entrada" ou "Saída".');
  }
  return errors;
};

const validateUpdateInput = (updates) => {
  const errors = [];
  const allowedFields = ['data', 'descricao', 'valor', 'entradaSaida', 'categoria', 'metodoPagamento', 'observacoes'];
  
  updates.forEach((update, index) => {
    if (!update.id) {
      errors.push(`Edição ${index + 1}: ID é obrigatório.`);
      return;
    }
    const fieldsToUpdate = Object.keys(update).filter(f => allowedFields.includes(f));
    if (fieldsToUpdate.length === 0) {
      errors.push(`Edição ${index + 1}: Nenhum campo válido.`);
    }
  });
  
  return errors;
};

module.exports = { validateFinanceiroInput, validateUpdateInput };
