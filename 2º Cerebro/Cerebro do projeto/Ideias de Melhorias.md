---
title: Ideias de Melhorias
description: Roadmap, features futuras e ideias para o Gestor Financeiro
date: 2026-05-25
tags:
  - roadmap
  - ideias
  - features
  - todo
aliases:
  - Roadmap
  - Melhorias Futuras
  - TODOs
cssclasses:
  - clean-embeds
---

# Ideias de Melhorias

> [!quote] "O software nunca está pronto."  
> Lista organizada de próximos passos, organizada por prioridade e esforço.

---

## ✅ Últimas Implementações (26/05/2026)

### 🔒 Autenticação de Dois Fatores (2FA)
- [x] Tabela `user_2fa` no banco (auto-create em `database.js`)
- [x] `twoFAService.js` — TOTP (app autenticador) + código por email + backup codes (8, uso único)
- [x] Login interceptado: retorna `{ requires2FA, tempToken }` quando 2FA ativo
- [x] Temp token JWT (5min, `{ id, purpose: '2fa' }`)
- [x] 6 rotas 2FA (`POST /api/login/2fa`, `/resend`, `GET /api/auth/2fa/status`, `POST /api/auth/2fa/setup`, `/verify`, `DELETE /api/auth/2fa`)
- [x] `LoginPage.js` — fluxo completo de verificação 2FA (seleção método, input código, reenvio email, backup code)
- [x] `ProfilePage.js` — seção 2FA com status, setup TOTP (QR code), setup email, backup codes, desativar
- [x] Dependência: `otplib` (v4, API funcional: `generate`, `verify`, `generateSecret`, `generateURI`)

### 🚫 Push Denied Handling
- [x] Toggle de notificações desabilitado quando `Notification.permission === 'denied'`
- [x] Mensagem de aviso clara com instruções de configuração do navegador
- [x] Estilo `.push-denied-warning` em `profile.css`

### 📊 Orçamentos por Categoria
- [x] Tabela `orcamentos` com `categoria`, `limite`, `mes`
- [x] CRUD completo (criar, listar, atualizar, deletar)
- [x] `GET /api/orcamentos/verificar` — compara gastos do mês vs limites
- [x] Alerta push ao atingir 80% (warning) e 100% (critical)
- [x] Seção no dashboard com progress bar (verde/amarelo/vermelho)

### 🌀 Staggered Reveal Animation
- [x] `@keyframes itemFadeIn` em `global.css` (opacity, translateY, scale)
- [x] Stat cards com delays 0/80/160/240ms
- [x] Chart cards com delays 50/100ms
- [x] Insight cards com delays 50/100/150ms
- [x] Table rows com index × 40ms
- [x] Orçamentos e recorrentes com staggered reveal

### 🧪 Testes de Integração (23)
- [x] Montam Express próprio com porta aleatória
- [x] Health, Auth (5 cenários), Financeiro (6), Recorrentes (3), Orçamentos (3), Profile (2), Error Handling (3)
- [x] `describeDB` — skip automático se `DATABASE_URL` não estiver disponível
- [x] Cleanup automático via pool direto no `after()`

### 🔧 Bugfixes
- [x] `orcamentoController`: `req.userId` → `req.user.id` (4 lugares)
- [x] Error handler: mapeia `'incorretos'` → 401, `'já está'` + `'obrigatória'` → 400
- [x] Validators: mensagens incluem "obrigatória" para match do error handler
- [x] Coluna `metodoPagamento`: normalizada via `RENAME COLUMN` + quoted identifier `"metodoPagamento"`
- [x] Orçamento criar retorna status 201 em vez de 200

