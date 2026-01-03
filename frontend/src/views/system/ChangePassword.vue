<template>
  <div class="change-password-page">
    <div class="page-header">
      <h2>修改密码</h2>
    </div>

    <div class="password-form-card">
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="120px"
        style="max-width: 500px"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            确认修改
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="password-tips">
        <h4>密码要求：</h4>
        <ul>
          <li>密码长度至少6位</li>
          <li>建议包含字母、数字和特殊字符</li>
          <li>请勿使用与用户名相同的密码</li>
          <li>定期更换密码以保证账户安全</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref(null);
const submitting = ref(false);

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

const submitForm = async () => {
  await formRef.value.validate();
  submitting.value = true;
  try {
    await request.put('/auth/change-password', {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    });
    ElMessage.success('密码修改成功，请重新登录');
    userStore.logout();
  } catch (e) {
    
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  formRef.value?.resetFields();
};
</script>

<style lang="scss" scoped>
.change-password-page {
  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .password-form-card {
    background: #fff;
    border-radius: 8px;
    padding: 40px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 60px;

    .password-tips {
      padding: 20px;
      background: #f5f7fa;
      border-radius: 8px;
      max-width: 300px;

      h4 {
        margin: 0 0 12px;
        font-size: 14px;
        color: #303133;
      }

      ul {
        margin: 0;
        padding-left: 20px;
        color: #606266;
        font-size: 13px;
        line-height: 2;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .change-password-page {
    .password-form-card {
      flex-direction: column;
      padding: 20px;

      .password-tips {
        max-width: 100%;
      }
    }
  }
}
</style>
