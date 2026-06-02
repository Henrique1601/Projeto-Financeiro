# Commands - Gestor Financeiro

## Desenvolvimento

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Inicia backend (nodemon :3000) + frontend (vite :5173) juntos |
| `npm run build` | Build do frontend → `dist/` |

## Testes

| Comando | O que faz |
|---------|-----------|
| `npm test` | Backend + frontend sequenciais |
| `npm run test:backend` | Só backend (54 testes) |
| `npm run test:frontend` | Só frontend (37 testes) |
| `npm run test:e2e` | Playwright E2E (14 testes) |

## Setup

| Comando | O que faz |
|---------|-----------|
| `npm run install:all` | Instala deps de backend + front-end |
| `npm install` | Instala deps da raiz (concurrently) |

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/ai/ask` | Assistente IA (streaming SSE) — requer `OPENAI_API_KEY` |

## Atalhos

| Atalho | Ação |
|--------|------|
| `Ctrl+I` | Abrir Assistente IA |
