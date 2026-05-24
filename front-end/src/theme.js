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

export function getThemes() {
  return THEMES;
}

export function getCurrentTheme() {
  return localStorage.getItem('theme') || 'dark';
}

export function applyTheme(id) {
  document.body.className = id === 'dark' ? '' : `theme-${id}`;
}

export function setTheme(id) {
  localStorage.setItem('theme', id);
  applyTheme(id);
  syncThemeToBackend(id);
}

function syncThemeToBackend(id) {
  const token = localStorage.getItem('token');
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

export { syncThemeToBackend };
