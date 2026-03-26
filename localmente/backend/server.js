require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} Localmente no arquivo novo`);
});

process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Conexão com o banco fechada.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao fechar o banco:', err.message);
    process.exit(1);
  }
});