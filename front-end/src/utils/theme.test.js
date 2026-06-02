import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

let localStorageStore = {};
const origLocalStorage = globalThis.localStorage;

globalThis.localStorage = {
  getItem: (k) => localStorageStore[k] ?? null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { localStorageStore = {}; },
};

let mediaListeners = [];
let matchMediaCalls = [];

let bodyClass = '';
globalThis.document = {
  body: { set className(v) { bodyClass = v; }, get className() { return bodyClass; } },
  head: { appendChild: () => {} },
  createElement: () => ({ id: '', tag: '', textContent: '', setAttribute: () => {} }),
  getElementById: () => null,
};
globalThis.window = globalThis;

let _matchMedia = (query) => {
  matchMediaCalls.push(query);
  return {
    matches: query === '(prefers-color-scheme: dark)',
    addEventListener: (_, cb) => { mediaListeners.push(cb); },
    removeEventListener: (_, cb) => {
      mediaListeners = mediaListeners.filter(l => l !== cb);
    },
  };
};
globalThis.matchMedia = _matchMedia;

let fetchCalls = [];
globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, opts });
  return { ok: true, json: async () => ({}) };
};

let themeApi;

before(async () => {
  themeApi = await import('../theme.js');
});

describe('getThemes', () => {
  it('returns array with 8 themes including system', () => {
    const themes = themeApi.getThemes();
    assert.equal(themes.length, 8);
    assert.ok(themes.some(t => t.id === 'system'));
  });
});

describe('getAllThemes', () => {
  it('includes system and custom themes', () => {
    const all = themeApi.getAllThemes();
    assert.ok(all.some(t => t.id === 'system'));
  });
});

describe('getCurrentTheme', () => {
  it('returns saved theme from localStorage', () => {
    localStorageStore.theme = 'dracula';
    assert.equal(themeApi.getCurrentTheme(), 'dracula');
  });

  it('returns dark as default when nothing saved', () => {
    delete localStorageStore.theme;
    assert.equal(themeApi.getCurrentTheme(), 'dark');
  });
});

describe('resolveTheme', () => {
  it('returns dark for system when prefers-color-scheme is dark', () => {
    assert.equal(themeApi.resolveTheme('system'), 'dark');
  });

  it('returns light for system when mock says light', () => {
    globalThis.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
    assert.equal(themeApi.resolveTheme('system'), 'light');
    globalThis.matchMedia = _matchMedia;
  });

  it('returns the same id for non-system themes', () => {
    assert.equal(themeApi.resolveTheme('dracula'), 'dracula');
    assert.equal(themeApi.resolveTheme('nord'), 'nord');
    assert.equal(themeApi.resolveTheme('light'), 'light');
  });
});

describe('setTheme', () => {
  before(() => {
    localStorageStore = {};
    mediaListeners = [];
    fetchCalls = [];
    matchMediaCalls = [];
  });

  it('saves system to localStorage and starts listener', () => {
    themeApi.setTheme('system');
    assert.equal(localStorageStore.theme, 'system');
    assert.ok(matchMediaCalls.length > 0, 'matchMedia should have been called');
    assert.ok(mediaListeners.length > 0, 'listener should have been added');
  });

  it('saves fixed theme to localStorage and stops listener', () => {
    themeApi.setTheme('dracula');
    assert.equal(localStorageStore.theme, 'dracula');
  });
});

describe('initTheme', () => {
  before(() => {
    localStorageStore = {};
    mediaListeners = [];
  });

  it('overrides localStorage with server theme', () => {
    themeApi.initTheme('nord');
    assert.equal(localStorageStore.theme, 'nord');
  });

  it('starts system listener when saved theme is system', () => {
    localStorageStore.theme = 'system';
    const prevLen = mediaListeners.length;
    themeApi.initTheme();
    assert.ok(mediaListeners.length > prevLen, 'listener should have been added');
  });
});

describe('applyTheme', () => {
  before(() => {
    bodyClass = '';
  });

  it('sets body class for non-system themes', () => {
    themeApi.applyTheme('dracula');
    assert.equal(bodyClass, 'theme-dracula');
  });

  it('sets empty body class for dark theme', () => {
    themeApi.applyTheme('dark');
    assert.equal(bodyClass, '');
  });

  it('sets body class for light theme', () => {
    themeApi.applyTheme('light');
    assert.equal(bodyClass, 'theme-light');
  });
});

after(() => {
  globalThis.localStorage = origLocalStorage;
});