### 🤖 CI/CD com Deploy Automático
- [x] GitHub Actions com 3 jobs (test-backend, test-frontend, deploy)
- [x] Deploy só na `main` (após testes passarem)
- [x] `vercel pull` + `vercel build` + `vercel deploy --prebuilt` (frontend)
- [x] `vercel pull` + `vercel deploy --prod` (backend)
- [x] Secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID_*, DATABASE_URL, JWT_SECRET
- [x] `.vercel/repo.json` com mapeamento dos projetos
- [x] Workflow test-backend passa `DATABASE_URL` + `JWT_SECRET` como env vars

### 🎨 Tema Claro no PDF
- [x] `exportPDF()` lê `--primary` do tema atual via `getComputedStyle()`
- [x] Cor do tema aplicada em `<h1>`, borda das seções, botão de impressão
- [x] Body permanece claro para impressão

---

## ✅ Últimas Implementações (24/05/2026)

### 🔁 Transações Recorrentes
- [x] Tabela `recorrentes`, service com CRUD + geração automática
- [x] Página `#/recorrentes` com toggle, deletar, botão "Gerar"
- [x] Opção "Repetir" no form do Dashboard com frequência, data fim e máx ocorrências
- [x] Atalho `Ctrl+R`, link no menu lateral
- [x] Geração automática ao carregar o dashboard
- [x] Notificação push ao gerar lançamentos
- [x] Notificação de vencimento próximo (data_fim)

### 🦴 Skeleton nos Gráficos
- [x] Canvas dos charts recebem classe `skeleton skeleton-chart` no HTML
- [x] Classe removida automaticamente após Chart.js renderizar
- [x] Shimmer animado aparece no lugar do gráfico enquanto carrega

### 🔗 Filtros e Paginação na URL
- [x] Filtros (descricao, tipo, categoria, metodoPagamento, data) sincronizados com hash params
- [x] Paginação (page, pageSize) na URL — dá pra compartilhar link exato
- [x] `showDashboard()` lê estado dos params no início
- [x] `handleHashChange()` não remove mais os query params

### 🧪 Testes com Node --test
- [x] Frontend: `format.test.js` com `node:test`
- [x] Backend: unit tests (autoCategorize, parseCSV, parseOFX, calcularProximaData)
- [x] `calcularProximaData` exportada do `module.exports`

### 📧 Relatório por Email
- [x] `sendReport()` no emailService (gera .xlsx + anexa via SMTP)
- [x] `POST /api/exportar/email` — endpoint autenticado
- [x] Opção "Email (.xlsx)" no modal de exportação

### 🔔 Push Notification ao Gerar Recorrentes
- [x] `web-push` instalado e configurado
- [x] `sendToUser()` no notificationService
- [x] Hook em `gerarLancamentos()` notifica ao gerar

### 🧪 Testes E2E com Playwright
- [x] 7 testes: register, login, dashboard, create transaction, perfil, recorrentes, health
- [x] Script `tests/e2e_test.py` + `npm run test:e2e`

### 🎨 Página de Login com Personalidade
- [x] Blocos geométricos decorativos com `clip-path` nos cantos
- [x] Formas flutuantes animadas (triângulos + losangos) com `@keyframes floatShape`
- [x] Aplicado em login, register, forgot-password, reset-password, change-password

### 🐛 Bugfixes
- [x] `isSaida()` prioridade corrigida: texto `entradaSaida` primeiro, `valor < 0` fallback
- [x] `formatDate()` parse manual sem timezone (evita -1 dia no Brasil)

---

## ✅ Últimas Implementações (21/05/2026)

### Página de Perfil + Tema Sincronizado
- [x] ProfilePage.js com edição de nome, sobrenome, foto
- [x] Seletor de tema com sync ao backend
- [x] Atalho `Ctrl+P`, rota `#/perfil`, link na sidebar
- [x] `initTheme()` aceita tema do servidor

### Notificações Push
- [x] `POST /api/push/subscribe` — subscription persistida
- [x] `GET /api/push/vapid-public-key` — chave pública VAPID
- [x] SW listeners `push` + `notificationclick`
- [x] Toggle no perfil com slider + permissão

