# Skills Úteis para Este Projeto

> Última atualização: 2026-05-22

## Sempre Disponíveis (carregadas no system prompt)

Estas skills já estão no system prompt e podem ser usadas sem carregar:

- [[context7-mcp]] — Docs de qualquer lib (Chart.js, Express, Nodemailer)
- [[web-design-guidelines]] — Auditoria de conformidade UI
- [[obsidian-markdown]] — Editar notas, callouts, wikilinks
- [[brainstorming]] — Planejar features novas
- [[claude-md-improver]] — Auditar AGENTS.md

## Carregar Sob Demanda

### Design & UI

| Skill | Quando usar |
|---|---|
| [[frontend-design]] | Criar páginas/componentes novos do zero |
| [[design-taste-frontend]] | Refinar UI/UX existente, component architecture |
| [[high-end-visual-design]] | Elevar qualidade visual premium (fonts, spacing, shadows, cards) |
| [[minimalist-ui]] | Alternativa de estilo clean (editorial) |
| [[redesign-existing-projects]] | Melhorias de design na lista pendente |
| [[ui-ux-pro-max]] | Paletas, fontes, guidelines, chart types |

### Dev & Deploy

| Skill | Quando usar |
|---|---|
| [[deploy-to-vercel]] | Deploy dos dois pacotes no Vercel |
| [[webapp-testing]] | Criar testes E2E com Playwright |
| [[supabase-postgres-best-practices]] | Performance PostgreSQL, queries, índices, migrations |
| [[improve-codebase-architecture]] | Refatorar código (ex: DashboardPage 1144 linhas) |

## Skills que NÃO se Aplicam

| Skill | Motivo |
|---|---|
| next-best-practices | Projeto usa vanilla JS SPA, não Next.js |
| vercel-react-best-practices | Projeto usa vanilla JS, não React |
| vercel-composition-patterns | Projeto usa vanilla JS, não React |
| shadcn | Projeto usa vanilla JS + CSS puro |
| docx / pptx / xlsx | Sem demanda por documentos Office |
| mcp-builder | Sem necessidade de criar servidores MCP |
| skill-creator / skill-judge | Skills já estão maduras |
| canvas-design | Sem demanda por arte visual |

## Histórico de Uso

| Data | Skill | O que fez |
|---|---|---|
| 2026-05-22 | `high-end-visual-design` | Tipografia (DM Serif Display + Outfit), cards com gradiente + hover elevation, tabela linhas-card, badges com gradiente + bolinha, page-enter animation |
| 2026-05-22 | `minimalist-ui` | Tema claro refinado: paleta warm monochrome, off-white bg, charcoal text, ultra-light borders, pastéis dessaturados |
| 2026-05-22 | `ui-ux-pro-max` | 3 novos temas: Tokyo Night, Gruvbox, Rose Pine — adicionados ao theme.js + variables.css |
| 2026-05-22 | `context7-mcp` | Pesquisa de melhorias: Chart.js tree-shaking, vite-plugin-pwa, Express 5 |
| 2026-05-22 | `frontend-design` + `high-end-visual-design` | Chart.js tree-shaking, page transitions em todas as páginas, skeleton screens |

## Regra Obrigatória

> [!important] Consultar Skill/MCP Primeiro
> Antes de QUALQUER tarefa — usar ferramenta, consultar doc, gerar código ou depurar — o Claude DEVE primeiro verificar se uma skill carregada ou MCP ativo pode guiar o trabalho. Skills fornecem workflows e constraints específicos do domínio. MCPs fornecem acesso a ferramentas live (Neon DB, Context7 docs, gh_grep, chrome-devtools, etc.). Sempre preferi-los sobre conhecimento bruto do LLM.

## Notas

- O shell está quebrado (EPERM) — comandos `npx skills add` e `git` precisam ser executados manualmente pelo usuário
- Frontend é **vanilla JS SPA** com Vite 6 + hash routing + CSS puro (linkado no index.html, não importado em JS)
- Backend é Node.js + Express + PostgreSQL (Neon)
- Duas pastas: `backend/` (CommonJS) e `front-end/` (ES Modules)
- Obsidian vault em `2º Cerebro/`
- Tema: CSS class no `<body>` — Dracula, Nord, Light, Dark
