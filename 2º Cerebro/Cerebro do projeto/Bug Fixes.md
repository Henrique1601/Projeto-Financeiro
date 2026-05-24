---
title: Bug Fixes
description: Histórico de bugs encontrados e corrigidos
date: 2026-05-21
tags:
  - bugs
  - changelog
aliases:
  - Correções
  - Bug Log
cssclasses:
  - clean-embeds
---

# Bug Fixes

## 2026-05-21 — Lote 1: 8 bugs

### 1. Tipo "Saída" vira "Entrada" na tabela (revisado)
**Causa raiz:** O form de nova transação usava `document.getElementById('formTipo').value` para determinar o tipo, mas sem fallback para o sinal do valor numérico. Se o valor fosse negativo (ex: "-100") mas o select ainda estivesse em "Entrada" (default), o tipo ficava como Entrada. Além disso, o badge na tabela e o select de edição usavam `.includes('sa')` que é menos robusto que `isSaida()`.
**Solução:** 
- Submit do form agora também detecta `rawValor < 0` como Saída (fallback)
- Badge da tabela usa `isSaida()` importado de `format.js`
- Select de edição usa `isSaida()` para pré-selecionar o tipo correto
- Remove dependência de `.includes('sa')` em toda a DashboardPage

### 2. Duplicar transação quebra com erro
**Causa:** `duplicarLancamento()` passava `{...lanc, id: null}` para `showFormModal()`. Como o objeto era truthy, `isEdit = !!editData` resultava em `true`, mas o submit tentava fazer PUT com `editData.id = null`, lançando "ID do lançamento não encontrado".
**Solução:** `showFormModal()` agora usa `isEdit = !!editData && !!editData.id`. Sem `id`, trata como criação (POST) em vez de edição (PUT).

### 3. Botão "Excluir Selecionados" não aparece
**Causa:** CSS `#bulkDeleteBtn { display: none; }` tinha maior especificidade que o `style.display = ''` setado via JS, mantendo o botão invisível mesmo com itens selecionados.
**Solução:** Removida a regra CSS conflitante. O botão já começa com `style="display:none"` no HTML e é controlado exclusivamente por JS.

### 4. Botões "Nova Transação" e "Importar" acima dos gráficos
**Causa:** A div `quick-actions` estava posicionada antes dos charts e insights no HTML do dashboard.
**Solução:** Movidos os botões para dentro de `.filter-actions` (row própria abaixo dos filtros), ao lado de "Filtrar" e "Limpar".

### 5. Sidebar abre e fecha imediatamente / não tem como fechar
**Causa (abrir):** O handler de clique no `mainContent` fechava a sidebar ao clicar em QUALQUER lugar dentro dele — inclusive no botão hamburger. Como o hamburger está DENTRO de `mainContent`, o evento de clique subia do hamburger → mainContent, abrindo e fechando a sidebar na mesma sequência.
**Causa (fechar):** Não havia botão de fechar, clique-fora, ou Esc para fechar.
**Solução:** 
- `mainContent` handler ignora cliques que originaram do `#mobileMenuBtn` ou `#sidebar` (`e.target.closest()`)
- Adicionado botão ✕ no header da sidebar (visível apenas no mobile)
- Fechamento com tecla Esc

### 6. Import mostra "0 registros" mas importa tudo
**Causa:** O backend retorna `{ insertedIds, updatedIds }` mas o frontend usava `result.count || 0` — `result.count` é `undefined`, então sempre mostrava 0.
**Solução:** Alterado para `(result.insertedIds?.length || 0) + (result.updatedIds?.length || 0)`. Também adicionado `await showDashboard()` após o import para atualizar a tela automaticamente.

### 7. ChangePasswordPage não consegue voltar ao dashboard
**Causa:** O link "Voltar ao Dashboard" usava `window.dispatchEvent(new CustomEvent('navigate', ...))`, mas o router SPA não escuta esse evento — ele escuta apenas `hashchange`.
**Solução:** Alterado para `window.location.hash = '#/dashboard'`.

### 8. Erro "apiPut is not defined" ao alterar senha
**Causa:** `auth.js` importava apenas `apiGet` e `apiPost`, mas a função `changePassword()` usava `apiPut()`.
**Solução:** Adicionado `apiPut` ao import em `auth.js`.

---

## 2026-05-21 — Lote 2: 4 bugs (pós-teste)

