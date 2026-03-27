export const API_BASE_URL = window.location.hostname.includes('vercel')
  ? 'https://projeto-financeiro-vert.vercel.app/'
  : 'http://localhost:3000';

export const TOAST_DURATION = 3000;
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000;
export const FETCH_TIMEOUT = 10000;
