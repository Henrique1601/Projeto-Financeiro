# Dashboard Customizável — Design Spec

## Visão Geral

Permitir que cada usuário personalize o dashboard: reordenar, redimensionar e ocultar widgets individuais, com presets salvos (localStorage + backend) e export/import.

## Widgets

10 widgets arrastáveis + 2 seções fixas:

| # | ID | Nome | Tipo | Tamanho padrão |
|---|----|------|------|----------------|
| 1 | `saldo` | Saldo Total | stat | Pequeno (span 3) |
| 2 | `entradas` | Entradas | stat | Pequeno (span 3) |
| 3 | `saidas` | Saídas | stat | Pequeno (span 3) |
| 4 | `transacoes` | Transações | stat | Pequeno (span 3) |
| 5 | `evolucao` | Evolução Mensal | chart | Grande (span 6) |
| 6 | `categorias` | Categorias | chart | Grande (span 6) |
| 7 | `comparativo` | Comparativo Mensal | insight | Médio (span 4) |
| 8 | `meta` | Meta de Economia | insight | Médio (span 4) |
| 9 | `projecao` | Projeção de Saldo | insight | Médio (span 4) |
| 10 | `orcamentos` | Orçamentos do Mês | orcamentos | Máximo (span 12) |

**Fixos** (não arrastáveis, não ocultáveis):
- Filtros (`#dashFiltros`)
- Tabela de transações (`#dashTableBody` + paginação)

## Grid Layout

CSS Grid 12 colunas:

```css
.dashboard-widgets {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}
```

### Tamanhos

| Tamanho | grid-column | Colunas ocupadas | Exemplo de uso |
|---------|-------------|------------------|----------------|
| `size-sm` | `span 3` | 3 / 12 (25%) | Stats |
| `size-md` | `span 4` | 4 / 12 (33%) | Insights |
| `size-lg` | `span 6` | 6 / 12 (50%) | Charts |
| `size-xl` | `span 12` | 12 / 12 (100%) | Orçamentos |

### Responsivo

| Breakpoint | Grid columns | Comportamento |
|------------|-------------|---------------|
| > 1024px | `repeat(12, 1fr)` | Layout completo |
| 768-1024px | `repeat(6, 1fr)` | sm=span 2, md=span 3, lg=span 6, xl=span 6 |
| < 768px | `repeat(1, 1fr)` | Todos span 1, empilhados |

## Data Model

### Widget Config

```js
{
  id: 'saldo',
  visible: true,
  size: 'sm' // 'sm' | 'md' | 'lg' | 'xl'
}
```

### Preset

```js
{
  id: 'preset-a1b2c3d4',
  name: 'Minimalista',
  widgets: [
    { id: 'saldo', visible: true, size: 'lg' },
    { id: 'entradas', visible: true, size: 'sm' },
    { id: 'saidas', visible: true, size: 'sm' },
    { id: 'transacoes', visible: false, size: 'sm' },
    { id: 'evolucao', visible: true, size: 'lg' },
    { id: 'categorias', visible: false, size: 'lg' },
    { id: 'comparativo', visible: true, size: 'md' },
    { id: 'meta', visible: false, size: 'md' },
    { id: 'projecao', visible: false, size: 'md' },
    { id: 'orcamentos', visible: true, size: 'xl' }
  ],
  order: ['saldo', 'evolucao', 'entradas', 'saidas', 'comparativo', 'orcamentos']
}
```

### Armazenamento

- **localStorage** (`dashboard-presets`): `JSON.stringify(array)` de presets
- **localStorage** (`dashboard-active-preset`): `id` do preset ativo
- **Backend**: coluna existente `customThemes` estendida OU nova coluna `dashboardConfig TEXT DEFAULT '{}'` em `usuarios`
  - `GET /api/profile` retorna `dashboardConfig`
  - `PUT /api/profile` aceita `dashboardConfig`

### Active Preset no backend

```json
{
  "activePresetId": "preset-a1b2c3d4",
  "presets": [ ... ]
}
```

## Arquitetura — Novo módulo `dashboardConfig.js`

`front-end/src/dashboardConfig.js`:

| Função | Descrição |
|--------|-----------|
| `getPresets()` | Lê array do localStorage |
| `getActivePreset()` | Lê preset ativo do localStorage |
| `savePreset(preset)` | Adiciona/atualiza preset no localStorage + sync backend |
| `deletePreset(id)` | Remove preset do localStorage + sync backend |
| `setActivePreset(id)` | Define preset ativo, re-renderiza dashboard |
| `getWidgetConfig(widgetId)` | Retorna `{visible, size}` do preset ativo |
| `updateWidgetConfig(widgetId, changes)` | Atualiza visible/size no preset ativo |
| `updateWidgetOrder(orderArray)` | Atualiza order no preset ativo |
| `exportPreset(id)` | Baixa preset como `.json` |
| `importPreset(jsonStr)` | Valida e importa preset |
| `syncToBackend()` | Envia `dashboardConfig` para `PUT /api/profile` |
| `getDefaultPreset()` | Retorna preset padrão (todos visíveis, tamanhos padrão) |
| `resetToDefaults()` | Restaura preset padrão |

## UI — Dashboard

### Cada widget recebe:

```html
<div class="widget-container" data-widget-id="saldo">
  <div class="widget-header">
    <span class="drag-handle">⠿</span>
    <div class="widget-controls">
      <button class="widget-size-btn" title="Alterar tamanho">⊞</button>
      <button class="widget-hide-btn" title="Ocultar widget">✕</button>
    </div>
  </div>
  <!-- conteúdo existente do widget -->
</div>
```