### 1 (reaberto). Tipo ainda fica "Entrada" ao adicionar nova transação
**Causa adicional:** O submit do form não tratava o caso de valor negativo digitado manualmente (ex: "-100") sem alterar o select de tipo. O select default é "Entrada", então mesmo com valor negativo, o tipo enviado era "Entrada".
**Solução revisada:** Submit agora infere `tipoFinal` de forma combinada: `isSaidaForm || isNegativeValue ? 'Saída' : 'Entrada'`. Também adiciona fallback de sinal: se o select diz "saida" OU o valor é negativo, envia como Saída.

### 2. Filtro não filtra por "Saídas"
**Causa:** O filtro usava comparação manual com `String(l.entradaSaida).trim().toLowerCase()` em vez de usar a função `isSaida()` já existente. Em dados com encoding diferente (acentos), a comparação `tipo !== 'saída'` podia falhar.
**Solução:** Substituído por `isSaida(l.entradaSaida)` em ambas as condições do filtro (entrada e saída).

### 3. Sidebar não abre (abria e fechava instantaneamente)
**Causa:** O handler de clique no `mainContent` interceptava o clique no botão hamburger (que está DENTRO de `mainContent`), fechando a sidebar no mesmo instante que ela abria via `classList.toggle('open')`.
**Solução:** Adicionado `if (e.target.closest('#mobileMenuBtn') || e.target.closest('#sidebar')) return;` no início do handler.

### 4. Botões empilhados verticalmente no filter-bar
**Causa:** Todos os 10 itens (6 filtros + 4+ botões) estavam como flex items diretos do `.filter-bar`, que tinha `flex-wrap: wrap`. Com muitos itens e min-width de 150px cada, os botões quebravam pra linha debaixo, mas como cada botão é um flex item individual, ficavam empilhados.
**Solução:** 
- Separado em `.filter-fields` (filtros) e `.filter-actions` (botões) dentro do `.filter-bar`
- `.filter-bar` virou `flex-direction: column` com gap 12px
- `.filter-fields` mantém `flex-wrap: wrap` para inputs
- `.filter-actions` tem `flex-wrap: wrap` para botões lado a lado
- min-width reduzido de 150px para 130px nos form-group

---

## 2026-05-21 — Lote 3: Reforma completa do sistema de tipo (Entrada/Saída)

O bug de tipo errado era SISTÊMICO e persistente, afetando dashboard, extrato, CSV, PDF, importação e estatísticas. A causa raiz era a dependência do campo texto `entradaSaida`, que podia ficar inconsistente com o sinal do `valor` em vários cenários (importação, form, encoding).

### Reforma completa

**Backend** (`financeiroService.js`):

- `salvarLancamento`: `entradaSaida` agora é **sempre derivada** do sinal de `valor`: `parseFloat(valor) < 0 ? 'Saída' : 'Entrada'`. Ignora qualquer valor enviado pelo frontend.
- `importarLancamentos`: usa `entradaSaida` se fornecido, senão deriva do sinal de `valor`. Removeu validação estrita `!['Entrada', 'Saída'].includes(entradaSaida)` que quebrava imports com tipos não normalizados.

**Frontend** (`format.js`):

- `isSaida(item)`: reformada para aceitar tanto **objeto** (lançamento) quanto **string**. Quando recebe objeto, **prioriza o sinal de `item.valor`** sobre `item.entradaSaida`. O `entradaSaida` text vira fallback.
- `getTipo(item)`: nova função auxiliar que retorna `'Saída'` ou `'Entrada'` usando `isSaida()`.

**Dashboard** (`DashboardPage.js`):

- **TODAS as 15 ocorrências** de `isSaida(l.entradaSaida)` substituídas por `isSaida(l)` — passa o objeto inteiro, não a string.
- `calcularStats()`: substituído `String(l.entradaSaida).toLowerCase()` por `isSaida(l)`.
- CSV export: `l.entradaSaida || ''` → `getTipo(l)`.
- JSON export: `l.entradaSaida || ''` → `getTipo(l)`.
- Export filter: removida variável morta `const t = ...`, usa `isSaida(l)`.
- Form submit: `isSaidaFinal = formTipo === 'saida' || rawValor < 0`. O sinal de `valor` agora **sempre corresponde** ao `entradaSaida` enviado, eliminando divergência frontend↔backend.

**Extrato** (`ExtratoPage.js`):

