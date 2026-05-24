---
title: API Documentation
description: Referência completa da API REST do Gestor Financeiro
date: 2026-05-21
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

> Base URL: `https://projeto-financeiro-vert.vercel.app/api`  
> Local: `http://localhost:3000/api`
>
> Local: 'http://localhost:3000/api/auth/github/callback'
   vercel: https://projeto-financeiro-vert.vercel.app/api/auth/github/callback
   local: http://localhost:3000/api/auth/google/callback
   vercel: https://projeto-financeiro-vert.vercel.app/api/auth/google/callback

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
> 4. Backend redireciona para `/#/callback?token=<jwt>`
> 5. `CallbackPage.js` envia token via `postMessage` para janela pai
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

> [!example] Response (dev mode — SMTP não configurado)
> ```json
> { "message": "Código enviado!", "devMode": true, "code": "123456" }
> ```
>
> [!example] Response (produção — SMTP configurado)
> ```json
> { "message": "Código enviado!" }
> ```
>
> %%O código é enviado por email via SMTP. Em dev, retornado no response e exibido na tela.%%
> %%Configurar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` no .env para envio real.%%

```http
POST /api/reset-password
Content-Type: application/json

{ "email": "joao@email.com", "code": "123456", "senha": "nova123" }
```

> [!success] 200 OK
> ```json
> { "message": "Senha redefinida com sucesso." }
> ```

> [!failure] 400 — 3 mensagens de erro distintas
> ```json
> { "error": "Nenhum código foi solicitado para este email. Solicite um novo código." }
> { "error": "Código inválido. Verifique se digitou corretamente." }
> { "error": "Código expirado. Solicite um novo código." }
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
  "id": 1,
  "descricao": "Novo nome",
  "valor": 50.00,
  "categoria": "Transporte"
}
```

Aceita edição única ou múltipla com `updates: [...]`.

#### Deletar

```http
DELETE /api/deletar?id=1
Authorization: Bearer <token>
```

O backend lê o ID de `req.query.id` (também aceita `req.body.id` como fallback).

> [!warning] Exclusão em lote
> O frontend faz requisições individuais em loop. O backend **não** aceita `{ ids: [...] }`.

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

> [!tip] Headers aceitos no CSV
> O parser detecta automaticamente os headers (com ou sem acentos, quotes).
> - **Descrição**: `descricao`, `descrição`, `nome`, `name`, `memo`, `lançamento`
> - **Valor**: `valor`, `amount`, `value`
> - **Data**: `data`, `date`, `data transação`
> - **Tipo** (opcional): `tipo`, `tipo_` — se presente, usado como fonte primária (evita dedução pelo sinal do valor)
> - **Categoria** (opcional): `categoria`, `category` — se presente, usado; senão, auto-categoriza
> - **MetodoPagamento** (opcional): `metodopagamento`, `metodo_pagamento`, `método de pagamento`, `pagamento`
>
> O separador é auto-detectado (`;` ou `,`). BOM UTF-8 e `\r\n` são tratados automaticamente.

> [!tip] Debug da Importação
> A resposta de `POST /api/importar/auto` agora inclui `debug.sample` com os 3 primeiros registros parseados, útil para diagnóstico.

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