### Importação CSV Refatorada
- [x] Leitura da coluna `Tipo` do CSV (não deriva mais só do sinal do valor)
- [x] BOM UTF-8 removido automaticamente
- [x] `\r\n` / `\r` normalizados
- [x] Auto-detecte `;` ou `,`
- [x] Quotes em cabeçalhos e valores tratados
- [x] `metodoPagamento` e `observacoes` salvos na importação
- [x] Sinal do `valor` consistente: negativo para Saída, positivo para Entrada
- [x] Debug "Amostra dos dados" na resposta da importação

### Reforma do Sistema de Tipo
- [x] `isSaida()` prioriza texto `entradaSaida`, fallback ao sinal do valor
- [x] Backend deriva tipo do sinal do valor em `salvarLancamento`
- [x] Form submit envia valor com sinal correto (negativo p/ Saída)
- [x] Export CSV/JSON usa `getTipo(l)` em vez de `l.entradaSaida`

### Dashboard Avançado
- [x] Gráfico de evolução mensal (receitas vs despesas) — linha
- [x] Gráfico de categorias (pizza/donut interativo)
- [x] Comparativo mensal (mês atual × mês anterior)
- [x] Meta de economia mensal com progresso visual
- [x] Projeção de saldo futuro

### Exportação Avançada
- [x] Exportar por período selecionável
- [x] Exportar com filtros aplicados
- [x] Relatório PDF com gráficos embutidos + tema atual
- [x] Envio por email do relatório (.xlsx)

### Temas Melhorados
- [x] Temas pré-definidos (Dark, Dracula, Nord, Claro)
- [x] Transição suave entre temas
- [x] Seletor de tema no sidebar
- [x] Tema claro refinado: paleta warm monochrome
- [x] 3 novos temas: Tokyo Night, Gruvbox, Rose Pine
- [x] Tema salvo no backend (sincronizado entre dispositivos)

---

## 🎨 Melhorias de Design

### 1. 🖋️ Tipografia Distintiva
- [x] Substituir fonte do sistema por par tipográfico (DM Serif Display p/ títulos + Outfit p/ corpo)
- [x] Adicionar `<link>` das fontes no `index.html`
- [x] Definir `font-family` nas variáveis CSS

### 2. 📊 Cards de Estatística com Personalidade
- [x] Gradiente diagonal no ícone com fundo circular
- [x] `font-variant-numeric: tabular-nums` + tracking mais solto nos números
- [x] Hover com elevation: `box-shadow` + `translateY(-2px)` + transição suave
- [ ] Sinal de + ou - animado quando o valor muda (CSS `@keyframes`)

### 3. 📋 Tabela com Linhas-Card
- [x] Cada linha com `border-radius` sutil + `box-shadow` leve
- [x] Hover com destaque na borda esquerda (verde p/ entrada, vermelho p/ saída)
- [x] `transition` suave em todos os estados

### 4. 🎨 Página de Login com Personalidade ✅
- [x] Bloco decorativo geométrico no canto (triângulos/círculos com `clip-path`)
- [x] Formas flutuantes animadas (triângulos + losangos) com `@keyframes floatShape`
- [x] Aplicado em login, register, forgot-password, reset-password e change-password

### 5. 🌀 Transições entre Páginas
- [x] `@keyframes pageFadeIn` com `translateY(12px)` no conteúdo ao navegar
- [x] `animation-delay` escalonado nos elementos internos (staggered reveal)
- [ ] Transição suave de saída antes de trocar a rota (fade-out)

### 6. 🎯 Badges de Tipo com mais Presença
- [x] Fundo gradiente sutil nos badges "Entrada"/"Saída"
- [x] `::before` com bolinha colorida indicando o tipo
- [x] Letter-spacing maior, uppercase obrigatório

