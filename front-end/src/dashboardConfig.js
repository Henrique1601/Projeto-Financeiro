import { API_BASE_URL } from './config.js';

const CONFIG_KEY = 'dashboard-config';
const DEFAULT_PRESET_ID = 'default';

const WIDGET_DEFS = [
  { id: 'saldo', label: 'Saldo Total', type: 'stat', defaultSize: 'sm' },
  { id: 'entradas', label: 'Entradas', type: 'stat', defaultSize: 'sm' },
  { id: 'saidas', label: 'Saídas', type: 'stat', defaultSize: 'sm' },
  { id: 'transacoes', label: 'Transações', type: 'stat', defaultSize: 'sm' },
  { id: 'evolucao', label: 'Evolução Mensal', type: 'chart', defaultSize: 'lg' },
  { id: 'categorias', label: 'Categorias', type: 'chart', defaultSize: 'lg' },
  { id: 'comparativo', label: 'Comparativo Mensal', type: 'insight', defaultSize: 'md' },
  { id: 'meta', label: 'Meta de Economia', type: 'insight', defaultSize: 'md' },
  { id: 'projecao', label: 'Projeção de Saldo', type: 'insight', defaultSize: 'md' },
  { id: 'orcamentos', label: 'Orçamentos do Mês', type: 'orcamentos', defaultSize: 'xl' },
  { id: 'metas-categoria', label: 'Metas por Categoria', type: 'metas-categoria', defaultSize: 'lg' },
  { id: 'desafios', label: 'Desafios de Economia', type: 'desafios', defaultSize: 'lg' },
  { id: 'pagamentos', label: 'Por Método de Pagamento', type: 'chart', defaultSize: 'md' },
  { id: 'recorrentes-vs-pontuais', label: 'Recorrentes vs Pontuais', type: 'chart', defaultSize: 'md' },
  { id: 'comparativo-mensal', label: 'Comparativo Mensal', type: 'insight', defaultSize: 'md' },
  { id: 'investimento', label: 'Regra de Investimento', type: 'insight', defaultSize: 'sm' },
];

const DEFAULT_ORDER = WIDGET_DEFS.map(w => w.id);

const SIZE_LABELS = { sm: 'Pequeno', md: 'Médio', lg: 'Grande', xl: 'Máximo' };
const NEXT_SIZE = { sm: 'md', md: 'lg', lg: 'xl', xl: 'sm' };

let syncTimer = null;

function getToken() { return localStorage.getItem('token'); }

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}; } catch { return {}; }
}

function saveConfigSilent(data) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
}

function syncToBackend(data) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const token = getToken();
    if (!token) return;
    fetch(API_BASE_URL + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dashboardConfig: JSON.stringify(data) }),
    }).catch(() => {});
  }, 2000);
}

export function getWidgetDefs() { return WIDGET_DEFS; }

export function getSizeLabel(size) { return SIZE_LABELS[size] || 'Pequeno'; }

export function getNextSize(size) { return NEXT_SIZE[size] || 'sm'; }

function normalizeWidgets(preset) {
  if (Array.isArray(preset.widgets)) {
    const obj = {};
    preset.widgets.forEach(w => { obj[w.id] = { hidden: !w.visible, size: w.size }; });
    preset.widgets = obj;
  }
  return preset;
}

export function getActivePreset() {
  const config = loadConfig();
  const activeId = config.activePresetId || DEFAULT_PRESET_ID;
  const presets = config.presets || [];
  const preset = presets.find(p => p.id === activeId);
  if (preset) return normalizeWidgets(JSON.parse(JSON.stringify(preset)));
  return getDefaultPreset();
}

export function setActivePreset(id) {
  const config = loadConfig();
  config.activePresetId = id;
  if (id === DEFAULT_PRESET_ID) {
    config.presets = (config.presets || []).filter(p => p.id !== DEFAULT_PRESET_ID);
  }
  saveConfigSilent(config);
  syncToBackend(config);
}

export function saveCurrentPreset(name, currentWidgets, currentOrder) {
  const config = loadConfig();
  const presets = config.presets || [];
  if (!currentWidgets || !currentOrder) {
    const active = getActivePreset();
    if (active) {
      currentWidgets = Object.entries(active.widgets).map(([id, w]) => ({ id, visible: !w.hidden, size: w.size || 'lg' }));
      currentOrder = active.order || Object.keys(active.widgets);
    }
  }
  const widgets = {};
  if (currentWidgets) currentWidgets.forEach(w => { widgets[w.id] = { hidden: !w.visible, size: w.size }; });
  const preset = {
    id: 'preset-' + Math.random().toString(36).slice(2, 10),
    name: name || 'Novo Preset',
    widgets,
    order: currentOrder ? [...currentOrder] : [],
  };
  presets.push(preset);
  config.presets = presets;
  config.activePresetId = preset.id;
  saveConfigSilent(config);
  syncToBackend(config);
  return preset;
}

