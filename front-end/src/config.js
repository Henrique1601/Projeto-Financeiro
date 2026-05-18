const BACKEND_URL = 'https://projeto-financeiro-vert.vercel.app';

export function getApiBaseUrl() {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }
  return BACKEND_URL;
}

export const API_BASE_URL = getApiBaseUrl();

export const APP_NAME = 'Gestor Financeiro';

export const CATEGORIAS = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
  'Lazer', 'Vestuário', 'Serviços', 'Salário', 'Investimentos',
];