### 7. 🧩 Empty States Ilustrados ✅
- [x] 3 SVGs decorativos: chart (dashboard vazio), search (filtro sem resultado), list (recorrentes vazia)
- [x] Título com `font-heading` + subtítulo explicativo
- [x] Dashboard vazio mostra ilustração + CTA "Nova Transação"
- [x] `emptyStateSVG(type)` e `renderEmptyState()` em `dom.js`

### 8. ✨ Micro-Interações e Motion Design
- [ ] **Hover lift nos cards** — `translateY(-2px)` + `box-shadow` aumentado ao passar o mouse (já existe nos stats, replicar nos demais cards)
- [ ] **Pulse no FAB** — botão `+` de nova transação com `@keyframes pulse` suave (opacity/scale)
- [ ] **Modal com scale** — fade + `scale(0.95)→(1)` ao abrir/fechar modais
- [ ] **Contadores animados** — números dos cards de estatística incrementam visualmente ao carregar
- [ ] **Row highlight na tabela** — hover com brilho sutil e borda esquerda colorida (já existe parcialmente)
- [ ] **Transição entre páginas** — slide ou crossfade ao navegar entre rotas
- [ ] **Gradiente animado no header** — `background-position` animado sutilmente
- [ ] **Sinal de + ou - animado quando o valor muda** (CSS `@keyframes`)

---

## ⚡ Performance & Infraestrutura

### 1. 📦 Otimizar Bundle do Chart.js ✅
- [x] Substituir `import Chart from 'chart.js/auto'` por import seletivo (~240KB → ~90KB)
- [x] Importar só: `LineController, LineElement, PointElement, BarController, BarElement, CategoryScale, LinearScale, DoughnutController, PieController, ArcElement, Tooltip, Legend, Filler`
- [x] Shared `chartSetup.js` com `Chart.register()`

### 2. ⚡ `vite-plugin-pwa` (substituir SW manual)
- [ ] Instalar `vite-plugin-pwa -D`
- [ ] Configurar no `vite.config.js` com `registerType: 'autoUpdate'`
- [ ] Gerar Service Worker com Workbox em vez do `sw.js` manual em `public/`
- [ ] Habilitar `devOptions.enabled` para testar em dev
- [ ] Manter notificações push (custom SW)
- [ ] Auto-inject do manifest + caching de assets estáticos

### 3. 🚀 Migrar Express 4 → Express 5
- [ ] Atualizar `express` no `backend/package.json` para `^5.2.0`
- [ ] Verificar breaking changes: `res.redirect()` sem magic string `'back'`
- [ ] Query parser agora usa modo `'simple'` por padrão
- [ ] `res.clearCookie()` ignora `maxAge`/`expires` do usuário
- [ ] MIME types: `application/javascript` → `text/javascript`
- [ ] `res.status()` só aceita inteiros 100-999

### 4. 🔍 Análise de Bundle
- [ ] Adicionar `vite-plugin-visualizer` para debug visual do bundle
- [ ] Rodar `npx vite-bundle-analyzer` no build
- [ ] Identificar dependências pesadas não utilizadas

### 5. 🦴 Skeleton Screens ✅
- [x] Classe CSS `.skeleton` com shimmer animado (`@keyframes shimmer`)
- [x] `showDashboardSkeleton()` com placeholders para stats, charts e tabela
- [x] Dashboard usa skeleton em vez de `showSpinner('Carregando…')`
- [x] Skeleton nos gráficos (placeholder com shimmer nos canvases)

---

## 🔥 Prioridade Alta

### 1. 🧪 Testes Automatizados
- [x] Testes unitários (31: autoCategorize, parseCSV, parseOFX, calcularProximaData)
- [x] Testes de integração (23: health, auth, financeiro, recorrentes, orçamentos, profile, errors)
- [x] Testes E2E Playwright (7: register, login, dashboard, create, perfil, recorrentes, health)
- [x] CI/CD no GitHub Actions (test → build → deploy)
- [x] Integration tests skip graciosamente sem DATABASE_URL

