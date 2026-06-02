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

> **Sistema completo de gerenciamento financeiro pessoal** com PWA, categorização automática, login social, transações recorrentes, orçamentos por categoria, 2FA, dashboard customizável, metas por categoria, desafios de economia e CI/CD automático.

- **Frontend (prod):** https://gestor-financeiro-proj.vercel.app  
  (Vite SPA — ver [[Refatoração Frontend V2]])
- **Backend (prod):** https://gestor-financeiro-api-proj.vercel.app/api
- **Status:** https://gestor-financeiro-api-proj.vercel.app/api/health
- **GitHub:** https://github.com/Henrique1601/Projeto-Financeiro

---

## ✅ Roadmap & Status

| Funcionalidade                                                                         | Status | Prioridade |
| -------------------------------------------------------------------------------------- | ------ | ---------- |
| Autenticação JWT + refresh token                                                       | ✅      | Alta       |
| CRUD Transações                                                                        | ✅      | Alta       |
| Categorização Automática (100+ palavras)                                               | ✅      | Alta       |
| Modo Offline (PWA)                                                                     | ✅      | Alta       |
| Dashboard Responsivo                                                                   | ✅      | Alta       |
| Dashboard Avançado (gráficos, comparativo, meta, projeção)                             | ✅      | Alta       |
| Filtros (descrição, tipo, categoria, pagamento, período)                               | ✅      | Alta       |
| Filtros sincronizados com URL (hash params)                                            | ✅      | Alta       |
| Ordenação por colunas + Paginação (10/20/50/100)                                       | ✅      | Alta       |
| Bulk Select + Deletar em Massa                                                         | ✅      | Alta       |
| Transações Recorrentes (CRUD + geração automática)                                     | ✅      | Alta       |
| Orçamentos por Categoria (limites + alertas push)                                      | ✅      | Alta       |
| 8 Temas (Sistema, Dark, Dracula, Nord, Tokyo Night, Gruvbox, Rose Pine, Claro)         | ✅      | Alta       |
| Importação OFX/CSV/JSON (BOM, quotes, separador auto, duplicatas)                      | ✅      | Média      |
| Exportação CSV/JSON/PDF (período + filtros + tema)                                     | ✅      | Média      |
| Duplicar Transação                                                                     | ✅      | Média      |
| Observações + Método Pagamento                                                         | ✅      | Média      |
| Sistema de Tipo (Entrada/Saída) por sinal do valor                                     | ✅      | Alta       |
| Skeleton Loading (shimmer) nos gráficos e dashboard                                    | ✅      | Média      |
| Staggered Reveal Animation (cards, tabela, insights)                                   | ✅      | Média      |
| Page Transitions (fade + translateY)                                                   | ✅      | Média      |
| Empty States Ilustrados (SVG)                                                          | ✅      | Média      |
| Testes Unitários (31) + Integração (23)                                                | ✅      | Alta       |
| Testes E2E Playwright (7)                                                              | ✅      | Alta       |
| CI/CD GitHub Actions (test → build → deploy)                                           | ✅      | Alta       |
| Login Social (Google, GitHub) — fluxo redirect                                         | ✅      | Baixa      |
| Esqueci/Resetar Senha (com email SMTP ou dev mode)                                     | ✅      | Baixa      |
| Alterar Senha (logado)                                                                 | ✅      | Baixa      |
| Página de Perfil (nome, foto, tema, push toggle)                                       | ✅      | Baixa      |
| Notificações Push (recorrentes + orçamentos)                                           | ✅      | Média      |
| Tema "Sistema" (prefers-color-scheme) + listener ao vivo                               | ✅      | Média      |
| Tema sincronizado com backend                                                          | ✅      | Média      |
| Chart.js Tree-shaking (~150KB economia)                                                | ✅      | Média      |
| Login page com formas geométricas animadas                                             | ✅      | Baixa      |
| Autenticação 2FA (TOTP + Email + Backup Codes + Trust)                                 | ✅      | Alta       |
| Excel (.xlsx) export (CSV/JSON/PDF/Email)                                              | ✅      | Média      |
| Desfazer (Undo) após deletar (individual + bulk)                                       | ✅      | Média      |
| Tema Customizável (20 variáveis CSS, editor visual, CRUD, export/import JSON)          | ✅      | Média      |
| Dashboard Customizável (widget grid, drag, redimensionar, presets, export/import)      | ✅      | Alta       |
| Página Extrato (chart type selector, resumo anual, calcular faturamento)               | ✅      | Média      |
| Export Chart como PNG (Extrato)                                                        | ✅      | Baixa      |
| Export Email (.xlsx com período + filtros)                                             | ✅      | Baixa      |
| PDF com gráficos (opcional, base64 charts)                                             | ✅      | Baixa      |
| Meta de Economia (progress bar, localStorage)                                          | ✅      | Média      |
| Projeção de Saldo (média diária, fim do mês)                                           | ✅      | Média      |
| Orçamentos inline no dashboard (progress bars, cores)                                  | ✅      | Média      |
| Importar com preview dos dados (expandable JSON sample)                                | ✅      | Média      |
| Empty states (3 SVGs: chart, search, list)                                             | ✅      | Média      |
| Skeleton loading (shimmer: stats, charts, table)                                       | ✅      | Média      |
| Offline cache (localStorage, fica disponível sem conexão)                              | ✅      | Média      |
| Atalho Ctrl+T (próximo tema)                                                           | ✅      | Baixa      |
| Atalho Ctrl+S (submit form)                                                            | ✅      | Baixa      |
| Atalho Ctrl+F (focar busca descrição)                                                  | ✅      | Baixa      |
| Tema sincronizado com backend                                                          | ✅      | Média      |
| Sidebar collapsível + overlay hover-expand (Notion-like) + footer icon buttons 40×40px | ✅      | Alta       |
| Undo Delete com toast de 5s (individual + bulk)                                        | ✅      | Média      |
| TOTP nativo sem otplib (crypto built-in) — evitou ESM crash no Vercel                  | ✅      | Média      |
| Metas por Categoria (economizar por categoria, progress bars, widget)                  | ✅      | Média      |
| Desafios de Economia (streak tracking, milestones, push, Ctrl+D)                       | ✅      | Média      |
| Testes E2E Playwright (3 spec files, Chromium, CI)                                     | ✅      | Alta       |
| vite-plugin-pwa (Workbox, devOptions, CDN cache)                                       | ✅      | Média      |
| Assistente Financeiro com IA                                                           | ❌      | Baixa      |
| Receita Federal integração (import OFX bancário)                                       | ❌      | Baixa      |
| Compartilhamento familiar                                                              | ❌      | Baixa      |
| App nativo mobile                                                                      | ❌      | Baixa      |
| Multi-moeda                                                                            | ✅      | Baixa      |
| Categorias customizáveis pelo usuário                                                  | ✅      | Média      |
| Anexar comprovantes (fotos) aos lançamentos                                            | ✅      | Baixa      |
| Customizable keyboard shortcuts                                                        | ✅      | Baixa      |

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
- **Tabelas:** `usuarios`, `financeiro`, `password_resets`, `recorrentes`, `orcamentos`, `push_subscriptions`, `user_2fa`, `metas_categoria`, `desafios_economia`

