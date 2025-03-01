document.addEventListener('DOMContentLoaded', function() {
  // Declaração dos elementos do DOM
  const deletar = document.getElementById('Deletar');
  const salvar = document.getElementById('Salvar');
  const fecharFaturamento = document.getElementById('FecharFaturamento');
  const confirmar = document.getElementById('Confirmar');
  const SaldoAtual = document.getElementById('Saldo_Atual');
  const lancamentos = document.getElementById('lancamentos');
  const BtnLancar = document.getElementById('Lancar');
  const X = document.getElementById('close-button');
  const editar = document.getElementById('Editar');
  // Variável para armazenar a linha selecionada
  let linhaSelecionada = null;

  if (!confirmar || !SaldoAtual || !lancamentos || !BtnLancar) {
    console.error('Um ou mais elementos essenciais não foram encontrados no HTML');
    return;
  }

  function Confirmar() {
    const data = document.getElementById('date').value;
    const descricao = document.getElementById('description').value;
    const valor = Number(document.getElementById('value').value);
    const entradaSaida = document.getElementById('select').value;

    if (data === '' || descricao === '' || isNaN(valor)) {
      alert('Todos os campos são obrigatórios!');
      return;
    }

    const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
    const row = tabela.insertRow();

  fetch('http://localhost:3000/salvar', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ data, descricao, valor, entradaSaida })
   })
 .then(response => {
        console.log('Status da resposta:', response.status);
        console.log('Resposta completa:', response);
        if (!response.ok){
          throw new Error(`Erro no servidor: ${response.status} - ${response.statusText}`);
        } 
        return response.json();// Tenta converter a resposta para JSON
    })
   .then(result => {
      console.log('Resultado do back-end:', result);
      if (result.error) {
        throw new Error(result.error);
    }
      if(!result.id){
        throw new Error('ID não retornado pelo servidor');
      }
     row.dataset.id = result.id; // ID retornado pelo back-end
    
    // Adicionar célula com checkbox como primeira coluna
    const cellCheck = row.insertCell(0);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'select-row';
    cellCheck.appendChild(checkbox);

// Demais células com os dados (ajustando os índices)   
    const cell1 = row.insertCell(1);// Data (índice 1)
    const cell2 = row.insertCell(2);// Descrição (índice 2)
    const cell3 = row.insertCell(3);// Entrada/Saída (índice 4)
    const cell4 = row.insertCell(4);// Entrada/Saída (índice 4)

    cell1.innerHTML = data;
    cell2.innerHTML = descricao;
    cell3.innerHTML = valor;
    cell4.innerHTML = entradaSaida;

    //  Tornar as células editáveis
    // [cell1, cell2, cell3, cell4].forEach(cell => {
    //   cell.addEventListener('click', function(e) {
    //     TornarEditavel(cell,row.dataset.id);
    //   });
    // });
    SaldoAtual.innerText = valor;
    alert('Dados confirmados');
  })
    .catch(error => {
      console.error('Erro ao confirmar:', error);// Veja o erro exato
      alert('Erro ao salvar os dados no servidor.'+ error.message);
     if(row.parentNode){
      row.remove(); // Remove a linha se houver erro, para evitar dados inconsistentes
     }
    })
}


