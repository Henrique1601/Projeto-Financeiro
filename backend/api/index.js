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

app.get('/api/health', async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      await pool.query('SELECT 1');
      res.json({ status: 'OK', database: 'connected' });
    } else {
      res.json({ status: 'OK', database: 'not configured' });
    }
  } catch (err) {
    res.json({ status: 'OK', database: 'error', error: err.message });
  }
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  const status = err.message.includes('não encontrado') ? 404 :
                 err.message.includes('obrigatório') ? 400 : 500;
  res.status(status).json({ error: err.message });
});

initDatabase().then(() => {
  console.log('Banco inicializado');
}).catch(err => {
  console.error('Erro inicialização:', err.message);
});

const PORT = process.env.PORT || 3000;

module.exports = app;
