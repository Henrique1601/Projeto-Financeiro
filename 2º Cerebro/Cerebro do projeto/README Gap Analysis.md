---
title: README Gap Analysis
description: Discrepâncias entre o README.md e o que realmente existe no código
date: 2026-05-21
tags:
  - audit
  - readme
  - docs
aliases:
  - Gap Analysis
  - README vs Realidade
cssclasses:
  - clean-embeds
---

# README Gap Analysis

> [!warning] O README.md promete funcionalidades que **não existem** no código.
> Abaixo, a lista completa do que está documentado mas não foi implementado, e vice-versa.

---

## ❌ Prometido no README mas NÃO existe

### Bibliotecas Inexistentes
| Biblioteca     | Prometido como   | Realidade                       |
| -------------- | ---------------- | ------------------------------- |
| SheetJS (xlsx) | Exportação Excel | `package.json` não tem          |
| jsPDF          | Exportação PDF   | Usa `window.print()`, não jsPDF |
| html2canvas    | Captura de tela  | Usa `canvas.toDataURL()` nativo |
| PapaParse      | Parsing CSV      | Parsing manual no backend       |

### Funcionalidades Inexistentes
- **Exportar para Excel** — sem planilhas .xlsx
- **Calendário integrado** — não existe
- **Notificações push** — VAPID keys não configuradas, SW sem `push` handler
- **Orçamento por categoria** — só existe meta global
- **Perfil do usuário** — backend tem endpoint, frontend não tem página
- **SQLite** — diretório `locally/` não existe
- **Sincronização automática online** — só alterna banner, sem fila de mutações

### ✅ Implementado desde a última análise
- **Exportar para JSON** — implementado no dashboard
- **Selecionar múltiplas transações** — checkboxes + bulk delete
- **Deletar em massa** — loop individual `DELETE /api/deletar?id=N`
- **Duplicar transações** — botão copy com fallback à criação
- **Filtro por categoria** — select de categorias no dashboard
- **Filtro por método de pagamento** — select no dashboard
- **Observações personalizadas** — campo textarea no form
- **Ordenação por colunas** — `<th>` clicáveis com ▲▼
- **Paginação** — seletor de itens por página + navegação
- **Alterar senha (logado)** — `ChangePasswordPage.js` com `apiPut`

### Atalhos de Teclado Faltando
| Atalho no README | Realidade |
|-----------------|-----------|
| Ctrl+N (novo) | ❌ |
| Ctrl+S (salvar) | ❌ |
| Ctrl+E (exportar) | ❌ (é extrato) |
| Ctrl+F (buscar) | ❌ |
| Ctrl+D (deletar) | ❌ |
| Ctrl+, (perfil) | ❌ |
| Esc (fechar modal) | ❌ |
| F1/? (ajuda) | ❌ |
| F5 (atualizar) | ❌ |
| +/- (paginar) | ❌ |

## ✅ Existe no código mas NÃO está no README

- **Temas: Dracula, Nord, Claro** — README só cita claro/escuro
- **Atalhos reais** — Ctrl+H (dashboard), Ctrl+T (tema)
- **Dashboard Avançado** — gráficos evolução + categorias, comparativo mensal, projeção de saldo
- **Meta de economia** — barra de progresso visual
- **Exportar modal** — período + filtros + formato (CSV/PDF)
- **Ano automático no extrato** — select de anos preenchido dinamicamente

## 📁 Estrutura do Projeto Desatualizada

O README mostra estrutura **antiga** (arquivos planos `js/`, `css/`, `extrato/`). A estrutura real é **Vite SPA**:

```
postgre/
├── backend/
│   └── api/
│       ├── config/
│       ├── controllers/
│       ├── docs/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── index.js
├── front-end/
│   ├── public/           # sw.js, manifest.json
│   └── src/
│       ├── pages/        # DashboardPage, ExtratoPage, LoginPage, etc.
│       ├── styles/       # variables.css, global.css, dashboard.css, etc.
│       ├── utils/        # dom.js, format.js
│       ├── api.js
│       ├── auth.js
│       ├── config.js
│       ├── router.js
│       ├── store.js
│       ├── theme.js
│       └── main.js
└── 2º Cerebro/          # Obsidian vault
```

## 📋 Ações Recomendadas

> [!todo]
> - [ ] **Remover do README** SheetJS, jsPDF, html2canvas, PapaParse (bibliotecas)
> - [ ] **Remover do README** Excel/JSON export, bulk delete, multi-select, duplicate, calendar
> - [ ] **Remover do README** metodoPagamento, observacoes (front-end), category filter, column sort
> - [ ] **Remover do README** push notifications, per-category budget, pagination, SQLite, profile
> - [ ] **Remover do README** atalhos falsos (manter só Ctrl+H, Ctrl+E, Ctrl+T)
> - [ ] **Atualizar no README** estrutura do projeto (Vite SPA)
> - [ ] **Adicionar ao README** temas Dracula/Nord/Light, gráficos dashboard, export modal
> - [ ] **Decidir**: implementar ou remover cada feature faltante

---

## Notas Relacionadas

- [[Gestor Financeiro]]
- [[Ideias de Melhorias]]
- [[Refatoração Frontend V2]]
- [[Readme do Projeto]]
