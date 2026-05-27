---
title: Readme do Projeto
description: Visão geral, arquitetura, setup e deploy do Gestor Financeiro
date: 2026-05-25
tags:
  - projeto
  - setup
  - deploy
  - arquitetura
aliases:
  - README
  - Sobre o Projeto
  - Como Rodar
cssclasses:
  - clean-embeds
---

# Readme do Projeto

> **Gestor Financeiro** — Sistema completo de gerenciamento financeiro pessoal com PWA, categorização automática, login social, transações recorrentes, orçamentos e CI/CD automático.

---

## Stack

```mermaid
graph LR
    F[Frontend<br/>Vite SPA + Vanilla JS] -->|HTTP| B[Backend<br/>Node + Express]
    B -->|SQL| D[(Neon PostgreSQL)]
    B --> P[Push Notifications<br/>web-push]
    B --> E[Email SMTP<br/>Nodemailer]
    F --> SW[Service Worker<br/>Cache + Push]
    B --> O[OAuth2<br/>Google + GitHub]
```

| Camada | Tecnologia | Deploy |
|--------|-----------|--------|
| Frontend | Vite 6, Vanilla JS ES Modules, Chart.js | Vercel (static) |
| Backend | Node.js, Express, JWT, bcrypt, Passport.js | Vercel (serverless) |
| Database | PostgreSQL (Neon Serverless) | Neon |
| PWA | Service Worker v3, Cache API, web-push | Vercel |
| Auth | JWT + OAuth2 (Google/GitHub) | Vercel env vars |
| CI/CD | GitHub Actions | test → build → deploy |

---

## URLs de Produção

| Serviço | URL |
|---------|-----|
| Frontend | https://gestor-financeiro-proj.vercel.app |
| Backend | https://gestor-financeiro-api-proj.vercel.app |
| API Health | https://gestor-financeiro-api-proj.vercel.app/api/health |
| Docs | https://gestor-financeiro-api-proj.vercel.app/api/docs |

---

## Estrutura

```bash
postgre/
├── backend/                    # API REST (serverless)
│   ├── api/
│   │   ├── index.js            # Express app
│   │   ├── config/
│   │   │   ├── database.js     # Pool pg + init tabelas (6 tabelas)
│   │   │   └── jwt.js          # Config JWT
│   │   ├── controllers/        # auth, financeiro, orcamento
│   │   ├── middleware/auth.js  # Verify JWT
│   │   ├── routes/index.js     # Todas as rotas + OAuth
│   │   ├── services/           # auth, financeiro, email, notification, recorrente, passport
│   │   ├── tests/              # 31 unit + 23 integração
│   │   └── docs/index.html     # Documentação interativa
│   ├── .env
│   └── vercel.json
│
├── front-end/                  # Vite 6 SPA
│   ├── index.html              # Entry point
│   ├── src/
│   │   ├── main.js             # App init + router + keyboard shortcuts
│   │   ├── config.js           # API_BASE_URL (env-aware)
│   │   ├── api.js              # Fetch centralizado + retry + refresh
│   │   ├── auth.js             # Login, register, social, reset
│   │   ├── router.js           # Hash-based SPA router
│   │   ├── store.js            # Reactive store
│   │   ├── theme.js            # 7 temas + apply + localStorage + sync backend
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js    # ~1131 linhas
│   │   │   ├── ExtratoPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── RecorrentesPage.js
│   │   │   ├── CallbackPage.js
│   │   │   ├── ForgotPasswordPage.js
│   │   │   ├── ResetPasswordPage.js
│   │   │   └── ChangePasswordPage.js
│   │   ├── utils/
│   │   │   ├── dom.js          # Toast, Spinner, empty states, skeletons
│   │   │   ├── format.js       # Data, Moeda, Tipo
│   │   │   └── chartSetup.js   # Chart.js tree-shaked
│   │   └── styles/
│   │       ├── variables.css   # 7 temas (dark, dracula, nord, tokyo, gruvbox, rose-pine, light)
│   │       ├── global.css      # Animações, skeletons, item-enter, page-enter
│   │       ├── login.css
│   │       ├── dashboard.css   # + sort, pagination, checkbox, recorrentes, orçamentos
│   │       └── extrato.css
│   ├── public/
│   │   ├── sw.js               # Service Worker v3
│   │   └── manifest.json
│   ├── package.json
│   └── vercel.json
│
├── 2º Cerebro/                 # Obsidian vault
├── .github/workflows/test.yml  # CI/CD pipeline
├── AGENTS.md                   # OpenCode instructions
└── (legacy files a serem removidos)
```

---

## Setup Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL local (ou conta Neon gratuita)
- (Opcional) Google OAuth Client ID + GitHub OAuth App

### Passos

```bash
# 1. Clonar
git clone https://github.com/Henrique1601/Projeto-Financeiro
cd Projeto-Financeiro/postgre

# 2. Backend
cd backend
cp .env.example .env    # Configurar DATABASE_URL e JWT_SECRET
npm install
npm run dev             # http://localhost:3000

# 3. Frontend (em outro terminal)
cd front-end
npm install
npm run dev             # http://localhost:5173
```

