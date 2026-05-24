export const store = {
  get token() { return localStorage.getItem('token'); },
  set token(v) { localStorage.setItem('token', v); },
  clear() { localStorage.removeItem('token'); },
};
