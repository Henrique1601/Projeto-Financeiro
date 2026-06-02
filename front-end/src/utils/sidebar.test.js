import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let localStorageStore = {};
let bodyClasses = new Set();

function resetState() {
  bodyClasses = new Set();
  localStorageStore = {};
  fetchCalls = [];
}

globalThis.localStorage = {
  getItem: (k) => localStorageStore[k] ?? null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { localStorageStore = {}; },
};

globalThis.document = {
  body: {
    classList: {
      add: (...args) => args.forEach(c => bodyClasses.add(c)),
      remove: (c) => bodyClasses.delete(c),
      toggle: (c, force) => {
        if (force !== undefined) {
          if (force) bodyClasses.add(c);
          else bodyClasses.delete(c);
        } else {
          if (bodyClasses.has(c)) bodyClasses.delete(c);
          else bodyClasses.add(c);
        }
        return bodyClasses.has(c);
      },
      contains: (c) => bodyClasses.has(c),
    },
  },
  querySelectorAll: () => [],
};

let fetchCalls = [];
globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, opts });
  return { ok: true, json: async () => ({}) };
};

const api = await import('../utils/sidebar.js');

describe('getSidebarCompactMode', () => {
  it('returns true when compact mode is set', () => {
    localStorageStore.sidebarCompactMode = 'true';
    assert.equal(api.getSidebarCompactMode(), true);
  });

  it('returns false when compact mode not set', () => {
    delete localStorageStore.sidebarCompactMode;
    assert.equal(api.getSidebarCompactMode(), false);
  });
});

describe('setSidebarCollapsed', () => {
  beforeEach(() => resetState());

  it('adds sidebar-collapsed class when collapsed is true', () => {
    api.setSidebarCollapsed(true);
    assert.ok(bodyClasses.has('sidebar-collapsed'));
    assert.equal(localStorageStore.sidebarCollapsed, 'true');
  });

  it('removes sidebar-collapsed class when collapsed is false', () => {
    api.setSidebarCollapsed(false);
    assert.ok(!bodyClasses.has('sidebar-collapsed'));
    assert.equal(localStorageStore.sidebarCollapsed, 'false');
  });
});

describe('initSidebarState', () => {
  beforeEach(() => resetState());

  it('applies compact mode when sidebarCompactMode is true', () => {
    localStorageStore.sidebarCompactMode = 'true';
    api.initSidebarState();
    assert.ok(bodyClasses.has('sidebar-collapsed'));
    assert.ok(bodyClasses.has('sidebar-compact-mode'));
    assert.equal(localStorageStore.sidebarCollapsed, 'true');
  });

  it('applies collapsed when localStorage has it', () => {
    localStorageStore.sidebarCollapsed = 'true';
    api.initSidebarState();
    assert.ok(bodyClasses.has('sidebar-collapsed'));
  });

  it('does nothing when no state is saved', () => {
    api.initSidebarState();
    assert.ok(!bodyClasses.has('sidebar-collapsed'));
  });
});

describe('syncSidebarState', () => {
  beforeEach(() => resetState());

  it('does nothing without token', () => {
    api.syncSidebarState(true);
    assert.equal(fetchCalls.length, 0);
  });

  it('makes PUT request with token', () => {
    localStorageStore.token = 'test-token';
    api.syncSidebarState(true);
    assert.equal(fetchCalls.length, 1);
    assert.ok(fetchCalls[0].opts.body.includes('sidebarCollapsed'));
    assert.ok(fetchCalls[0].opts.body.includes('true'));
    assert.equal(fetchCalls[0].opts.method, 'PUT');
    assert.ok(fetchCalls[0].opts.headers.Authorization.includes('test-token'));
  });
});

describe('getPageGroup', () => {
  it('maps dashboard to Principal', () => {
    assert.equal(api.getPageGroup('dashboard'), 'Principal');
  });

  it('maps extrato/orcamentos/recorrentes to Financeiro', () => {
    assert.equal(api.getPageGroup('extrato'), 'Financeiro');
    assert.equal(api.getPageGroup('orcamentos'), 'Financeiro');
    assert.equal(api.getPageGroup('recorrentes'), 'Financeiro');
  });

  it('maps nova-transacao/importar to Ações', () => {
    assert.equal(api.getPageGroup('nova-transacao'), 'Ações');
    assert.equal(api.getPageGroup('importar'), 'Ações');
  });

  it('maps perfil/categorias to Conta', () => {
    assert.equal(api.getPageGroup('perfil'), 'Conta');
    assert.equal(api.getPageGroup('categorias'), 'Conta');
  });

  it('returns null for unknown page', () => {
    assert.equal(api.getPageGroup('unknown'), null);
  });
});
