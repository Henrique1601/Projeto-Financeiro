import { editar } from './api.js';
import { showSpinner, hideSpinner, showToast } from './utils.js';
import { formatarData, formatarValor, converterParaFormatoBackend } from './formatters.js';
import { atualizarSaldo, atualizarEstadoBotaoSelecionarTodos, carregarDados, setIsEditing } from './financeiro.js';

export function tornarEditavel(cell, cellIndex) {
  const valorOriginal = cell.dataset.originalValue || cell.innerHTML.trim().replace('R$ ', '').replace(',', '.');
  let input;

  cell.dataset.originalValue = valorOriginal;

  if (cellIndex === 1) {
    input = document.createElement('input');
    input.type = 'date';
    try {
      const dateParts = valorOriginal.split('/');
      if (dateParts.length === 3) {
        const [dia, mes, ano] = dateParts;
        input.value = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      } else if (valorOriginal.match(/^\d{4}-\d{2}-\d{2}/)) {
        input.value = valorOriginal.substring(0, 10);
      }
    } catch (e) {
      input.value = '';
    }
    input.style.width = '100%';
  } else if (cellIndex === 2) {
    input = document.createElement('input');
    input.type = 'text';
    input.value = valorOriginal;
    input.style.width = '100%';
  } else if (cellIndex === 3) {
    input = document.createElement('input');
    input.type = 'number';
    input.value = Math.abs(Number(valorOriginal)) || '';
    input.style.width = '100%';
  } else if (cellIndex === 4) {
    input = document.createElement('select');
    input.style.width = '100%';
    ['Entrada', 'Saída'].forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.text = option;
      const tipoLower = String(valorOriginal).toLowerCase().trim();
      const optLower = option.toLowerCase();
      const isSaida = tipoLower.includes('saida') || tipoLower.includes('saída');
      const optIsSaida = optLower.includes('saida');
      if (isSaida === optIsSaida) {
        opt.selected = true;
      }
      input.appendChild(opt);
    });
  } else if (cellIndex === 5) {
    return;
  } else {
    return;
  }

  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();
}

export function editarLinhasSelecionadas() {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  const checkboxes = tabela?.getElementsByClassName('select-row');
  
  if (!checkboxes || checkboxes.length === 0) {
    showToast('Nenhuma linha disponível para edição.', 'warning');
    return;
  }

  let linhasSelecionadas = 0;

  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
      linhasSelecionadas++;
      const row = checkboxes[i].parentElement.parentElement;
      const cells = row.cells;

      tornarEditavel(cells[1], 1);
      tornarEditavel(cells[2], 2);
      tornarEditavel(cells[3], 3);
      tornarEditavel(cells[4], 4);
    }
  }

  if (linhasSelecionadas === 0) {
    showToast('Selecione pelo menos uma linha para editar.', 'warning');
    return;
  }

  setIsEditing(true);

  const saveButton = document.getElementById('saveEditsBtn');
  const cancelButton = document.getElementById('cancelEditsBtn');
  
  if (saveButton) {
    saveButton.style.display = '';
    saveButton.classList.remove('save-btn');
  }
  if (cancelButton) {
    cancelButton.style.display = '';
    cancelButton.classList.remove('cancel-btn');
  }
}

