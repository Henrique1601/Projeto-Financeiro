const STORAGE_KEY = 'keybindings';

export const DEFAULT_BINDINGS = {
  dashboard: { key: 'h', ctrl: true, shift: false, alt: false, label: 'Dashboard', desc: 'Ir para o dashboard' },
  extrato: { key: 'e', ctrl: true, shift: false, alt: false, label: 'Extrato', desc: 'Ir para o extrato' },
  tema: { key: 't', ctrl: true, shift: false, alt: false, label: 'Tema', desc: 'Alternar tema' },
  'nova-transacao': { key: 'n', ctrl: true, shift: false, alt: false, label: 'Nova Transação', desc: 'Abrir formulário' },
  salvar: { key: 's', ctrl: true, shift: false, alt: false, label: 'Salvar', desc: 'Salvar formulário atual' },
  perfil: { key: 'p', ctrl: true, shift: false, alt: false, label: 'Perfil', desc: 'Ir para o perfil' },
  recorrentes: { key: 'r', ctrl: true, shift: false, alt: false, label: 'Recorrentes', desc: 'Ir para recorrentes' },
  desafios: { key: 'd', ctrl: true, shift: false, alt: false, label: 'Desafios', desc: 'Ir para desafios' },
  comparativo: { key: 'm', ctrl: true, shift: false, alt: false, label: 'Comparativo', desc: 'Ir para comparativo mensal' },
  buscar: { key: 'f', ctrl: true, shift: false, alt: false, label: 'Buscar', desc: 'Focar no campo de busca' },
  fechar: { key: 'Escape', ctrl: false, shift: false, alt: false, label: 'Fechar', desc: 'Fechar modal' },
  assistente: { key: 'i', ctrl: true, shift: false, alt: false, label: 'Assistente', desc: 'Abrir assistente IA' },
};

let bindings = {};
let listener = null;

export function getBindings() {
  return { ...bindings };
}

export function getBinding(action) {
  return bindings[action] || null;
}

export function formatBinding(b) {
  if (!b) return '';
  const parts = [];
  if (b.ctrl) parts.push('Ctrl');
  if (b.alt) parts.push('Alt');
  if (b.shift) parts.push('Shift');
  if (b.key && b.key !== 'Escape') parts.push(b.key.toUpperCase());
  else if (b.key === 'Escape') parts.push('Esc');
  return parts.join('+');
}

export function setBinding(action, combo) {
  if (!bindings[action]) return;
  bindings[action] = { ...combo };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings)); } catch {}
  syncToBackend();
}

export function resetBindings() {
  bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings)); } catch {}
  syncToBackend();
}

export function getActionFromKeyEvent(e) {
  for (const [action, b] of Object.entries(bindings)) {
    if (
      e.key === b.key &&
      e.ctrlKey === !!b.ctrl &&
      e.shiftKey === !!b.shift &&
      e.altKey === !!b.alt
    ) {
      return action;
    }
  }
  return null;
}

export function initKeybindings() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch {}
  bindings = saved && typeof saved === 'object'
    ? { ...JSON.parse(JSON.stringify(DEFAULT_BINDINGS)), ...saved }
    : JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
}

export function loadKeybindings(serverBindings) {
  if (serverBindings && typeof serverBindings === 'object') {
    bindings = { ...JSON.parse(JSON.stringify(DEFAULT_BINDINGS)), ...serverBindings };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings)); } catch {}
  }
}

async function syncToBackend() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const { apiPut } = await import('../api.js');
    await apiPut('/api/profile', { keybindings: bindings });
  } catch {}
}
