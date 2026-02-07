import { defineStore } from 'pinia';
import permissionApi from '@/api/permission';

// Loads the global permission catalog (not the current user's permissions).
// We only need "which menu codes exist" so we can:
// - treat routes/menus with a real menu permission as permission-controlled
// - treat other sub routes (e.g. /schedule/my) as "virtual children" controlled by their parent.
export const usePermissionCatalogStore = defineStore('permissionCatalog', {
  state: () => ({
    loaded: false,
    loading: false,
    // { [menuCode: string]: true }
    menuCodeMap: {},
    // Known menu paths (e.g. "/schedule"), sorted by length desc for prefix matching.
    menuPathList: []
  }),

  getters: {
    hasMenuCode: (state) => (code) => !!state.menuCodeMap?.[code],
    resolveMenuCodeForPath: (state) => (path) => {
      if (!path || typeof path !== 'string') return null;
      const normalized = path.startsWith('/') ? path : `/${path}`;
      for (const menuPath of state.menuPathList || []) {
        if (normalized === menuPath || normalized.startsWith(`${menuPath}/`)) {
          return `menu:${menuPath}`;
        }
      }
      return null;
    }
  },

  actions: {
    async ensureLoaded() {
      if (this.loaded || this.loading) return;
      this.loading = true;
      try {
        const res = await permissionApi.getPermissionCatalog();
        const menuCodes = res?.menuCodes || [];
        const map = {};
        menuCodes
          .filter(code => typeof code === 'string' && code.startsWith('menu:/'))
          .forEach(code => {
            map[code] = true;
          });
        this.menuCodeMap = map;
        this.menuPathList = Object.keys(map)
          .filter(code => code.startsWith('menu:/'))
          .map(code => code.slice(5))
          .sort((a, b) => b.length - a.length);
        this.loaded = true;
      } catch {
        // Keep the previous state so the app can fall back to role-based behavior.
      } finally {
        this.loading = false;
      }
    }
  }
});