export async function salvarEdicoes() {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  const checkboxes = tabela?.getElementsByClassName('select-row');
  
  if (!checkboxes || checkboxes.length === 0) {
    showToast('Nenhuma linha disponível para salvar.', 'error');
    return;
  }

  const updates = [];

  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
      const row = checkboxes[i].parentElement.parentElement;
      const cells = row.cells;
      const id = row.dataset.id;
      
      if (!id || id.startsWith('temp_')) continue;

      const edit = { id };

      for (let j = 1; j < cells.length; j++) {
        const cell = cells[j];
        const input = cell.querySelector('input') || cell.querySelector('select');
        if (!input) continue;

        const novoValor = input.type === 'select-one' ? input.value : input.value.trim();

        if (novoValor === '') {
          showToast(`Campo vazio na célula ${j} da linha ${i + 1}`, 'error');
          return;
        }

        if (j === 1) {
          if (novoValor && novoValor !== cell.dataset.originalValue) {
            const formattedDate = novoValor;
            edit.data = formattedDate;
            cell.innerHTML = formatarData(formattedDate);
            cell.dataset.originalValue = formattedDate;
          } else {
            cell.innerHTML = formatarData(cell.dataset.originalValue);
          }
        } else if (j === 2) {
          if (novoValor !== cell.dataset.originalValue) {
            edit.descricao = novoValor;
            cell.dataset.originalValue = novoValor;
          }
        } else if (j === 3) {
          let valorEditado = Number(novoValor);
          if (isNaN(valorEditado)) {
            showToast(`Valor inválido na célula ${j}`, 'error');
            return;
          }
          const entradaSaidaCell = cells[4];
          const entradaSaidaInput = entradaSaidaCell.querySelector('select');
          const entradaSaida = entradaSaidaInput ? entradaSaidaInput.value :
            (entradaSaidaCell.querySelector('.tipo-badge')?.textContent || 'Entrada');
          const isSaida = String(entradaSaida).toLowerCase().includes('saida') ||
                          String(entradaSaida).toLowerCase().includes('saída');

          valorEditado = isSaida ? -Math.abs(valorEditado) : Math.abs(valorEditado);
          
          edit.valor = valorEditado;
          cell.dataset.originalValue = valorEditado;
          cell.className = valorEditado < 0 ? 'negative-value' : 'positive-value';
          cell.innerHTML = formatarValor(valorEditado);
        } else if (j === 4) {
          const novoTipo = novoValor;
          if (novoTipo !== cell.dataset.originalValue) {
            edit.entradaSaida = novoTipo;
            cell.dataset.originalValue = novoTipo;
          }
          const isSaida = novoTipo.toLowerCase().includes('saida') || novoTipo.toLowerCase().includes('saída');
          cell.innerHTML = `<span class="tipo-badge ${isSaida ? 'saida' : 'entrada'}">${novoTipo}</span>`;
        }
      }

      if (Object.keys(edit).length > 1) {
        updates.push(edit);
      }

      checkboxes[i].checked = false;
      cell.innerHTML = formatarData(cell.dataset.originalValue);
    }
  }

  if (updates.length === 0) {
    showToast('Nenhuma alteração detectada.', 'warning');
    return;
  }

  showSpinner('Salvando edições...');
  try {
    await editar(updates);
    setIsEditing(false);
    await carregarDados();
    showToast('Edições salvas com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar edições:', error);
    showToast('Erro ao salvar: ' + error.message, 'error');
  } finally {
    hideSpinner();
    const saveButton = document.getElementById('saveEditsBtn');
    const cancelButton = document.getElementById('cancelEditsBtn');
    if (saveButton) saveButton.style.display = 'none';
    if (cancelButton) cancelButton.style.display = 'none';
    atualizarEstadoBotaoSelecionarTodos();
  }
}

export function cancelarEdicoes() {
  const tabela = document.getElementById('generator-table')?.getElementsByTagName('tbody')[0];
  const checkboxes = tabela?.getElementsByClassName('select-row');
  
  if (!checkboxes || checkboxes.length === 0) return;

  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
      const row = checkboxes[i].parentElement.parentElement;
      const cells = row.cells;

      for (let j = 1; j < cells.length; j++) {
        const cell = cells[j];
        const valorOriginal = cell.dataset.originalValue;
        
        if (valorOriginal !== undefined) {
          if (j === 1) {
            cell.innerHTML = formatarData(valorOriginal);
          } else if (j === 3) {
            const numValor = Number(valorOriginal);
            cell.className = numValor < 0 ? 'negative-value' : 'positive-value';
            cell.innerHTML = formatarValor(valorOriginal);
          } else if (j === 4) {
            const tipoLower = String(valorOriginal).toLowerCase().trim();
            const isSaida = tipoLower.includes('saida') || tipoLower.includes('saída');
            const tipoExibir = isSaida ? 'Saída' : 'Entrada';
            cell.innerHTML = `<span class="tipo-badge ${isSaida ? 'saida' : 'entrada'}">${tipoExibir}</span>`;
          } else {
            cell.innerHTML = valorOriginal;
          }
        }
      }
      checkboxes[i].checked = false;
    }
  }

  setIsEditing(false);

  const saveButton = document.getElementById('saveEditsBtn');
  const cancelButton = document.getElementById('cancelEditsBtn');
  if (saveButton) saveButton.style.display = 'none';
  if (cancelButton) cancelButton.style.display = 'none';

  showToast('Edição cancelada.', 'warning');
  atualizarEstadoBotaoSelecionarTodos();
}
