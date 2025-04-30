require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http'); // Necessário para adaptar Express ao Vercel
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Configurar middlewares
app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.options('*', cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Muitas requisições de um mesmo IP. Tente novamente mais tarde.'
});
app.use(limiter);

// Determinar se estamos em ambiente de produção (ex.: Vercel) ou local
const isProduction = process.env.NODE_ENV === 'production';

// Conectar ao banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/financeiro',
  ssl: isProduction ? { rejectUnauthorized: false } : false // Desativar SSL em ambiente local
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

// Funções utilitárias para queries
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

// Chave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || '1234';

// Middleware para autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
  });
};

// Validação de entrada para financeiro
const validateFinanceiroInput = (data, descricao, valor, entradaSaida) => {
  const errors = [];
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    errors.push('Data deve estar no formato YYYY-MM-DD.');
  }
  if (!descricao || typeof descricao !== 'string' || descricao.length > 255) {
    errors.push('Descrição é obrigatória e deve ter no máximo 255 caracteres.');
  }
  if (isNaN(valor)) {
    errors.push('Valor deve ser um número.');
  }
  if (!['Entrada', 'Saída'].includes(entradaSaida)) {
    errors.push('Tipo de entrada/saída deve ser "Entrada" ou "Saída".');
  }
  return errors;
};

// Endpoint: Registrar usuário
app.post('/register', async (req, res) => {
  try {
    const { nome, sobrenome, email, senha } = req.body;

    if (!nome || !sobrenome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const existingUser = await getAsync('SELECT email FROM usuarios WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const id = await runAsync(
      'INSERT INTO usuarios (nome, sobrenome, email, senha) VALUES ($1, $2, $3, $4) RETURNING id',
      [nome, sobrenome, email, hashedPassword]
    );

    res.status(201).json({ message: 'Usuário registrado com sucesso.', id });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err.message);
    if (err.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Este email já está registrado.' });
    }
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

// Endpoint: Login
app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const user = await getAsync('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      token,
      nome: user.nome,
      sobrenome: user.sobrenome,
      email: user.email
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err.message);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

// Endpoint: Salvar registro financeiro
app.post('/salvar', authenticateToken, async (req, res) => {
  try {
    let { data, descricao, valor, entradaSaida } = req.body;
    const user_id = req.user.id;

    entradaSaida = entradaSaida.toLowerCase() === 'entrada' ? 'Entrada' :
                   entradaSaida.toLowerCase() === 'saída' ? 'Saída' : entradaSaida;

    const errors = validateFinanceiroInput(data, descricao, valor, entradaSaida);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const id = await runAsync(
        'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user_id, data, descricao, valor, entradaSaida]
      );
      const record = await getAsync('SELECT * FROM financeiro WHERE id = $1 AND user_id = $2', [id, user_id]);
      await client.query('COMMIT');

      res.status(200).json({ id, message: 'Dados salvos com sucesso', record });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao salvar:', err.message);
    res.status(500).json({ error: `Erro ao salvar: ${err.message}` });
  }
});

// Endpoint: Listar registros
app.get('/listar', authenticateToken, async (req, res) => {
  try {
      const user_id = req.user.id;
      const rows = await allAsync(
          'SELECT id, user_id, data, descricao, valor, entradaSaida AS "entradaSaida" FROM financeiro WHERE user_id = $1 ORDER BY data DESC',
          [user_id]
      );
      res.status(200).json(rows);
  } catch (err) {
      console.error('Erro ao consultar dados:', err.message);
      res.status(500).json({ error: 'Erro ao consultar no banco' });
  }
});

// Endpoint: Deletar registro
app.delete('/deletar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    const user_id = req.user.id;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório para deleção' });
    }

    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await runAsync('DELETE FROM financeiro WHERE id = $1 AND user_id = $2', [idNum, user_id]);
    if (result === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.status(200).json({ message: 'Registro deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar:', err.message);
    res.status(500).json({ error: `Erro ao deletar: ${err.message}` });
  }
});

