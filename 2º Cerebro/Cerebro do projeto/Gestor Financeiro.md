---
title: 🧠 Gestor Financeiro - Segundo Cérebro
description: Documentação completa do projeto Gestor Financeiro
date: 2026-05-21
tags:
  - projeto
  - financeiro
  - fullstack
  - nodejs
  - vercel
  - pwa
aliases:
  - Gestor de Despesas
  - Financeiro Pessoal
  - Projeto Financeiro
  - Sistema Financeiro
cssclasses:
  - cards
  - clean-embeds
---

# 💰 Gestor Financeiro

> **Sistema completo de gerenciamento financeiro pessoal** com PWA, suporte offline, categorização automática e login social.

- **Frontend:** https://projeto-financeiro-frontend.vercel.app  
  (Vite SPA — ver [[Refatoração Frontend V2]])
- **API:** https://projeto-financeiro-vert.vercel.app/api
- **Documentação:** https://projeto-financeiro-vert.vercel.app/api/docs
- **Status:** https://projeto-financeiro-vert.vercel.app/api/health
- **GitHub:** https://github.com/Henrique1601/Projeto-Financeiro

---

## ✅ Roadmap & Status

| Funcionalidade                                             | Status | Prioridade |
| ---------------------------------------------------------- | :----: | :--------: |
| Autenticação JWT                                           |   ✅    |    Alta    |
| CRUD Transações                                            |   ✅    |    Alta    |
| Categorização Automática                                   |   ✅    |    Alta    |
| Modo Offline (PWA)                                         |   ✅    |    Alta    |
| Dashboard Responsivo                                       |   ✅    |    Alta    |
| Dashboard Avançado (gráficos, comparativo, meta, projeção) |   ✅    |    Alta    |
| Filtros (descrição, tipo, categoria, pagamento, período)   |   ✅    |    Alta    |
| Ordenação por colunas + Paginação                          |   ✅    |    Alta    |
| Bulk Select + Deletar em Massa                             |   ✅    |    Alta    |
| Temas (Dark, Dracula, Nord, Claro)                         |   ✅    |    Alta    |
| Importação OFX/CSV                                         |   ✅    |   Média    |
| Exportação CSV/JSON/PDF (período + filtros)                |   ✅    |   Média    |
| Duplicar Transação                                         |   ✅    |   Média    |
| Observações + Método Pagamento                             |   ✅    |   Média    |
| Sistema de Tipo (Entrada/Saída) por sinal do valor          |   ✅    |    Alta    |
| Importação CSV refatorada (Tipo, BOM, quotes, quebras)      |   ✅    |   Média    |
| Atalhos de Teclado (Ctrl+N/S/F/H/E/T/Esc)                  |   ✅    |   Média    |
| Login Social (Google, GitHub)                              |   ✅    |   Baixa    |
| Esqueci/Resetar Senha (com email)                          |   ✅    |   Baixa    |
| Alterar Senha (logado)                                     |   ✅    |   Baixa    |
| Página de Perfil                                           |   ✅    |   Baixa    |
| Notificações Push                                          |   ✅    |   Média    |
| Excel (.xlsx)                                              |   ❌    |   Baixa    |
| Transações Recorrentes                                     |   ❌    |    Alta    |

---

## ⚡ Stack Tecnológica

### Frontend
- **Vite 6** (bundler, ES Modules, HMR)
- **JavaScript** Vanilla (SPA com hash routing)
- **Chart.js** para gráficos
- **Toastify.js** para notificações
- **Font Awesome** para ícones

### Backend
- **Node.js** + **Express**
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **pg** para PostgreSQL
- **helmet + cors + rate-limit**

### Database
- **PostgreSQL** (Neon Serverless)
- **Tabelas:** `usuarios`, `financeiro`, `password_resets`

### Deploy
- **Vercel** (funções serverless + static)
- **Neon** (banco serverless)

---

## 📁 Estrutura do Projeto

