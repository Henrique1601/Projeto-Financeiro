const { Pool } = require('pg');

const isProduction = process.env.VERCEL === '1';
const dbUrl = process.env.DATABASE_URL;

console.log('VERCEL:', process.env.VERCEL);
console.log('DATABASE_URL configured:', !!dbUrl);

if (!dbUrl) {
  console.error('ERRO: DATABASE_URL não está configurada nas variáveis de ambiente!');
}

const pool = new Pool({
  connectionString: dbUrl || 'postgres://postgres:1234@localhost:5432/financeiro',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 5
});

pool.on('connect', () => console.log('Conectado ao banco de dados.'));
pool.on('error', (err) => console.error('Erro na conexão:', err.message));

let isInitialized = false;

const initDatabase = async () => {
  if (isInitialized) return;
  
  try {
    console.log('Inicializando banco de dados...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        sobrenome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT,
        social_id TEXT,
        provider TEXT,
        foto TEXT,
        primeiro_login BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(social_id, provider)
      )
    `);
    console.log('Tabela usuarios OK');
    
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS social_id TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS provider TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS primeiro_login BOOLEAN DEFAULT TRUE`).catch(() => {});
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financeiro (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        data DATE NOT NULL,
        descricao TEXT NOT NULL,
        valor NUMERIC NOT NULL,
        entradaSaida TEXT NOT NULL,
        categoria TEXT DEFAULT 'Outros',
        metodoPagamento TEXT DEFAULT 'Dinheiro',
        observacoes TEXT DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabela financeiro OK');
    
    await pool.query(`
      ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Outros'
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS metodoPagamento TEXT DEFAULT 'Dinheiro'
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS observacoes TEXT DEFAULT ''
    `).catch(() => {});
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);
    console.log('Tabela password_resets OK');
    
    console.log('Tabelas criadas ou já existem.');
    isInitialized = true;
  } catch (err) {
    console.error('Erro ao inicializar banco:', err.message);
  }
};

const ensureDbInit = async (req, res, next) => {
  if (!dbUrl) {
    return res.status(500).json({ error: 'Banco de dados não configurado.' });
  }
  if (isInitialized) return next();
  try {
    await initDatabase();
    next();
  } catch (err) {
    res.status(503).json({ error: 'Serviço indisponível.' });
  }
};

module.exports = { pool, initDatabase, ensureDbInit };
