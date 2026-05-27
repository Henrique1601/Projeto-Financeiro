---
title: 🧠 Gestor Financeiro - Segundo Cérebro
description: Documentação completa do projeto Gestor Financeiro
date: 2026-05-25
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

> **Sistema completo de gerenciamento financeiro pessoal** com PWA, categorização automática, login social, transações recorrentes, orçamentos por categoria e CI/CD automático.

- **Frontend:** https://gestor-financeiro-proj.vercel.app  
  (Vite SPA — ver [[Refatoração Frontend V2]])
- **API:** https://gestor-financeiro-api-proj.vercel.app/api
- **Documentação:** https://gestor-financeiro-api-proj.vercel.app/api/docs
- **Status:** https://gestor-financeiro-api-proj.vercel.app/api/health
- **GitHub:** https://github.com/Henrique1601/Projeto-Financeiro

---

## ✅ Roadmap & Status

| Funcionalidade | Status | Prioridade |
|---|---|---|
| Autenticação JWT + refresh token | ✅ | Alta |
| CRUD Transações | ✅ | Alta |
| Categorização Automática (100+ palavras) | ✅ | Alta |
| Modo Offline (PWA) | ✅ | Alta |
| Dashboard Responsivo | ✅ | Alta |
| Dashboard Avançado (gráficos, comparativo, meta, projeção) | ✅ | Alta |
| Filtros (descrição, tipo, categoria, pagamento, período) | ✅ | Alta |
| Filtros sincronizados com URL (hash params) | ✅ | Alta |
| Ordenação por colunas + Paginação (10/20/50/100) | ✅ | Alta |
| Bulk Select + Deletar em Massa | ✅ | Alta |
| Transações Recorrentes (CRUD + geração automática) | ✅ | Alta |
| Orçamentos por Categoria (limites + alertas push) | ✅ | Alta |
| 7 Temas (Dark, Dracula, Nord, Tokyo Night, Gruvbox, Rose Pine, Claro) | ✅ | Alta |
| Importação OFX/CSV/JSON (BOM, quotes, separador auto, duplicatas) | ✅ | Média |
| Exportação CSV/JSON/PDF (período + filtros + tema) | ✅ | Média |
| Duplicar Transação | ✅ | Média |
| Observações + Método Pagamento | ✅ | Média |
| Sistema de Tipo (Entrada/Saída) por sinal do valor | ✅ | Alta |
| Skeleton Loading (shimmer) nos gráficos e dashboard | ✅ | Média |
| Staggered Reveal Animation (cards, tabela, insights) | ✅ | Média |
| Page Transitions (fade + translateY) | ✅ | Média |
| Empty States Ilustrados (SVG) | ✅ | Média |
| Testes Unitários (31) + Integração (23) | ✅ | Alta |
| Testes E2E Playwright (7) | ✅ | Alta |
| CI/CD GitHub Actions (test → build → deploy) | ✅ | Alta |
| Login Social (Google, GitHub) — fluxo redirect | ✅ | Baixa |
| Esqueci/Resetar Senha (com email SMTP ou dev mode) | ✅ | Baixa |
| Alterar Senha (logado) | ✅ | Baixa |
| Página de Perfil (nome, foto, tema, push toggle) | ✅ | Baixa |
| Notificações Push (recorrentes + orçamentos) | ✅ | Média |
| Tema sincronizado com backend | ✅ | Média |
| Chart.js Tree-shaking (~150KB economia) | ✅ | Média |
| Login page com formas geométricas animadas | ✅ | Baixa |
| Excel (.xlsx) | ❌ | Baixa |
| Assistente Financeiro com IA | ❌ | Baixa |
| Autenticação 2FA | ❌ | Média |
| vite-plugin-pwa (Workbox) | ❌ | Média |
| Migrar Express 4 → Express 5 | ❌ | Baixa |

---

## ⚡ Stack Tecnológica

### Frontend
- **Vite 6** (bundler, ES Modules, HMR)
- **JavaScript** Vanilla (SPA com hash routing)
- **Chart.js** (tree-shaked: ~90KB)
- **Toastify.js** para notificações
- **Font Awesome 6** para ícones