export function deletePreset(id) {
  const config = loadConfig();
  const presets = (config.presets || []).filter(p => p.id !== id);
  config.presets = presets;
  if (config.activePresetId === id) {
    config.activePresetId = DEFAULT_PRESET_ID;
  }
  saveConfigSilent(config);
  syncToBackend(config);
}

export function getPresets() {
  const config = loadConfig();
  return config.presets || [];
}

export function updateWidgetConfig(widgetId, changes) {
  const config = loadConfig();
  const activeId = config.activePresetId || DEFAULT_PRESET_ID;
  const presets = config.presets || [];
  let preset = presets.find(p => p.id === activeId);
  if (!preset) {
    preset = getDefaultPreset();
    presets.push(preset);
  }
  normalizeWidgets(preset);
  if (!preset.widgets[widgetId]) {
    const def = WIDGET_DEFS.find(w => w.id === widgetId);
    preset.widgets[widgetId] = { hidden: false, size: def ? def.defaultSize : 'lg' };
  }
  if (changes.hidden !== undefined) preset.widgets[widgetId].hidden = changes.hidden;
  if (changes.visible !== undefined) preset.widgets[widgetId].hidden = !changes.visible;
  if (changes.size) preset.widgets[widgetId].size = changes.size;
  if (!preset.order) preset.order = [...DEFAULT_ORDER];
  if (changes._order !== undefined) {
    const idx = preset.order.indexOf(widgetId);
    if (idx >= 0) preset.order.splice(idx, 1);
    preset.order.splice(changes._order, 0, widgetId);
  }
  config.presets = presets;
  config.activePresetId = preset.id;
  saveConfigSilent(config);
  syncToBackend(config);
}

export function updateWidgetOrder(orderArray) {
  const config = loadConfig();
  const activeId = config.activePresetId || DEFAULT_PRESET_ID;
  const presets = config.presets || [];
  const preset = presets.find(p => p.id === activeId);
  if (preset) {
    preset.order = orderArray;
    config.presets = presets;
    saveConfigSilent(config);
    syncToBackend(config);
  }
}

export function initFromBackend(backendConfigStr) {
  if (!backendConfigStr) return;
  try {
    const backend = JSON.parse(backendConfigStr);
    const local = loadConfig();
    if (!local.presets || local.presets.length === 0) {
      saveConfigSilent(backend);
    }
  } catch {}
}

export function getDefaultPreset() {
  const widgets = {};
  WIDGET_DEFS.forEach(w => { widgets[w.id] = { hidden: false, size: w.defaultSize }; });
  return { id: DEFAULT_PRESET_ID, name: 'Layout Padrão', widgets, order: [...DEFAULT_ORDER] };
}

export function exportPreset() {
  const preset = getActivePreset();
  if (!preset) return null;
  const arr = Object.entries(preset.widgets).map(([id, w]) => ({ id, visible: !w.hidden, size: w.size }));
  return JSON.stringify({ name: preset.name, widgets: arr, order: [...preset.order], _exported: true, _date: new Date().toISOString() }, null, 2);
}

export function importPreset(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (!data.name || !data.widgets || !data.order) {
    throw new Error('Preset inválido: necessário name, widgets e order.');
  }
  const arr = data.widgets;
  if (Array.isArray(arr) && arr.every(w => w.id && 'visible' in w && w.size)) {
    const obj = {};
    arr.forEach(w => { obj[w.id] = { hidden: !w.visible, size: w.size }; });
    data.widgets = obj;
  }
  data.id = 'preset-' + Math.random().toString(36).slice(2, 10);
  const config = loadConfig();
  const presets = config.presets || [];
  presets.push(data);
  config.presets = presets;
  config.activePresetId = data.id;
  saveConfigSilent(config);
  syncToBackend(config);
  return data;
}

export function resetToDefaults() {
  const config = loadConfig();
  config.activePresetId = DEFAULT_PRESET_ID;
  config.presets = [getDefaultPreset()];
  saveConfigSilent(config);
  syncToBackend(config);
}