### Deploy & CI/CD
- **Vercel** (funções serverless + static)
- **GitHub Actions** (test → build → deploy)
- **Node --test** (test runner nativo)
- **Playwright** (testes E2E — pendente, sem arquivos .spec.js nem playwright.config.js)

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
│   │   │   ├── authController.js     # Register, login, social, change-password, 2FA
│   │   │   ├── financeiroController.js # CRUD + importação + desfazer + export xlsx/email
│   │   │   ├── orcamentoController.js  # Orçamentos CRUD + verificar
│   │   │   ├── metaCategoriaController.js # Metas por Categoria CRUD
│   │   │   └── desafioController.js    # Desafios de Economia CRUD + verificar
│   │   ├── middleware/
│   │   │   └── auth.js               # Verify JWT
│   │   ├── routes/
│   │   │   └── index.js              # Todas as rotas (~39 endpoints)
│   │   ├── services/
│   │   │   ├── authService.js        # Lógica de auth + auto-categorize + dashboardConfig sync
│   │   │   ├── financeiroService.js  # CRUD + parser OFX/CSV/JSON + recorrentes hook + desfazer + xlsx
│   │   │   ├── emailService.js       # Nodemailer SMTP + fallback dev
│   │   │   ├── notificationService.js # Push subscription CRUD + sendToUser
│   │   │   ├── recorrenteService.js  # Transações recorrentes + gerarLançamentos
│   │   │   ├── twoFAService.js       # TOTP nativo (crypto), email code, backup codes, trust
│   │   │   ├── metaCategoriaService.js # Metas por Categoria + progresso
│   │   │   ├── desafioService.js     # Desafios de Economia + streak + milestones
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
│   │   ├── auth.js                   # Login, register, social, reset, 2FA
│   │   ├── store.js                  # Estado reativo
│   │   ├── router.js                 # Hash-based SPA router
│   │   ├── theme.js                  # 8 temas (+ "Sistema" com prefers-color-scheme) + custom themes (20 vars CSS, editor, export/import)
│   │   ├── dashboardConfig.js        # CRUD presets, sync backend, normalizeWidgets, export/import
│   │   ├── pages/
│   │   │   ├── LoginPage.js          # Com fluxo 2FA
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js    # ~1200 linhas + widget grid + presets + charts
│   │   │   ├── ExtratoPage.js
│   │   │   ├── CallbackPage.js
│   │   │   ├── ForgotPasswordPage.js
│   │   │   ├── ResetPasswordPage.js
│   │   │   ├── ChangePasswordPage.js
│   │   │   ├── ProfilePage.js       # Perfil + tema + push toggle + 2FA setup + custom themes
│   │   │   ├── RecorrentesPage.js   # Transações recorrentes + gerarLançamentos + push
│   │   │   └── DesafiosPage.js      # Desafios de Economia (card grid, streaks)
│   │   ├── utils/
│   │   │   ├── dom.js                # Toast (com undo), Spinner, empty states, skeletons
│   │   │   ├── format.js             # Data, Moeda, Tipo (isSaida/getTipo)
│   │   │   ├── sidebar.js            # Sidebar state: collapsed, compact, nav groups, sync
│   │   │   ├── theme.test.js         # Testes theme.js (14 testes)
│   │   │   ├── sidebar.test.js       # Testes sidebar.js (14 testes)
│   │   │   └── chartSetup.js         # Chart.js tree-shaked init (~90KB)
│   │   └── styles/
│   │       ├── variables.css         # 7 temas + custom theme CSS vars
│   │       ├── global.css            # Animações, skeletons, shimmer, page-enter, item-enter
│   │       ├── login.css
│   │       ├── dashboard.css         # widget grid, tooltips, modais, responsive
│   │       ├── extrato.css
│   │       ├── desafios.css          # Card grid, streaks, fire colors
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
GET  /api/profile             # Dados do usuário (+ dashboardConfig, customTheme, 2FA status)
PUT  /api/profile             # { nome, sobrenome, foto, theme, dashboardConfig, customTheme, pushEnabled }
POST /api/change-password     # { senhaAtual, novaSenha }
POST /api/refresh-token       # Renovar JWT
```

#### Autenticação 2FA
```http
GET    /api/auth/2fa/status            # Status do 2FA do usuário
POST   /api/auth/2fa/setup            # { method: "totp"|"email" } → secret + otpauth URI
POST   /api/auth/2fa/verify           # { method, code } → ativa o método
DELETE /api/auth/2fa                  # Desativa 2FA
POST   /api/login/2fa                 # { tempToken, code, method } → login após 2FA
POST   /api/login/2fa/resend          # { tempToken } → reenviar código email
```

> [!info] Fluxo 2FA
> 1. Login detecta 2FA → retorna `tempToken` + métodos disponíveis
> 2. Frontend exibe tela de escolha do método (TOTP/Email)
> 3. Usuário insere código → `POST /api/login/2fa`
> 4. Opcional: `trustDevice: true` → gera trust token (30 dias, SHA256 hashed)
> 5. Backup codes: 8 códigos de uso único, exibidos ao ativar 2FA

#### Login Social (Mobile / Direct)
```http
POST /api/login/social          # { id, provider, displayName, emails, photos } → mobile OAuth
```

#### Categorias
```http
GET  /api/categorias/palavras   # → dicionário de categorias + palavras-chave
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
PUT    /api/editar         # { updates: [...] } — batch até 50
DELETE /api/deletar?id=N   # Deletar (query param)
POST   /api/desfazer       # { record: {...} } — restaurar lançamento deletado
POST   /api/importar       # { lancamentos: [...] }
POST   /api/importar/auto  # { fileType: "ofx"|"csv", content: "..." } — auto detecta formato
POST   /api/exportar/xlsx  # { lancamentos: [...] } → .xlsx binary
POST   /api/exportar/email # { lancamentos: [...], email, periodo, filtros } → envia .xlsx
```

#### Recorrentes
```http
POST   /api/recorrentes            # Criar recorrência
GET    /api/recorrentes            # Listar
PUT    /api/recorrentes/:id        # Atualizar
DELETE /api/recorrentes/:id        # Deletar
POST   /api/recorrentes/gerar      # Gerar lançamentos manualmente + push notification
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
| sidebarCollapsed | `BOOLEAN` | Sidebar recolhida (sync) |
| dashboardConfig | `JSONB?` | Configuração do dashboard customizável |
| customTheme | `JSONB?` | Tema customizado (20 variáveis CSS) |
| pushEnabled | `BOOLEAN` | Notificações push ativadas |
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