- **Todas as 5 ocorrências** de `isSaida(l.entradaSaida)` substituídas por `isSaida(l)`.

---

## 2026-05-21 — Lote 5: Forgot/Reset password + email + hash router query params

### Problema
1. Esqueci senha gerava código mas nunca enviava email (só log no console)
2. Link "Redefinir senha" ia para `#/reset-password` (rota errada) e não `#/resetar-senha`
3. Router ignorava query params na hash route (`/resetar-senha?email=x` não batia a rota)
4. ResetPasswordPage lia `window.location.search` em vez de query da hash

### Causas
- `router.js:30`: `ROUTES.get(hash)` usava a hash **completa** (ex: `/resetar-senha?email=x`), mas a rota registrada era `/resetar-senha` (sem query) → `undefined` → 404.
- `ResetPasswordPage.js:6`: usava `new URLSearchParams(window.location.search)` — em hash routing, query params ficam na **hash**, não no `search`.
- `authService.js:163`: `forgotPassword` só logava o código no console, nunca enviava email.
- `ForgotPasswordPage.js:30`: link apontava para `#/reset-password` → rota inexistente.

### Soluções

**Router** (`router.js`):
- `onHashChange()` agora separa path de query string: `const [path, queryString] = fullHash.split('?')`
- `ROUTES.get(path)` usa só o path (sem query) para match de rota
- Query params parseados e expostos via `getRouteParams()` — store reativa para páginas consumirem

**ResetPasswordPage** (`ResetPasswordPage.js`):
- Troca `new URLSearchParams(window.location.search)` por `getRouteParams()`
- Agora lê `params.email` e `params.code` da hash corretamente

**ForgotPasswordPage** (`ForgotPasswordPage.js`):
- Link corrigido para `#/resetar-senha?email=...` (rota correta)
- Usa `onclick="window.location.hash=..."` em vez de `<a>` para consistência
- Exibe o código na tela em modo dev

**Email Service** (novo `emailService.js`):
- Usa Nodemailer com SMTP configurável via env vars
- Se `SMTP_USER`/`SMTP_PASS` não configurados → modo dev (código na tela)
- Se configurados → envia email HTML com código de recuperação
- Template HTML responsivo inline

**Auth Service** (`authService.js`):
- `forgotPassword`: chama `sendResetCode(email, code)`
- Se `devMode` → retorna `code` na resposta (frontend exibe)
- Se enviado → retorna mensagem genérica "Código enviado para seu e-mail"

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `front-end/src/router.js` | Separa path/query; `getRouteParams()` |
| `front-end/src/pages/ResetPasswordPage.js` | Usa `getRouteParams()` |
| `front-end/src/pages/ForgotPasswordPage.js` | Link correto + exibe código |
| `backend/api/services/authService.js` | Remove bloqueio social; chama email service |
| `backend/api/services/emailService.js` | **Novo** — Nodemailer SMTP |
| `backend/api/index.js` | Error handler: "rede social" → 400 |

### Configuração de Email (Produção)

Para enviar emails de verdade, adicionar no `.env`:

```env
# Gmail (requer senha de app)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=senha-de-app-do-gmail

# Ou SendGrid
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=SG.xxxxx
```

Sem essas vars, o sistema opera em **modo dev**: código exibido na tela do frontend.

### Problema
Importar CSV que foi **exportado do próprio app** resultava em todos os registros com:
- `descricao = 'Transação'` (padrão, nunca lia o campo real)
- `categoria = 'Outros'` (consequência da descrição errada)
- `entradaSaida = 'Entrada'` (sempre, pois ignorava a coluna Tipo)

### Causas (múltiplas falhas acumuladas)

1. **Acento na descrição**: CSV exporta `Descrição` (com `ç`), parser buscava `row.descricao` (sem acento).
2. **Coluna Tipo ignorada**: Parser derivava `entradaSaida` exclusivamente do sinal de `valor` (`valor < 0 ? 'Saída' : 'Entrada'`). Como o export sempre usa `Math.abs(valor)`, todo valor é positivo → toda reimportação vira "Entrada".
3. **`\r\n` (Windows)**: Parser só fazia `split('\n')`, deixando `\r` no último campo de cada linha.
4. **BOM UTF-8**: Excel adiciona `\uFEFF` no início do CSV → primeiro header virava `'\ufeffData'` em vez de `'data'`.
5. **Quotes nos cabeçalhos**: CSV com `"Data";"Descrição"` → headers viravam `'"data"'` em vez de `'data'`.
6. **`metodoPagamento` ignorado**: `importarLancamentos` não inseria `metodoPagamento` nem `observacoes`.
7. **Sinal do `valor` inconsistente**: OFX, JSON e CSV todos armazenavam `Math.abs(valor)`, mas o tipo era derivado do sinal. Para Saída, o valor deveria ser NEGATIVO.

