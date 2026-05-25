const { describe, it, before, after } = require('node:test');

const describeDB = process.env.DATABASE_URL ? describe : describe.skip;
const assert = require('node:assert');
const express = require('express');
const { initDatabase, pool } = require('../config/database');
const routes = require('../routes');

let server;
let baseURL;
let token;
let userId;
let transactionId;

const testUser = {
  nome: 'Teste',
  sobrenome: 'Integracao',
  email: `teste_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`,
  senha: 'Senha123!'
};

before(async () => {
  if (!process.env.DATABASE_URL) return;
  try {
    await initDatabase();
  } catch (error) {
    console.error('Database init failed:', error.message);
    throw new Error(`Integration tests require a database. Set DATABASE_URL env var.`);
  }

  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  app.use((err, req, res, next) => {
    const status = err.message.includes('não encontrado') ? 404 :
      err.message.includes('incorretos') ? 401 :
      err.message.includes('obrigatório') || err.message.includes('obrigatória') || err.message.includes('rede social') || err.message.includes('inválido') || err.message.includes('expirado') || err.message.includes('código foi solicitado') || err.message.includes('já está') ? 400 : 500;
    res.status(status).json({ error: err.message });
  });

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseURL = `http://localhost:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (!process.env.DATABASE_URL || !pool) return;
  try {
    if (transactionId) {
      await pool.query('DELETE FROM financeiro WHERE id = $1', [transactionId]);
    }
    if (userId) {
      await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM orcamentos WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM recorrentes WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM financeiro WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM usuarios WHERE id = $1', [userId]);
    }
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

describeDB('Integration — Health', () => {
  it('GET /api/health returns OK', async () => {
    const res = await fetch(`${baseURL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'OK');
    assert.strictEqual(data.database, 'connected');
  });
});

describeDB('Integration — Auth', () => {
  it('POST /api/register — cria usuário e retorna token', async () => {
    const res = await fetch(`${baseURL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201, `Falha no registro: ${JSON.stringify(data)}`);
    assert.ok(data.token, 'Token não retornado');
    assert.ok(data.id, 'User ID não retornado');
    token = data.token;
    userId = data.id;
  });

  it('POST /api/register — rejeita email duplicado', async () => {
    const res = await fetch(`${baseURL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400, `Deveria ser 400: ${data.error}`);
    assert.ok(data.error.toLowerCase().includes('já'));
  });

  it('POST /api/login — autentica com credenciais corretas', async () => {
    const res = await fetch(`${baseURL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, senha: testUser.senha })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Falha no login: ${JSON.stringify(data)}`);
    assert.ok(data.token);
    token = data.token;
  });

  it('POST /api/login — rejeita senha incorreta', async () => {
    const res = await fetch(`${baseURL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, senha: 'wrong' })
    });
    assert.strictEqual(res.status, 401, `Deveria ser 401: ${await res.text()}`);
  });

  it('POST /api/login — rejeita email inexistente', async () => {
    const res = await fetch(`${baseURL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'naoexiste@test.com', senha: '123' })
    });
    assert.strictEqual(res.status, 401, `Deveria ser 401: ${await res.text()}`);
  });
});