### `user_2fa`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| user_id | `INT PK FK` | FK → usuarios(id) CASCADE |
| methods | `TEXT[]` | Métodos ativos: `{totp}`, `{email}`, `{totp,email}` |
| totp_secret | `TEXT?` | Chave secreta TOTP (base32) |
| totp_verified | `BOOLEAN` | TOTP verificado |
| email_verified | `BOOLEAN` | Código email verificado |
| email_code | `TEXT?` | Código de verificação email (6 dígitos) |
| email_code_expires | `TIMESTAMP?` | Expiração código email |
| email_login_code | `TEXT?` | Código de login email |
| email_login_expires | `TIMESTAMP?` | Expiração código login |
| backup_codes | `JSONB` | Array de 8 hashes SHA256 (uso único) |
| trust_token | `TEXT?` | Hash SHA256 do trust token |
| trust_expires | `TIMESTAMP?` | Expiração do trust (30 dias) |
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
| `Ctrl + D` | 🏆 Ir para Desafios |
| `Esc` | ❌ Fechar modal |

---

## 📱 PWA & Offline

### Service Worker (`src/sw.js` — gerenciado via `vite-plugin-pwa`)
```javascript
// Estratégias de cache:
// GET /api/* → networkFirst com stale cache fallback
// GET same-origin estáticos → cacheFirst
// CDN assets (cdnjs, google fonts) → StaleWhileRevalidate
// skipWaiting + claim na ativação
```
- **Manifest injetado** automaticamente pelo `vite-plugin-pwa`
- `devOptions.enabled: true` para testar SW em dev

