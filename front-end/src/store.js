import { apiGet } from './api.js';

export const store = {
  get token() { return localStorage.getItem('token'); },
  set token(v) { localStorage.setItem('token', v); },
  clear() { localStorage.removeItem('token'); },
  _categorias: null,
  _categoriasPromise: null,
  async getCategorias() {
    if (this._categorias) return this._categorias;
    if (!this._categoriasPromise) {
      this._categoriasPromise = apiGet('/api/categorias').then(cats => {
        this._categorias = cats;
        return cats;
      });
    }
    return this._categoriasPromise;
  },
  invalidateCategorias() {
    this._categorias = null;
    this._categoriasPromise = null;
  }
};
