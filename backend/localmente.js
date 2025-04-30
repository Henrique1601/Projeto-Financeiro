const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // Importar CORS
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

app.options('*', cors()); // Permitir preflight para todas as rotas
app.use(express.json());// Middleware para interpretar JSON no corpo das requisições
app.use(helmet());// Configurar headers de segurança com helmet
// console.log('Recebendo dados:', req.body);

// Configurar CORS para permitir requisições do frontend
app.use(cors({
  origin: '*', // URL exata do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  credentials: false // Desativa credenciais, já que origin: '*' não suporta credentials: true
}));

// Configurar rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requests per second
  message: 'Muitas requisições de um mesmo IP. Tente novamente mais tarde.'
});
app.use(limiter);

// Conectar ao banco de dados SQLite (cria 'financeiro.db' se não existir)
 const db = new sqlite3.Database('./financeiro.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        console.log('Caminho do banco:', __dirname + './financeiro.db');
    }
}); 


// Configurar busyTimeout para aguardar mais tempo em caso de bloqueio
db.configure('busyTimeout', 10000); // 10 segundos
// Configurar PRAGMA synchronous para evitar perdas de dados
db.run('PRAGMA synchronous = FULL', (err) => {
    if (err) {
        console.error('Erro ao configurar PRAGMA synchronous:', err.message);
    } else {
        console.log('PRAGMA synchronous configurado para FULL.');
    }
}); // Força a sincronização para evitar perdas de dados
db.all('PRAGMA table_info(financeiro)', [], (err, columns) => {
    if (err) {
        console.error('Erro ao verificar estrutura da tabela financeiro:', err.message);
    } else {
        console.log('Estrutura da tabela financeiro:', columns);
    }
});
db.serialize(() => {
/*     // Renomeia a tabela antiga
     db.run('ALTER TABLE financeiro RENAME TO financeiro_old', (err) => {
        if (err) {
            console.error('Erro ao renomear tabela:', err.message);
        }
    });  */
    // Tabela financeiro
    db.run(`CREATE TABLE IF NOT EXISTS financeiro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        data DATE NOT NULL,
        descricao TEXT NOT NULL,
        valor NUMBER NOT NULL,
        entradaSaida TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar tabela financeiro:', err.message);
        } else {
            console.log('Tabela "financeiro" criada ou já existe.');
        }
    });
/*     // Migra os dados
     db.run(`INSERT INTO financeiro (user_id, data, descricao, valor, entradaSaida)
            SELECT 1, data, descricao, valor, entradaSaida
            FROM financeiro_old`, (err) => {
        if (err) {
            console.error('Erro ao migrar dados:', err.message);
        }else{
            console.log('Dados migrados com sucesso.');
        }
    });  */
/*     // Exclui a tabela antiga
     db.run('DROP TABLE financeiro_old', (err) => {
        if (err) {
            console.error('Erro ao excluir tabela antiga:', err.message);
        }
    });  */

        // Verificar se a tabela usuarios tem a estrutura correta
    db.all('PRAGMA table_info(usuarios)', [], (err, columns) => {
        if (err) {
            console.error('Erro ao verificar estrutura da tabela usuarios:', err.message);
            return;
        }

        const hasNome = columns.some(col => col.name === 'nome');
        const hasSobrenome = columns.some(col => col.name === 'Sobrenome');
        const hasEmail = columns.some(col => col.name === 'email');
        const hasSenha = columns.some(col => col.name === 'senha');

        if (!hasNome || !hasSobrenome || !hasEmail || !hasSenha) {
            console.log('Tabela usuarios com estrutura antiga. Atualizando...');
               // Renomear a tabela antiga
           /*  db.run('ALTER TABLE usuarios RENAME TO usuarios_old', (err) => {
                if (err) {
                    console.error('Erro ao renomear tabela:', err.message);
                }
            });  */
            // Criar nova tabela com a estrutura correta
            db.run(`CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                sobrenome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL
            )`, (err) => {
                if (err) {
                    console.error('Erro ao criar nova tabela usuarios:', err.message);
                } else {
                    console.log('Nova tabela "usuarios" criada ou já existe.');
                }
            });
            db.all('SELECT * FROM usuarios', [], (err, users) => {
                if (err) {
                    console.error('Erro ao listar usuários:', err.message);
                } else {
                    console.log('Usuários no banco:', users);
                }
            });
             // Migrar dados (se necessário)
            /*  db.run(`INSERT INTO usuarios (id, nome, sobrenome,email, senha)
                    SELECT id, nome, sobrenome, email, senha
                    FROM usuarios_old`, (err) => {
                if (err) {
                    console.error('Erro ao migrar dados:', err.message);
                } else {
                    console.log('Dados migrados com sucesso.');
                }
            });  */
 
             // Remover tabela antiga
            //   db.run('DROP TABLE usuarios_old', (err) => {
            //     if (err) {
            //         console.error('Erro ao remover tabela antiga:', err.message);
            //     } else {
            //         console.log('Tabela usuarios_old removida.');
            //     }
            // });  
        } else {
            console.log('Tabela "usuarios" já está com a estrutura correta.');
            } 
        });
    });

// Chave secreta para JWT (substitua por uma chave segura em produção)
const JWT_SECRET = '1234';

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    console.log('Header Authorization:', authHeader); // Log para depuração
    console.log('Token extraído:', token); // Log para depuração

    if (!token) {
        console.log('Token não fornecido');
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        console.log('Token verificado, usuário:', user); // Log para depuração
        req.user = user;
        next();
    });
};

// Função auxiliar para transformar db.get em uma promessa
const getAsync = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Função auxiliar para transformar db.run em uma promessa
const runAsync = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('Erro na execução da query:', err.message);
                reject(err);
            } else {
                console.log(`Registro inserido com ID: ${this.lastID}`);
                resolve(this.lastID);
            }
        });
    });
};
const allAsync = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};
// Endpoint para registrar usuário
app.post('/register', async (req, res) => {
    try {
        const { nome, sobrenome, email, senha } = req.body;

        if (!nome || !sobrenome || !email || !senha) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        // Verificar se o email já existe
        const existingUser = await getAsync('SELECT email FROM usuarios WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Este email já está registrado.' });
        }

        // Se o email não existe, prossegue com o registro
        const hashedPassword = await bcrypt.hash(senha, 10);
        console.log('Dados a serem inseridos:', { nome, sobrenome, email, hashedPassword });

        const lastID = await runAsync(
            'INSERT INTO usuarios (nome, sobrenome, email, senha) VALUES (?, ?, ?, ?)',
            [nome, sobrenome, email, hashedPassword]
        );
        
        // Verificar se o registro foi inserido
        const newUser = await getAsync('SELECT * FROM usuarios WHERE id = ?', [lastID]);
        console.log('Registro inserido no banco:', newUser);
        // Verificar todos os usuários para depuração
        const allUsers = await allAsync('SELECT * FROM usuarios', []);
        console.log('Todos os usuários no banco:', allUsers);
        
        res.status(201).json({ message: 'Usuário registrado com sucesso.', id: lastID });
    } catch (err) {
        console.error('Erro ao registrar usuário:', err.message);
        if (err.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Este email já está registrado.' });
        }
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});

// Endpoint para login usuário
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }
        try {
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

        console.log('Usuário retornado do banco:', user); // Log para depuração
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const isPasswordValid = await bcrypt.compare(senha, user.senha);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        // Gerar token JWT com nome, sobrenome e email
        const token = jwt.sign(
            { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        console.log('Token gerado no login:', token); // Log para depuração
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

// Validações robustas para entradas
const validateFinanceiroInput = (data, descricao, valor, entradaSaida) => {
    const errors = [];
    console.log('Validando:', { data, descricao, valor, entradaSaida });
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        errors.push('Data deve estar no formato YYYY-MM-DD.');
    }
    if (!descricao || typeof descricao !== 'string' || descricao.length > 255) {
        errors.push('Descrição é obrigatória e deve ter no máximo 255 caracteres.');
    }
    if (isNaN(valor)) {
        errors.push('Valor deve ser um número.');
    }
    if(entradaSaida === 'Saída' && valor > 0){
        errors.push('valor deve ser negativo para saída');
    }else if (entradaSaida === 'Entrada' && valor < 0){
        errors.push('valor deve ser positivo para entrada');
    }
    if(!entradaSaida) errors.push('Tipo de entrada/saída é obrigatório.');
    return errors;
    
};

// Endpoint para salvar dados
app.post('/salvar',authenticateToken,async (req, res) => {
    try {
        const { data, descricao, valor, entradaSaida } = req.body;
        const user_id = req.user.id; // ID do usuário autenticado
        // Log dos dados recebidos
        console.log('Dados recebidos:', {user_id ,data, descricao, valor, entradaSaida });

     // Validação direta do valor original de entradaSaida
     const entradaSaidaValida = entradaSaida.trim();
     if (entradaSaidaValida !== 'Entrada' && entradaSaidaValida !== 'Saída') {
         return res.status(400).json({ error: 'Tipo de entrada/saída deve ser "Entrada" ou "Saída".' });
     }
        // Validação dos campos usando a função validateFinanceiroInput
        const errors = validateFinanceiroInput(data, descricao, valor, entradaSaida);
        console.log('Erros de validação:', errors); // Log para depuração
        if (errors.length > 0){ 
            return res.status(400).json({ error: errors.join(' ') });
        }
        
        // Inserção no banco de dados
        const lastID = await runAsync(
            'INSERT INTO financeiro (user_id,data, descricao, valor, entradaSaida) VALUES (?,?, ?, ?, ?)',
            [user_id,data, descricao, valor, entradaSaidaValida]
        );

        // Resposta de sucesso
        res.status(200).json({ id: lastID, message: 'Dados salvos ' });
    } catch (err) {
        console.error('Erro ao salvar no SQLite:', err.message);
        res.status(500).json({ error: 'Erro ao salvar no banco.' });
    }
});

// Endpoint para deletar dados
app.delete('/deletar', authenticateToken, (req, res) => {
    if (!req.user || !req.user.id) {
        console.log('Usuário não autenticado ou ID não encontrado');
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { id } = req.body;
    const user_id = req.user.id; // ID do usuário autenticado
    
    console.log('Tentando deletar ID:', {id, user_id}); // Log para depuração

    if (!id) {
        console.log('ID não fornecido');
        return res.status(400).json('ID é obrigatório para deleção');
    }
    // Verificar os tipos dos parâmetros
    console.log('Tipos dos parâmetros:', { id: typeof id, user_id: typeof user_id });
    
    // Garantir que id e user_id sejam números
    const idNum = parseInt(id);
    const userIdNum = parseInt(user_id);
    if (isNaN(idNum) || isNaN(userIdNum)) {
        console.log('ID ou user_id inválido:', { id, user_id });
        return res.status(400).json({ error: 'ID e user_id devem ser números válidos' });
    }
  
    db.run('DELETE FROM financeiro WHERE id = ? AND user_id = ?', [idNum, userIdNum], 
    function (err) {
        if (err) {
            console.error('Erro ao deletar no SQLite:', err.message);
            console.error('Stack trace:', err.stack); // Adicionar stack trace para mais detalhes
            return res.status(500).json('Erro ao deletar no banco' + err.message);
        }
        if (this.changes === 0) {
            console.log('Registro não encontrado para o id fornecido', idNum, 'e user_id', userIdNum);
            return res.status(404).json('Registro não encontrado');
        }
        console.log('Registro deletado com sucesso:', idNum);
        res.status(200).json({ message: 'Registro deletado com sucesso' });
    });
});

// Endpoint para editar dados
app.put('/editar', authenticateToken, async (req, res) => {
    console.log('Corpo da requisição:', req.body);
    try {
        const { updates } = req.body; // Agora esperamos um array de updates
        const user_id = req.user.id; // ID do usuário autenticado

        // Validação do array de updates
        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ error: 'Um array de edições é obrigatório.' });
        }

        // Validar cada edição
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
            if (update.valor !== undefined && update.entradaSaida) {
                if (update.entradaSaida === 'Entrada' && update.valor <= 0) {
                    errors.push(`Edição ${index + 1} (ID ${update.id}): Valor deve ser positivo para entrada.`);
                } else if (update.entradaSaida === 'Saída' && update.valor >= 0) {
                    errors.push(`Edição ${index + 1} (ID ${update.id}): Valor deve ser negativo para saída.`);
                }
            }
            if (updates.length > 50) {
                return res.status(400).json({ error: 'Não é permitido editar mais de 50 linhas de uma vez.' });
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(' ') });
        }

        // Iniciar uma transação
        let totalChanges = 0;
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        try {
            for (const update of updates) {
                const fieldsToUpdate = Object.keys(update).filter(field => allowedFields.includes(field));
                const updatesClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
                const values = fieldsToUpdate.map(field => update[field]);
                values.push(update.id, user_id); // Adicionar id e user_id para o WHERE

                const query = `UPDATE financeiro SET ${updatesClause} WHERE id = ? AND user_id = ?`;
                console.log('Query gerada:', query);
                console.log('Valores para a query:', values);

                const changes = await new Promise((resolve, reject) => {
                    db.run(query, values, function (err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    });
                });

                if (changes === 0) {
                    throw new Error(`Nenhum registro encontrado para atualizar ou você não tem permissão para editá-los (ID ${update.id}).`);
                }
                totalChanges += changes;
            }

            // Commit da transação
            await new Promise((resolve, reject) => {
                db.run('COMMIT', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            res.status(200).json({ message: `Registros atualizados com sucesso: ${totalChanges} linha(s) afetada(s)` });
        } catch (err) {
            // Rollback da transação em caso de erro
            await new Promise((resolve, reject) => {
                db.run('ROLLBACK', (rollbackErr) => {
                    if (rollbackErr) console.error('Erro ao fazer rollback:', rollbackErr.message);
                    resolve();
                });
            });
            throw err;
        }
    } catch (err) {
        console.error('Erro ao atualizar no SQLite:', err.message);
        res.status(500).json({ error: `Erro ao atualizar no SQLite: ${err.message}` });
    }
});

// Endpoint para consultar todos os dados (opcional, para listar registros)
app.get('/listar',authenticateToken,(req, res) => {
    const user_id = req.user.id; // ID do usuário autenticado
    db.all('SELECT * FROM financeiro WHERE user_id = ? ORDER BY data DESC', [user_id], (err, rows) => {
        if (err) {
            console.error('Erro ao consultar dados:', err.message);
            return res.status(500).json('Erro ao consultar no banco');
        }
        res.status(200).json(rows);
    });
});
// Endpoint para renovar o token
app.post('/refresh-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Tentando renovar token:', token);

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
        console.log('Usuário decodificado para renovação:', user);

        if (!user.id) {
            console.log('ID do usuário não encontrado no token');
            return res.status(400).json({ error: 'ID do usuário não encontrado no token.' });
        }

        const newToken = jwt.sign(
            { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        console.log('Novo token gerado:', newToken);
        res.status(200).json({ token: newToken });
    } catch (err) {
        console.error('Erro ao renovar token:', err.message);
        return res.status(403).json({ error: 'Token inválido.' });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

//Conecção com o banco de dados

// Inicia o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
}); 


// Fechar o banco quando o processo for encerrado (opcional)
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco:', err.message);
        } else {
            console.log('Conexão com o banco fechada.');
        }
        process.exit();
    });
});