### Funcionamento Offline
1. **Instalação**: Assets estáticos são cacheados via Workbox
2. **Modo offline**: Lista de transações da última sessão via `localStorage`
3. **Indicador**: Banner amarelo aparece quando offline
4. **Leitura offline**: Dashboard carrega dados do cache local
5. **Notificações push**: Recebe alertas mesmo com app fechado

### Checklist PWA
- [x] Manifest.json injetado pelo build (vite-plugin-pwa)
- [x] Service Worker registrado (Workbox)
- [x] Cache de assets estáticos + CDN
- [x] Cache de dados (localStorage)
- [x] Indicador offline
- [x] Push notifications (custom SW + web-push)
- [ ] Escrita offline (adicionar/editar sem conexão)

---

## 🔒 Segurança

```yaml
Senhas: bcrypt (salt rounds: 10)
Autenticação: JWT com expiração (24h) + refresh token
2FA: TOTP (RFC 6238, crypto nativo) + Email code + 8 Backup Codes (SHA256, uso único)
Trust Device: Token SHA256, 30 dias, armazenado hasheado
Rate Limiting: 1000 req/15min por IP
Headers: Helmet.js
CORS: Pacote cors oficial + wildcard .vercel.app (previews)
SQL Injection: Parameterized queries
Trust Proxy: Habilitado para Vercel
OAuth2: Passport.js (Google + GitHub)
Push Auth: VAPID keys (web-push)
```

---

## 🧪 Testes

```yaml
Total: 105 testes (54 backend + 37 frontend + 14 E2E)
Backend unitários: 31 (autoCategorize 15, parseCSV 6, parseOFX 4, calcularProximaData 6)
Backend integração: 23 (health, auth 5, financeiro 6, recorrentes 3, orçamentos 3, profile 2, error handling 3)
Frontend: 37 (9 format + 14 theme + 14 sidebar)
E2E Playwright: 14 testes (auth 6, dashboard 5, sidebar 3) — Chromium, 1280×720
```

## 🤖 CI/CD

O pipeline do GitHub Actions roda em todo push/PR:

1. **test-backend**: `npm test` (Node --test, 54 testes = 31 unit + 23 integração) com `DATABASE_URL` + `JWT_SECRET`
2. **test-frontend**: `npm test` (37 testes: 9 format + 14 theme + 14 sidebar) + `vite build`
3. **test-e2e**: Playwright tests (14 testes: auth 6, dashboard 5, sidebar 3) — Chromium, inicia backend via `with_server.py`
4. **deploy** (só main, após todos os testes): `vercel deploy --prod` para ambos os projetos

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
Arquivos: ~90+
Linhas de código: ~13000+
Dependências: 18 npm (backend) + 8 npm (frontend)
Banco: 9 tabelas (usuarios, financeiro, password_resets, recorrentes, orcamentos, push_subscriptions, user_2fa, metas_categoria, desafios_economia)
Endpoints API: 48+
Telas: 11 (Login, Register, Dashboard, Extrato, Forgot, Reset, Change, Callback, Perfil, Recorrentes, Desafios)
Testes: 105 (31 unit backend + 23 integração backend + 37 frontend + 14 E2E)
```

---

## 🔗 Notas Relacionadas

- [[Readme do Projeto]]
- [[API Documentation]]
- [[Service Worker Notes]]
- [[Ideias de Melhorias]]
- [[Refatoração Frontend V2]]
- [[Bug Fixes]]
- [[Skills Úteis]]
- [[Tutorial - Aprenda o Projeto]]

---

> [!quote] Feito com ❤️ por [Henrique Bezerra](https://github.com/Henrique1601)
