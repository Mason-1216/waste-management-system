import { computed } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { getApiBaseUrl } from '@/utils/apiBaseUrl';

export const useUpload = (actionPath = '/upload') => {
  const userStore = useUserStore();
  const apiBaseUrl = getApiBaseUrl();
  const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value ?? '');
  const isLoopbackHost = (host) => host === 'localhost' || host === '127.0.0.1';
  const resolveWindowOrigin = () => {
    if (typeof window === 'undefined' || !window.location) return '';
    const origin = window.location.origin;
    return typeof origin === 'string' ? origin : '';
  };
  const resolveApiBaseUrl = (value) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (!isAbsoluteUrl(trimmed)) return trimmed;
    if (typeof window === 'undefined' || !window.location || !window.location.origin) {
      return trimmed;
    }
    try {
      const parsed = new URL(trimmed);
      const windowHost = window.location.hostname;
      if (isLoopbackHost(parsed.hostname) && !isLoopbackHost(windowHost)) {
        const normalizedPath = parsed.pathname.replace(/\/+$/, '');
        return `${window.location.origin}${normalizedPath}`;
      }
    } catch (error) {
      return trimmed;
    }
    return trimmed;
  };
  const resolvedApiBaseUrl = resolveApiBaseUrl(apiBaseUrl);
  const uploadUrl = computed(() => `${resolvedApiBaseUrl}${actionPath}`);
  const uploadHeaders = computed(() => {
    const token = userStore.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  });
  const resolveUploadUrl = (value) => {
    if (typeof value !== 'string') return '';
    const url = value.trim();
    if (!url) return '';
    if (isAbsoluteUrl(url)) return url;
    if (!url.startsWith('/')) return url;
    const windowOrigin = resolveWindowOrigin();
    if (windowOrigin) {
      if (typeof resolvedApiBaseUrl !== 'string' || !isAbsoluteUrl(resolvedApiBaseUrl)) {
        return `${windowOrigin}${url}`;
      }
      const windowHost = window.location?.hostname;
      if (typeof windowHost === 'string' && windowHost) {
        try {
          const baseUrl = new URL(resolvedApiBaseUrl);
          if (baseUrl.hostname === windowHost) {
            return `${windowOrigin}${url}`;
          }
        } catch (error) {
          
        }
      }
    }
    if (typeof resolvedApiBaseUrl === 'string' && isAbsoluteUrl(resolvedApiBaseUrl)) {
      try {
        const baseUrl = new URL(resolvedApiBaseUrl);
        return `${baseUrl.origin}${url}`;
      } catch (error) {
        
      }
    }
    if (windowOrigin) {
      return `${windowOrigin}${url}`;
    }
    return url;
  };

  return {
    apiBaseUrl: resolvedApiBaseUrl,
    uploadUrl,
    uploadHeaders,
    resolveUploadUrl
  };
};