```bash
postgre/
├── backend/                          # API REST
│   ├── api/
│   │   ├── index.js                  # Express app
│   │   ├── config/
│   │   │   ├── database.js           # Pool pg + init tabelas
│   │   │   └── jwt.js                # Config JWT
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, social, change-password
│   │   │   └── financeiroController.js # CRUD + importação
│   │   ├── middleware/
│   │   │   └── auth.js               # Verify JWT
│   │   ├── routes/
│   │   │   └── index.js              # Todas as rotas
│   │   ├── services/
│   │   │   ├── authService.js        # Lógica de auth + auto-categorize
│   │   │   ├── financeiroService.js  # CRUD + parser OFX/CSV
│   │   │   ├── emailService.js       # Nodemailer SMTP + fallback dev
│   │   │   └── notificationService.js # Push subscription CRUD
│   │   ├── utils/
│   │   │   ├── queryHelpers.js       # getOne, run, getAll, withTransaction
│   │   │   └── validators.js         # Validação de inputs
│   │   └── docs/
│   │       └── index.html            # Documentação interativa
│   ├── lib/                          # Código legado
│   ├── .env
│   └── vercel.json
│
├── front-end/                        # SPA (Vite)
│   ├── index.html                    # Entry point único
│   ├── package.json                  # Vite + Chart.js + Toastify
│   ├── vite.config.js
│   ├── vercel.json
│   ├── public/
│   │   ├── sw.js                     # Service Worker v3
│   │   └── manifest.json
│   ├── src/
│   │   ├── main.js                   # App init + router + lazy loading
│   │   ├── config.js                 # API_BASE_URL (centralizado)
│   │   ├── api.js                    # Fetch + retry + refresh automático
│   │   ├── auth.js                   # Login, register, social, reset
│   │   ├── store.js                  # Estado reativo
│   │   ├── router.js                 # Hash-based SPA router
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js    # ~1131 linhas
│   │   │   ├── ExtratoPage.js
│   │   │   ├── CallbackPage.js
│   │   │   ├── ForgotPasswordPage.js
│   │   │   ├── ResetPasswordPage.js
│   │   │   ├── ChangePasswordPage.js
│   │   │   └── ProfilePage.js
│   │   ├── utils/
│   │   │   ├── dom.js                # Toast, Spinner
│   │   │   └── format.js             # Data, Moeda, Tipo
│   │   ├── theme.js              # │   │   ├── theme.js              # Gerenciador de temas
│   │   └── styles/
│   │       ├── variables.css
│   │       ├── global.css
│   │       ├── login.css
│   │       ├── dashboard.css
│   │       └── extrato.css
│   └── imgs/                         # Ícones
│
├── 2º Cerebro/
│   └── Cerebro do projeto/           # Obsidian vault
│       ├── Gestor Financeiro.md
│       ├── Bug Fixes.md
│       ├── Refatoração Frontend V2.md
│       ├── API Documentation.md
│       ├── Readme do Projeto.md
│       ├── Ideias de Melhorias.md
│       ├── Service Worker Notes.md
│       └── README Gap Analysis.md
│
├── AGENTS.md                         # Instruções para OpenCode
│
└── (legacy files a serem removidos: js/, css/, login/, extrato/, extrato.html, extrato.js, sw.js, manifest.json, imgs/img/)
```

---

## 🌐 API Endpoints

### 🔓 Públicos
```http
POST /api/register         # { nome, sobrenome, email, senha }
POST /api/login            # { email, senha }
POST /api/forgot-password  # { email } → envia código de 6 dígitos por email (SMTP) ou exibe na tela (dev)
POST /api/reset-password   # { email, code, senha } → 3 mensagens de erro distintas
GET  /api/health           # Status + versão
GET  /api/docs             # Documentação HTML
```

### 🔒 Autenticados (Header: `Authorization: Bearer <token>`)

#### Perfil
```http
GET  /api/profile          # Dados do usuário
PUT  /api/profile          # { nome, sobrenome }
PUT  /api/change-password  # { senhaAtual, novaSenha }
POST /api/refresh-token    # Renovar JWT
```

### 🔐 OAuth2 (Login Social)
```http
GET  /api/auth/google                  # Iniciar login Google (popup)
GET  /api/auth/google/callback         # Callback Google → redirect para callback.html?token=
GET  /api/auth/github                  # Iniciar login GitHub (popup)
GET  /api/auth/github/callback         # Callback GitHub → redirect para callback.html?token=
GET  /api/auth/failure                 # Falha na autenticação
```

