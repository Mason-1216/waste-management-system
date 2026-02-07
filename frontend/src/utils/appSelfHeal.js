// Recover from "old chunk" 404s after deployments (often caused by stale Service Worker cache).
// When the browser runs an old entry file, dynamic import() will try to fetch outdated chunk names
// and fail with: "Failed to fetch dynamically imported module".
//
// Strategy:
// - Detect chunk load failures (unhandledrejection / error event).
// - Unregister all Service Workers and clear CacheStorage.
// - Force reload with a cache-busting query param.
//
// Guard against reload loops by only attempting once per tab session.

const RECOVERY_FLAG = '__wms_chunk_recovery_attempted__';

const isChunkLoadError = (message) => {
  const text = String(message || '');
  return (
    text.includes('Failed to fetch dynamically imported module') ||
    text.includes('Importing a module script failed') ||
    text.includes('ChunkLoadError') ||
    text.includes('Loading chunk')
  );
};

const forceReloadWithBustParam = () => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('__reload', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.replace(`/?__reload=${Date.now()}`);
  }
};

const recoverFromStaleCache = async (reason) => {
  if (sessionStorage.getItem(RECOVERY_FLAG) === '1') {
    return;
  }
  sessionStorage.setItem(RECOVERY_FLAG, '1');

  // If user is offline, a reload loop is likely not helpful.
  if (navigator && navigator.onLine === false) {
    // eslint-disable-next-line no-console
    console.warn('[self-heal] offline, skip recovery:', reason);
    return;
  }

  // eslint-disable-next-line no-console
  console.warn('[self-heal] detected chunk load failure, clearing SW/caches then reloading:', reason);

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
    // ignore
  }

  try {
    if (window.caches && typeof window.caches.keys === 'function') {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k).catch(() => false)));
    }
  } catch {
    // ignore
  }

  forceReloadWithBustParam();
};

export const setupChunkLoadRecovery = () => {
  // unhandledrejection is the most reliable signal for dynamic import() failures.
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event && event.reason;
    const message = reason && (reason.message || reason.toString());
    if (isChunkLoadError(message)) {
      recoverFromStaleCache(message);
    }
  });

  // Some browsers may emit a generic error event for chunk/script errors.
  window.addEventListener('error', (event) => {
    const message = event && (event.message || (event.error && event.error.message));
    if (isChunkLoadError(message)) {
      recoverFromStaleCache(message);
      return;
    }

    const target = event && event.target;
    const src = target && (target.src || target.href);
    if (src && typeof src === 'string' && src.includes('/js/') && src.endsWith('.js')) {
      recoverFromStaleCache(`static js load failed: ${src}`);
    }
  }, true);
};