function TornarEditavel(cell, idLinha, cellIndex) {
  const valorOriginal = cell.innerHTML.trim();
  let input;

  // Armazena o valor original como atributo para reverter, se necessário
  cell.dataset.originalValue = valorOriginal;

  if (cellIndex === 4) { // Campo "Entrada/Saída" (última coluna)
      // Cria um <select> para "Entrada/Saída"
      input = document.createElement('select');
      input.style.width = '100%';
      const options = ['Entrada', 'Saída'];
      options.forEach(option => {
          const opt = document.createElement('option');
          opt.value = option;
          opt.text = option;
          if (option === valorOriginal) opt.selected = true;
          input.appendChild(opt);
      });
  } else {
      // Para os outros campos (Data, Descrição, Valor), usa um <input>
      input = document.createElement('input');
      input.style.width = '100%';

      // Validações específicas para cada campo
      if (cellIndex === 1) { // Data
          input.type = 'date';
          // Converte o valor para o formato correto para input date (YYYY-MM-DD)
          input.value = valorOriginal; // Garante que o valor original seja preenchido corretamente
      } else if (cellIndex === 3) { // Valor
          input.type = 'number';
          input.value = valorOriginal; // Garante que o valor original seja preenchido corretamente
      } else { // Descrição (índice 2)
          input.type = 'text';
          input.value = valorOriginal; // Garante que o valor original seja preenchido corretamente
      }
  }

  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();

  console.log(`Campo editável criado para célula índice ${cellIndex} com valor: ${valorOriginal}`);

  // Adiciona eventos para salvar apenas quando o usuário terminar de editar
  input.addEventListener('blur', function() {
      const novoValor = (input.type === 'select-one') ? input.value : input.value.trim();
      if (novoValor !== valorOriginal) { // Só salva se houver alteração
          SalvarEdicao(cell, novoValor, idLinha, cellIndex);
      } else {
          cell.innerHTML = valorOriginal; // Reverte se não houver alterações
          console.log(`Nenhuma alteração detectada para célula índice ${cellIndex}`);
      }
  });

  input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          const novoValor = (input.type === 'select-one') ? input.value : input.value.trim();
          if (novoValor !== valorOriginal) { // Só salva se houver alteração
              SalvarEdicao(cell, novoValor, idLinha, cellIndex);
          } else {
              cell.innerHTML = valorOriginal; // Reverte se não houver alterações
              console.log(`Nenhuma alteração detectada para célula índice ${cellIndex}`);
          }
      }
  });
}