### 2. 🔒 Autenticação de Dois Fatores (2FA) ✅
- [x] Adicionar tabela `user_2fa` no banco
- [x] Gerar secret TOTP na ativação
- [x] Tela de verificação de código no login
- [x] Códigos de recuperação (backup codes)
- [x] Integração completa frontend + backend

> [!check] Implementado em 26/05/2026 — `otplib` v4 (API funcional)

### 3. 🔁 Transações Recorrentes ✅
- [x] Tabela `recorrentes` com suporte a frequências (semanal, quinzenal, mensal, anual)
- [x] Geração automática ao carregar o dashboard (hook em `listarLancamentos`)
- [x] Geração manual via botão na página `#/recorrentes`
- [x] Página dedicada com toggle ativo/inativo, exclusão e feedback
- [x] Opção "Repetir" no formulário de nova transação
- [x] Suporte a data fim e número máximo de ocorrências (parcelas)
- [x] Notificar antes do vencimento (push notification)

### 4. 📊 Orçamentos por Categoria ✅
- [x] CRUD completo com limite por categoria
- [x] Progresso visual no dashboard (barra + percentual)
- [x] Alerta push ao atingir 80% do limite
- [x] Alerta push ao ultrapassar 100%
- [x] Verificação automática ao listar lançamentos

---

## 📋 Prioridade Média

### 5. 🔔 Notificações Push
- [x] Endpoint `POST /api/push/subscribe` para salvar subscription
- [x] Envio de notificação push ao gerar lançamentos recorrentes
- [x] Alerta de orçamento (80% e 100%)
- [x] Botão "Ativar notificações" no perfil
- [x] Tratar permissão negada / revogada

### 6. 📤 Melhorias na Exportação
- [x] Envio por email do relatório (.xlsx anexado)
- [x] Exportar para Excel (.xlsx)
- [x] Tema claro no PDF (lê --primary do tema atual)

### 7. 🌙 Tema — Salvar no Backend ✅
- [x] Endpoint `PUT /api/profile` salva theme
- [x] Sincronizar tema entre dispositivos
- [ ] Temas customizáveis pelo usuário (criar próprio)

---

## 💡 Prioridade Baixa

### 8. 🤖 Assistente Financeiro com IA

> [!idea] Chat/consultas em linguagem natural sobre finanças pessoais

- [ ] Chat integrado no dashboard para perguntas como "Quanto gastei em alimentação esse mês?"
- [ ] Análise de gastos com sugestões de economia personalizadas
- [ ] Detecção de padrões — "Você gastou 30% a mais em delivery esse mês"
- [ ] Classificação inteligente de transações não categorizadas
- [ ] Previsão de saldo futuro baseada em histórico + recorrentes
- [ ] Sugestão de meta de economia realista baseada nos gastos

### 9. 👨‍👩‍👧‍👦 Compartilhamento / Multiusuário
- [ ] Conta familiar com múltiplos perfis
- [ ] Categorias e orçamentos compartilhados
- [ ] Permissões (admin, editor, visualizador)

### 10. 🏦 Integração Bancária
- [ ] Conectar com Open Finance do Brasil
- [ ] Sincronização automática de transações
- [ ] Classificação inteligente por machine learning

> [!warning] Esforço alto
> Open Finance exige certificação e registro no Banco Central.

### 11. 📱 App Mobile Nativo
- [ ] React Native ou Flutter
- [ ] Biometria (Touch ID / Face ID)
- [ ] Widgets de saldo rápido
- [ ] Suporte offline completo com SQLite local

---

## 🐛 Bugs Conhecidos (todos corrigidos)

