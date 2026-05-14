---
title: Readme do Projeto
description: Visão geral, arquitetura, setup e deploy do Gestor Financeiro
date: 2026-03-27
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

> **Gestor Financeiro** — Sistema completo de gerenciamento financeiro pessoal com PWA, suporte offline, categorização automática e login social.

---

## Stack

```mermaid
graph LR
    F[Frontend<br/>HTML + CSS + JS] -->|HTTP| B[Backend<br/>Node + Express]
    B -->|SQL| D[(PostgreSQL<br/>Neon)]
    F --> SW[Service Worker<br/>Cache + Push]
    B --> O[OAuth2<br/>Google + GitHub]
```

| Camada | Tecnologia | Deploy |
|--------|-----------|--------|
| Frontend | HTML5, CSS3, JS Vanilla, Chart.js, Toastify | Vercel (static) |
| Backend | Node.js, Express, JWT, bcrypt, Passport.js | Vercel (serverless) |
| Database | PostgreSQL (Neon Serverless) | Neon |
| PWA | Service Worker (v2), Cache API, Push API | Vercel |
| Auth | JWT + OAuth2 (Google/GitHub) | Vercel env vars |

---

## Estrutura

```bash
postgre/
├── backend/                    # API REST (serverless)
│   ├── api/
│   │   ├── index.js            # Express app (trust proxy, CORS, rate-limit)
│   │   ├── config/
│   │   │   ├── database.js     # Pool pg + init tabelas
│   │   │   └── jwt.js          # Config JWT
│   │   ├── controllers/        # authController, financeiroController
│   │   ├── middleware/auth.js  # Verify JWT
│   │   ├── routes/index.js     # Todas as rotas + OAuth
│   │   ├── services/           # authService, financeiroService, passportConfig
│   │   ├── utils/              # queryHelpers, validators
│   │   └── docs/index.html     # Documentação interativa
│   ├── .env
│   └── vercel.json
│
├── front-end/                  # SPA (static)
│   ├── index.html              # Dashboard principal
│   ├── login/                  # login.html, register.js, callback.html
│   ├── extrato/                # extrato.html + extrato.js
│   ├── css/                    # modern.css, Login.css, Extrato.css
│   ├── js/                     # config, api, auth, financeiro, events, table, ...
│   ├── sw.js                   # Service Worker v2
│   ├── manifest.json
│   └── vercel.json
│
├── 2º Cerebro/                 # Obsidian vault
│   └── Cerebro do projeto/
│       ├── Gestor Financeiro.md
│       ├── API Documentation.md
│       ├── Readme do Projeto.md
│       ├── Service Worker Notes.md
│       └── Ideias de Melhorias.md
│
└── locally/                    # Versão local SQLite (legacy)
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
# Servir com live-server ou similar
npx serve .             # http://localhost:5000
```

### `.env`

```env
DATABASE_URL=postgresql://user:pass@host:5432/financeiro?sslmode=require
JWT_SECRET=minha-chave-secreta-aqui
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5000
API_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## Deploy

### Backend (Vercel)

```bash
cd backend
vercel --prod
```

> [!warning] Env vars obrigatórias no Vercel
> `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `API_URL`  
> Adicionar em **Production, Preview e Development** environments.

### Frontend (Vercel)

```bash
cd front-end
vercel --prod
```

> [!tip] Domínios
> - Frontend: `https://projeto-financeiro-frontend.vercel.app`
> - Backend: `https://financeiro-backend.vercel.app`

---

## Banco de Dados

### Tabelas

```mermaid
erDiagram
    usuarios ||--o{ financeiro : "user_id"
    usuarios ||--o| password_resets : "user_id"
    usuarios {
        int id PK
        text nome
        text sobrenome
        text email UK
        text senha "bcrypt hash"
        text social_id "OAuth ID"
        text provider "google | github"
        text foto
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
    }
    password_resets {
        int id PK
        int user_id FK UK
        text email
        text code "6 dígitos"
        timestamp expires_at "15 min"
    }
```

---

## Variáveis de Ambiente (Vercel)

| Variável | Descrição | Obrigatória |
|----------|-----------|:-----------:|
| `DATABASE_URL` | Connection string PostgreSQL | ✅ |
| `JWT_SECRET` | Chave para assinar tokens JWT | ✅ |
| `FRONTEND_URL` | URL do frontend (CORS) | ✅ |
| `API_URL` | URL do backend (callbackURL OAuth) | ✅ |
| `GOOGLE_CLIENT_ID` | OAuth Client ID (Google) | ❌ |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret (Google) | ❌ |
| `GITHUB_CLIENT_ID` | OAuth Client ID (GitHub) | ❌ |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret (GitHub) | ❌ |

---

## Troubleshooting

> [!warning] `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
> Adicionar `app.set('trust proxy', 1)` **antes** do rate-limit.

> [!warning] CORS bloqueando
> Verificar se `FRONTEND_URL` está na lista `allowedOrigins` e se o CORS middleware manual permite OPTIONS.

> [!warning] CSS 404 (Linux case-sensitive)
> Vercel usa Linux. `Extrato.css` ≠ `extrato.css`. Nomes de arquivo devem corresponder exatamente.

> [!warning] Neon hibernando
> Plano gratuito do Neon pode hibernar. Primeira requisição após inatividade leva ~5s.

---

## Notas Relacionadas

- [[Gestor Financeiro]]
- [[API Documentation]]
- [[Service Worker Notes]]
- [[Ideias de Melhorias]]