### Backend
- **Node.js** + **Express** (CommonJS)
- **JWT** para autenticação + refresh token
- **bcrypt** para hash de senhas
- **pg** para PostgreSQL (Neon serverless)
- **Passport.js** para OAuth (Google + GitHub)
- **helmet + cors + rate-limit**
- **Nodemailer** para envio de email
- **web-push** para notificações push

### Database
- **PostgreSQL** (Neon Serverless)
- **Tabelas:** `usuarios`, `financeiro`, `password_resets`, `recorrentes`, `orcamentos`, `push_subscriptions`

### Deploy & CI/CD
- **Vercel** (funções serverless + static)
- **GitHub Actions** (test → build → deploy)
- **Node --test** (test runner nativo)
- **Playwright** (testes E2E)

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
│   │   │   ├── financeiroController.js # CRUD + importação
│   │   │   └── orcamentoController.js  # Orçamentos CRUD + verificar
│   │   ├── middleware/
│   │   │   └── auth.js               # Verify JWT
│   │   ├── routes/
│   │   │   └── index.js              # Todas as rotas
│   │   ├── services/
│   │   │   ├── authService.js        # Lógica de auth + auto-categorize
│   │   │   ├── financeiroService.js  # CRUD + parser OFX/CSV + recorrentes hook
│   │   │   ├── emailService.js       # Nodemailer SMTP + fallback dev
│   │   │   ├── notificationService.js # Push subscription CRUD
│   │   │   ├── recorrenteService.js  # Transações recorrentes
│   │   │   └── passportConfig.js     # OAuth Google/GitHub
│   │   ├── utils/
│   │   │   ├── queryHelpers.js       # getOne, run, getAll, withTransaction
│   │   │   └── validators.js         # Validação de inputs
│   │   ├── tests/
│   │   │   ├── integration.test.js   # 23 testes integração
│   │   │   └── __tests__/           # 31 testes unitários
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
│   │   ├── main.js                   # App init + router + lazy loading + shortcuts
│   │   ├── config.js                 # API_BASE_URL (centralizado, env-aware)
│   │   ├── api.js                    # Fetch + retry + refresh automático
│   │   ├── auth.js                   # Login, register, social, reset
│   │   ├── store.js                  # Estado reativo
│   │   ├── router.js                 # Hash-based SPA router
│   │   ├── theme.js                  # 7 temas + sync backend
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js    # ~1131 linhas
│   │   │   ├── ExtratoPage.js
│   │   │   ├── CallbackPage.js
│   │   │   ├── ForgotPasswordPage.js
│   │   │   ├── ResetPasswordPage.js
│   │   │   ├── ChangePasswordPage.js
│   │   │   ├── ProfilePage.js       # Perfil + tema + push toggle
│   │   │   └── RecorrentesPage.js   # Transações recorrentes
│   │   ├── utils/
│   │   │   ├── dom.js                # Toast, Spinner, empty states, skeletons
│   │   │   ├── format.js             # Data, Moeda, Tipo
│   │   │   └── chartSetup.js         # Chart.js tree-shaked init
│   │   └── styles/
│   │       ├── variables.css         # 7 temas
│   │       ├── global.css            # Animações, skeletons, globais
│   │       ├── login.css
│   │       ├── dashboard.css         # + sort, pagination, checkbox, recorrentes
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
├── .github/
│   └── workflows/
│       └── test.yml                  # CI/CD pipeline
│
└── (legacy files a serem removidos: js/, css/, login/, extrato/, extrato.html, extrato.js, sw.js, manifest.json, imgs/img/)
```

---

## 🌐 API Endpoints

### 🔓 Públicos
```http
POST /api/register         # { nome, sobrenome, email, senha }
POST /api/login            # { email, senha }
POST /api/forgot-password  # { email } → envia código de 6 dígitos
POST /api/reset-password   # { email, code, senha } → 3 mensagens de erro
GET  /api/health           # Status + versão
GET  /api/docs             # Documentação HTML
```

### 🔒 Autenticados (Header: `Authorization: Bearer <token>`)

#### Perfil
```http
GET  /api/profile             # Dados do usuário
PUT  /api/profile             # { nome, sobrenome, foto, theme }
POST /api/change-password     # { senhaAtual, novaSenha }
POST /api/refresh-token       # Renovar JWT
```

### 🔐 OAuth2 (Login Social)
```http
GET  /api/auth/google         # Iniciar login Google
GET  /api/auth/google/callback# Callback → redirect para #/callback?token=
GET  /api/auth/github         # Iniciar login GitHub
GET  /api/auth/github/callback# Callback → redirect para #/callback?token=
GET  /api/auth/failure        # Falha na autenticação
```

> [!info] Fluxo OAuth2
> 1. Usuário clica "Entrar com Google" → `window.location.href = '/api/auth/google'`
> 2. Backend redireciona para tela de consentimento do Google
> 3. Google redireciona de volta para callback
> 4. Passport verifica token, cria/loga usuário, gera JWT
> 5. Backend redireciona para `/#/callback?token=<jwt>`
> 6. CallbackPage.js lê token do hash, envia via postMessage para popup opener

