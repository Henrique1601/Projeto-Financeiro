const BACKEND_URL = 'https://gestor-financeiro-api-proj.vercel.app';

export function getApiBaseUrl() {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : process.env;
  if (env.DEV) {
    return env.VITE_API_URL || 'http://localhost:3000';
  }
  return BACKEND_URL;
}

export const API_BASE_URL = getApiBaseUrl();

export const APP_NAME = 'Gestor Financeiro';

export const CATEGORIAS = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
  'Lazer', 'Vestuário', 'Serviços', 'Salário', 'Investimentos',
];

export const CURRENCIES = [
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', locale: 'pt-BR' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥', locale: 'ja-JP' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', locale: 'en-GB' },
  { code: 'ARS', name: 'Peso Argentino', symbol: 'AR$', locale: 'es-AR' },
];
