# 💰 Gestor de Despesas

<div align="center">
  
![Badge](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Badge](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Badge](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Badge](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Badge](https://img.shields.io/badge/Neon-3F8EFC?style=for-the-badge&logo=neon&logoColor=white)
![Badge](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
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

- **Interface moderna** com tema escuro e design responsivo (mobile-first)
- **PWA completo** com suporte offline e sincronização automática
- **Múltiplos formatos de exportação** (PDF, Excel, CSV, JSON)
- **Sistema de autenticação** com JWT
- **Login social** (Google, GitHub)
- **Recuperação de senha** por código
- **Categorização automática** por IA
- **Importação automática** de extratos (OFX, CSV)
- **Notificações push** para alertas
- **Atalhos de teclado** para produtividade
- **Calendário financeiro** integrado
- **Transações recorrentes** automáticas

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
- [x] Deletar transações individuais ou em massa
- [x] Selecionar múltiplas transações
- [x] Duplicar transações
- [x] Categorização automática por IA

### Importação
- [x] Importar de JSON
- [x] Importar de CSV
- [x] Importar de OFX (formato bancário)
- [x] Importação automática com categorização

### Categorização
- [x] Categorias pré-definidas (Alimentação, Transporte, Lazer, etc.)
- [x] 10 categorias com +100 palavras-chave
- [x] Métodos de pagamento (Dinheiro, PIX, Débito, Crédito)
- [x] Observações personalizadas

### Filtros e Busca
- [x] Busca por descrição
- [x] Filtro por tipo (Entrada/Saída)
- [x] Filtro por categoria
- [x] Filtro por método de pagamento
- [x] Filtro por período (data início/fim)
- [x] Ordenação por colunas

### Relatórios e Exportação
- [x] Resumo financeiro (Entradas, Saídas, Saldo)
- [x] Gráfico de gastos por categoria
- [x] Exportar para Excel
- [x] Exportar para PDF
- [x] Exportar para CSV
- [x] Exportar para JSON
- [x] Importar de JSON/CSV/OFX
- [x] Imprimir tabela
- [x] Extrato detalhado com filtros

### Planejamento
- [x] Definir meta mensal
- [x] Alerta ao atingir percentual da meta
- [x] Orçamento por categoria
- [x] Transações recorrentes

### Interface
- [x] Tema claro/escuro
- [x] Calendário integrado
- [x] Responsivo mobile-first (3 breakpoints)
- [x] Menu hamburger para mobile
- [x] Paginação de resultados
- [x] Animações e feedback visual (Toastify)
- [x] Atalhos de teclado

### PWA e Offline
- [x] Service Worker com cache
- [x] Funciona offline
- [x] Indicador de status offline
- [x] Sincronização automática
- [x] Notificações push

---

## 🛠 Tecnologias

### Front-end
| Tecnologia | Descrição |
|------------|-----------|
| HTML5 | Estrutura semântica |
| CSS3 | Estilização moderna (mobile-first) |
| JavaScript | Lógica da aplicação |
| Service Worker | PWA offline |
| Toastify.js | Notificações |
| Font Awesome | Ícones |
| SheetJS | Exportação Excel |
| jsPDF | Exportação PDF |
| PapaParse | Parsing CSV |
| html2canvas | Captura de tela |

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
│   ├── api/
│   │   ├── config/
│   │   │   ├── database.js      # Configuração do banco
│   │   │   └── jwt.js          # Configuração JWT
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── financeiroController.js
│   │   ├── docs/
│   │   │   └── index.html      # Documentação da API
│   │   ├── middleware/
│   │   │   └── auth.js         # Middleware de autenticação
│   │   ├── routes/
│   │   │   └── index.js        # Rotas da API
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   └── financeiroService.js
│   │   ├── utils/
│   │   │   ├── queryHelpers.js  # Helpers SQL
│   │   │   └── validators.js   # Validações
│   │   └── index.js            # Entry point
│   ├── lib/
│   │   ├── lib_auth.js
│   │   ├── lib_db.js
│   │   └── lib_middlewares.js
│   ├── .env
│   ├── vercel.json
│   └── package.json
│
├── front-end/
│   ├── css/
│   │   ├── Login.css
│   │   └── modern.css
│   ├── extrato/
│   │   └── extrato.html
│   ├── imgs/
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── events.js
│   │   ├── export.js
│   │   ├── finance.js
│   │   ├── formatters.js
│   │   ├── main.js
│   │   ├── notifications.js    # Notificações PWA
│   │   ├── shortcuts.js        # Atalhos de teclado
│   │   ├── table.js
│   │   └── utils.js
│   ├── login/
│   │   ├── login.html
│   │   ├── login.js
│   │   ├── register.js
│   │   └── Esqueci a senha/
│   │       ├── Senha.html
│   │       ├── esqueci.js
│   │       └── esqueci.css
│   ├── sw.js                   # Service Worker
│   ├── index.html
│   ├── extrato.js
│   ├── vercel.json
│   └── manifest.json
│
├── locally/                    # Versão local (SQLite)
├── LICENSE
└── readme.md
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
npm install -g vercel
vercel dev
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
3. Deploy!

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
  "valor": 250.00,
  "entradaSaida": "Saída",
  "categoria": "Alimentação",
  "metodoPagamento": "PIX",
  "observacoes": "Compras da semana"
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
| metodoPagamento | TEXT | Método de pagamento |
| observacoes | TEXT | Observações |

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
- [x] **JWT tokens** com expiração
- [x] **Rate limiting** (1000 req/15min por IP)
- [x] **Helmet.js** para headers de segurança
- [x] **CORS** configurado para origens específicas
- [x] **Validação de inputs** no backend
- [x] **SQL injection** prevenido com parameterized queries
- [x] **Trust proxy** habilitado para Vercel

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + N` | Novo lançamento |
| `Ctrl + S` | Salvar |
| `Ctrl + E` | Exportar |
| `Ctrl + F` | Buscar |
| `Ctrl + D` | Deletar |
| `Ctrl + ,` | Ir para perfil |
| `Esc` | Fechar modal |
| `F1` ou `?` | Mostrar ajuda |
| `F5` | Atualizar página |
| `+` | Próxima página |
| `-` | Página anterior |

---

## 📱 Modo Offline (PWA)

A aplicação funciona offline:

1. **Cache de Assets**: CSS, JS, HTML são cacheados
2. **Cache de Dados**: Lista de transações é cacheada
3. **Indicador**: Banner amarelo indica quando offline
4. **Sincronização**: Dados são sincronizados quando volta online

Para instalar como PWA:
1. Abra no Chrome/Edge
2. Clique em "Instalar" no banner ou menu

---

## 📸 Demonstração

- **Aplicação:** https://projeto-financeiro-frontend.vercel.app
- **Documentação API:** https://financeiro-backend.vercel.app/api/docs
- **Status API:** https://financeiro-backend.vercel.app/api/health

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