- [x] CORS preflight bloqueado em produção — middleware manual com OPTIONS handler
- [x] `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` — `app.set('trust proxy', 1)`
- [x] `/api/health` retornando "database: not configured" — DATABASE_URL não estava setada
- [x] CSS 404 no extrato (Linux case-sensitive) — renomeado para Extrato.css
- [x] `API_BASE_URL` redeclarada — função `getApiBaseUrl()`
- [x] Recursão infinita em `forgotPassword` — require de authService
- [x] Import CSV ignorava coluna Tipo — `parseCSV` lê `row.tipo`
- [x] Import CSV ignorava acento — `row['descrição']` adicionado
- [x] Import CSV quebrava com `\r\n` (Windows) — normalização de line endings
- [x] Import CSV quebrava com BOM (Excel) — `replace(/^\uFEFF/, '')`
- [x] Tipo inconsistente (form vs import vs display) — reforma completa do sistema de tipo
- [x] Orçamento controller usava `req.userId` em vez de `req.user.id` — corrigido
- [x] Coluna `metodoPagamento` minúscula no PostgreSQL — `RENAME COLUMN` + quoted identifier
- [x] Orçamento criar retornava 200 em vez de 201 — corrigido

---

---

## 💡 Ideias Extras (não categorizadas)

### 🔄 Melhorias na Experiência

- [ ] **Modo escuro automático** — seguir `prefers-color-scheme` do SO, com toggle pra sobrescrever
- [ ] **Gráfico de despesas por método de pagamento** — "Quanto gastei no crédito vs débito esse mês?"
- [ ] **Nota fiscal / comprovante** — anexar imagem por transação (upload pra blob storage)
- [ ] **Dashboard customizável** — usuário escolhe quais cards/widgets aparecem (arrastar e soltar)
- [ ] **Categorias personalizadas** — usuário criar/deletar/renomear categorias próprias (hoje são fixas)
- [ ] **Página de Resumo Anual** — tabelão com 12 meses lado a lado, total por categoria no ano

### 📊 Dados & Relatórios

- [ ] **Gastos recorrentes vs pontuais** — gráfico separando assinaturas fixas de gastos variáveis
- [ ] **Regra de negócio "Se sobrou X, investir Y%"** — sugestão automática de investimento baseada no saldo do mês
- [ ] **Exportar CSV/PDF por categoria** — "Exportar só gastos de Alimentação" sem precisar filtrar manual
- [ ] **Extrato bancário comparado** — importar 2 meses e mostrar diff lado a lado

### ⚡ Qualidade de Vida

- [ ] **Scanning de boleto por código de barras** — ler linha digitável e preencher valor + data automaticamente (câmera do celular)
- [ ] **Dark mode na impressão do PDF** — opção "Imprimir com fundo escuro" pra quem usa tema noturno
- [ ] **Multi-moeda** — suporte a USD/EUR com cotação aproximada, útil pra gastos internacionais
- [ ] **Desfazer (Undo)** — "Excluiu sem querer?" botão de desfazer por 5 segundos após deletar
- [ ] **Atalho customizable** — usuário redefinir os atalhos de teclado (Ctrl+H, etc.)

### 🌐 Social & Gamificação

- [ ] **Metas personalizadas por categoria** — "Quero gastar no máximo R$500 em Ifood esse mês" com progresso
- [ ] **Desafio de economia** — "Fique 30 dias sem gastar com delivery" com streak counter
- [ ] **Compartilhar resumo público** — link temporário com resumo anônimo (sem valores, só métricas)

---

## 📈 Métricas de Qualidade

```yaml
Alvo atual:
  Cobertura de testes: ~40% (backend unit + integração + frontend + E2E)
  Performance (API): < 200ms p95
  Lighthouse (mobile): > 85 em todas as categorias (pendente medição)
  Acessibilidade: WCAG 2.1 AA (pendente auditoria)
```

---

## Notas Relacionadas

- [[Gestor Financeiro]]
- [[API Documentation]]
- [[Service Worker Notes]]
- [[Readme do Projeto]]
- [[README Gap Analysis]]

---

