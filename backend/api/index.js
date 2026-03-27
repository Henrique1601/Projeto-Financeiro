const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./config/database');
const routes = require('./routes');
const { pool } = require('./config/database');

const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(helmet());

const allowedOrigins = [
  'https://projeto-financeiro-frontend.vercel.app',
  'https://projeto-financeiro-frontend-git-p-a06e7c-henrique1601s-projects.vercel.app',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.some(o => !origin || origin.startsWith(o.replace('/index.html', '')))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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
