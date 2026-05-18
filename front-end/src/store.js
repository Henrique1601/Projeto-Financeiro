const state = {};
const listeners = {};

export function setState(key, value) {
  state[key] = value;
  if (listeners[key]) {
    listeners[key].forEach(fn => fn(value));
  }
}

export function getState(key) {
  return state[key];
}

export function onState(key, fn) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(fn);
  return () => {
    listeners[key] = listeners[key].filter(f => f !== fn);
  };
}

export const store = {
  get token() { return localStorage.getItem('token'); },
  set token(v) { localStorage.setItem('token', v); },
  clear() { localStorage.removeItem('token'); },
};