### Solução — `parseCSV` refeito

- Normaliza `\r\n` e `\r` → `\n`
- Remove BOM (`\uFEFF`)
- Auto-detecta separador `;` ou `,` (conta qual tem mais no header)
- Parse inteligente de quoted fields (lida com `;` dentro de aspas)
- Strip aspas dos cabeçalhos APÓS lowercasing
- **Lê a coluna `Tipo` do CSV**: se o valor for `"Saída"`, `ehSaida = true`
- Deriva `entradaSaida` da coluna Tipo (NÃO mais do sinal do valor)
- Ajusta sinal do `valor`: negativo para Saída, positivo para Entrada
- Mapeia 10+ variações de nome de coluna: `descricao`, `descrição`, `nome`, `nome`, `memo`, `lançamento`, `description`, `descr`, `valor`, `valor `, `valor_`, `amount`, `value`, `data`, `data `, `data_`, `date`, `dt`, `tipo`, `tipo `, `tipo_`, `categoria`, `categoria_`, `categoria `, `category`
- Lê `metodoPagamento` do CSV (5 aliases)
- Data DD/MM/AA → YYYY-MM-DD com padding e ano de 2 dígitos

### Solução — `parseOFX` corrigido

- Normaliza `\r\n` e `\r`
- Armazena `valor` negativo para Saída (antes era sempre `Math.abs`)
- `entradaSaida` derivada do sinal de `rawValor` (já que OFX usa negativo para débitos)

### Solução — JSON import corrigido (`importarAuto`)

- Lê `entradaSaida` do JSON
- Se for "Saída", armazena `valor` negativo
- Se não fornecido, deriva do sinal de `valor`

### Solução — `importarLancamentos` corrigido

- Agora destrutura `item` inteiro (não só campos específicos)
- Insere `metodoPagamento` + `observacoes` no INSERT
- Usa `entradaSaida` do parser (com fallback ao sinal)

### Solução — `salvarLancamento` (form) mantido

- Já deriva `entradaSaida` do sinal de `valor`
- Frontend envia `valor` com sinal correto (negativo para Saída, positivo para Entrada)
- Frontend agora usa `isSaidaFinal = formTipo === 'saida' || rawValor < 0`

### Solução — `isSaida()` em `format.js`

- Já trata corretamente: se `valor < 0` → Saída; senão, checa `entradaSaida` texto
- Com a importação corrigida, TODOS os registros têm sinal correto → `isSaida` funciona sempre

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `backend/api/services/financeiroService.js` | `parseCSV` refeito; `parseOFX` sign fix; JSON sign fix; `importarLancamentos` incluí `metodoPagamento` + `observacoes`; debug no response |
| `front-end/src/pages/DashboardPage.js` | Import exibe "Amostra dos dados" para debug; form submit usa `isSaidaFinal` |
| `front-end/src/utils/format.js` | `isSaida()` prioriza `entradaSaida` texto, fallback ao sinal |

### Diagnóstico Adicionado

O endpoint `POST /api/importar/auto` agora retorna `result.debug.sample` com os 3 primeiros registros parseados. O frontend exibe um `<details>` "Amostra dos dados" com JSON formatado abaixo da mensagem de sucesso.

---

## 2026-05-21 — Lote 6: Reset-password diagnostics, SMTP button fix, timezone expiration

### 1. "Código inválido ou expirado" sem detalhes

**Causa:** O erro genérico `'Código inválido ou expirado.'` não informava qual dos 3 cenários ocorreu:
- Nenhum registro de `password_resets` encontrado
- Código não corresponde
- Código expirou

**Solução:** `resetPassword()` em `authService.js` agora tem 3 verificações separadas com mensagens específicas:
1. `'Nenhum código foi solicitado para este email. Solicite um novo código.'`
2. `'Código inválido. Verifique se digitou corretamente.'`
3. `'Código expirado. Solicite um novo código.'`

