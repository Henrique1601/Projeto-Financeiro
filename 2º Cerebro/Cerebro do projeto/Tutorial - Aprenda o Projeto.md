---
title: "Tutorial — Aprenda o Projeto"
tags:
  - tutorial
  - arquitetura
  - aprendizado
aliases:
  - Tutorial Completo
  - Aprenda o Projeto
cssclasses:
  - wide-page
---

# Tutorial — Aprenda o Projeto Financeiro do Zero

Bem-vindo! Este tutorial assume que você sabe **o básico de JavaScript (variáveis, funções, objetos, arrays, promises/async-await)** e explica tudo construído em cima disso: como o frontend e backend se comunicam, o que cada tecnologia faz, e por que usamos cada uma.

---

## Índice

1. [[#Visão Geral — O que este projeto faz]]
2. [[#Fluxo de uma Requisição]]
3. [[#Frontend — Vite + Vanilla JS SPA]]
   - [[#Por que Vite?]]
   - [[#O que é uma SPA?]]
   - [[#Hash Router — Como a navegação funciona sem servidor]]
   - [[#Lazy Loading — Carregar páginas sob demanda]]
   - [[#api.js — Centralizando requisições HTTP]]
   - [[#PWA — Service Worker + Push]]
4. [[#Backend — Express + Node.js]]
   - [[#Express — O framework HTTP]]
   - [[#CommonJS vs ES Modules — E por que o backend é diferente do frontend]]
   - [[#Middleware — A corrente de funções]]
   - [[#pg — Conectando ao PostgreSQL]]
   - [[#JWT — JSON Web Tokens]]
5. [[#Autenticação]]
   - [[#Fluxo de Login]]
   - [[#2FA — Autenticação de Dois Fatores]]
   - [[#OAuth2 — Login com Google/GitHub]]
6. [[#Banco de Dados — PostgreSQL + Neon]]
   - [[#Neon — Por que serverless?]]
   - [[#Pool de Conexões]]
   - [[#Migrations — Como as tabelas nascem]]
7. [[#Deploy — Vercel]]
   - [[#Serverless Functions]]
   - [[#Variáveis de Ambiente]]
8. [[#Testes]]
   - [[#node --test]]
9. [[#CI/CD — GitHub Actions]]
10. [[#Glossário — Termos Técnicos]]

---

## Visão Geral — O que este projeto faz

```
┌─────────────────────────────────────────────────────┐
│              GESTOR FINANCEIRO                       │
│                                                      │
│  App web para controlar finanças pessoais:           │
│  - Lançar receitas/despesas                          │
│  - Categorizar automaticamente (keywords)            │
│  - Transações recorrentes (aluguel, assinaturas)     │
│  - Orçamentos mensais por categoria                  │
│  - Dashboard com gráficos + widgets                  │
│  - Importar extrato OFX/CSV/JSON                     │
│  - Exportar XLSX, enviar por email                   │
│  - Autenticação via email/senha ou Google/GitHub     │
│  - 2FA (TOTP + email + backup codes)                │
│  - Push notifications                                │
│  - Temas customizáveis                               │
│  - PWA (funciona offline)                            │
└─────────────────────────────────────────────────────┘
```

**Arquitetura simplificada:**

```mermaid
graph LR
    User[Usuário] --> Browser[Browser]
    Browser --> FE[Frontend Vite SPA<br/>port 5173 dev]
    Browser --> SW[Service Worker]
    FE --> API[Backend Express REST API<br/>port 3000 dev]
    API --> DB[(PostgreSQL Neon<br/>cloud)]
    SW --> Cache[(Cache offline)]
```

---

## Fluxo de uma Requisição

Entender o caminho que um dado percorre é a melhor forma de entender o sistema. Vamos seguir o fluxo quando você **adiciona uma despesa**:

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend (SPA)
    participant A as Backend (API)
    participant D as PostgreSQL

    U->>F: Preenche form + clica "Salvar"
    F->>F: Valida campos (nome, valor, data)
    F->>A: POST /api/salvar {descricao, valor, ...}
    Note over F,A: apiPost() → fetch() com JWT no header
    A->>A: Verifica JWT (middleware authMiddleware)
    A->>A: Auto-categoriza descrição
    A->>D: INSERT INTO financeiro (...)
    D-->>A: Ok
    A-->>F: 201 {mensagem, registro}
    F-->>F: Atualiza dashboard + mostra toast "Salvo!"
    F-->>U: Vê o lançamento na tabela
```

**Conceitos-chave deste fluxo:**
- **JWT** é um token enviado em toda requisição autenticada (header `Authorization: Bearer <token>`)
- **Middleware** são funções que o Express executa antes do handler final (ex: verificar token)
- **JSON** é o formato de dados que trafega entre frontend e backend

---

## Frontend — Vite + Vanilla JS SPA

### Por que Vite?

> [!info] Vite é um **bundler** e **dev server** moderno.

Antes do Vite, usava-se Webpack. Vite é mais rápido porque:
- Em desenvolvimento, **não empacota nada** — serve os arquivos `.js` nativamente (ES Modules) e transpila só o que precisa
- Em produção, usa **Rollup** por baixo para empacotar tudo em arquivos minificados

```
📁 front-end/
├── index.html          ← Ponto de entrada (único HTML)
├── package.json
├── vite.config.js      ← Configuração do Vite (porta, PWA, build)
├── vercel.json         ← Configuração de deploy
└── src/
    ├── main.js         ← Bootstrap da aplicação
    ├── router.js       ← Hash router
    ├── api.js          ← Cliente HTTP centralizado
    ├── auth.js         ← Gerenciamento de autenticação
    ├── store.js        ← Cache de dados (ex: categorias)
    ├── theme.js        ← Sistema de temas
    ├── dashboardConfig.js ← Presets do dashboard
    ├── config.js       ← Constantes globais
    ├── utils/
    │   ├── dom.js      ← Utilitários DOM (toast, spinner)
    │   ├── format.js   ← Formatação (moeda, data, tipo)
    │   └── chartSetup.js ← Chart.js tree-shaked
    ├── pages/
    │   ├── LoginPage.js
    │   ├── DashboardPage.js  ← ~1131 linhas (a maior)
    │   ├── ProfilePage.js
    │   ├── ExtratoPage.js
    │   ├── RecorrentesPage.js
    │   ├── etc.
    └── styles/
        ├── global.css  ← Reset + variáveis + temas
        ├── dashboard.css
        ├── profile.css
        └── login.css
```

### O que é uma SPA?

> **SPA** = Single Page Application.

Você carrega **um único HTML** (`index.html`) e o JavaScript muda o conteúdo dinamicamente. Não há recarregamento de página ao navegar — o JS substitui o conteúdo da `<div id="app">`.

**Vantagem:** Navegação instantânea, parece um app nativo.

### Hash Router — Como a navegação funciona sem servidor

> [!example] Como o router funciona

```js
// URL do navegador: https://site.com/#/dashboard?page=2

// O que acontece:
window.location.hash  // → "#/dashboard?page=2"
// O servidor vê apenas "/" — tudo depois de "#" é ignorado pelo servidor
```

**Por que hash routing?** Porque deployamos como **static site** no Vercel. Sem hash, o Vercel tentaria servir `/dashboard` como arquivo físico e daria 404. Com hash, toda navegação fica no cliente.

Nosso router em `src/router.js:18-21`:
```js
export function navigate(path) {
  window.location.hash = path;   // Muda o hash → dispara hashchange
}

window.addEventListener('hashchange', onHashChange);
```

O `onHashChange()` (linha 23):
1. Lê o hash: `window.location.hash.slice(1)` → `/dashboard?page=2`
2. Separa path de query string: `.split('?')` → `['/dashboard', 'page=2']`
3. Acha o handler registrado em `ROUTES` (via `route(path, handler)`)
4. Chama o handler passando a `<div id="app">`, que popula o HTML

### Lazy Loading — Carregar páginas sob demanda

No `src/main.js:6-15`:
```js
route('/dashboard', () => import('./pages/DashboardPage.js').then(m => m.render(app)));
route('/perfil', () => import('./pages/ProfilePage.js').then(m => m.render(app)));
```

`import()` é uma **importação dinâmica** — o navegador só baixa o arquivo `DashboardPage.js` quando você entra no Dashboard pela primeira vez. Isso é **lazy loading**: o bundle inicial fica pequeno (~13KB) e cada página é baixada sob demanda.

> [!tip] **Benefício:** Usuário entra, vê login quase instantaneamente. O código do dashboard (62KB) só baixa se ele navegar até lá.

### api.js — Centralizando requisições HTTP

`src/api.js` é o **cliente HTTP** do frontend. Toda chamada ao backend passa por ele.

```js
export async function apiPost(path, body) {
  return apiFetch(path, { method: 'POST', body });
}
// apiGet, apiPut, apiDelete, apiPatch — todas usam apiFetch
```

O `apiFetch()` faz:
1. Pega o JWT do `localStorage`
2. Monta headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
3. Calcula `API_BASE_URL` — se `import.meta.env.DEV` for true → `http://localhost:3000`, senão → `https://gestor-financeiro-api-proj.vercel.app`
4. Faz `fetch(url, options)`
5. Se der 401/403 → tenta **refresh automático** do token, depois **retry**
6. Se falhar de novo → redireciona para login

> [!tip] **`import.meta.env.DEV`** é uma variável que o Vite substitui em tempo de build: `true` quando você roda `npm run dev`, `false` no build de produção.

### PWA — Service Worker + Push

**PWA** (Progressive Web App) permite:
- Instalar o site como app no celular/desktop
- Funcionar offline (parcialmente)
- Receber notificações push

O **Service Worker** (`public/sw.js`) é um script que o navegador executa **em segundo plano**, mesmo com a aba fechada. Ele age como um proxy entre o navegador e a rede:

1. **Cache-first para assets estáticos**: JS, CSS, imagens → servem do cache
2. **Network-first para API**: tenta o servidor primeiro; se falhar (offline), usa cache como fallback
3. **Push notifications**: o backend envia notificação → o Service Worker recebe → mostra notificação no sistema

---

## Backend — Express + Node.js

### Express — O framework HTTP

Express é o framework web mais popular do Node.js. Ele organiza o código em:
- **Rotas** — definem URL + método HTTP
- **Controllers** — funções que processam a requisição
- **Services** — lógica de negócio (separada dos controllers)
- **Middleware** — funções que executam antes/depois das rotas

```
📁 backend/
├── api/
│   ├── index.js              ← App Express (setup, middleware, rotas)
│   ├── config/
│   │   ├── database.js       ← Conexão PostgreSQL + criação de tabelas
│   │   └── jwt.js            ← Segredo do JWT
│   ├── middleware/
│   │   └── authMiddleware.js ← Verifica JWT
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── financeiroController.js
│   │   ├── categoriaController.js
│   │   └── ...
│   ├── services/
│   │   ├── authService.js
│   │   ├── financeiroService.js  ← Lógica principal (CRUD, import, export)
│   │   ├── categoriaService.js
│   │   ├── twoFAService.js       ← TOTP nativo (crypto, sem otplib)
│   │   └── ...
│   ├── routes/
│   │   └── index.js          ← Agrupa todas as rotas
│   └── utils/
│       └── queryHelpers.js   ← Pool.query + helpers
├── package.json              ← "type": "commonjs" (padrão)
└── vercel.json
```

### CommonJS vs ES Modules — E por que o backend é diferente do frontend

> [!warning] **Conceito fundamental**

JavaScript tem **dois sistemas de módulos**:

| | CommonJS (CJS) | ES Modules (ESM) |
|---|---|---|
| Sintaxe | `require()` / `module.exports` | `import` / `export` |
| Carregamento | Síncrono | Assíncrono |
| Arquivos | `.js` (padrão) | `.js` com `"type": "module"` ou `.mjs` |
| Usado em | Node.js (tradicional) | Navegadores, Vite |

**No nosso projeto:**
- **Backend** (`backend/package.json`): **CommonJS** — sem `"type": "module"`, então usa `require()`. Isso porque o Vercel executa o backend como serverless function, e CommonJS é mais compatível.
- **Frontend** (`front-end/package.json`): **ES Modules** — tem `"type": "module"`, usa `import`/`export`. O Vite já lida com ESM nativamente no navegador.

```js
// Backend (CommonJS)
const express = require('express');
module.exports = { minhaFuncao };

// Frontend (ES Modules)
import { minhaFuncao } from './utils.js';
export function minhaFuncao() { }
```

### Middleware — A corrente de funções

No Express, uma requisição passa por uma **cadeia de funções** (middlewares) até chegar no handler final. Cada middleware pode:
- Modificar `req` ou `res`
- Encerrar a resposta (`res.send()`, `res.json()`)
- Passar para o próximo (`next()`)

```js
// Exemplo real do backend (api/index.js):
app.use(cors());           // 1. Permite requisições de outros domínios
app.use(express.json());   // 2. Converte body JSON em objeto JS
app.use(rateLimit(...));   // 3. Limita requisições por IP
app.use('/api', routes);   // 4. Rotas da API (cada rota pode ter + middlewares)

// Dentro de uma rota:
router.post('/salvar', authMiddleware, (req, res) => {
  // authMiddleware executou ANTES de chegar aqui
  // req.user já está populado
});
```

### pg — Conectando ao PostgreSQL

`pg` é o pacote oficial do Node.js para PostgreSQL. Usamos ele com **Pool** (conexões reaproveitáveis):

```js
// api/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Ex: postgres://user:pass@host.neon.tech/neondb
  ssl: { rejectUnauthorized: false }           // Obrigatório para conexões seguras
});
```

**Como funciona:**
- `Pool` mantém um conjunto de conexões abertas
- Quando você chama `pool.query(sql, params)`, ele pega uma conexão disponível do pool, executa a query, e devolve a conexão ao pool
- Isso é muito mais rápido que abrir/fechar conexão a cada requisição

**Query helpers** (`api/utils/queryHelpers.js`) simplificam ainda mais:
```js
const { getOne, getAll, run } = require('./queryHelpers');

// Em vez de:
const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
const user = result.rows[0];

// Você escreve:
const user = await getOne('SELECT * FROM usuarios WHERE email = $1', [email]);
```

### JWT — JSON Web Tokens

JWT é um formato de token **autocontido** — ele contém os dados do usuário dentro dele, assinados digitalmente.

```js
// Login bem-sucedido → gerar token
const token = jwt.sign(
  { id: user.id, email: user.email },  // payload (dados)
  process.env.JWT_SECRET,              // chave secreta (só o servidor conhece)
  { expiresIn: '24h' }                 // expira em 24h
);

// Requisição autenticada → verificar token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { id: 123, email: 'user@email.com', iat: ..., exp: ... }
```

> [!tip] **Diferença de session:** Em apps tradicionais, você armazena a sessão no servidor (memória/banco) e envia apenas um ID de sessão ao cliente. Com JWT, **o servidor não precisa armazenar nada** — o token já tem tudo que precisa. Isso escala melhor.

---

## Autenticação

### Fluxo de Login

1. Usuário envia email + senha → `POST /api/login`
2. Servidor verifica hash da senha (bcrypt)
3. Se ok → gera JWT com `{ id, email }` + `refreshToken`
4. Retorna `{ token, refreshToken, user }`
5. Frontend salva no `localStorage`
6. Toda requisição futura envia `Authorization: Bearer <token>`

### 2FA — Autenticação de Dois Fatores

> [!info] O 2FA foi implementado **sem bibliotecas externas** para evitar problemas com ESM no Vercel.

**TOTP (Time-based One-Time Password):**
- Usuário escaneia QR code com Google Authenticator
- O app gera um código de 6 dígitos que muda a cada 30 segundos
- O servidor e o app calculam o mesmo código usando o **mesmo segredo** e o **timestamp atual**

```js
// twoFAService.js — TOTP nativo (RFC 6238)
function totpVerify(secret, token) {
  // 1. Calcula contador: timestamp / 30
  let counter = Math.floor(Date.now() / 1000 / 30);

  // 2. HMAC-SHA1(secret, counter)
  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();

  // 3. Extrai 4 bytes do HMAC → número de 6 dígitos
  const totp = String(code % 1000000).padStart(6, '0');

  return totp === token;
}
```

**Fluxo de login com 2FA:**
1. Email + senha → servidor vê que 2FA está ativo → retorna `{ requires2FA: true, tempToken }`
2. Frontend mostra tela de código 2FA
3. Usuário digita código → `POST /api/login/2fa` com `{ tempToken, code }`
4. Servidor verifica código TOTP (ou email, ou backup code)
5. Se ok → retorna JWT definitivo

**Backup codes:** 8 códigos de uso único (SHA256) para quando você perde o acesso ao autenticador.

**Trust this device:** Marcar o dispositivo como confiável por 30 dias — gera um token hashado armazenado no banco.

### OAuth2 — Login com Google/GitHub

OAuth2 delega a autenticação para terceiros. O fluxo é:

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant G as Google

    U->>F: Clica "Entrar com Google"
    F->>B: Redireciona para /api/auth/google
    B->>G: Redireciona para página de login do Google
    U->>G: Faz login no Google
    G-->>B: Código de autorização (callback)
    B->>G: Troca código por access_token
    B->>B: Cria usuário se não existir
    B-->>F: Redireciona para /#/callback?token=JWT
    F->>F: Salva token no localStorage
    F-->>U: Dashboard
```

> [!warning] No nosso fluxo, o frontend **nunca** vê o access_token do Google. Toda troca acontece entre backend e Google. O frontend só recebe o JWT final.

---

## Banco de Dados — PostgreSQL + Neon

### Neon — Por que serverless?

**Neon** é um serviço de PostgreSQL "serverless". Serverless significa que você **não gerencia um servidor** — a Neon escala automaticamente de 0 a milhares de conexões.

**Características importantes:**
- **Auto-pausa:** Se ninguém usa o banco por 5 minutos, ele "dorme" (custa $0). Acorda automaticamente na próxima requisição (~500ms de latência no primeiro acesso)
- **Branching:** Você pode criar branches do banco (como git!) para testar migrations
- **Conexão SSL obrigatória:** `?sslmode=require` na URL

### Pool de Conexões

> [!tip] **Problema:** Vercel executa cada requisição em uma função separada. Criar uma conexão nova a cada chamada é lento. **Solução:** Usar `@neondatabase/serverless` que gerencia um pool de conexões HTTP.

```js
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,                // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000
});
```

### Migrations — Como as tabelas nascem

Diferente de frameworks como Prisma ou Django que têm sistema de migrations, aqui as tabelas são criadas **dentro do próprio código**, no `database.js:26-99`:

```js
async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS financeiro (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES usuarios(id),
      descricao VARCHAR(255),
      valor DECIMAL(12, 2),
      data DATE,
      entradaSaida VARCHAR(10),
      ...
    );
  `);
}
```

`CREATE TABLE IF NOT EXISTS` significa que rode quantas vezes quiser — se a tabela já existe, não faz nada. Isso é chamado de **migration inline** ou **auto-migration**.

---

## Deploy — Vercel

O Vercel é uma plataforma que faz deploy automático de frontends (static) e backends (serverless functions).

### Estrutura do deploy

```
Raiz do projeto (backend)
├── api/             ← Vira serverless functions
│   └── index.js     ← Vira https://api-site.vercel.app/api
├── public/          ← Static files (se houver)
├── vercel.json      ← Configuração
└── package.json

Frontend (projeto separado)
├── dist/            ← Build output (uploadado)
├── vercel.json
└── package.json
```

**`vercel.json` do backend:**
```json
{
  "version": 2,
  "builds": [{ "src": "api/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "api/index.js" }]
}
```

**`vercel.json` do frontend:**
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Serverless Functions

> [!info] Serverless = sua função só roda quando é chamada. Você não paga por idle.

Quando o Vercel recebe uma requisição em `https://gestor-financeiro-api-proj.vercel.app/api/listar`:
1. Ele executa `api/index.js` em um container temporário
2. O Express processa a rota `/api/listar`
3. Retorna a resposta
4. O container é destruído

**Implicações:**
- **Estado em memória não persiste** entre requisições (diferente de um servidor tradicional)
- A primeira requisição após um período sem uso é mais lenta (cold start)
- Conexões de banco precisam ser gerenciadas com pool (o Neon acorda o banco também)

### Variáveis de Ambiente

No Vercel, configuramos 15 variáveis de ambiente no dashboard:
- `DATABASE_URL` — conexão com Neon
- `JWT_SECRET` — chave para assinar tokens
- `SMTP_HOST/PORT/USER/PASS` — servidor de email
- `GOOGLE_CLIENT_ID/SECRET` — OAuth Google
- `GITHUB_CLIENT_ID/SECRET` — OAuth GitHub
- `VAPID_PUBLIC/PRIVATE_KEY` — push notifications
- `FRONTEND_URL` / `API_URL` — URLs do deploy

No código, acessamos com `process.env.NOME_DA_VARIAVEL`.

---

## Testes

### node --test

> [!info] Desde o Node 18, o Node.js tem um **test runner nativo** — não precisa de Jest, Mocha, ou outras bibliotecas.

```bash
npm test  # Roda: node --test api/**/*.test.js
```

```js
// api/services/__tests__/parseCSV.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('parseCSV', () => {
  it('should parse basic CSV', () => {
    const result = parseCSV('Tipo;Valor\nEntrada;100\nSaída;50');
    assert.strictEqual(result.length, 2);
  });
});
```

**O projeto tem 63 testes:**
- **31 unit tests** (auto-categorização, parse CSV/OFX, datas)
- **23 integration tests** (API completa com banco real)
- **9 frontend tests** (formatação de data/moeda/tipo)

**Integration tests** pulam se não houver `DATABASE_URL`:
```js
const describeDB = process.env.DATABASE_URL ? describe : describe.skip;
```

---

## CI/CD — GitHub Actions

**CI/CD** = Continuous Integration / Continuous Deployment.

```mermaid
graph LR
    A[git push main] --> B[GitHub Actions]
    B --> C[test-backend]
    B --> D[test-frontend]
    C --> E[Deploy backend Vercel]
    D --> F[Deploy frontend Vercel]
```

O workflow (`.github/workflows/test.yml`) tem 3 jobs paralelos:
1. **test-backend**: roda `npm test` no backend com banco real
2. **test-frontend**: roda `npm test` + `npm run build`
3. **deploy** (só na branch `main`): faz deploy automático no Vercel

---

## Glossário — Termos Técnicos

| Termo | O que significa |
|---|---|
| **SPA** | Single Page Application — app que roda em uma única página HTML |
| **PWA** | Progressive Web App — site que funciona como app instalável |
| **JWT** | JSON Web Token — token assinado contendo dados do usuário |
| **TOTP** | Time-based One-Time Password — código de 6 dígitos que muda a cada 30s |
| **OAuth2** | Protocolo para login com terceiros (Google, GitHub) |
| **REST** | Estilo de API que usa verbos HTTP (GET, POST, PUT, DELETE) |
| **Middleware** | Função que processa uma requisição antes do handler final |
| **ESM** | ES Modules — sistema de módulos com `import`/`export` |
| **CommonJS** | Sistema de módulos do Node com `require()` |
| **Serverless** | Código que só executa quando chamado, sem servidor dedicado |
| **CORS** | Mecanismo de segurança do navegador para requisições entre domínios |
| **Migration** | Script que altera o schema do banco de dados |
| **Lazy Loading** | Carregar código apenas quando necessário |
| **Cold Start** | Latência na primeira execução de uma função serverless |
| **Pool** | Conjunto de conexões reutilizáveis (banco de dados) |
| **VAPID** | Protocolo para push notifications no browser |
| **chart.js tree-shaking** | Importar apenas os componentes do Chart.js que usamos (bar, doughnut, line) — reduz de 240KB para 90KB |

---

> [!tip] **Dica de estudo:** Abra o código enquanto lê este tutorial. No Obsidian, use `Ctrl+O` para navegar entre as notas do projeto. Tente seguir o fluxo de uma funcionalidade inteira (ex: categorias) desde o clique no frontend até o INSERT no banco.

---

## Para Aprender Mais

Cada tecnologia tem sua própria documentação. Aqui estão os links mais úteis:

- [Vite](https://vite.dev/guide/) — Dev server + build tool
- [Express](https://expressjs.com/) — Framework HTTP para Node.js
- [Neon](https://neon.tech/docs) — Serverless PostgreSQL
- [Vercel](https://vercel.com/docs) — Deploy platform
- [JWT](https://jwt.io/introduction) — Introdução a JSON Web Tokens
- [OAuth2](https://oauth.net/2/) — Protocolo de autorização
- [Chart.js](https://www.chartjs.org/docs/) — Gráficos no navegador
- [MDN Fetch API](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API) — Como fazer requisições HTTP no browser
- [Node.js test runner](https://nodejs.org/api/test.html) — Testes nativos no Node

---

*Criado em 28/05/2026 — Tutorial interativo do Gestor Financeiro*
