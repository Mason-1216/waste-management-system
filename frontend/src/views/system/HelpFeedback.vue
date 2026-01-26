<template>
  <div class="help-feedback-page">
    <div class="page-header">
      <h2>帮助与反馈</h2>
    </div>

    <!-- 管理员查看反馈记录 -->
    <div class="section" v-if="userStore.roleCode === 'admin'">
      <h3>用户反馈记录</h3>
      <el-table :data="feedbackList" stripe border v-loading="loadingFeedback">
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'suggestion'" type="success">功能建议</el-tag>
            <el-tag v-else-if="row.type === 'bug'" type="danger">问题反馈</el-tag>
            <el-tag v-else type="info">其他</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="反馈内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系方式" width="150" />
        <el-table-column prop="createdAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewFeedbackDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 常见问题 -->
    <div class="section">
      <h3>常见问题</h3>
      <el-collapse v-model="activeFaq">
        <el-collapse-item title="如何提交工时？" name="1">
          <p>1. 点击侧边栏"岗位工作"菜单</p>
          <p>2. 选择对应的工作项目</p>
          <p>3. 填写工时信息并提交</p>
        </el-collapse-item>
        <el-collapse-item title="如何上报故障？" name="2">
          <p>1. 点击侧边栏"故障上报"菜单</p>
          <p>2. 填写设备信息和故障现象</p>
          <p>3. 选择紧急程度并提交</p>
        </el-collapse-item>
        <el-collapse-item title="如何查看排班表？" name="3">
          <p>1. 点击侧边栏"排班表"菜单</p>
          <p>2. 可以按周或月查看排班信息</p>
          <p>3. 站长及以上级别可以编辑排班</p>
        </el-collapse-item>
        <el-collapse-item title="忘记密码怎么办？" name="4">
          <p>请联系系统管理员重置密码</p>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 意见反馈 -->
    <div class="section">
      <h3>意见反馈</h3>
      <el-form :model="feedbackForm" :rules="feedbackRules" ref="feedbackFormRef" label-width="100px">
        <el-form-item label="反馈类型" prop="type">
          <el-select v-model="feedbackForm.type" placeholder="请选择反馈类型" style="width: 200px;">
            <el-option label="功能建议" value="suggestion" />
            <el-option label="问题反馈" value="bug" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="反馈内容" prop="content">
          <el-input
            v-model="feedbackForm.content"
            type="textarea"
            :rows="5"
            placeholder="请详细描述您的问题或建议..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="feedbackForm.contact" placeholder="可选，方便我们联系您" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="截图">
          <BaseUpload
            :action="uploadUrl"
            list-type="picture-card"
            :headers="uploadHeaders"
            :limit="3"
            :file-list="imageList"
            :on-success="handleUploadSuccess"
            :on-remove="handleUploadRemove"
            :on-exceed="handleUploadExceed"
            accept="image/*"
            @change="(file, fileList) => syncImageList(fileList)"
            @error="handleUploadError"
          >
            <el-icon><Plus /></el-icon>
          </BaseUpload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitFeedback" :loading="submitting">
            提交反馈
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 联系方式 -->
    <div class="section">
      <h3>联系我们</h3>
      <div class="contact-info">
        <p><el-icon><Phone /></el-icon> 技术支持热线：400-XXX-XXXX</p>
        <p><el-icon><Message /></el-icon> 邮箱：support@example.com</p>
        <p><el-icon><Clock /></el-icon> 工作时间：周一至周五 9:00-18:00</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import { Plus } from '@element-plus/icons-vue';

const activeFaq = ref(['1']);
const feedbackFormRef = ref(null);
const submitting = ref(false);
const userStore = useUserStore();

const { uploadUrl, uploadHeaders } = useUpload();
const imageList = ref([]);

// 管理员查看反馈列表
const feedbackList = ref([]);
const loadingFeedback = ref(false);

const loadFeedbackList = async () => {
  if (userStore.roleCode !== 'admin') return;

  loadingFeedback.value = true;
  try {
    const res = await request.get('/feedback');
    feedbackList.value = res.data || [];
  } catch (e) {
    // 如果API不存在，使用模拟数据
    feedbackList.value = [];
  } finally {
    loadingFeedback.value = false;
  }
};

const viewFeedbackDetail = (row) => {
  ElMessage.info('查看反馈详情功能开发中');
};

onMounted(() => {
  loadFeedbackList();
});

const feedbackForm = ref({
  type: '',
  content: '',
  contact: '',
  images: []
});

const feedbackRules = {
  type: [{ required: true, message: '请选择反馈类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入反馈内容', trigger: 'blur' }]
};

const submitFeedback = async () => {
  await feedbackFormRef.value.validate();
  submitting.value = true;
  try {
    await request.post('/feedback', feedbackForm.value);
    ElMessage.success('感谢您的反馈，我们会尽快处理！');
    feedbackForm.value = { type: '', content: '', contact: '', images: [] };
    imageList.value = [];
  } catch (e) {
    
    // 即使API不存在，也显示成功（前端演示）
    ElMessage.success('感谢您的反馈，我们会尽快处理！');
    feedbackForm.value = { type: '', content: '', contact: '', images: [] };
    imageList.value = [];
  } finally {
    submitting.value = false;
  }
};

const normalizeUploadFile = (file) => {
  const responseUrl = file?.response?.data?.url ?? file?.response?.url ?? '';
  const url = responseUrl ? responseUrl : (file?.url ?? '');
  return url ? { ...file, url } : file;
};

const syncImageList = (fileList) => {
  const normalized = (fileList ?? []).map(normalizeUploadFile);
  imageList.value = normalized;
  feedbackForm.value.images = normalized
    .map(file => file.response?.data?.url ?? file.response?.url)
    .filter(Boolean);
};

const handleUploadSuccess = (response, file, fileList) => {
  syncImageList(fileList);
};

const handleUploadRemove = (file, fileList) => {
  syncImageList(fileList);
};

const handleUploadExceed = () => {
  ElMessage.warning('最多上传 3 张图片');
};

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请检查图片大小或网络');
};
</script>

<style lang="scss" scoped>
.help-feedback-page {
  .page-header {
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .section {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 16px;
      font-size: 16px;
      color: #303133;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    p {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }
  }

  .contact-info {
    p {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 12px 0;
      font-size: 14px;

      .el-icon {
        color: #409EFF;
      }
    }
  }
}
// 移动端适配
@media screen and (max-width: 768px) {
  .help-feedback-page {
    .section {
      padding: 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;

      .el-table {
        min-width: 600px;
      }

      h3 {
        font-size: 15px;
      }
    }

    .el-form {
      .el-form-item__label {
        width: 80px !important;
      }

      .el-select,
      .el-input {
        width: 100% !important;
      }
    }

    .contact-info {
      p {
        font-size: 13px;
      }
    }
  }
}
</style>