#### Transações
```http
POST   /api/salvar         # Criar lançamento
GET    /api/listar         # Listar (com filtros via query)
PUT    /api/editar         # { updates: [...] }
DELETE /api/deletar?id=N   # Deletar (query param)
POST   /api/importar       # { lancamentos: [...] }
POST   /api/importar/auto  # { fileType: "ofx"|"csv", content: "..." }
```

#### Recorrentes
```http
POST   /api/recorrentes            # Criar recorrência
GET    /api/recorrentes            # Listar
PUT    /api/recorrentes/:id        # Atualizar
DELETE /api/recorrentes/:id        # Deletar
```

#### Orçamentos
```http
POST   /api/orcamentos             # Criar orçamento
GET    /api/orcamentos             # Listar
GET    /api/orcamentos/verificar   # Verificar alertas (>80%, >100%)
PUT    /api/orcamentos/:id         # Atualizar
DELETE /api/orcamentos/:id         # Deletar
```

#### Push Notifications
```http
POST   /api/push/subscribe         # Salvar subscription
GET    /api/push/vapid-public-key  # Chave pública VAPID
```

> [!tip] Importação Automática
> Aceita OFX, CSV (BOM, quotes, separador auto) e JSON.
> Categorização automática + detecção de duplicatas.

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
| theme | `TEXT?` | Tema salvo |
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
| created_at | `TIMESTAMP` | Data de criação |

### `recorrentes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `SERIAL PK` | ID único |
| user_id | `INT FK` | FK → usuarios(id) CASCADE |
| descricao | `TEXT` | Descrição |
| valor | `NUMERIC` | Valor |
| categoria | `TEXT` | Categoria |
| frequencia | `TEXT` | semanal, quinzenal, mensal, anual |
| dia_vencimento | `INT` | Dia do vencimento |
| metodoPagamento | `TEXT` | Método de pagamento |
| observacoes | `TEXT` | Observações |
| data_fim | `DATE?` | Data fim (opcional) |
| max_ocorrencias | `INT?` | Máx ocorrências (opcional) |
| ativo | `BOOLEAN` | Ativo/inativo |
| proxima_data | `DATE` | Próxima geração |
| created_at | `TIMESTAMP` | Data de criação |

### `orcamentos`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `SERIAL PK` | ID único |
| user_id | `INT FK` | FK → usuarios(id) CASCADE |
| categoria | `TEXT` | Categoria |
| limite | `NUMERIC` | Limite mensal |
| mes | `TEXT?` | Mês de referência |
| created_at | `TIMESTAMP` | Data de criação |

### `password_resets`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `SERIAL PK` | ID único |
| user_id | `INT FK UNIQUE` | FK → usuarios(id) |
| email | `TEXT` | Email |
| code | `TEXT` | Código 6 dígitos |
| expires_at | `TIMESTAMP` | Expira em 15min |