> [!info] Fluxo OAuth2
> 1. Usuário clica "Entrar com Google" → abre popup para `/api/auth/google`
> 2. Backend redireciona para tela de consentimento do Google
> 3. Google redireciona de volta para `/api/auth/google/callback`
> 4. Passport verifica token, cria/loga usuário, gera JWT
> 5. Backend redireciona para `/login/callback.html?token=<jwt>`
> 6. `callback.html` extrai token, envia via `postMessage` para a janela pai (popup opener), fecha popup
> 7. Login.js recebe mensagem, salva token, redireciona para dashboard

#### Transações
```http
POST   /api/salvar         # Criar lançamento
GET    /api/listar         # Listar (com filtros via query)
PUT    /api/editar         # { updates: [...] }
DELETE /api/deletar        # { id } ou { ids: [...] }
POST   /api/importar       # { lancamentos: [...] }
POST   /api/importar/auto  # { fileType: "ofx"|"csv", content: "..." }
```

> [!tip] Importação Automática
> Aceita arquivos OFX (formato bancário), CSV e JSON.
> A categorização é feita automaticamente pelo sistema de palavras-chave.

---

## 🗄️ Banco de Dados

### `usuarios`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `SERIAL PK` | ID único |
| nome | `TEXT` | Primeiro nome |
| sobrenome | `TEXT` | Sobrenome |
| email | `TEXT UNIQUE` | Email |
| senha | `TEXT?` | Hash bcrypt (null para login social) |
| social_id | `TEXT?` | ID do provedor OAuth |
| provider | `TEXT?` | "google" ou "github" |
| foto | `TEXT?` | URL da foto do perfil |
| primeiro_login | `BOOLEAN` | Flag de primeiro login |
| created_at | `TIMESTAMP` | Data de criação |

### `financeiro`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `SERIAL PK` | ID único |
| user_id | `INT FK` | FK → usuarios(id) CASCADE |
| data | `DATE` | Data do lançamento |
| descricao | `TEXT` | Descrição |
| valor | `NUMERIC` | Valor absoluto |
| entradaSaida | `TEXT` | "Entrada" ou "Saída" |
| categoria | `TEXT` | Categoria (auto ou manual) |
| metodoPagamento | `TEXT` | Método de pagamento |
| observacoes | `TEXT` | Observações |

### `password_resets`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `SERIAL PK` | ID único |
| user_id | `INT FK UNIQUE` | FK → usuarios(id) |
| email | `TEXT` | Email |
| code | `TEXT` | Código 6 dígitos |
| expires_at | `TIMESTAMP` | Expira em 15min |

---

## 🤖 Categorização Automática

O sistema usa um dicionário de **>100 palavras-chave** em 10 categorias:

| Categoria | Palavras-chave |
|-----------|----------------|
| **Alimentação** | `supermercado`, `mercado`, `restaurante`, `ifood`, `rappi`, `padaria`, `feira`, `pizza`, `lanche`, `bar` |
| **Transporte** | `uber`, `99`, `gasolina`, `posto`, `metrô`, `ônibus`, `estacionamento`, `pedágio` |
| **Lazer** | `netflix`, `spotify`, `cinema`, `academia`, `jogo`, `steam`, `show`, `teatro` |
| **Saúde** | `farmácia`, `médico`, `hospital`, `dentista`, `remédio`, `exame`, `plano de saúde` |
| **Educação** | `escola`, `curso`, `faculdade`, `livro`, `aula`, `professor` |
| **Moradia** | `aluguel`, `condomínio`, `luz`, `água`, `gás`, `internet`, `iptu` |
| **Salário** | `salário`, `pagamento`, `freelance`, `bônus`, `proventos` |
| **Investimento** | `poupança`, `cdb`, `bitcoin`, `ação`, `tesouro`, `fundo` |
| **Serviços** | `assinatura`, `net`, `vivo`, `claro`, `amazon` |
| **Outros** | Fallback padrão |

