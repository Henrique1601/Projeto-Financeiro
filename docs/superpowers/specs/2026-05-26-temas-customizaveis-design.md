# Temas Customizáveis — Design Spec

## Visão Geral

Permitir que usuários criem e modifiquem temas visuais completos (todas as variáveis CSS) diretamente pela interface, com persistência local + backend.

## Data Model

Tema customizado armazenado como objeto JSON:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | `custom-{random8}` |
| `name` | string | Nome definido pelo usuário |
| `baseOn` | string? | ID do tema base (opcional) |
| `colors` | object | Mapa de todas as 20 variáveis CSS |

```js
{
  id: 'custom-a1b2c3d4',
  name: 'Meu Tema',
  baseOn: 'dracula',
  colors: {
    primary: '#bd93f9',
    primaryHover: '#a67ee6',
    primaryLight: 'rgba(189,147,249,0.15)',
    success: '#50fa7b',
    successLight: 'rgba(80,250,123,0.15)',
    warning: '#ffb86c',
    warningLight: 'rgba(255,184,108,0.15)',
    danger: '#ff5555',
    dangerLight: 'rgba(255,85,85,0.15)',
    bg: '#282a36',
    bgCard: '#44475a',
    bgInput: '#3a3c4e',
    bgHover: '#3a3c4e',
    border: '#6272a4',
    text: '#f8f8f2',
    textSecondary: '#bd93f9',
    textMuted: '#6272a4',
    shadow: '0 2px 8px rgba(0,0,0,0.15)',
    shadowLg: '0 4px 16px rgba(0,0,0,0.15)',
    font: "'Outfit', system-ui, sans-serif",
    fontHeading: "'DM Serif Display', Georgia, serif"
  }
}
```

## Armazenamento

- **localStorage** (`custom-themes`): `JSON.stringify(array)` de temas customizados
- **Backend**: nova coluna `customThemes TEXT DEFAULT '[]'` em `usuarios`
  - `GET /api/profile` retorna `customThemes`
  - `PUT /api/profile` aceita `customThemes` no body
  - Sincronizado ao salvar/criar/editar/deletar um tema customizado

## Arquitetura — theme.js

Novas funções:

| Função | Descrição |
|--------|-----------|
| `getCustomThemes()` | Lê array do localStorage |
| `saveCustomTheme(data)` | Adiciona/atualiza tema no localStorage + sync backend |
| `deleteCustomTheme(id)` | Remove do localStorage + sync backend |
| `applyCustomTheme(colors)` | Injeta `<style id="custom-theme-style">` no `<head>` com `:root { --var: val; ... }` |
| `removeCustomThemeStyle()` | Remove a tag `<style id="custom-theme-style">` |
| `exportCustomTheme(id)` | Retorna JSON blob do tema (ou array se id='all') e dispara download |
| `importCustomTheme(jsonStr)` | Valida JSON, gera novo id, adiciona ao array, retorna tema importado |

`applyTheme(id)` modificada: se `id` começa com `custom-`, busca nos custom themes e chama `applyCustomTheme(colors)`. Senão, aplica classe CSS normal.

### Exportar / Importar Temas

**Exportar**: Cada card de tema customizado tem botão "Exportar" que baixa um arquivo `.json` com o objeto do tema (`{id, name, baseOn, colors}`). Botão "Exportar Todos" no topo da seção baixa array completo como `.json`.

**Importar**: Botão "Importar" abre seletor de arquivo (aceita `.json`). Validação:
- JSON válido
- Objeto único com `name` (string) e `colors` (objeto com ao menos `primary`, `bg`, `text`) OU array de temas com mesma validação
- Gera novo `id` (substitui o existente) para evitar conflito
- Adiciona ao `custom-themes` no localStorage + sync backend
- Feedback: toast de sucesso com quantidade importada

## UI — ProfilePage

### Seção "Meus Temas"

Abaixo do seletor de temas `<select>` existente:

- **Cards de temas customizados**: cada card mostra nome, prévia de cores (bolinhas coloridas), botões editar/deletar
- **Botão "Novo Tema"**: abre modal de edição com cores preenchidas a partir do tema atualmente selecionado

### Modal de Edição de Cores

Grupos colapsáveis com inputs:

| Grupo | Propriedades | Input Type |
|-------|-------------|------------|
| Principal | primary, primaryHover, primaryLight | color |
| Sucesso | success, successLight | color |
| Alerta | warning, warningLight | color |
| Erro | danger, dangerLight | color |
| Fundo | bg, bgCard, bgInput, bgHover, border | color |
| Texto | text, textSecondary, textMuted | color |
| Sombra | shadow, shadowLg | text |
| Fonte | font, fontHeading | text |

- Preview ao vivo: cada alteração aplica o tema imediatamente via `applyCustomTheme()`
- Botões: "Salvar" / "Cancelar" / "Resetar para o base"
- Ao salvar: valida nome não vazio, gera `id` se novo, salva no localStorage + sync backend, recarrega lista de temas no `<select>`

### Tema customizado no `<select>`

Dropdown inclui temas customizados com label `"Meu Tema ✨"`. Ao selecionar, aplica normalmente via `applyTheme()`.

## Backend — Migration

```sql
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "customThemes" TEXT DEFAULT '[]';
```

## Fluxo de Sincronização

1. Usuário cria/edita/deleta tema customizado
2. `saveCustomTheme()` / `deleteCustomTheme()` no theme.js atualiza localStorage
3. Chama `syncCustomThemesToBackend()` com o array completo via `PUT /api/profile { customThemes: [...] }`
4. Ao carregar ProfilePage, `fetchProfile` retorna `customThemes` do backend; se localStorage estiver vazio, popula a partir do backend

## Testes

- Unit: `getCustomThemes()`, `saveCustomTheme()`, `deleteCustomTheme()`, `applyCustomTheme()` (injeção/remoção de style tag)
- Integração: `ALTER TABLE usuarios ADD COLUMN customThemes`, `PUT /api/profile` com customThemes, `GET /api/profile` retorna customThemes
- Visual: abrir modal, editar cores, salvar, ver preview ao vivo, ver tema no dropdown