### `push_subscriptions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `SERIAL PK` | ID único |
| user_id | `INT FK` | FK → usuarios(id) CASCADE |
| endpoint | `TEXT` | Endpoint push |
| keys | `JSONB` | Chaves p256dh + auth |
| created_at | `TIMESTAMP` | Data de criação |

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
| `Ctrl + P` | 👤 Ir para Perfil |
| `Ctrl + R` | 🔁 Ir para Recorrentes |
| `Esc` | ❌ Fechar modal |

---

## 📱 PWA & Offline

### Service Worker (`sw.js` v3)
```javascript
// Estratégias de cache:
// GET /api/* → networkFirst com stale cache fallback
// GET same-origin estáticos → cacheFirst
// skipWaiting + claim na ativação
```

### Funcionamento Offline
1. **Instalação**: Assets estáticos são cacheados
2. **Modo offline**: Lista de transações da última sessão via `localStorage`
3. **Indicador**: Banner amarelo aparece quando offline
4. **Leitura offline**: Dashboard carrega dados do cache local
5. **Notificações push**: Recebe alertas mesmo com app fechado

### Checklist PWA
- [x] Manifest.json com ícones
- [x] Service Worker registrado
- [x] Cache de assets estáticos
- [x] Cache de dados (localStorage)
- [x] Indicador offline
- [x] Push notifications
- [ ] Escrita offline (adicionar/editar sem conexão)

---

## 🔒 Segurança

```yaml
Senhas: bcrypt (salt rounds: 10)
Autenticação: JWT com expiração (24h) + refresh token
Rate Limiting: 1000 req/15min por IP
Headers: Helmet.js
CORS: Origens específicas (manual)
SQL Injection: Parameterized queries
Trust Proxy: Habilitado para Vercel
OAuth2: Passport.js (Google + GitHub)
Push Auth: VAPID keys
```

---

## 🧪 Testes

```yaml
Total: 54 testes no backend + testes frontend + E2E
Backend unitários: 31 (autoCategorize 15, parseCSV 6, parseOFX 4, calcularProximaData 6)
Backend integração: 23 (health, auth 5, financeiro 6, recorrentes 3, orçamentos 3, profile 2, error handling 3)
Frontend: format.test.js (data, moeda, tipo)
E2E: 7 testes Playwright (register, login, dashboard, create, perfil, recorrentes, health)
```

## 🤖 CI/CD

O pipeline do GitHub Actions roda em todo push/PR:

1. **test-backend**: `npm test` (Node --test, 54 testes) com `DATABASE_URL` + `JWT_SECRET`
2. **test-frontend**: `npm test` + `vite build`
3. **deploy** (só main): `vercel deploy --prod` para ambos os projetos

---

## ⚙️ Setup & Deploy

### Variáveis de Ambiente
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=sua_chave_aqui
NODE_ENV=development
PORT=3000
FRONTEND_URL=https://gestor-financeiro-proj.vercel.app
API_URL=https://gestor-financeiro-api-proj.vercel.app

# SMTP (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua-senha-de-app

# Push Notification
VAPID_PUBLIC_KEY=BCxxxxx
VAPID_PRIVATE_KEY=yyyyy
VAPID_SUBJECT=mailto:seuemail@example.com

# OAuth2
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GITHUB_CLIENT_ID=seu-github-client-id
GITHUB_CLIENT_SECRET=seu-github-client-secret
```

---

## 📈 Métricas do Projeto

```yaml
Arquivos: ~60+
Linhas de código: ~9000+
Dependências: 18 (backend) + 5 npm (frontend)
Banco: 6 tabelas
Endpoints API: 25+
Telas: 10 (Login, Register, Dashboard, Extrato, Forgot, Reset, Change, Callback, Perfil, Recorrentes)
Testes: 54 backend + frontend + 7 E2E
```

---

## 🔗 Notas Relacionadas

- [[Readme do Projeto]]
- [[API Documentation]]
- [[Service Worker Notes]]
- [[Ideias de Melhorias]]
- [[Refatoração Frontend V2]]
- [[Bug Fixes]]

---

> [!quote] Feito com ❤️ por [Henrique Bezerra](https://github.com/Henrique1601)