function SalvarEdicao(cell, novoValor, idLinha, cellIndex) {
  // Validação para Descrição (índice 2, se necessário evitar vazio)
  if (cellIndex === 2 && !novoValor.trim()) { // Descrição
      alert('A descrição não pode estar vazia');
      cell.innerHTML = cell.dataset.originalValue || ''; // Reverte para o valor original
      return;
  }

  // Validação do campo "valor" (se for a coluna de valor, índice 3)
  if (cellIndex === 3) { // Coluna "Valor"
      if (isNaN(Number(novoValor))) {
          alert('Por favor, insira um número válido para o valor');
          cell.innerHTML = cell.dataset.originalValue || ''; // Reverte para o valor original
          return;
      }
      SaldoAtual.innerText = novoValor;
  }

  // Validação para Data (formato YYYY-MM-DD, índice 1)
  if (cellIndex === 1) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(novoValor)) {
          alert('Por favor, insira uma data válida no formato YYYY-MM-DD');
          cell.innerHTML = cell.dataset.originalValue || ''; // Reverte para o valor original
          return;
      }
  }

  // Validação para Entrada/Saída (se for o índice 4, deve ser "Entrada" ou "Saída")
  if (cellIndex === 4 && novoValor !== 'Entrada' && novoValor !== 'Saída') {
      alert('Por favor, selecione "Entrada" ou "Saída"');
      cell.innerHTML = cell.dataset.originalValue || ''; // Reverte para o valor original
      return;
  }

  // Atualiza a célula no front-end
  cell.innerHTML = novoValor;

  // Pegar todos os dados da linha após a edição
  const row = cell.parentElement;
  const data = row.cells[1].innerHTML;
  const descricao = row.cells[2].innerHTML;
  const valor = row.cells[3].innerHTML;
  const entradaSaida = row.cells[4].innerHTML;

  // Verifica se houve alteração antes de enviar ao back-end
  const valorOriginal = cell.dataset.originalValue;
  if (novoValor === valorOriginal) {
      console.log(`Nenhuma alteração detectada para célula índice ${cellIndex}, ignorando salvamento`);
      return; // Não salva se o valor não mudou
  }

  // Enviar requisição para o back-end
  fetch('http://localhost:3000/editar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idLinha, data, descricao, valor, entradaSaida })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Erro na resposta do servidor');
      }
      return response.json(); // Usar JSON para corresponder ao back-end
  })
  .then(result => {
      console.log('Atualização bem-sucedida:', result);
      if (result.error) {
          alert('Erro ao salvar as alterações no servidor: ' + result.error);
          cell.innerHTML = cell.dataset.originalValue || ''; // Reverte em caso de erro
      } else {
          alert('Alterações salvas com sucesso!');
          cell.dataset.originalValue = novoValor; // Atualiza o valor original após sucesso
      }
  })
  .catch(error => {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao salvar as alterações no servidor.');
      cell.innerHTML = cell.dataset.originalValue || ''; // Reverte em caso de erro
  });
}

  function EditarLinhasSelecionadas() {
    const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
    const checkboxes = tabela.getElementsByClassName('select-row');
    let linhasSelecionadas = 0;

    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
          linhasSelecionadas++;
          const row = checkboxes[i].parentElement.parentElement; // Pega a linha
          const cells = row.cells;
          // Torna todas as células editáveis (exceto a do checkbox)
          for (let j = 1; j < cells.length; j++) {
            console.log(`Tornando editável célula ${j} na linha ${i}`);
              TornarEditavel(cells[j], row.dataset.id, j); // Passa o índice da célula
          }
      }
  }
      if (linhasSelecionadas === 0) {
        alert('Por favor, selecione pelo menos uma linha para editar.');
        return // Evita loops adicionais
      }
      console.log('Linhas selecionadas para edição:', linhasSelecionadas);
  }



  function Salvar() {
    const data = document.getElementById('date').value;
    const descricao = document.getElementById('description').value;
    const valor = Number(document.getElementById('value').value);
    const entradaSaida = document.getElementById('select').value;

    if (data === '' || descricao === '' || isNaN(valor) || entradaSaida === '') {
      alert('Preencha todos os campos antes de salvar!');
      return;
    }

    fetch('http://localhost:3000/salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, descricao, valor, entradaSaida }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Erro na resposta do servidor');
        return response.text();
      })
      .then(result => alert(result))
      .catch(error => {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar os dados.');
      });
  }

  function Deletar() {
    const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0];
    const checkboxes = tabela.getElementsByClassName('select-row');
    const linhasParaDeletar = [];

  // Identificar linhas marcadas e coletar informações necessárias
  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
        const linha = checkboxes[i].parentElement.parentElement;
        // Supondo que você tenha um ID único para cada registro
        // Você pode armazenar o ID como atributo data-id na linha ou célula
        const id = linha.dataset.id; // Certifique-se de que o ID está disponível
        if (id) {
            linhasParaDeletar.push({ elemento: linha, id: id });
        } else {
            // Se não houver ID, usar os dados da linha como identificação
            const data = linha.cells[1].innerHTML; // Ajuste os índices conforme sua tabela
            const descricao = linha.cells[2].innerHTML;
            linhasParaDeletar.push({ elemento: linha, data, descricao });
        }
    }
}
    // Deletar as linhas marcadas
    if (linhasParaDeletar.length > 0) {
      alert('Por favor, selecione pelo menos uma linha para deletar.');
    } 
    

    // Fazer requisição para o back-end
    Promise.all(linhasParaDeletar.map(linha => {
    const url = 'http://localhost:3000/deletar';
    const body = linha.id ? 
      { id: linha.id } : 
      { data: linha.data, descricao: linha.descricao };

      return fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao deletar no servidor');
      }
        return response.text();
      });
    }))
    .then(results => {
      // Após sucesso no back-end, remover linhas do front-end
      linhasParaDeletar.forEach(linha => linha.elemento.remove());
      alert('Linhas deletadas com sucesso!');
    })
    .catch(error => {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar as linhas no servidor.');
    });
  }

  function FecharFaturamento() {
    const tabelaResposta = document.getElementById('resposta-table')?.getElementsByTagName('tbody')[0];
    if (tabelaResposta) {
      const row = tabelaResposta.insertRow();
      const valorResultado = SaldoAtual.innerText || '0';
      row.insertCell(0).innerHTML = valorResultado;
      alert('Faturamento fechado');
    } else {
      console.warn('Tabela de resposta não encontrada');
    }
  }

  // Eventos
  BtnLancar.addEventListener('click', function() {
    lancamentos.style.display = 'block';
  });

  X.addEventListener('click', () => {
    lancamentos.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === lancamentos) {
      lancamentos.style.display = 'none';
    }
  });

  editar.addEventListener('click', EditarLinhasSelecionadas); // Evento do botão Editar
  confirmar.addEventListener('click', Confirmar);
  deletar.addEventListener('click', Deletar);
  salvar.addEventListener('click', Salvar);
  fecharFaturamento.addEventListener('click', FecharFaturamento);
});