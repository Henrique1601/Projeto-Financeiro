import { showSpinner, hideSpinner, showToast, showCustomMessage } from './utils.js';
import { formatarData, formatarValor, converterParaFormatoBackend, isValidDate } from './formatters.js';
import { importarLancamentos, carregarDados, atualizarSaldo } from './financeiro.js';

export function exportarCSV() {
  const tabela = document.getElementById('generator-table');
  if (!tabela) {
    showToast('Tabela não encontrada.', 'error');
    return;
  }

  showSpinner('Exportando para CSV...');
  try {
    const tbody = tabela.getElementsByTagName('tbody')[0];
    const rows = tbody.getElementsByTagName('tr');
    const csv = [];
    const headers = ['Data', 'Descrição', 'Valor', 'Entrada/Saída'];
    csv.push(headers.map(h => `"${h}"`).join(','));

    for (const row of rows) {
      if (row.dataset.id && !row.dataset.id.startsWith('temp_')) {
        const cells = row.cells;
        let dataValue = cells[1].dataset.originalValue;
        
        if (dataValue?.includes('T')) {
          dataValue = new Date(dataValue).toISOString().split('T')[0];
        } else if (dataValue?.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          dataValue = converterParaFormatoBackend(dataValue);
        }

        const valor = cells[3].dataset.originalValue || cells[3].innerHTML.replace('R$ ', '').replace(',', '.');
        const rowData = [dataValue, cells[2].innerHTML, valor, cells[4].innerHTML];
        csv.push(rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
      }
    }

    if (csv.length <= 1) {
      throw new Error('Nenhum dado confirmado para exportar.');
    }

    const csvContent = '\uFEFF' + csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lancamentos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`${csv.length - 1} linhas exportadas.`, 'success');
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    showToast('Erro ao exportar: ' + error.message, 'error');
  } finally {
    hideSpinner();
  }
}

export async function importarCSV() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.csv';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      document.body.removeChild(fileInput);
      return;
    }

    if (!file.name.endsWith('.csv')) {
      showToast('Selecione um arquivo CSV.', 'error');
      document.body.removeChild(fileInput);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Arquivo muito grande (máx 5MB).', 'error');
      document.body.removeChild(fileInput);
      return;
    }

    if (!confirm(`Importar ${file.name}?`)) {
      document.body.removeChild(fileInput);
      return;
    }

    showSpinner('Importando CSV...');

    Papa.parse(file, {
      complete: async (results) => {
        try {
          const linhas = results.data;
          if (linhas.length <= 1) {
            throw new Error('Arquivo vazio.');
          }

          const headersEsperados = ['Data', 'Descrição', 'Valor', 'Entrada/Saída'];
          const headers = linhas[0].map(h => h.trim());
          if (!headersEsperados.every((h, i) => h === headers[i])) {
            throw new Error('Cabeçalhos inválidos.');
          }

          const dados = linhas.slice(1).filter(linha => linha.length >= 4 && linha.some(val => val.trim()));
          const lancamentos = [];
          const errors = [];

          for (const [index, linha] of dados.entries()) {
            try {
              let [data, descricao, valorStr, entradaSaida] = linha.map(val => val.trim());
              
              if (!data || !descricao || !valorStr || !entradaSaida) {
                throw new Error('Campos obrigatórios ausentes.');
              }

              if (!isValidDate(data)) {
                throw new Error(`Data inválida: ${data}`);
              }

              if (descricao.length > 255) {
                throw new Error('Descrição muito longa.');
              }

              const valor = Number(valorStr.replace(',', '.'));
              if (isNaN(valor)) {
                throw new Error(`Valor inválido: ${valorStr}`);
              }

              const normalized = entradaSaida.toLowerCase() === 'entrada' ? 'Entrada' : 
                               entradaSaida.toLowerCase() === 'saída' ? 'Saída' : entradaSaida;
              if (!['Entrada', 'Saída'].includes(normalized)) {
                throw new Error(`Tipo inválido: ${entradaSaida}`);
              }

              const valorFinal = normalized === 'Saída' ? -Math.abs(valor) : Math.abs(valor);
              lancamentos.push({ data, descricao, valor: valorFinal, entradaSaida: normalized });
            } catch (error) {
              errors.push(`Linha ${index + 1}: ${error.message}`);
            }
          }

          if (lancamentos.length === 0) {
            throw new Error('Nenhum lançamento válido. ' + errors.slice(0, 3).join('; '));
          }

          await importarLancamentos(lancamentos);
          
          if (errors.length > 0) {
            showCustomMessage(`${lancamentos.length} importados, ${errors.length} erros`, '#ff9800');
          }
        } catch (error) {
          console.error('Erro ao importar:', error);
          showToast('Erro: ' + error.message, 'error');
        } finally {
          hideSpinner();
          document.body.removeChild(fileInput);
        }
      },
      header: false,
      skipEmptyLines: true,
      encoding: 'utf-8'
    });
  });

  fileInput.click();
}

