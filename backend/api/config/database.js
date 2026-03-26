const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/financeiro',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on('connect', () => console.log('Conectado ao banco de dados.'));
pool.on('error', (err) => console.error('Erro na conexão:', err.message));

let isInitialized = false;

const initDatabase = async () => {
  if (isInitialized) return;
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        sobrenome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financeiro (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        data DATE NOT NULL,
        descricao TEXT NOT NULL,
        valor NUMERIC NOT NULL,
        entradaSaida TEXT NOT NULL,
        categoria TEXT DEFAULT 'Outros',
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    await pool.query(`
      ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Outros'
    `);
    console.log('Tabelas criadas ou já existem.');
    isInitialized = true;
  } catch (err) {
    console.error('Erro ao inicializar banco:', err.message);
  }
};

const ensureDbInit = async (req, res, next) => {
  if (isInitialized) return next();
  try {
    await initDatabase();
    next();
  } catch (err) {
    res.status(503).json({ error: 'Serviço indisponível.' });
  }
};

module.exports = { pool, initDatabase, ensureDbInit };
