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

> Sistema completo de gerenciamento financeiro pessoal com interface moderna, responsiva e suporte offline.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Deploy na Vercel](#deploy-na-vercel)
- [API Endpoints](#api-endpoints)
- [Banco de Dados](#banco-de-dados)
- [Segurança](#segurança)
- [Atalhos de Teclado](#atalhos-de-teclado)
- [Demonstração](#demonstração)
- [Autor](#autor)
- [Licença](#licença)

---

## 💡 Sobre o Projeto

O **Gestor de Despesas** é uma aplicação web completa para controle financeiro pessoal. Permite registrar entradas e saídas, acompanhar gastos por categoria, definir metas mensais, visualizar relatórios e muito mais.

### ✨ Principais Características

- **Interface moderna** com 4 temas (Dark, Dracula, Nord, Claro) e design responsivo (mobile-first)
- **PWA** com service worker e cache offline de leitura
- **Exportação** CSV e PDF com seleção de período e filtros
- **Dashboard avançado** com gráficos Chart.js, comparativo mensal, meta de economia e projeção de saldo
- **Sistema de autenticação** com JWT
- **Login social** (Google, GitHub)
- **Recuperação de senha** por código
- **Categorização automática** por palavras-chave
- **Importação automática** de extratos (OFX, CSV)
- **Atalhos de teclado** para navegação rápida

---

## 🎯 Funcionalidades

### Autenticação
- [x] Registro de novos usuários
- [x] Login com autenticação JWT
- [x] Login com redes sociais (Google, GitHub)
- [x] Recuperação de senha por código
- [x] Alteração de senha no perfil
- [x] Logout automático

### Gestão Financeira
- [x] Lançar entradas e saídas
- [x] Editar transações existentes
- [x] Deletar transações individuais
- [x] Categorização automática por palavras-chave (10 categorias, 100+ palavras)
- [x] Observações personalizadas
- [x] Método de pagamento (Dinheiro, PIX, Débito, Crédito, Boleto, Transferência)

### Importação
- [x] Importar de CSV
- [x] Importar de OFX (formato bancário)
- [x] Importação automática com categorização

### Categorização
- [x] Categorias pré-definidas (Alimentação, Transporte, Lazer, etc.)
- [x] 10 categorias com +100 palavras-chave
- [x] Categoria automática via backend

### Filtros e Busca
- [x] Busca por descrição
- [x] Filtro por tipo (Entrada/Saída)
- [x] Filtro por categoria
- [x] Filtro por método de pagamento
- [x] Filtro por período (data início/fim)

### Relatórios e Exportação
- [x] Resumo financeiro (Entradas, Saídas, Saldo)
- [x] Dashboard com gráfico de evolução mensal (linha)
- [x] Dashboard com gráfico de categorias (donut)
- [x] Comparativo mensal (mês atual × anterior)
- [x] Projeção de saldo para fim do mês
- [x] Meta de economia mensal com barra de progresso
- [x] Exportar para CSV com período e filtros
- [x] Exportar para JSON
- [x] Exportar para PDF com gráficos (via impressão)
- [x] Extrato detalhado com filtros, gráficos e resumo anual

### Seleção em Massa
- [x] Checkbox por linha + selecionar todos
- [x] Deletar múltiplos lançamentos de uma vez
- [x] Duplicar transação existente

### Ordenação e Paginação
- [x] Ordenar por qualquer coluna (clicar no header)
- [x] Paginação com 10/20/50/100 itens por página

### Interface
- [x] 4 temas (Dark, Dracula, Nord, Claro) com transição suave
- [x] Seletor de tema no sidebar
- [x] Responsivo mobile-first
- [x] Menu hamburger para mobile
- [x] Animações e feedback visual (Toastify)
- [x] Atalhos de teclado (Ctrl+H, Ctrl+E, Ctrl+T, Ctrl+N, Ctrl+S, Ctrl+F, Esc)
- [x] Página de alterar senha

### PWA e Offline
- [x] Service Worker com cache de assets
- [x] Cache offline da lista de transações (localStorage)
- [x] Indicador de status offline (banner amarelo)

---

## 🛠 Tecnologias

### Front-end
| Tecnologia | Descrição |
|------------|-----------|
| Vite 6 | Build tool e dev server |
| CSS3 | Estilização moderna com variáveis CSS |
| JavaScript (ES Modules) | Lógica da aplicação |
| Chart.js | Gráficos (evolução, categorias) |
| Service Worker | PWA offline |
| Toastify.js | Notificações |
| Font Awesome | Ícones |

### Back-end
| Tecnologia | Descrição |
|------------|-----------|
| Node.js | Runtime JavaScript |
| Express | Framework web |
| JWT | Autenticação |
| bcrypt | Hash de senhas |
| pg | Cliente PostgreSQL |
| Passport.js | Login social |
| express-rate-limit | Rate limiting |
| helmet | Segurança headers |

### Banco de Dados
| Tecnologia | Descrição |
|------------|-----------|
| PostgreSQL | Banco relacional |
| Neon | PostgreSQL serverless |
| SQLite | Alternativa local |

### Deploy
| Tecnologia | Descrição |
|------------|-----------|
| Vercel | Hosting serverless |
| Git | Versionamento |

---

## 📁 Estrutura do Projeto

```
postgre/
├── backend/
│   └── api/
│       ├── config/
│       │   └── database.js      # Configuração do banco Neon/PostgreSQL
│       ├── controllers/
│       │   ├── authController.js
│       │   └── financeiroController.js
│       ├── docs/
│       │   └── index.html       # Documentação da API
│       ├── middleware/
│       │   └── auth.js          # Middleware de autenticação JWT
│       ├── routes/
│       │   └── index.js         # Rotas da API
│       ├── services/
│       │   ├── authService.js
│       │   ├── financeiroService.js
│       │   └── passportConfig.js
│       ├── utils/
│       │   └── validators.js
│       ├── index.js             # Entry point Express
│       ├── .env
│       └── package.json
│
├── front-end/
│   ├── public/
│   │   ├── sw.js                # Service Worker
│   │   └── manifest.json
│   ├── src/
│   │   ├── pages/               # Páginas SPA
│   │   │   ├── DashboardPage.js
│   │   │   ├── ExtratoPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── CallbackPage.js
│   │   │   ├── ForgotPasswordPage.js
│   │   │   └── ResetPasswordPage.js
│   │   ├── styles/
│   │   │   ├── variables.css    # Variáveis CSS + temas
│   │   │   ├── global.css       # Estilos globais
│   │   │   ├── dashboard.css    # Dashboard + sidebar
│   │   │   ├── extrato.css
│   │   │   └── login.css
│   │   ├── utils/
│   │   │   ├── dom.js           # Toast, spinner
│   │   │   └── format.js        # Formatação data/moeda
│   │   ├── api.js               # Cliente HTTP com refresh token
│   │   ├── auth.js              # Autenticação
│   │   ├── config.js            # API_BASE_URL
│   │   ├── main.js              # Entry point + router
│   │   ├── router.js            # Hash-based SPA router
│   │   ├── store.js             # Estado reativo
│   │   └── theme.js             # Gerenciador de temas
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
│
├── 2º Cerebro/                  # Obsidian vault
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

### Backend

```bash
cd backend
npm install
```

### Front-end (desenvolvimento local)

```bash
cd front-end
npm install
npm run dev
```

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

# Frontend (opcional)
FRONTEND_URL=https://seu-frontend.vercel.app

# Login Social (opcional)
GOOGLE_CLIENT_ID=seu_google_client_id
GITHUB_CLIENT_ID=seu_github_client_id
```

### Configuração do Neon (PostgreSQL Cloud)

1. Crie uma conta em [Neon](https://neon.tech)
2. Crie um novo projeto
3. Copie a connection string
4. Cole no `DATABASE_URL`

---

## 🌐 Deploy na Vercel

### Backend

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório
3. Selecione a pasta `backend`
4. Configure as variáveis de ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `VERCEL=1`
5. Deploy!

### Frontend

1. Crie um novo projeto na Vercel
2. Importe a pasta `front-end`
3. A Vercel detecta automaticamente o Vite e executa `npm run build`
4. Configure as variáveis de ambiente:
   - `VITE_API_URL` — URL do backend (ex: `https://backend.vercel.app`)
5. Deploy!

---

## 📡 API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/register` | Registrar novo usuário |
| POST | `/api/login` | Login do usuário |
| POST | `/api/login/social` | Login via rede social |
| POST | `/api/forgot-password` | Solicitar recuperação de senha |
| POST | `/api/reset-password` | Redefinir senha |
| POST | `/api/change-password` | Alterar senha (autenticado) |
| PUT | `/api/profile` | Atualizar perfil |
| GET | `/api/profile` | Ver perfil |

**Exemplo de Registro:**
```json
POST /api/register
{
  "nome": "João",
  "sobrenome": "Silva",
  "email": "joao@email.com",
  "senha": "minhaSenha123"
}
```

### Transações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/salvar` | Criar transação |
| GET | `/api/listar` | Listar transações |
| PUT | `/api/editar` | Editar transação |
| DELETE | `/api/deletar` | Deletar transação |
| POST | `/api/importar` | Importar transações |
| POST | `/api/importar/auto` | Importação automática (OFX/CSV) |

**Headers de Autenticação:**
```
Authorization: Bearer <token_jwt>
```

**Exemplo de Salvar Transação:**
```json
POST /api/salvar
{
  "data": "2024-01-15",
  "descricao": "Supermercado",
  "valor": -250.00,
  "entradaSaida": "Saída",
  "categoria": "Alimentação"
}
```

**Categorização Automática:**
```json
POST /api/importar/auto
{
  "fileType": "ofx",
  "content": "conteúdo do arquivo OFX..."
}
```

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
| metodoPagamento | TEXT | Método de pagamento (reservado) |
| observacoes | TEXT | Observações (reservado) |

#### `password_resets`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | ID único |
| user_id | INTEGER | FK para usuários |
| email | TEXT | Email |
| code | TEXT | Código de 6 dígitos |
| expires_at | TIMESTAMP | Expiração do código |

### Categorização Automática

O sistema categoriza automaticamente transações baseado em palavras-chave:

| Categoria | Palavras-chave |
|-----------|---------------|
| Alimentação | supermercado, mercado, restaurante, ifood... |
| Transporte | uber, 99, gasolina, posto, metrô... |
| Lazer | cinema, netflix, spotify, academia... |
| Saúde | farmácia, médico, hospital, dentista... |
| Educação | escola, curso, livro, microsoft... |
| Moradia | aluguel, condomínio, luz, água, internet... |
| Salário | salário, pagamento, freelance... |
| Investimento | aplicação, bitcoin, cdb, ação... |
| Serviços | assinatura, net, vivo, Claro... |
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
| `Esc` | Fechar modal |

---

## 📱 Modo Offline (PWA)

A aplicação possui suporte offline parcial:

1. **Cache de Assets**: CSS, JS são cacheados via Service Worker
2. **Cache de Dados**: Lista de transações é cacheada no `localStorage`
3. **Indicador**: Banner amarelo indica quando offline
4. **Leitura offline**: Dashboard carrega dados do cache quando offline
5. **Instalação**: Abra no Chrome/Edge e clique em "Instalar" no banner ou menu

> [!NOTE]
> Escrita offline (adicionar/editar sem conexão) ainda não implementada.

---

## 📸 Demonstração

- **Aplicação:** https://projeto-financeiro-frontend.vercel.app
- **Status API:** https://projeto-financeiro-vert.vercel.app/api/health
- **Documentação API:** https://projeto-financeiro-vert.vercel.app/api/docs

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
