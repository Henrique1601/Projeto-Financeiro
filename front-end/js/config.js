const isFrontend = window.location.hostname.includes('projeto-financeiro-frontend');
const isVercel = window.location.hostname.includes('vercel');

export const API_BASE_URL = isVercel
  ? (isFrontend ? 'https://financeiro-backend.vercel.app' : 'https://financeiro-backend.vercel.app')
  : 'http://localhost:3000';

export const TOAST_DURATION = 3000;
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000;
export const FETCH_TIMEOUT = 10000;
