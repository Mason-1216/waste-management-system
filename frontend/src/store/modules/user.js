import { defineStore } from 'pinia';
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    currentStationId: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    roleCode: (state) => state.userInfo?.roleCode || '',
    roleName: (state) => state.userInfo?.roleName || '',
    baseRoleCode: (state) => state.userInfo?.baseRoleCode || '',
    userId: (state) => state.userInfo?.id,
    realName: (state) => state.userInfo?.realName || '',
    stations: (state) => state.userInfo?.stations || [],
    isPriceAdmin: (state) => state.userInfo?.isPriceAdmin || false,
    permissionCodes: (state) => state.userInfo?.permissionCodes || [],
    menuCodes: (state) => state.userInfo?.menuCodes || []
  },

  actions: {
    async login(username, password) {
      const data = await loginApi({ username, password });

      this.token = data.token;
      this.userInfo = data.user;
      this.currentStationId = data.user.lastStationId;

      return data;
    },

    async logout() {
      try {
        await logoutApi();
      } catch {
        // 忽略错误
      }

      this.token = '';
      this.userInfo = null;
      this.currentStationId = null;
      window.location.replace('/login');
    },

    async fetchUserInfo() {
      const data = await getCurrentUser();
      this.userInfo = data;
      return data;
    },

    updateContext(stationId) {
      this.currentStationId = stationId;
    },

    hasRole(roles) {
      if (!Array.isArray(roles)) {
        roles = [roles];
      }
      return roles.includes(this.roleCode)
        || roles.includes(this.baseRoleCode)
        || this.roleCode === 'admin'
        || this.roleCode === 'dev_test';
    }
  },

  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['token', 'userInfo', 'currentStationId']
  }
});
