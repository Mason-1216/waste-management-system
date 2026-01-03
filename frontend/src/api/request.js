import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import router from '@/router';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }

    // 添加项目和场站上下文
    if (userStore.currentProjectId) {
      config.headers['X-Project-Id'] = userStore.currentProjectId;
    }
    if (userStore.currentStationId) {
      config.headers['X-Station-Id'] = userStore.currentStationId;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 如果是blob类型，直接返回
    if (response.config.responseType === 'blob') {
      return response.data;
    }

    const { code, message, data } = response.data;

    if (code === 200) {
      return data;
    } else {
      ElMessage.error(message || '请求失败');
      return Promise.reject(new Error(message));
    }
  },
  error => {
    if (error.response) {
      const { status, data } = error.response;
      const requestUrl = error.config?.url || '';

      if (status === 401) {
        if (requestUrl.includes('/auth/login')) {
          ElMessage.error('用户名或密码错误，请重新输入');
        } else {
          ElMessage.error('登录已过期，请重新登录');
          const userStore = useUserStore();
          userStore.logout();
          router.push('/login');
        }
      } else if (status === 403) {
        ElMessage.error('无权限访问');
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在');
      } else if (status === 500) {
        ElMessage.error(data?.message || '服务器错误');
      } else {
        ElMessage.error(data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请重试');
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  }
);

export default request;
