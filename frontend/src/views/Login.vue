<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>运行项目管理系统</h2>
      </div>

      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div
        class="secret-trigger"
        @mousedown="startServerPress"
        @mouseup="cancelServerPress"
        @mouseleave="cancelServerPress"
        @touchstart.prevent="startServerPress"
        @touchend="cancelServerPress"
        @touchcancel="cancelServerPress"
      ></div>
    </div>
  </div>

  <FormDialog
    v-model="pinDialogVisible"
    title="Enter PIN"
    width="360px"
    :show-confirm="false"
    :show-cancel="false"
  >
    <el-form label-width="80px">
      <el-form-item label="PIN">
        <el-input
          v-model="pinForm.pin"
          type="password"
          autocomplete="off"
          placeholder="6-digit PIN"
          maxlength="12"
          show-password
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="pinDialogVisible = false">Cancel</el-button>
      <el-button type="primary" @click="confirmPin">Confirm</el-button>
    </template>
  </FormDialog>

  <FormDialog
    v-model="serverDialogVisible"
    title="Server Settings"
    width="420px"
    :show-confirm="false"
    :show-cancel="false"
  >
    <el-form label-width="120px">
      <el-form-item label="API Base URL">
        <el-input
          v-model="serverForm.baseUrl"
          placeholder="http://192.168.1.10:3000"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="resetServerBaseUrl">Reset</el-button>
      <el-button @click="serverDialogVisible = false">Cancel</el-button>
      <el-button type="primary" @click="saveServerBaseUrl">Save</el-button>
    </template>
  </FormDialog>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import { getApiBaseUrl, getStoredApiBaseUrl, setApiBaseUrl } from '@/utils/apiBaseUrl';
import FormDialog from '@/components/system/FormDialog.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const formRef = ref(null);
const loading = ref(false);
const pinDialogVisible = ref(false);
const serverDialogVisible = ref(false);
const pinForm = reactive({
  pin: ''
});
const serverForm = reactive({
  baseUrl: ''
});
const pressTimer = ref(null);
const expectedPin = import.meta.env.VITE_SERVER_SETTINGS_PIN || '2580';
const rememberMe = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      await userStore.login(loginForm.username, loginForm.password);

      // 保存或清除记住的用户名和密码
      if (rememberMe.value) {
        localStorage.setItem('rememberedUsername', loginForm.username);
        localStorage.setItem('rememberedPassword', loginForm.password);
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
      }

      ElMessage.success('登录成功');

      const redirect = route.query.redirect || '/home';
      router.push(redirect);
    } catch {
      // 登录失败已在 store 中处理
    } finally {
      loading.value = false;
    }
  });
};

const startServerPress = () => {
  cancelServerPress();
  pressTimer.value = setTimeout(() => {
    pinForm.pin = '';
    pinDialogVisible.value = true;
  }, 5000);
};

const cancelServerPress = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
};

const saveServerBaseUrl = () => {
  const rawValue = (serverForm.baseUrl || '').trim();
  if (!rawValue) {
    resetServerBaseUrl();
    return;
  }

  const normalized = setApiBaseUrl(rawValue);
  if (!normalized) {
    ElMessage.error('Invalid server URL');
    return;
  }

  ElMessage.success('Server URL saved');
  serverDialogVisible.value = false;
  setTimeout(() => window.location.reload(), 200);
};

const resetServerBaseUrl = () => {
  setApiBaseUrl('');
  ElMessage.success('Server URL reset');
  serverDialogVisible.value = false;
  setTimeout(() => window.location.reload(), 200);
};

const confirmPin = () => {
  if (pinForm.pin !== expectedPin) {
    ElMessage.error('Invalid PIN');
    return;
  }
  pinDialogVisible.value = false;
  serverForm.baseUrl = getStoredApiBaseUrl() || getApiBaseUrl();
  serverDialogVisible.value = true;
};

onBeforeUnmount(() => {
  cancelServerPress();
});

onMounted(() => {
  // 加载记住的用户名和密码
  const rememberedUsername = localStorage.getItem('rememberedUsername');
  const rememberedPassword = localStorage.getItem('rememberedPassword');
  if (rememberedUsername) {
    loginForm.username = rememberedUsername;
  }
  if (rememberedPassword) {
    loginForm.password = rememberedPassword;
  }
  if (rememberedUsername || rememberedPassword) {
    rememberMe.value = true;
  }
});
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    margin: 0 0 8px;
    font-size: 24px;
    color: #303133;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }
}

.login-btn {
  width: 100%;
}

.login-footer {
  text-align: center;
  margin-top: 20px;

  p {
    margin: 0;
    color: #909399;
    font-size: 12px;
  }
}

.secret-trigger {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 80px;
  height: 30px;
  opacity: 0.02;
}

@media screen and (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 24px 16px;
  }

  .login-header {
    margin-bottom: 24px;

    h2 {
      font-size: 20px;
    }
  }

  .login-form {
    .el-form-item {
      margin-bottom: 20px;
    }
  }

  // 确保触摸友好
  .login-btn {
    min-height: 44px;
    font-size: 16px;
  }
}

// 处理软键盘弹出时的布局
@media screen and (max-height: 500px) {
  .login-container {
    align-items: flex-start;
    padding-top: 20px;
  }

  .login-card {
    padding: 20px 16px;
  }

  .login-header {
    margin-bottom: 16px;

    h2 {
      font-size: 18px;
    }
  }

  .login-form {
    .el-form-item {
      margin-bottom: 16px;
    }
  }
}
</style>