> [!example] Como funciona
> Se o usuário lança "Uber para o aeroporto", o sistema detecta `uber` e automaticamente categoriza como **Transporte**.

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Ctrl + H` | 🏠 Ir para Dashboard |
| `Ctrl + E` | 📋 Ir para Extrato |
| `Ctrl + T` | 🎨 Alternar tema |
| `Ctrl + N` | 📝 Nova transação (no dashboard) |
| `Ctrl + S` | 💾 Salvar formulário aberto |
| `Ctrl + F` | 🔍 Focar campo de busca |
| `Esc` | ❌ Fechar modal |

---

## 📱 PWA & Offline

### Service Worker (`sw.js` v3)
```javascript
// Estratégias de cache:
// - CACHE_NAME: assets estáticos (cache-first, apenas GET)
// - Indicador offline com banner amarelo
// - Dados cacheados via localStorage para leitura offline
```

### Funcionamento Offline
1. **Instalação**: Assets estáticos são cacheados
2. **Modo offline**: Lista de transações da última sessão via `localStorage`
3. **Indicador**: Banner amarelo aparece quando offiline
4. **Leitura offline**: Dashboard carrega dados do cache local

> [!warning] Escrita offline
> Ainda não implementada. Adicionar/editar/excluir requer conexão.

---

## 🔒 Segurança

```yaml
Senhas: bcrypt (salt rounds: 10)
Autenticação: JWT com expiração
Rate Limiting: 1000 req/15min por IP
Headers: Helmet.js
CORS: Origens específicas
SQL Injection: Parameterized queries
Trust Proxy: Habilitado para Vercel
```

---

## ⚙️ Setup & Deploy

### Variáveis de Ambiente
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=sua_chave_aqui
NODE_ENV=development
PORT=3000
FRONTEND_URL=https://seu-frontend.vercel.app
API_URL=http://localhost:3000                   # Usado para callbackURL do OAuth

# SMTP (opcional - envio de email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua-senha-de-app

# Push Notification (opcional - VAPID keys)
# Gerar com: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=BCxxxxx
VAPID_PRIVATE_KEY=yyyyy
VAPID_SUBJECT=mailto:seuemail@example.com

# OAuth2 (opcional - login social)
GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GITHUB_CLIENT_ID=seu-github-client-id
GITHUB_CLIENT_SECRET=seu-github-client-secret
```

> [!warning] Configurar OAuth no Google Cloud
> 1. Criar projeto em https://console.cloud.google.com
> 2. Ativar Google+ API / People API
> 3. Authorized redirect URIs: `https://projeto-financeiro-vert.vercel.app/api/auth/google/callback`
> 4. Adicionar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Vercel

> [!warning] Configurar OAuth no GitHub
> 1. Settings → Developer settings → OAuth Apps → New OAuth App
> 2. Authorization callback URL: `https://projeto-financeiro-vert.vercel.app/api/auth/github/callback`
> 3. Adicionar `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` no Vercel

### Deploy Backend (Vercel)
1. Importar projeto → selecionar `backend/`
2. Adicionar env vars no dashboard
3. Deploy automático

### Deploy Frontend (Vercel)
1. Importar projeto → selecionar `front-end/`
2. Deploy automático

---

## 🐛 Troubleshooting

> [!warning] Problemas Comuns

### `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
Adicionar `app.set('trust proxy', 1)` antes do rate-limit.

### CORS bloqueando requisições
Verificar se a origin do frontend está na lista `allowedOrigins` no `api/index.js`.

### CSS 404 no extrato
No Vercel (Linux), nomes de arquivo são case-sensitive. `extrato.css` ≠ `Extrato.css`.

### DATABASE_URL não reconhecida
Adicionar a env var no Vercel em **todas** as environments (Production, Preview, Development).

### Banco offline no Neon
Neon pode hibernar no plano gratuito. A primeira requisição pode demorar ~5s.

---

## 📈 Métricas do Projeto

```yaml
Arquivos: ~50
Linhas de código: ~7000+
Dependências: 15 (backend) + 3 npm (frontend)
Banco: 3 tabelas
Endpoints API: 17
Telas: 8 (Login, Dashboard, Extrato, Esqueci Senha, Reset, Alterar Senha, Callback, Perfil)
Estrutura: Vite SPA com hash routing + ES Modules
```

---

## 🔗 Notas Relacionadas

- [[Readme do Projeto]]
- [[API Documentation]]
- [[Service Worker Notes]]
- [[Ideias de Melhorias]]
- [[Refatoração Frontend V2]]

---

> [!quote] Feito com ❤️ por [Henrique Bezerra](https://github.com/Henrique1601)