describeDB('Integration — Financeiro', () => {
  it('POST /api/salvar — cria lançamento com token válido', async () => {
    const res = await fetch(`${baseURL}/api/salvar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        data: '2026-05-15',
        descricao: 'Salário mensal',
        valor: 5000,
        entradaSaida: 'Entrada',
        categoria: 'Salário',
        metodoPagamento: 'Transferência',
        observacoes: 'Teste integração'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201, `Falha ao salvar: ${JSON.stringify(data)}`);
    assert.ok(data.id);
    transactionId = data.id;
  });

  it('POST /api/salvar — cria saída com valor negativo', async () => {
    const res = await fetch(`${baseURL}/api/salvar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        data: '2026-05-16',
        descricao: 'Aluguel',
        valor: -1500,
        entradaSaida: 'Saída',
        categoria: 'Moradia'
      })
    });
    assert.strictEqual(res.status, 201);
  });

  it('GET /api/listar — retorna lançamentos do usuário', async () => {
    const res = await fetch(`${baseURL}/api/listar`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 2);
    const found = data.find(l => l.id === transactionId);
    assert.ok(found, 'Lançamento criado não encontrado na lista');
    assert.strictEqual(found.descricao, 'Salário mensal');
    assert.strictEqual(Number(found.valor), 5000);
    assert.strictEqual(found.categoria, 'Salário');
    assert.strictEqual(found.metodoPagamento, 'Transferência');
    assert.strictEqual(found.observacoes, 'Teste integração');
  });

  it('GET /api/listar — rejeita sem token', async () => {
    const res = await fetch(`${baseURL}/api/listar`);
    assert.strictEqual(res.status, 401);
  });

  it('DELETE /api/deletar — remove lançamento', async () => {
    const res = await fetch(`${baseURL}/api/deletar?id=${transactionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);
    const listRes = await fetch(`${baseURL}/api/listar`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const list = await listRes.json();
    assert.strictEqual(list.find(l => l.id === transactionId), undefined);
    transactionId = null;
  });

  it('POST /api/salvar — rejeita dados inválidos', async () => {
    const res = await fetch(`${baseURL}/api/salvar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ descricao: 'Sem data' })
    });
    assert.strictEqual(res.status, 400);
  });
});

describeDB('Integration — Recorrentes', () => {
  let recId;

  after(() => {
    if (recId) {
      pool.query('DELETE FROM recorrentes WHERE id = $1', [recId]).catch(() => {});
    }
  });

  it('POST /api/recorrentes — cria recorrência mensal', async () => {
    const res = await fetch(`${baseURL}/api/recorrentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        descricao: 'Assinatura Mensal',
        valor: 49.90,
        frequencia: 'mensal',
        categoria: 'Lazer',
        dia_vencimento: 15,
        proxima_data: '2026-06-15'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.id);
    recId = data.id;
  });

  it('GET /api/recorrentes — lista recorrências', async () => {
    const res = await fetch(`${baseURL}/api/recorrentes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data));
    const found = data.find(r => r.id === recId);
    assert.ok(found);
    assert.strictEqual(found.descricao, 'Assinatura Mensal');
  });

  it('PUT /api/recorrentes/:id — desativa recorrência', async () => {
    const res = await fetch(`${baseURL}/api/recorrentes/${recId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ativo: false })
    });
    assert.strictEqual(res.status, 200);
  });
});

describeDB('Integration — Orçamentos', () => {
  let orcId;

  after(() => {
    if (orcId) {
      pool.query('DELETE FROM orcamentos WHERE id = $1', [orcId]).catch(() => {});
    }
  });

  it('POST /api/orcamentos — cria orçamento', async () => {
    const res = await fetch(`${baseURL}/api/orcamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ categoria: 'Alimentação', limite: 800 })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.id);
    orcId = data.id;
  });

  it('GET /api/orcamentos — lista orçamentos', async () => {
    const res = await fetch(`${baseURL}/api/orcamentos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });

  it('GET /api/orcamentos/verificar — retorna alertas', async () => {
    const res = await fetch(`${baseURL}/api/orcamentos/verificar`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data));
  });
});

describeDB('Integration — Profile', () => {
  it('GET /api/profile — retorna perfil', async () => {
    const res = await fetch(`${baseURL}/api/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.nome, 'Teste');
    assert.strictEqual(data.email, testUser.email);
  });

  it('PUT /api/profile — atualiza perfil', async () => {
    const res = await fetch(`${baseURL}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ nome: 'TesteAtualizado', theme: 'nord' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.message);
    const profileRes = await fetch(`${baseURL}/api/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profile = await profileRes.json();
    assert.strictEqual(profile.nome, 'TesteAtualizado');
  });
});

describeDB('Integration — Error Handling', () => {
  it('retorna 401 para rotas sem token', async () => {
    const res = await fetch(`${baseURL}/api/profile`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.includes('Token'));
  });

  it('retorna 403 para token inválido', async () => {
    const res = await fetch(`${baseURL}/api/profile`, {
      headers: { 'Authorization': 'Bearer token_invalido_aqui' }
    });
    assert.strictEqual(res.status, 403);
  });

  it('retorna 404 para rota inexistente', async () => {
    const res = await fetch(`${baseURL}/api/rota_inexistente`);
    assert.strictEqual(res.status, 404);
  });
});