// Endpoint: Editar registros
app.put('/editar', authenticateToken, async (req, res) => {
  try {
    const { updates } = req.body;
    const user_id = req.user.id;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Um array de edições é obrigatório.' });
    }

    if (updates.length > 50) {
      return res.status(400).json({ error: 'Não é permitido editar mais de 50 linhas de uma vez.' });
    }

    const allowedFields = ['data', 'descricao', 'valor', 'entradaSaida'];
    const errors = [];

    updates.forEach((update, index) => {
      if (!update.id) {
        errors.push(`Edição ${index + 1}: ID é obrigatório.`);
        return;
      }
      const fieldsToUpdate = Object.keys(update).filter(field => allowedFields.includes(field));
      if (fieldsToUpdate.length === 0) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Nenhum campo válido para atualizar.`);
        return;
      }
      if (update.data && !/^\d{4}-\d{2}-\d{2}$/.test(update.data)) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Data deve estar no formato YYYY-MM-DD.`);
      }
      if (update.descricao && (typeof update.descricao !== 'string' || update.descricao.length > 255)) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Descrição inválida.`);
      }
      if (update.valor !== undefined && isNaN(update.valor)) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Valor deve ser um número.`);
      }
      if (update.entradaSaida && !['Entrada', 'Saída'].includes(update.entradaSaida)) {
        errors.push(`Edição ${index + 1} (ID ${update.id}): Tipo inválido.`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const client = await pool.connect();
    let totalChanges = 0;

    try {
      await client.query('BEGIN');
      for (const update of updates) {
        const fieldsToUpdate = Object.keys(update).filter(field => allowedFields.includes(field));
        const updatesClause = fieldsToUpdate.map((field, i) => `${field} = $${i + 1}`).join(', ');
        const values = fieldsToUpdate.map(field => update[field]);
        values.push(update.id, user_id);

        const query = `UPDATE financeiro SET ${updatesClause} WHERE id = $${fieldsToUpdate.length + 1} AND user_id = $${fieldsToUpdate.length + 2}`;
        const result = await client.query(query, values);
        if (result.rowCount === 0) {
          throw new Error(`Nenhum registro encontrado para atualizar (ID ${update.id}).`);
        }
        totalChanges += result.rowCount;
      }
      await client.query('COMMIT');
      res.status(200).json({ message: `Registros atualizados com sucesso: ${totalChanges} linha(s) afetada(s)` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao atualizar:', err.message);
    res.status(500).json({ error: `Erro ao atualizar: ${err.message}` });
  }
});

// Endpoint: Renovar token
app.post('/refresh-token', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const user = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    if (!user.id) {
      return res.status(400).json({ error: 'ID do usuário não encontrado no token.' });
    }

    const newToken = jwt.sign(
      { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({ token: newToken });
  } catch (err) {
    console.error('Erro ao renovar token:', err.message);
    res.status(403).json({ error: 'Token inválido.' });
  }
});

// Endpoint: Importar registros
app.post('/importar', authenticateToken, async (req, res) => {
  try {
      const lancamentos = req.body.lancamentos;
      const user_id = req.user.id;
      const insertedIds = [];
      const updatedIds = [];

      // Validar os lançamentos recebidos
      if (!lancamentos || !Array.isArray(lancamentos) || lancamentos.length === 0) {
          return res.status(400).json({ error: 'Nenhum lançamento válido fornecido.' });
      }

      // Processar cada lançamento
      for (const lancamento of lancamentos) {
          const { data, descricao, valor, entradaSaida } = lancamento;

          // Validar os campos
          if (!data || !descricao || isNaN(valor) || !['Entrada', 'Saída'].includes(entradaSaida)) {
              return res.status(400).json({ error: 'Campos inválidos em um dos lançamentos.' });
          }

          // Verificar se já existe um registro com os mesmos dados
          const existing = await pool.query(
              'SELECT id FROM financeiro WHERE user_id = $1 AND data = $2 AND descricao = $3 AND valor = $4 AND entradaSaida = $5',
              [user_id, data, descricao, valor, entradaSaida]
          );

          if (existing.rows.length > 0) {
              // Registro já existe, podemos atualizar ou ignorar
              updatedIds.push(existing.rows[0].id);
              continue; // Vamos pular a inserção para evitar duplicatas
          }

          // Inserir o novo lançamento
          const result = await pool.query(
              'INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida) VALUES ($1, $2, $3, $4, $5) RETURNING id',
              [user_id, data, descricao, valor, entradaSaida]
          );
          insertedIds.push(result.rows[0].id);
      }

      res.status(200).json({
          message: 'Lançamentos importados com sucesso',
          insertedIds,
          updatedIds
      });
  } catch (err) {
      console.error('Erro ao importar lançamentos:', err);
      res.status(500).json({ error: 'Erro ao importar lançamentos' });
  }
});

// Endpoint: Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Exportar o app como uma função serverless para o Vercel
module.exports = serverless(app);