const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializar tabelas
const initDatabase = async () => {
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
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabelas criadas ou já existem.');
  } catch (err) {
    console.error('Erro ao inicializar banco:', err.message);
  }
};

initDatabase();

// Funções utilitárias
const getAsync = async (sql, params) => {
  const { rows } = await pool.query(sql, params);
  return rows[0];
};

const runAsync = async (sql, params) => {
  const result = await pool.query(sql, params);
  return result.rows[0]?.id || result.rowCount;
};

const allAsync = async (sql, params) => {
  const { rows } = await pool.query(sql, params);
  return rows;
};

module.exports = { getAsync, runAsync, allAsync };