### Drag handle

- CSS: `cursor: grab; user-select: none`
- Ativo: `cursor: grabbing`
- Somente o handle inicia o drag (SortableJS `handle: '.drag-handle'`)

### Botão de Tamanho

Cicla `sm → md → lg → xl → sm`:

| Tamanho | Label no tooltip |
|---------|-----------------|
| `sm` | "Pequeno" |
| `md` | "Médio" |
| `lg` | "Grande" |
| `xl` | "Máximo" |

- Tooltip mostra tamanho atual ex: "Tamanho: Grande"
- Muda a classe CSS no `widget-container` → `.size-sm`, `.size-md`, `.size-lg`, `.size-xl`
- Grid auto-reflowa

### Botão Ocultar

- Adiciona classe `.widget-hidden` ou remove do DOM
- Widget some com animação fadeOut 0.3s
- Não afeta o grid (itens remanescentes reflowam)

### Gerenciar Widgets

Botão "Gerenciar Widgets" no topo do dashboard (antes dos widgets). Abre um modal com toggle switches para cada widget:

| Widget | Visível | Tamanho |
|--------|---------|---------|
| Saldo Total | ✅ | sm |
| Entradas | ✅ | sm |
| ... | ... | ... |

- Útil para reativar widgets ocultos
- Ajustar tamanhos também aqui
- Botão "Resetar para Padrão"

### Feedback visual durante drag

- `.sortable-ghost`: `opacity: 0.3` + `outline: 2px dashed var(--primary)`
- `.sortable-chosen`: `box-shadow: var(--shadow-lg)` + `z-index: 100`
- Transição suave: `transition: transform 0.2s`

### Animação de hide

```css
@keyframes widgetFadeOut {
  to { opacity: 0; transform: scale(0.95); max-height: 0; padding: 0; margin: 0; overflow: hidden; }
}
.widget-hiding {
  animation: widgetFadeOut 0.3s ease forwards;
}
```

## UI — Presets

### Botão de Presets

Ícone `💾` no topo do dashboard (ao lado de "Gerenciar Widgets"). Abre dropdown com:

- **Salvar como...** → prompt para nome → salva
- **Gerenciar Presets** → modal com lista:
  - Nome do preset
  - ⭐ (ativo)
  - ✏️ Renomear
  - 📋 Exportar como JSON
  - 🗑️ Deletar
- **Importar Preset** → input file (.json)
- **Resetar para Padrão** → confirma → restaura

### Modal Gerenciar Presets

| Preset | Ações |
|--------|-------|
| Meu Layout Minimalista (ativo) | ⭐ Exportar 🗑️ |
| Layout Completo | Exportar 🗑️ |
| Foco em Gráficos | Exportar 🗑️ |

- Botão "Ativar" para aplicar preset
- Botão "Importar" para upload

### Export / Import

**Exportar**: arquivo `.json` com objeto do preset completo (widgets + order + name).

**Importar**: validação:
- JSON válido
- Objeto com `name` (string) e `widgets` (array) e `order` (array)
- Cada widget em `widgets` tem `id`, `visible` (boolean), `size` (string)
- Gera novo `id` para evitar conflito
- Adiciona à lista e ativa

## Backend — Migration

Opcional: nova coluna `dashboardConfig` na tabela `usuarios`:

```sql
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "dashboardConfig" TEXT DEFAULT '{}';
```

Alternativa: reutilizar `customThemes` com uma chave especial `_dashboard`. Decisão: **coluna separada `dashboardConfig`** para não misturar dados.

## Fluxo de Sincronização

1. Usuário arrasta/redimensiona/oculta widget
2. `updateWidgetConfig()` / `updateWidgetOrder()` atualiza localStorage
3. Debounce 2s → `syncToBackend()` com `PUT /api/profile { dashboardConfig }`
4. Ao carregar dashboard:
   - Lê `dashboardConfig` do backend via `GET /api/profile`
   - Se localStorage vazio, popula do backend
   - Aplica preset ativo (ordem + visibilidade + tamanhos)
5. Fallback: se backend sem `dashboardConfig`, usa `getDefaultPreset()`

## Ordem de Implementação

1. **Estrutura**: Criar `dashboardConfig.js` com funções CRUD de preset
2. **Backend**: Migration `ADD COLUMN dashboardConfig`, `GET/PUT /api/profile` tratam o campo
3. **HTML**: Refatorar `showDashboard()` — cada widget vira função separada + `.widget-container` com header
4. **CSS**: Grid 12 colunas, tamanhos, responsivo, drag styles, fadeOut
5. **SortableJS**: CDN, configurar `handle`, `onEnd` → `updateWidgetOrder()`
6. **Tamanho**: Botão ciclo + `updateWidgetConfig()`
7. **Ocultar**: Botão ✕ + `updateWidgetConfig()` + fadeOut
8. **Presets**: Modal gerenciar, salvar/carregar/exportar/importar
9. **Sincronização**: Debounce + `syncToBackend()`
10. **Testes**: Unit (dashboardConfig.js) + visual

## Testes

- Unit: `getPresets()`, `savePreset()`, `importPreset()` (validação), `getDefaultPreset()`
- Integração: `GET/PUT /api/profile` com `dashboardConfig`
- Visual: arrastar widget, mudar tamanho, ocultar, reativar, salvar preset, exportar, importar
- Responsivo: verificar grid em mobile/tablet/desktop