### 2. Erro de timezone na expiração

**Causa:** A comparação `expires_at > NOW()` no SQL podia falhar por diferença de timezone entre Node.js (que insere) e PostgreSQL (que compara com `NOW()`). Se os fusos divergissem, um código recém-gerado aparecia como expirado.

**Solução:** Substituída comparação SQL por JavaScript: `new Date(existing.expires_at) < new Date()`. Agora a verificação ocorre no mesmo runtime, eliminando discrepância de timezone.

### 3. Botão "Redefinir senha" não aparece quando SMTP envia email

**Causa:** Em `ForgotPasswordPage.js`, o botão de navegação `#/resetar-senha?email=...` estava dentro de `if (result?.code)`. Quando o SMTP está configurado e envia o código por email, o backend NÃO retorna `result.code` (só retorna em dev mode). Portanto, o botão nunca era renderizado.

**Solução:** Separado o bloco `if (result?.code)` — a caixa visual do código fica dentro do `if`, mas o botão "Redefinir senha" foi movido para **fora**, renderizando sempre.

### 4. Erro handler não cobria novos códigos de erro

**Causa:** `index.js` só tratava `'obrigatório'` e `'rede social'` como 400, mas os novos erros `'inválido'`, `'expirado'`, `'código foi solicitado'` caíam como 500.

**Solução:** Adicionados `'inválido'`, `'expirado'`, `'código foi solicitado'` à lista de triggers para status 400.

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `backend/api/services/authService.js` | 3 verificações separadas + comparação JS (não SQL `NOW()`) |
| `backend/api/index.js` | Error handler: +`'inválido'`, `'expirado'`, `'código foi solicitado'` → 400 |
| `front-end/src/pages/ForgotPasswordPage.js` | Botão "Redefinir senha" sempre visível |

---

## 2026-05-21 — Lote 7: Perfil + Notificações Push

### Features implementadas

**Página de Perfil** (`#/perfil`):
- Nova `ProfilePage.js` com edição de nome, sobrenome e URL da foto
- Seletor de tema que sincroniza com o backend (`PUT /api/profile` com `{theme}`)
- Botão "Alterar Senha" com link direto
- Toggle de notificações push (solicita permissão, assina subscription)
- Rota `/perfil` registrada, atalho `Ctrl+P`, link na sidebar do Dashboard
- `theme.js`: `initTheme()` aceita tema do servidor; `setTheme()` sincroniza via PUT
- `main.js`: busca tema do backend no login e passa para `initTheme()`

**Notificações Push**:
- Nova `notificationService.js` — CRUD de `push_subscriptions` no banco
- `POST /api/push/subscribe` — salva subscription do usuário (autenticado)
- `GET /api/push/vapid-public-key` — retorna chave pública VAPID
- `sw.js`: listeners `push` e `notificationclick` — exibe notificação, abre URL ao clicar
- Tabela `push_subscriptions` criada no `database.js`
- Health check agora verifica VAPID keys (`features.pushNotifications`)

### Arquivos Modificados/Criados

| Arquivo | Mudança |
|---------|---------|
| `front-end/src/pages/ProfilePage.js` | **Novo** — Página de perfil completa |
| `front-end/src/styles/profile.css` | **Novo** — Estilos do perfil |
| `front-end/src/auth.js` | +`updateProfile()` export |
| `front-end/src/main.js` | Rota `/perfil` + Ctrl+P + initTheme com tema do servidor |
| `front-end/src/theme.js` | `initTheme(serverTheme)` + `syncThemeToBackend()` |
| `front-end/src/pages/DashboardPage.js` | Link "Perfil" na sidebar |
| `front-end/src/pages/ProfilePage.js` | Botão "Dashboard" flutuante com glassmorphism + hover reveal + Esc |
| `front-end/src/styles/profile.css` | `.profile-back-btn` — botão editorial animado |
| `front-end/index.html` | +`profile.css` |
| `front-end/public/sw.js` | Listeners `push` + `notificationclick` |
| `backend/api/services/notificationService.js` | **Novo** — CRUD push subscriptions |
| `backend/api/config/database.js` | Coluna `theme` + tabela `push_subscriptions` |
| `backend/api/services/authService.js` | `getUserProfile` retorna theme; `updateUserProfile` aceita theme/foto |
| `backend/api/routes/index.js` | Rotas `/push/subscribe` + `/push/vapid-public-key` |
