import { defineStore } from 'pinia';

export const UI_MODES = Object.freeze({
  STANDARD: 'standard',
  SIMPLE: 'simple'
});

export const useUiModeStore = defineStore('uiMode', {
  state: () => ({
    mode: UI_MODES.STANDARD
  }),

  getters: {
    isSimpleMode: (state) => state.mode === UI_MODES.SIMPLE
  },

  actions: {
    setMode(mode) {
      if (!Object.values(UI_MODES).includes(mode)) return;
      this.mode = mode;
    },

    ensureAllowed(canUseSimpleMode) {
      if (canUseSimpleMode) return;
      if (this.mode !== UI_MODES.STANDARD) {
        this.mode = UI_MODES.STANDARD;
      }
    }
  },

  persist: {
    key: 'ui-mode-store',
    storage: localStorage,
    paths: ['mode']
  }
});
