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

    // Demais células com os dados
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    const cell3 = row.insertCell(2);
    const cell4 = row.insertCell(3);

    cell1.innerHTML = data;
    cell2.innerHTML = descricao;
    cell3.innerHTML = valor;
    cell4.innerHTML = entradaSaida;

    // Tornar as células editáveis
    [cell1, cell2, cell3, cell4].forEach(cell => {
      cell.addEventListener('click', function(e) {
        TornarEditavel(cell,row.dataset.id);
      });
    });
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


  function TornarEditavel(cell,idLinha) {
    const valorOriginal = cell.innerHTML;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = valorOriginal;
    input.style.width = '100%';

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();

    input.addEventListener('blur', function() {
      SalvarEdicao(cell, input.value, idLinha);
    });

    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        SalvarEdicao(cell, input.value,idLinha);
      }
    });
  }

  function SalvarEdicao(cell, novoValor, idLinha) {
    // Validação do campo "valor" (se for a coluna de valor)
    if (cell.cellIndex === 3) {// Ajustado para índice 3 porque adicionamos a coluna de checkbox
      if (isNaN(Number(novoValor))) {
        alert('Por favor, insira um número válido para o valor');
        return;
      }
      SaldoAtual.innerText = novoValor;
    }
    // Atualiza a célula no front-end
    cell.innerHTML = novoValor;

    // Pegar todos os dados da linha após a edição
    const row = cell.parentElement;
    const data = row.cells[1].innerHTML; // Ajuste os índices conforme sua tabela
    const descricao = row.cells[2].innerHTML;
    const valor = row.cells[3].innerHTML;
    const entradaSaida = row.cells[4].innerHTML;

    // Enviar requisição para o back-end
    fetch('http://localhost:3000/editar', {
      method: 'PUT', // Ou POST, dependendo da sua preferência
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idLinha, data, descricao, valor, entradaSaida })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Erro na resposta do servidor');
      }
      return response.text();
  })
  .then(result => {
      console.log('Atualização bem-sucedida:', result);
  })
  .catch(error => {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao salvar as alterações no servidor.');
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
          TornarEditavel(cells[j], row.dataset.id); //Passa o ID da linha
        } 
      }
    }
      if (linhasSelecionadas === 0) {
        alert('Por favor, selecione pelo menos uma linha para editar.');
      }
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