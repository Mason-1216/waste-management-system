const STORAGE_KEY = 'wms_api_base_url';

const normalizeBaseUrl = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (withoutTrailingSlash.endsWith('/api')) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};

export const getStoredApiBaseUrl = () => {
  return localStorage.getItem(STORAGE_KEY) || '';
};

export const getApiBaseUrl = () => {
  const stored = normalizeBaseUrl(getStoredApiBaseUrl());
  if (stored) return stored;

  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || '/api');
};

export const setApiBaseUrl = (value) => {
  const normalized = normalizeBaseUrl(value);
  if (normalized) {
    localStorage.setItem(STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  return normalized;
};