### `.env`

```env
DATABASE_URL=postgresql://user:pass@host:5432/financeiro?sslmode=require
JWT_SECRET=minha-chave-secreta-aqui
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000

# OAuth2 (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# SMTP (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Push (opcional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:seuemail@example.com
```

---

## Testes

```bash
# Backend (54 testes)
cd backend && npm test

# Frontend
cd front-end && npm test

# E2E Playwright
npm run test:e2e
```

---

## CI/CD (GitHub Actions)

O workflow em `.github/workflows/test.yml`:

1. **test-backend**: `npm test` (54 testes, 31 unit + 23 integração)
2. **test-frontend**: `npm test` + `vite build`
3. **deploy** (só na main): deploy Vercel automático

### Secrets no GitHub

| Secret | Valor |
|--------|-------|
| `VERCEL_TOKEN` | Token Vercel |
| `VERCEL_ORG_ID` | `team_wLbnbFbcsPoVrsUH0ha0Hhv2` |
| `VERCEL_PROJECT_ID_BACKEND` | `prj_HVlKrN2J7tVfvGF0o71ZHpLrWHso` |
| `VERCEL_PROJECT_ID_FRONTEND` | `prj_03Ubrvp96UsDmupRfqESi07KgKX6` |
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | JWT signing key |

---

## Deploy

### Backend (Vercel)
```bash
cd backend
vercel --prod
```

### Frontend (Vercel)
```bash
cd front-end
vercel --prod
```

---

## Banco de Dados

### Tabelas (6)

```mermaid
erDiagram
    usuarios ||--o{ financeiro : "user_id"
    usuarios ||--o| password_resets : "user_id"
    usuarios ||--o{ recorrentes : "user_id"
    usuarios ||--o{ orcamentos : "user_id"
    usuarios ||--o{ push_subscriptions : "user_id"

    usuarios {
        int id PK
        text nome
        text sobrenome
        text email UK
        text senha "bcrypt hash"
        text social_id "OAuth ID"
        text provider "google | github"
        text foto
        text theme
        boolean primeiro_login
        timestamp created_at
    }
    financeiro {
        int id PK
        int user_id FK
        date data
        text descricao
        numeric valor
        text entradaSaida "Entrada | Saída"
        text categoria
        text metodoPagamento
        text observacoes
        timestamp created_at
    }
    password_resets {
        int id PK
        int user_id FK UK
        text email
        text code "6 dígitos"
        timestamp expires_at "15 min"
    }
    recorrentes {
        int id PK
        int user_id FK
        text descricao
        numeric valor
        text categoria
        text frequencia "semanal | quinzenal | mensal | anual"
        int dia_vencimento
        text metodoPagamento
        text observacoes
        date data_fim
        int max_ocorrencias
        boolean ativo
        date proxima_data
        timestamp created_at
    }
    orcamentos {
        int id PK
        int user_id FK
        text categoria
        numeric limite
        text mes
        timestamp created_at
    }
    push_subscriptions {
        int id PK
        int user_id FK
        text endpoint
        jsonb keys
        timestamp created_at
    }
```

---

## Variáveis de Ambiente (Vercel)

| Variável | Descrição | Obrigatória |
|----------|-----------|:-----------:|
| `DATABASE_URL` | Connection string Neon | ✅ |
| `JWT_SECRET` | Chave para assinar tokens JWT | ✅ |
| `FRONTEND_URL` | URL do frontend (CORS) | ✅ |
| `API_URL` | URL do backend (callbackURL OAuth) | ✅ |
| `GOOGLE_CLIENT_ID` | OAuth Client ID (Google) | ❌ |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret (Google) | ❌ |
| `GITHUB_CLIENT_ID` | OAuth Client ID (GitHub) | ❌ |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret (GitHub) | ❌ |
| `SMTP_HOST` | Servidor SMTP | ❌ |
| `SMTP_PORT` | Porta SMTP (587) | ❌ |
| `SMTP_USER` | Email do remetente | ❌ |
| `SMTP_PASS` | Senha de app do email | ❌ |
| `VAPID_PUBLIC_KEY` | Chave pública VAPID (push) | ❌ |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID (push) | ❌ |
| `VAPID_SUBJECT` | `mailto:seuemail@example.com` | ❌ |

---

## Troubleshooting

> [!warning] `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
> Adicionar `app.set('trust proxy', 1)` **antes** do rate-limit.

> [!warning] CORS bloqueando
> Verificar se `FRONTEND_URL` está na lista `allowedOrigins` e se o CORS middleware manual permite OPTIONS.

> [!warning] Neon hibernando
> Primeira requisição após inatividade leva ~5s.

> [!warning] DB connection timeout
> Se `DATABASE_URL` é válida mas timeout, pode ser firewall/porta bloqueada.

---

## Notas Relacionadas

- [[Gestor Financeiro]]
- [[API Documentation]]
- [[Service Worker Notes]]
- [[Ideias de Melhorias]]
- [[Bug Fixes]]
