import { API_BASE_URL } from './config.js';

const THEMES = [
  { id: 'dark', label: 'Escuro (Padrão)', icon: 'fa-moon' },
  { id: 'dracula', label: 'Dracula', icon: 'fa-dragon' },
  { id: 'nord', label: 'Nord', icon: 'fa-mountain' },
  { id: 'tokyo-night', label: 'Tóquio Noite', icon: 'fa-city' },
  { id: 'gruvbox', label: 'Gruvbox', icon: 'fa-brush' },
  { id: 'rose-pine', label: 'Rose Pine', icon: 'fa-tree' },
  { id: 'light', label: 'Claro', icon: 'fa-sun' },
];

const CUSTOM_THEMES_KEY = 'custom-themes';

function genId() {
  return 'custom-' + Math.random().toString(36).slice(2, 10);
}

function getToken() {
  return localStorage.getItem('token');
}

function syncCustomThemesToBackend(themes) {
  const token = getToken();
  if (!token) return;
  fetch(API_BASE_URL + '/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ customThemes: JSON.stringify(themes) }),
  }).catch(() => {});
}

export function getThemes() {
  return THEMES;
}

export function getAllThemes() {
  return [...THEMES, ...getCustomThemes().map(t => ({ ...t, label: t.label || t.name }))];
}

export function getCurrentTheme() {
  return localStorage.getItem('theme') || 'dark';
}

export function applyTheme(id) {
  if (id && id.startsWith('custom-')) {
    const themes = getCustomThemes();
    const theme = themes.find(t => t.id === id);
    if (theme) {
      applyCustomTheme(theme.colors);
      document.body.className = '';
      return;
    }
  }
  removeCustomThemeStyle();
  document.body.className = id === 'dark' ? '' : `theme-${id}`;
}

export function setTheme(id) {
  localStorage.setItem('theme', id);
  applyTheme(id);
  syncThemeToBackend(id);
}

function syncThemeToBackend(id) {
  const token = getToken();
  if (!token) return;
  fetch(API_BASE_URL + '/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ theme: id }),
  }).catch(() => {});
}

export function initTheme(serverTheme) {
  if (serverTheme) {
    localStorage.setItem('theme', serverTheme);
  }
  applyTheme(getCurrentTheme());
}

export function getCustomThemes() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveCustomTheme(data) {
  const themes = getCustomThemes();
  if (!data.id) data.id = genId();
  const idx = themes.findIndex(t => t.id === data.id);
  if (idx >= 0) {
    themes[idx] = data;
  } else {
    themes.push(data);
  }
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  syncCustomThemesToBackend(themes);
  return data;
}

export function deleteCustomTheme(id) {
  let themes = getCustomThemes().filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  syncCustomThemesToBackend(themes);
  if (getCurrentTheme() === id) {
    setTheme('dark');
  }
}

export function applyCustomTheme(colors) {
  removeCustomThemeStyle();
  const style = document.createElement('style');
  style.id = 'custom-theme-style';
  const vars = Object.entries(colors).map(([key, val]) => {
    const cssName = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `  ${cssName}: ${val};`;
  }).join('\n');
  style.textContent = `:root {\n${vars}\n}`;
  document.head.appendChild(style);
}

export function removeCustomThemeStyle() {
  const el = document.getElementById('custom-theme-style');
  if (el) el.remove();
}

export function exportCustomTheme(id) {
  const themes = getCustomThemes();
  const data = id === 'all' ? themes : themes.find(t => t.id === id);
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = id === 'all' ? 'meus-temas.json' : `tema-${data.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importCustomTheme(jsonStr) {
  const data = JSON.parse(jsonStr);
  const themes = Array.isArray(data) ? data : [data];
  const imported = [];
  for (const t of themes) {
    if (!t.name || !t.colors || !t.colors.primary || !t.colors.bg || !t.colors.text) {
      throw new Error(`Tema "${t.name || 'desconhecido'}" inválido: necessário name + colors (primary, bg, text)`);
    }
    t.id = genId();
    imported.push(t);
  }
  const existing = getCustomThemes();
  const merged = [...existing, ...imported];
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(merged));
  syncCustomThemesToBackend(merged);
  return imported;
}

export { syncThemeToBackend };
