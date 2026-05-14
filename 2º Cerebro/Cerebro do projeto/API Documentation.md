---
title: API Documentation
description: Referência completa da API REST do Gestor Financeiro
date: 2026-03-27
tags:
  - api
  - reference
  - endpoints
  - backend
aliases:
  - API Reference
  - Endpoints
  - Rotas da API
cssclasses:
  - clean-embeds
---

# API Documentation

> Base URL: `https://financeiro-backend.vercel.app/api`  
> Local: `http://localhost:3000/api`

%%自动生成 - mantida sincronizada com o código-fonte%%

---

## Autenticação

Todas as rotas protegidas usam `Authorization: Bearer <token>` no header.

> [!info] Token JWT
> O token é obtido via [[API Documentation#Registro|/api/register]] ou [[API Documentation#Login|/api/login]].  
> Expira em 7 dias. Renove com `POST /api/refresh-token`.

---

## Endpoints

### Saúde e Docs

```http
GET /api/health
GET /api/docs
```

| Rota | Descrição |
|------|-----------|
| `GET /api/health` | Status do servidor + banco + versão |
| `GET /api/docs` | Página HTML interativa com a documentação |

> [!example] `GET /api/health` Response
> ```json
> {
>   "status": "OK",
>   "database": "connected",
>   "version": "1.0.0",
>   "timestamp": "2026-03-27T12:00:00.000Z",
>   "features": {
>     "socialLogin": true,
>     "notifications": true,
>     "autoCategorize": true
>   }
> }
> ```

---

### Registro

```http
POST /api/register
Content-Type: application/json

{
  "nome": "João",
  "sobrenome": "Silva",
  "email": "joao@email.com",
  "senha": "123456"
}
```

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `nome` | string | ✅ |
| `sobrenome` | string | ✅ |
| `email` | string | ✅ |
| `senha` | string | ✅ |

> [!success] 201 Created
> ```json
> { "message": "Usuário registrado com sucesso.", "id": 1, "token": "jwt..." }
> ```

> [!failure] 400 Error
> ```json
> { "error": "Este email já está registrado." }
> ```

---

### Login

```http
POST /api/login
Content-Type: application/json

{ "email": "joao@email.com", "senha": "123456" }
```

> [!success] 200 OK
> ```json
> { "token": "jwt...", "nome": "João", "sobrenome": "Silva", "email": "joao@email.com" }
> ```

---

### OAuth2 (Login Social)

```http
GET /api/auth/google                  # Redireciona para Google
GET /api/auth/google/callback         # Callback → redirect para callback.html?token=
GET /api/auth/github                  # Redireciona para GitHub
GET /api/auth/github/callback         # Callback → redirect para callback.html?token=
GET /api/auth/failure                 # Fallback de erro
```

> [!tip] Fluxo OAuth2 via Popup
> 1. Botão → abre popup para `/api/auth/{provider}`
> 2. Backend redireciona para provedor OAuth
> 3. Provedor redireciona de volta → Passport valida → gera JWT
> 4. Backend redireciona para `callback.html?token=<jwt>`
> 5. `callback.html` envia token via `postMessage` para janela pai
> 6. Pai salva token no `localStorage` e redireciona para dashboard

> [!warning] Configuração Necessária
> Exige `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` nas env vars.  
> Sem elas, as rotas retornam `501 Not Implemented`.

---

### Login Social (Mobile / Direct)

```http
POST /api/login/social
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "12345",
  "provider": "google",
  "displayName": "João Silva",
  "emails": [{ "value": "joao@email.com" }],
  "photos": [{ "value": "https://..." }]
}
```

> [!warning] Requer autenticação JWT
> Esta rota espera que o cliente já tenha o token social e passa o profile do usuário.  
> Usado para integração mobile ou fluxos onde o OAuth é feito no frontend.

---

### Refresh Token

```http
POST /api/refresh-token
Authorization: Bearer <token_expirado>
```

> [!success] 200 OK
> ```json
> { "token": "novo_jwt..." }
> ```

---

### Esqueci Senha / Reset

```http
POST /api/forgot-password
Content-Type: application/json

{ "email": "joao@email.com" }
```

> [!example] Response
> ```json
> { "message": "Código de recuperação gerado.", "code": "123456" }
> ```
>
> %%Em produção, o código é enviado por email. Em dev, logado no console.%%

```http
POST /api/reset-password
Content-Type: application/json

{ "email": "joao@email.com", "code": "123456", "senha": "nova123" }
```

> [!success] 200 OK
> ```json
> { "message": "Senha redefinida com sucesso." }
> ```

---

### Perfil

```http
GET /api/profile
Authorization: Bearer <token>
```

> [!success] 200 OK
> ```json
> { "id": 1, "nome": "João", "sobrenome": "Silva", "email": "joao@email.com", "foto": null, "provider": null, "created_at": "2026-01-01T00:00:00.000Z" }
> ```

```http
PUT /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{ "nome": "João Updated", "sobrenome": "Silva" }
```

```http
PUT /api/change-password
Authorization: Bearer <token>
Content-Type: application/json

{ "senhaAtual": "123456", "novaSenha": "nova123" }
```

---

### Transações (CRUD)

#### Salvar

```http
POST /api/salvar
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "2026-03-27",
  "descricao": "Uber para o aeroporto",
  "valor": 45.90,
  "entradaSaida": "Saída",
  "categoria": "Transporte",
  "metodoPagamento": "Crédito",
  "observacoes": "Corrida matinal"
}
```

> [!tip] Categoria Automática
> Se `categoria` não for fornecida, o sistema detecta por palavras-chave na descrição.  
> "Uber" → **Transporte**. Veja [[API Documentation#Categorias]] para a lista completa.

#### Listar

```http
GET /api/listar?mes=3&ano=2026&page=1&limit=20&search=uber&categoria=Transporte&entradaSaida=Saída
Authorization: Bearer <token>
```

| Query | Tipo | Descrição |
|-------|------|-----------|
| `mes` | int | Filtro por mês |
| `ano` | int | Filtro por ano |
| `page` | int | Paginação (default: 1) |
| `limit` | int | Itens por página (default: 50) |
| `search` | string | Busca textual na descrição |
| `categoria` | string | Filtro por categoria |
| `entradaSaida` | string | "Entrada" ou "Saída" |
| `metodoPagamento` | string | Filtro por método |

> [!success] 200 OK
> ```json
> {
>   "lancamentos": [ { "id": 1, "data": "2026-03-27", ... } ],
>   "total": 150,
>   "page": 1,
>   "totalPages": 8
> }
> ```

#### Editar

```http
PUT /api/editar
Authorization: Bearer <token>
Content-Type: application/json

{
  "updates": [
    { "id": 1, "valor": 50.00, "categoria": "Transporte" },
    { "id": 2, "descricao": "Novo nome" }
  ]
}
```

#### Deletar

```http
DELETE /api/deletar
Authorization: Bearer <token>
Content-Type: application/json

{ "id": 1 }
```

Ou múltiplos:

```http
DELETE /api/deletar
Content-Type: application/json

{ "ids": [1, 2, 3] }
```

---

### Importação

#### Importar Lançamentos (JSON)

```http
POST /api/importar
Authorization: Bearer <token>
Content-Type: application/json

{
  "lancamentos": [
    { "data": "2026-03-01", "descricao": "Mercado", "valor": 200.00, "entradaSaida": "Saída" }
  ]
}
```

#### Importação Automática (OFX/CSV)

```http
POST /api/importar/auto
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileType": "ofx",
  "content": "<OFX>...</OFX>"
}
```

| `fileType` | Formato | Separador |
|:----------:|---------|:---------:|
| `ofx` | OFX (Open Financial Exchange) | N/A |
| `csv` | CSV com header | `;` (ponto e vírgula) |
| `json` | JSON array | N/A |

> [!tip] Headers esperados no CSV
> `data;descricao;valor;entradaSaida`  
> A categorização é automática.

---

### Categorias

```http
GET /api/categorias/palavras
Authorization: Bearer <token>
```

> [!example] Response
> ```json
> {
>   "categorias": {
>     "Alimentação": ["supermercado", "mercado", "restaurante", ...],
>     "Transporte": ["uber", "gasolina", "posto", ...],
>     ...
>   }
> }
> ```

---

## Códigos de Erro

| Status | Significado |
|:------:|-------------|
| 200 | Sucesso |
| 201 | Criado (registro) |
| 400 | Dados inválidos / campo obrigatório |
| 401 | Token não fornecido |
| 403 | Token inválido ou expirado |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |
| 501 | Funcionalidade não configurada (ex: OAuth sem env vars) |
| 503 | Banco de dados indisponível |

%%==================================================================================%%

## Notas Relacionadas

- [[Gestor Financeiro]]
- [[Readme do Projeto]]
- [[Service Worker Notes]]
- [[Ideias de Melhorias]]
