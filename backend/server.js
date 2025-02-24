// Importa o módulo mysql
const express = require('express');
const mysql = require('mysql');
const app = express();
const cors = require('cors');

// Habilite o CORS para permitir requisições de qualquer origem (ou especifique a origem exata)
app.use(cors({
  origin: 'http://127.0.0.1:5501' // Substitua pelo endereço do seu frontend (ex.: Live Server)
}));



// Configura o servidor para aceitar JSON
app.use(express.json());

// Configura a conexão com o banco de dados
const connection = mysql.createConnection({
  host: '127.0.0.1', // Endereço do servidor MySQL (use IP se for remoto)
  user: 'root',// Seu usuário MySQL (ex.: 'root')
  password: '1234',// Sua senha MySQL
  database: 'nome_do_banco', // Nome do banco de dados que você criou
  connectionLimit: 10  // Limite de conexões simultâneas
});

// Estabelece a conexão
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar: ' + err);
    return;
  }
  console.log('Conectado ao MySQL com sucesso!');
});

// Endpoint para salvar dados
app.post('/salvar', (req, res) => {
  const { data, descricao, valor, entradaSaida } = req.body;
  
  console.log('Dados recebidos:', { data, descricao, valor, entradaSaida }); // Depuração

  if (!data || !descricao || !valor || !entradaSaida) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

// Verifica se data está no formato correto
if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
  return res.status(400).send('Data deve estar no formato YYYY-MM-DD');
}

// Verifica se valor é um número
if (isNaN(valor)) {
  return res.status(400).send('Valor deve ser um número válido');
}

// Verifica se entradaSaida é válido
if (entradaSaida !== 'Entrada' && entradaSaida !== 'Saída') {
  return res.status(400).send('Tipo deve ser "Entrada" ou "Saída"');
}

  const query = 'INSERT INTO faturamento (data, descricao, valor, entrada_saida) VALUES (?, ?, ?, ?)';
  connection.query(query, [data, descricao, valor, entradaSaida], (err, result) => {
    if (err) {
      console.error('Erro ao salvar no MySQL:', err);
      return res.status(500).send('Erro ao salvar no banco');
    }
    res.status(200).send('Dados salvos com sucesso!');
  });
});

app.delete('/deletar', (req, res) => {
  const { id } = req.body; // Ou outros campos como data e descricao
  const query = 'DELETE FROM sua_tabela WHERE id = ?';
  connection.query(query, [id], (error, results) => {
      if (error) {
          res.status(500).send('Erro ao deletar no banco');
          return;
      }
      res.send('Registro deletado com sucesso');
  });
});

app.put('/editar', (req, res) => {
  const { id, data, descricao, valor, entradaSaida } = req.body;

  if (!id) {
      return res.status(400).send('ID é obrigatório para edição');
  }

  const query = 'UPDATE sua_tabela SET data = ?, descricao = ?, valor = ?, entrada_saida = ? WHERE id = ?';
  connection.query(query, [data, descricao, valor, entradaSaida, id], (error, results) => {
      if (error) {
          console.error('Erro ao atualizar no MySQL:', error);
          return res.status(500).send('Erro ao atualizar no banco');
      }
      if (results.affectedRows === 0) {
          return res.status(404).send('Registro não encontrado');
      }
      res.send('Registro atualizado com sucesso');
  });
});

// Inicia o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});




// // Fecha a conexão
// connection.end();
// Exemplo de consulta
// connection.query('SELECT * FROM usuarios', (err, results) => {
//   if (err) throw err;
//   console.log('Dados da tabela:',results); // Deve exibir 2
// });