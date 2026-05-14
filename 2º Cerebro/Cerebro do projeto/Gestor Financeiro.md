---
title: 🧠 Gestor Financeiro - Segundo Cérebro
description: Documentação completa do projeto Gestor Financeiro
date: 2026-03-27
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
- **API:** https://financeiro-backend.vercel.app/api
- **Documentação:** https://financeiro-backend.vercel.app/api/docs
- **Status:** https://financeiro-backend.vercel.app/api/health
- **GitHub:** https://github.com/Henrique1601/Projeto-Financeiro

---

## ✅ Roadmap & Status

| Funcionalidade | Status | Prioridade |
| -------------- | :----: | :--------: |
| Autenticação JWT | ✅ | Alta |
| CRUD Transações | ✅ | Alta |
| Categorização Automática | ✅ | Alta |
| Modo Offline (PWA) | ✅ | Alta |
| Dashboard Responsivo | ✅ | Alta |
| Atalhos de Teclado | ✅ | Média |
| Importação OFX/CSV | ✅ | Média |
| Notificações Push | ✅ | Média |
| Login Social | ✅ | Baixa |
| Alteração de Senha | ✅ | Baixa |
| Gráficos e Relatórios | ✅ | Média |
| Exportação Multi-formato | ✅ | Média |

---

## ⚡ Stack Tecnológica

### Frontend
- **HTML5** + **CSS3** (mobile-first, tema claro/escuro)
- **JavaScript** Vanilla (ES6 Modules)
- **Chart.js** para gráficos
- **Toastify.js** para notificações
- **Font Awesome** para ícones
- **SheetJS + jsPDF + PapaParse** para exportação

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
│   │   │   └── financeiroService.js  # CRUD + parser OFX/CSV
│   │   ├── utils/
│   │   │   ├── queryHelpers.js       # getOne, run, getAll, withTransaction
│   │   │   └── validators.js         # Validação de inputs
│   │   └── docs/
│   │       └── index.html            # Documentação interativa
│   ├── lib/                          # Código legado
│   ├── .env
│   └── vercel.json
│
├── front-end/                        # SPA
│   ├── index.html                    # Dashboard principal
│   ├── css/
│   │   ├── modern.css                # Estilos principais + responsivo
│   │   └── Login.css                 # Estilos login + social
│   ├── js/
│   │   ├── config.js                 # API_BASE_URL
│   │   ├── api.js                    # Fetch wrapper
│   │   ├── auth.js                   # Gerenciamento de auth
│   │   ├── financeiro.js             # Lógica financeira
│   │   ├── events.js                 # Event listeners
│   │   ├── table.js                  # Tabela + paginação
│   │   ├── export.js                 # Exportar dados
│   │   ├── formatters.js             # Formatação moeda/data
│   │   ├── utils.js                  # Utilitários
│   │   ├── main.js                   # Init principal
│   │   ├── shortcuts.js              # Atalhos de teclado
│   │   └── notifications.js          # PWA + offline + notificações
│   ├── login/
│   │   ├── login.html
│   │   ├── login.js                  # Login + social
│   │   ├── register.js               # Registro
│   │   └── Esqueci a senha/
│   │       ├── Senha.html
│   │       ├── esqueci.js
│   │       └── esqueci.css
│   ├── extrato/
│   │   ├── extrato.html              # Página de extrato
│   │   └── extrato.js                # Lógica do extrato
│   ├── sw.js                         # Service Worker v2
│   ├── vercel.json
│   └── manifest.json
│
├── 2º Cerebro/
│   └── Cerebro do projeto/           # Obsidian vault
│       └── Gestor Financeiro.md
│
└── locally/                          # Versão local SQLite
```

---

## 🌐 API Endpoints

### 🔓 Públicos
```http
POST /api/register         # { nome, sobrenome, email, senha }
POST /api/login            # { email, senha }
POST /api/forgot-password  # { email }
POST /api/reset-password   # { email, code, senha }
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
| `Ctrl + N` | 📝 Novo lançamento |
| `Ctrl + S` | 💾 Salvar |
| `Ctrl + E` | 📤 Exportar (1=Excel/2=PDF/3=CSV) |
| `Ctrl + F` | 🔍 Focar busca |
| `Ctrl + D` | 🗑️ Deletar |
| `Esc` | ❌ Fechar modal |
| `Ctrl + ,` | ⚙️ Perfil |
| `F5` | 🔄 Atualizar |
| `+` / `-` | 📄 Próxima/Anterior página |
| `F1` / `?` | ❓ Ajuda |

> [!tip] Exportação interativa
> Ao pressionar `Ctrl+E`, aparece um menu temporário: digite `1` para Excel, `2` para PDF ou `3` para CSV.

---

## 📱 PWA & Offline

### Service Worker (`sw.js` v2)
```javascript
// Estratégias de cache:
// - STATIC_CACHE: assets estáticos (cache-first)
// - DATA_CACHE: requisições API (network-first)
// Indicador offline com sincronização automática
```

### Funcionamento Offline
1. **Instalação**: Assets estáticos são cacheados
2. **Modo offline**: Dados da última sessão ficam disponíveis
3. **Indicador**: Banner amarelo "Offline" aparece
4. **Reconexão**: Dados são sincronizados automaticamente

### Notificações Push
- Service Worker registrado para push
- Notificações para alertas financeiros
- Ações: "Abrir" e "Fechar"

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

# OAuth2 (opcional - login social)
GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GITHUB_CLIENT_ID=seu-github-client-id
GITHUB_CLIENT_SECRET=seu-github-client-secret
```

> [!warning] Configurar OAuth no Google Cloud
> 1. Criar projeto em https://console.cloud.google.com
> 2. Ativar Google+ API / People API
> 3. Criar credenciais OAuth → Authorized redirect URIs: `https://financeiro-backend.vercel.app/api/auth/google/callback`
> 4. Adicionar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Vercel

> [!warning] Configurar OAuth no GitHub
> 1. Settings → Developer settings → OAuth Apps → New OAuth App
> 2. Authorization callback URL: `https://financeiro-backend.vercel.app/api/auth/github/callback`
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
Linhas de código: ~5000+
Dependências: 15 (backend) + 5 CDN (frontend)
Banco: 3 tabelas
Endpoints API: 15
Telas: 4 (Login, Dashboard, Extrato, Esqueci Senha)
```

---

## 🔗 Notas Relacionadas

- [[Readme do Projeto]]
- [[API Documentation]]
- [[Service Worker Notes]]
- [[Ideias de Melhorias]]

---

> [!quote] Feito com ❤️ por [Henrique Bezerra](https://github.com/Henrique1601)
