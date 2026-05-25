require('dotenv').config();
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
  'https://gestor-financeiro-proj.vercel.app',
  'https://projeto-financeiro-frontend.vercel.app',
  'https://front-ck0fxtiwd-henrique1601s-projects.vercel.app',
  'https://projeto-financeiro-frontend-git-p-a06e7c-henrique1601s-projects.vercel.app',
  'http://localhost:5173',
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
      res.json({
        status: 'OK',
        database: 'connected',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        status: 'OK',
        database: 'not configured',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    res.status(503).json({
      status: 'ERROR',
      database: 'error',
      error: err.message,
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/docs', (req, res) => {
  res.sendFile(__dirname + '/docs/index.html');
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  const status = err.message.includes('não encontrado') ? 404 :
    err.message.includes('incorretos') ? 401 :
    err.message.includes('obrigatório') || err.message.includes('obrigatória') || err.message.includes('rede social') || err.message.includes('inválido') || err.message.includes('expirado') || err.message.includes('código foi solicitado') || err.message.includes('já está') ? 400 : 500;
  res.status(status).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  console.log('Banco inicializado');
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro inicialização:', err.message);
});

module.exports = app;
