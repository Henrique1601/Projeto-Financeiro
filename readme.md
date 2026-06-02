# 💰 Gestor de Despesas

<div align="center">
  
![Badge](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Badge](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Badge](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Badge](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Badge](https://img.shields.io/badge/Neon-3F8EFC?style=for-the-badge&logo=neon&logoColor=white)
![Badge](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Badge](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Badge](https://img.shields.io/badge/License-MIT-FF5733?style=for-the-badge)

</div>

> Sistema completo de gerenciamento financeiro pessoal com interface moderna, responsiva, suporte offline e CI/CD automático.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Deploy na Vercel](#deploy-na-vercel)
- [CI/CD](#cicd)
- [API Endpoints](#api-endpoints)
- [Banco de Dados](#banco-de-dados)
- [Segurança](#segurança)
- [Atalhos de Teclado](#atalhos-de-teclado)
- [Testes](#testes)
- [Demonstração](#demonstração)
- [Autor](#autor)
- [Licença](#licença)

---

## 💡 Sobre o Projeto

O **Gestor de Despesas** é uma aplicação web completa para controle financeiro pessoal. Permite registrar entradas e saídas, acompanhar gastos por categoria, definir orçamentos mensais por categoria, automatizar transações recorrentes, visualizar relatórios e muito mais.

### ✨ Principais Características

- **Interface moderna** com 8 temas (Sistema, Dark, Dracula, Nord, Tokyo Night, Gruvbox, Rose Pine, Claro) + **temas customizáveis** (editor visual com 20 variáveis CSS)
- **Sidebar collapsível** com overlay hover-expand (Notion-like), mini mode persistente e grupos de navegação
- **PWA** com service worker, cache offline e notificações push
- **Exportação** CSV, JSON, XLSX, PDF e envio por email com período e filtros
- **Dashboard customizável** com widget grid (drag & drop, redimensionar, ocultar/mostrar, presets)
- **Gráficos Chart.js** (tree-shaked, ~90KB), comparativo mensal, meta de economia, projeção de saldo e orçamentos por categoria
- **Transações recorrentes** com geração automática e notificação de vencimento
- **Orçamentos mensais** por categoria com alertas push (>80% e >100%)
- **Autenticação em dois fatores (2FA)** via TOTP (Google Authenticator) + código email + códigos de backup (8, uso único) + dispositivo confiável (30 dias)
- **Sistema de autenticação** com JWT + refresh token
- **Login social** (Google, GitHub) com fluxo redirect
- **Recuperação de senha** por código (SMTP ou dev mode)
- **Categorização automática** por palavras-chave (10 categorias, 100+ palavras)
- **Importação automática** de extratos (OFX, CSV, JSON) com detecção de duplicatas
- **Seleção em massa**, duplicação, ordenação por coluna e paginação
- **Atalhos de teclado** para navegação rápida
- **Página de perfil** com edição de nome/foto, tema sincronizado, tema customizado, push notifications e 2FA
- **CI/CD automático** — GitHub Actions → Testes → Deploy Vercel
- **Undo após deletar** com toast de 5s para desfazer (individual e bulk)

---

## 🎯 Funcionalidades

### Autenticação
- [x] Registro de novos usuários
- [x] Login com autenticação JWT
- [x] Login com redes sociais (Google, GitHub) — fluxo redirect
- [x] Recuperação de senha por código (SMTP ou dev mode)
- [x] Alteração de senha no perfil
- [x] Refresh token automático
- [x] Logout automático

### Gestão Financeira
- [x] Lançar entradas e saídas
- [x] Editar transações existentes
- [x] Deletar transações individuais e em massa
- [x] Duplicar transação existente
- [x] Categorização automática por palavras-chave (10 categorias, 100+ palavras)
- [x] Observações personalizadas
- [x] Método de pagamento (Dinheiro, PIX, Débito, Crédito, Boleto, Transferência)

### Transações Recorrentes
- [x] CRUD completo (criar, listar, editar, deletar)
- [x] Frequências: semanal, quinzenal, mensal, anual
- [x] Data fim e máximo de ocorrências (parcelas)
- [x] Geração automática ao carregar o dashboard
- [x] Geração manual via página dedicada
- [x] Toggle ativo/inativo
- [x] Push notification ao gerar lançamentos
- [x] Notificação de vencimento próximo

### Orçamentos por Categoria
- [x] CRUD completo com limite por categoria
- [x] Progresso visual no dashboard (barra + percentual)
- [x] Alerta push ao atingir 80% do limite
- [x] Alerta push ao ultrapassar 100%
- [x] Verificação automática ao listar lançamentos

### Importação
- [x] Importar de CSV (BOM, separador auto, quotes, \r\n)
- [x] Importar de OFX (formato bancário)
- [x] Importar de JSON
- [x] Importação automática com categorização
- [x] Detecção de duplicatas (user_id, data, descricao, valor, entradaSaida)
- [x] Debug "Amostra dos dados" na resposta

### Categorização
- [x] Categorias pré-definidas (Alimentação, Transporte, Lazer, etc.)
- [x] 10 categorias com +100 palavras-chave
- [x] Categoria automática via backend
- [x] Case insensitive

### Filtros e Busca
- [x] Busca por descrição
- [x] Filtro por tipo (Entrada/Saída)
- [x] Filtro por categoria
- [x] Filtro por método de pagamento
- [x] Filtro por período (data início/fim)
- [x] Estado sincronizado com hash params (URL sharable)

### Relatórios e Exportação
- [x] Resumo financeiro (Entradas, Saídas, Saldo)
- [x] Dashboard com gráfico de evolução mensal (linha)
- [x] Dashboard com gráfico de categorias (donut)
- [x] Comparativo mensal (mês atual × anterior)
- [x] Projeção de saldo para fim do mês
- [x] Meta de economia mensal com barra de progresso
- [x] Exportar para CSV com período e filtros
- [x] Exportar para JSON
- [x] Exportar para PDF com tema atual (--primary) e botão de impressão
- [x] Envio por email do relatório (.xlsx)

### Interface
- [x] 8 temas (Sistema, Dark, Dracula, Nord, Tokyo Night, Gruvbox, Rose Pine, Claro)
- [x] Seletor de tema no sidebar
- [x] Tema sincronizado com o backend
- [x] Tema "Sistema" segue `prefers-color-scheme` do SO com listener ao vivo
- [x] Sidebar collapsível com overlay hover-expand (Notion-like), footer icon buttons, backdrop overlay, indicador de grupo ativo, smooth margin-left transition e mini mode persistente
- [x] Responsivo mobile-first
- [x] Menu hamburger para mobile
- [x] Animações: page enter (fade + translateY), staggered reveal em cards/tabela/gráficos
- [x] Skeleton loading (shimmer) em vez de spinner no dashboard
- [x] Empty states ilustrados (SVG: chart vazio, sem resultados, lista vazia)
- [x] Atalhos de teclado (Ctrl+H/E/T/N/S/F/P/R, Esc)
- [x] Toastify para feedback visual

### PWA e Offline
- [x] Service Worker com cache de assets (cache-first para GETs)
- [x] Cache offline da lista de transações (localStorage)
- [x] Indicador de status offline (banner amarelo)
- [x] Notificações push (VAPID keys)
- [x] Manifest.json com ícones

---

## 🛠 Tecnologias

### Front-end
| Tecnologia | Descrição |
|------------|-----------|
| Vite 6 | Build tool e dev server (ES Modules) |
| CSS3 | Estilização moderna com variáveis CSS + 8 temas (+ "Sistema") |
| JavaScript (Vanilla) | SPA com hash routing |
| Chart.js (tree-shaked) | Gráficos (~90KB vs 240KB) |
| Service Worker | PWA offline + push notifications |
| Toastify.js | Notificações |
| Font Awesome 6 | Ícones (CDN) |

### Back-end
| Tecnologia | Descrição |
|------------|-----------|
| Node.js | Runtime JavaScript |
| Express | Framework web |
| JWT | Autenticação + refresh token |
| bcrypt | Hash de senhas (salt rounds: 10) |
| pg | Cliente PostgreSQL (Neon serverless) |
| Passport.js | Login social (Google, GitHub) |
| express-rate-limit | Rate limiting (1000 req/15min) |
| helmet | Segurança headers |
| Nodemailer | Envio de email (SMTP) |
| web-push | Notificações push |

### Banco de Dados
| Tecnologia | Descrição |
|------------|-----------|
| PostgreSQL | Banco relacional |
| Neon | PostgreSQL serverless |

### Deploy & CI/CD
| Tecnologia | Descrição |
|------------|-----------|
| Vercel | Hosting serverless (backend + frontend) |
| GitHub Actions | CI/CD automático (test → build → deploy) |
| Node --test | Test runner nativo |
| Playwright | Testes E2E |

---

## 📁 Estrutura do Projeto

```
postgre/
├── backend/
│   └── api/
│       ├── config/
│       │   ├── database.js          # Configuração Neon + init tabelas
│       │   └── jwt.js               # Config JWT
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── financeiroController.js
│       │   └── orcamentoController.js
│       ├── middleware/
│       │   └── auth.js              # Middleware JWT
│       ├── routes/
│       │   └── index.js             # Rotas + OAuth
│       ├── services/
│       │   ├── authService.js
│       │   ├── financeiroService.js # CRUD + parser OFX/CSV
│       │   ├── emailService.js      # Nodemailer
│       │   ├── notificationService.js # Push subscriptions
│       │   ├── recorrenteService.js # Transações recorrentes
│       │   └── passportConfig.js
│       ├── utils/
│       │   ├── queryHelpers.js
│       │   └── validators.js
│       ├── tests/
│       │   ├── integration.test.js  # 23 testes integração
│       │   └── __tests__/           # Testes unitários
│       ├── docs/
│       │   └── index.html           # Documentação interativa
│       ├── index.js                 # Entry point Express
│       ├── .env
│       └── package.json
│
├── front-end/
│   ├── public/
│   │   ├── sw.js                    # Service Worker v3
│   │   └── manifest.json
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.js
│   │   │   ├── ExtratoPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── RecorrentesPage.js
│   │   │   ├── CallbackPage.js
│   │   │   ├── ForgotPasswordPage.js
│   │   │   ├── ResetPasswordPage.js
│   │   │   └── ChangePasswordPage.js
│   │   ├── styles/
│   │   │   ├── variables.css        # Variáveis CSS + 8 temas (+ "Sistema")
│   │   │   ├── global.css           # Animações, skeletons, estilos globais
│   │   │   ├── dashboard.css        # Dashboard + sidebar collapsível/overlay + sort/pagination
│   │   │   ├── extrato.css
│   │   │   └── login.css
│   │   ├── utils/
│   │   │   ├── dom.js               # Toast, spinner, empty states, skeletons
│   │   │   ├── format.js            # Data, Moeda, Tipo
│   │   │   └── chartSetup.js        # Chart.js tree-shaked setup
│   │   ├── api.js                   # HTTP client + retry + refresh
│   │   ├── auth.js                  # Login, register, social, reset
│   │   ├── config.js                # API_BASE_URL (env-aware)
│   │   ├── main.js                  # App init + router + shortcuts
│   │   ├── router.js                # Hash-based SPA router
│   │   ├── store.js                 # Estado reativo
│   │   └── theme.js                 # 8 temas (+ "Sistema") + sync backend + custom themes
│   ├── tests/
│   │   └── format.test.js           # Testes unitários
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
│
├── 2º Cerebro/                      # Obsidian vault
├── .github/workflows/test.yml       # CI/CD pipeline
├── AGENTS.md                        # Instruções OpenCode
├── LICENSE
└── README.md
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou Neon para cloud)
- npm ou yarn

### Clone o Repositório

```bash
git clone https://github.com/Henrique1601/Projeto-Financeiro.git
cd Projeto-Financeiro
```

### Desenvolvimento local (raiz)

```bash
npm run install:all   # Instala dependências de backend + frontend
npm run dev           # Inicia ambos simultaneamente (via concurrently)
```

### Ou individualmente

```bash
# Apenas backend
cd backend && npm install && npm run dev

# Apenas front-end
cd front-end && npm install && npm run dev
```

O frontend em dev aponta para `localhost:3000` automaticamente.

---

## ⚙️ Configuração

### Variáveis de Ambiente (Backend)

Crie um arquivo `.env` no diretório `backend/`:

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@host:5432/banco?sslmode=require

# Autenticação
JWT_SECRET=sua_chave_secreta_muito_segura

# Ambiente
NODE_ENV=development
PORT=3000

# URLs
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000

# Login Social (opcional)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GITHUB_CLIENT_ID=seu_github_client_id
GITHUB_CLIENT_SECRET=seu_github_client_secret

# SMTP (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua-senha-de-app

# Push Notification (opcional)
VAPID_PUBLIC_KEY=BCxxxxx
VAPID_PRIVATE_KEY=yyyyy
VAPID_SUBJECT=mailto:seuemail@example.com
```

### Configuração do Neon (PostgreSQL Cloud)

1. Crie uma conta em [Neon](https://neon.tech)
2. Crie um novo projeto
3. Copie a connection string
4. Cole no `DATABASE_URL`

---

## 🌐 Deploy na Vercel

### Projetos (já configurados)

| Projeto | URL | ID Vercel |
|---------|-----|-----------|
| **Frontend** | https://gestor-financeiro-proj.vercel.app | `prj_03Ubrvp96UsDmupRfqESi07KgKX6` |
| **Backend** | https://gestor-financeiro-api-proj.vercel.app | `prj_HVlKrN2J7tVfvGF0o71ZHpLrWHso` |

### Variáveis de Ambiente (15 vars no Vercel)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string Neon PostgreSQL |
| `JWT_SECRET` | Chave JWT |
| `FRONTEND_URL` | URL do frontend |
| `API_URL` | URL do backend (OAuth callback) |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `GITHUB_CLIENT_ID` | OAuth GitHub |
| `GITHUB_CLIENT_SECRET` | OAuth GitHub |
| `SMTP_HOST/PORT/USER/PASS` | Servidor SMTP |
| `VAPID_PUBLIC/PRIVATE/SUBJECT` | Push notification |

---

## 🤖 CI/CD

O projeto usa **GitHub Actions** para integração contínua e deploy automático:

```yaml
# .github/workflows/test.yml
jobs:
  test-backend:    # node --test (31 unit + 23 integration)
  test-frontend:  # node --test + vite build
  deploy:         # Vercel deploy (só na main)
```

**Fluxo:**
1. Push em qualquer branch → roda testes
2. Push na `main` → testes + deploy automático nos 2 projetos Vercel
3. PR → apenas testes

### Secrets necessários no GitHub

| Secret | Descrição |
|--------|-----------|
| `VERCEL_TOKEN` | Token de acesso Vercel |
| `VERCEL_ORG_ID` | `team_wLbnbFbcsPoVrsUH0ha0Hhv2` |
| `VERCEL_PROJECT_ID_BACKEND` | `prj_HVlKrN2J7tVfvGF0o71ZHpLrWHso` |
| `VERCEL_PROJECT_ID_FRONTEND` | `prj_03Ubrvp96UsDmupRfqESi07KgKX6` |
| `DATABASE_URL` | Connection string Neon |
| `JWT_SECRET` | Chave JWT |

---

## 📡 API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/register` | Registrar novo usuário |
| POST | `/api/login` | Login do usuário |
| POST | `/api/login/social` | Login via rede social |
| POST | `/api/forgot-password` | Solicitar recuperação de senha |
| POST | `/api/reset-password` | Redefinir senha (código 6 dígitos) |
| POST | `/api/change-password` | Alterar senha (autenticado) |
| POST | `/api/refresh-token` | Renovar JWT |
| PUT | `/api/profile` | Atualizar perfil |
| GET | `/api/profile` | Ver perfil |

### Transações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/salvar` | Criar transação |
| GET | `/api/listar` | Listar transações |
| PUT | `/api/editar` | Editar transação |
| DELETE | `/api/deletar` | Deletar transação |
| POST | `/api/importar` | Importar transações |
| POST | `/api/importar/auto` | Importação automática (OFX/CSV) |

### Recorrentes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/recorrentes` | Criar recorrência |
| GET | `/api/recorrentes` | Listar recorrências |
| PUT | `/api/recorrentes/:id` | Atualizar recorrência |
| DELETE | `/api/recorrentes/:id` | Deletar recorrência |

### Orçamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/orcamentos` | Criar orçamento |
| GET | `/api/orcamentos` | Listar orçamentos |
| GET | `/api/orcamentos/verificar` | Verificar alertas |
| PUT | `/api/orcamentos/:id` | Atualizar orçamento |
| DELETE | `/api/orcamentos/:id` | Deletar orçamento |

### Push Notifications

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/push/subscribe` | Salvar subscription |
| GET | `/api/push/vapid-public-key` | Chave pública VAPID |

### Monitoramento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Status da API e banco |
| GET | `/api/docs` | Documentação interativa |

---

## 🗄️ Banco de Dados

### Tabelas

#### `usuarios`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | ID único |
| nome | TEXT | Nome do usuário |
| sobrenome | TEXT | Sobrenome |
| email | TEXT | Email (único) |
| senha | TEXT | Hash bcrypt (nullable para login social) |
| social_id | TEXT | ID da rede social |
| provider | TEXT | Provedor (google, github) |
| foto | TEXT | URL da foto |
| theme | TEXT | Tema salvo (sincronizado) |
| sidebarCollapsed | BOOLEAN | Sidebar recolhida (sync) |
| primeiro_login | BOOLEAN | Primeiro login |
| created_at | TIMESTAMP | Data de criação |

#### `financeiro`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | ID único |
| user_id | INTEGER | FK para usuários |
| data | DATE | Data da transação |
| descricao | TEXT | Descrição |
| valor | NUMERIC | Valor (positivo) |
| entradaSaida | TEXT | "Entrada" ou "Saída" |
| categoria | TEXT | Categoria |
| metodoPagamento | TEXT | Método de pagamento |
| observacoes | TEXT | Observações |
| created_at | TIMESTAMP | Data de criação |

#### `recorrentes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | ID único |
| user_id | INTEGER | FK para usuários |
| descricao | TEXT | Descrição |
| valor | NUMERIC | Valor |
| categoria | TEXT | Categoria |
| frequencia | TEXT | semanal, quinzenal, mensal, anual |
| dia_vencimento | INTEGER | Dia do vencimento |
| metodoPagamento | TEXT | Método de pagamento |
| observacoes | TEXT | Observações |
| data_fim | DATE | Data fim (opcional) |
| max_ocorrencias | INTEGER | Máx ocorrências (opcional) |
| ativo | BOOLEAN | Ativo/inativo |
| proxima_data | DATE | Próxima geração |
| created_at | TIMESTAMP | Data de criação |

#### `orcamentos`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | ID único |
| user_id | INTEGER | FK para usuários |
| categoria | TEXT | Categoria |
| limite | NUMERIC | Limite mensal |
| mes | TEXT | Mês de referência (YYYY-MM) |
| created_at | TIMESTAMP | Data de criação |

#### `password_resets`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | ID único |
| user_id | INTEGER | FK para usuários |
| email | TEXT | Email |
| code | TEXT | Código de 6 dígitos |
| expires_at | TIMESTAMP | Expiração do código |

#### `push_subscriptions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | ID único |
| user_id | INTEGER | FK para usuários |
| endpoint | TEXT | Endpoint push |
| keys | JSONB | Chaves p256dh + auth |
| created_at | TIMESTAMP | Data de criação |

### Categorização Automática

O sistema categoriza automaticamente transações baseado em palavras-chave:

| Categoria | Palavras-chave |
|-----------|---------------|
| Alimentação | supermercado, mercado, restaurante, ifood, rappi, padaria, feira, pizza, lanche, bar |
| Transporte | uber, 99, gasolina, posto, metrô, ônibus, estacionamento, pedágio |
| Lazer | cinema, netflix, spotify, academia, jogo, steam, show, teatro |
| Saúde | farmácia, médico, hospital, dentista, remédio, exame, plano de saúde |
| Educação | escola, curso, livro, faculdade, aula, professor |
| Moradia | aluguel, condomínio, luz, água, internet, iptu |
| Salário | salário, pagamento, freelance, bônus, proventos |
| Investimento | aplicação, bitcoin, cdb, ação, tesouro, fundo |
| Serviços | assinatura, net, vivo, claro, amazon |
| Outros | fallback padrão |

---

## 🔒 Segurança

### Medidas Implementadas

- [x] **Senhas criptografadas** com bcrypt (salt rounds: 10)
- [x] **JWT tokens** com expiração (24h)
- [x] **Refresh token** automático para sessões longas
- [x] **Rate limiting** (1000 req/15min por IP) com express-rate-limit
- [x] **Helmet.js** para headers de segurança
- [x] **CORS** configurado para origens específicas
- [x] **Validação de inputs** no backend
- [x] **SQL injection** prevenido com parameterized queries
- [x] **Trust proxy** habilitado para Vercel
- [x] **OAuth2** com Passport.js (Google + GitHub)
- [x] **Notificações push** com VAPID authentication

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + H` | Ir para Dashboard |
| `Ctrl + E` | Ir para Extrato |
| `Ctrl + T` | Alternar tema |
| `Ctrl + N` | Nova transação (no dashboard) |
| `Ctrl + S` | Salvar formulário aberto |
| `Ctrl + F` | Focar campo de busca |
| `Ctrl + P` | Ir para Perfil |
| `Ctrl + R` | Ir para Recorrentes |
| `Esc` | Fechar modal |

---

## 🧪 Testes

O projeto usa `node:test` (nativo do Node.js) — sem dependências externas de test runner.

### Todos os testes (raiz)

```bash
npm test              # Backend + frontend sequenciais
npm run test:backend  # Apenas backend
npm run test:frontend # Apenas frontend
```

### Ou individualmente

```bash
cd backend && npm test     # Backend: 54 testes (31 unit + 23 integração)
cd front-end && npm test   # Frontend: 37 testes (format + theme + sidebar)
```

**54 testes backend**: autoCategorize (15), parseCSV (6), parseOFX (4), calcularProximaData (6), integração (23)

**37 testes frontend**: `format.test.js` (9) + `theme.test.js` (14) + `sidebar.test.js` (14)

### E2E (Playwright)

```bash
npm run test:e2e
```

**14 testes**: auth (6), dashboard (5), sidebar (3)

### CI/CD

Os testes rodam automaticamente no GitHub Actions a cada push/PR.

---

## 📱 Modo Offline (PWA)

A aplicação possui suporte offline parcial:

1. **Cache de Assets**: CSS, JS são cacheados via Service Worker
2. **Cache de Dados**: Lista de transações é cacheada no `localStorage`
3. **Indicador**: Banner amarelo indica quando offline
4. **Leitura offline**: Dashboard carrega dados do cache quando offline
5. **Instalação**: Abra no Chrome/Edge e clique em "Instalar" no banner ou menu
6. **Notificações push**: Ative no perfil para receber alertas de recorrentes e orçamentos

---

## 📸 Demonstração

- **Aplicação:** https://gestor-financeiro-proj.vercel.app
- **Status API:** https://gestor-financeiro-api-proj.vercel.app/api/health
- **Documentação API:** https://gestor-financeiro-api-proj.vercel.app/api/docs

---

## 👨‍💻 Autor

<div align="center">

### Henrique Bezerra

[![GitHub](https://img.shields.io/badge/GitHub-Henrique1601-181717?style=for-the-badge&logo=github)](https://github.com/Henrique1601)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-henrique--bezerra-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/henrique-bezerra)

</div>

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

Feito com ❤️ por [Henrique Bezerra](https://github.com/Henrique1601)

</div>
