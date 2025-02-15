document.addEventListener('DOMContentLoaded', function() {
  const deletar = document.getElementById('Deletar');
  const salvar = document.getElementById('Salvar');
  const fecharFaturamento = document.getElementById('FecharFaturamento');
  const confirmar = document.getElementById('Confirmar');

function Confirmar(){
  const data = document.getElementById('date').value;
  const descricao = document.getElementById('description').value;
  const valor = Number(document.getElementById('value').value);
  const entradaSaida = document.getElementById('select').value;
  // const saida = document.getElementById('saida').checked;

  //Validar Faturamento
  if (data === '' || descricao === '' || valor === '') {
    alert('Todos os campos são obrigatórios!');
    return;
  }
  alert('Dados confirmados');
  const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0]
  const row = tabela.insertRow();

  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  const cell3 = row.insertCell(2);
  const cell4 = row.insertCell(3);

  cell1.innerHTML = data
  cell2.innerHTML = descricao
  cell3.innerHTML = valor
  cell4.innerHTML = entradaSaida
 
}

function Salvar(){

}
 
function Deletar(){
  const tabela = document.getElementById('generator-table').getElementsByTagName('tbody')[0]
  if (tabela.rows.length > 0){
    tabela.deleteRow(tabela.rows.length - 1);
  }
}

function FecharFaturamento(){
 
//resposta-table

  const tabelaResposta = document.getElementById('resposta-table').getElementsByTagName('tbody')[0]
  const row = tabelaResposta.insertRow();

  const valorResultado = document.getElementById('value').value; // pegar o valor da primeira tabela e nao do input
  //const resutladovalor = document.getElementById

  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  const cell3 = row.insertCell(2);
  const cell4 = row.insertCell(3);

  cell1.innerHTML = valorResultado
  // cell2.innerHTML = valorResultado
  // cell3.innerHTML = valorResultado
  // cell4.innerHTML = valorResultado

  alert('Faturamento fechado')
}


// Eventos
confirmar.addEventListener('click', Confirmar);
deletar.addEventListener('click', Deletar);
salvar.addEventListener('click', Salvar);
fecharFaturamento.addEventListener('click', FecharFaturamento);
})