export function exportarJSON() {
  showSpinner('Exportando para JSON...');
  try {
    const tabela = document.getElementById('generator-table');
    const tbody = tabela?.getElementsByTagName('tbody')[0];
    const rows = tbody?.getElementsByTagName('tr');
    const data = [];

    for (const row of rows) {
      if (row.dataset.id && !row.dataset.id.startsWith('temp_')) {
        const cells = row.cells;
        let dataValue = cells[1].dataset.originalValue;
        
        if (dataValue?.includes('T')) {
          dataValue = new Date(dataValue).toISOString().split('T')[0];
        } else {
          dataValue = converterParaFormatoBackend(dataValue);
        }

        data.push({
          data: dataValue,
          descricao: cells[2].innerHTML,
          valor: Number(cells[3].dataset.originalValue),
          entradaSaida: cells[4].innerHTML
        });
      }
    }

    if (data.length === 0) {
      throw new Error('Nenhum dado confirmado para exportar.');
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lancamentos.json';
    a.click();
    URL.revokeObjectURL(url);

    showToast(`${data.length} lançamentos exportados.`, 'success');
  } catch (error) {
    console.error('Erro ao exportar JSON:', error);
    showToast('Erro: ' + error.message, 'error');
  } finally {
    hideSpinner();
  }
}

export async function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.json')) {
    showToast('Selecione um arquivo JSON.', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Arquivo muito grande (máx 5MB).', 'error');
    return;
  }

  showSpinner('Importando JSON...');
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON deve ser uma lista de lançamentos.');
    }

    if (data.length > 100) {
      throw new Error('Máximo 100 lançamentos por vez.');
    }

    if (!confirm(`Importar ${data.length} lançamentos?`)) {
      return;
    }

    const lancamentos = [];
    const errors = [];

    for (const [index, item] of data.entries()) {
      try {
        if (!item.data || !item.descricao || isNaN(item.valor) || !item.entradaSaida) {
          throw new Error('Campos obrigatórios ausentes.');
        }

        if (!isValidDate(item.data)) {
          throw new Error(`Data inválida: ${item.data}`);
        }

        const normalized = item.entradaSaida.trim().toLowerCase() === 'entrada' ? 'Entrada' :
                         item.entradaSaida.trim().toLowerCase() === 'saída' ? 'Saída' : item.entradaSaida.trim();
        if (!['Entrada', 'Saída'].includes(normalized)) {
          throw new Error(`Tipo inválido: ${item.entradaSaida}`);
        }

        const valorFinal = normalized === 'Saída' ? -Math.abs(Number(item.valor)) : Math.abs(Number(item.valor));
        lancamentos.push({
          data: item.data,
          descricao: item.descricao,
          valor: valorFinal,
          entradaSaida: normalized
        });
      } catch (error) {
        errors.push(`Item ${index + 1}: ${error.message}`);
      }
    }

    if (lancamentos.length === 0) {
      throw new Error('Nenhum lançamento válido. ' + errors.slice(0, 3).join('; '));
    }

    await importarLancamentos(lancamentos);
    
    if (errors.length > 0) {
      showCustomMessage(`${lancamentos.length} importados, ${errors.length} erros`, '#ff9800');
    }
  } catch (error) {
    console.error('Erro ao importar JSON:', error);
    showToast('Erro: ' + error.message, 'error');
  } finally {
    hideSpinner();
    event.target.value = '';
  }
}

export function exportarExcel() {
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const saldoAtual = document.getElementById('SaldoAtual');
  const tabela = document.getElementById('generator-table');

  if (!tabela) {
    showToast('Tabela não encontrada.', 'error');
    return;
  }

  showSpinner('Gerando Excel...');

  try {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    if (saldoAtual) wsData.unshift([saldoAtual.innerText]);
    if (userEmail) wsData.unshift(['Email', userEmail.textContent]);
    if (userName) wsData.unshift(['Nome', userName.textContent]);

    const headers = [];
    const headerRow = tabela.querySelectorAll('thead tr th');
    headerRow.forEach(h => headers.push(h.innerText));
    wsData.push(headers);

    const rows = tabela.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowData = [];
      cells.forEach(cell => {
        if (cell.querySelector('input[type="checkbox"]')) {
          rowData.push('');
        } else {
          rowData.push(cell.innerText);
        }
      });
      wsData.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');
    XLSX.writeFile(wb, 'lancamentos.xlsx');

    showToast('Excel gerado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao gerar Excel:', error);
    showToast('Erro ao gerar Excel.', 'error');
  } finally {
    hideSpinner();
  }
}

export function exportarPDF() {
  const tabela = document.getElementById('generator-table');
  if (!tabela) {
    showToast('Tabela não encontrada.', 'error');
    return;
  }

  showSpinner('Gerando PDF...');

  html2canvas(tabela, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save('lancamentos.pdf');
    hideSpinner();
    showToast('PDF gerado com sucesso!', 'success');
  }).catch(error => {
    console.error('Erro ao gerar PDF:', error);
    showToast('Erro ao gerar PDF.', 'error');
    hideSpinner();
  });
}

export function imprimirTabela() {
  const tabela = document.getElementById('generator-table');
  if (!tabela) {
    showToast('Tabela não encontrada.', 'error');
    return;
  }

  showSpinner('Preparando impressão...');

  const printWindow = window.open('', '_blank');
  const clonedTable = tabela.cloneNode(true);
  const rows = clonedTable.querySelectorAll('tr');
  rows.forEach(row => row.deleteCell(0));

  printWindow.document.write(`
    <html>
      <head>
        <title>Impressão de Lançamentos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .positive-value { color: green; }
          .negative-value { color: red; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h2>Lançamentos Financeiros</h2>
        <table>${clonedTable.outerHTML}</table>
      </body>
    </html>
  `);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
    hideSpinner();
  }, 500);
}
