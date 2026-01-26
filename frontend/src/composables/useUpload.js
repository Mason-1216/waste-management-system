import { computed } from 'vue';
import { useUserStore } from '@/store/modules/user';

export const useUpload = (actionPath = '/upload') => {
  const userStore = useUserStore();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const uploadUrl = computed(() => `${apiBaseUrl}${actionPath}`);
  const uploadHeaders = computed(() => {
    const token = userStore.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  });

  return {
    apiBaseUrl,
    uploadUrl,
    uploadHeaders
  };
};
