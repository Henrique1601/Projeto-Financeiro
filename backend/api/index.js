require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./config/database');
const routes = require('./routes');
const { pool } = require('./config/database');

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Muitas requisições. Tente novamente mais tarde.'
}));

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  const status = err.message.includes('não encontrado') ? 404 :
                 err.message.includes('obrigatório') ? 400 : 500;
  res.status(status).json({ error: err.message });
});

initDatabase();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

process.on('SIGINT', async () => {
  await pool.end();
  console.log('Conexão fechada.');
  process.exit(0);
});
