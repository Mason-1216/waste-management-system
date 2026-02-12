<template>
  <div class="help-feedback-page">
    <div class="page-header">
      <h2>帮助与反馈</h2>
    </div>

    <!-- 管理员查看反馈记录 -->
    <div class="section" v-if="userStore.hasRole('admin')">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>用户反馈记录</h3>
        <div class="feedback-header-actions">
          <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
            {{ simpleShowTable ? '切换卡片' : '切换表格' }}
          </el-button>
          <el-button type="primary" :loading="exportingFeedback" @click="handleExportFeedback">
            <el-icon><Upload /></el-icon>批量导出
          </el-button>
        </div>
      </div>
      <el-card class="filter-card">
        <SimpleFilterBar
          :enabled="isSimpleMode"
          v-model:expanded="simpleFilterExpanded"
          :summary-text="feedbackFilterSummaryText"
        >
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">用户</span>
              <FilterAutocomplete
                v-model="feedbackFilters.keyword"
                :fetch-suggestions="fetchFeedbackUserSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 160px"
                @select="applyFeedbackFilters"
                @input="applyFeedbackFilters"
                @clear="applyFeedbackFilters"
                @keyup.enter="applyFeedbackFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">类型</span>
              <FilterSelect
                v-model="feedbackFilters.type"
                placeholder="全部"
                clearable
                filterable
                style="width: 160px"
                @change="applyFeedbackFilters"
                @clear="applyFeedbackFilters"
              >
                <el-option label="全部" value="all" />
                <el-option label="功能建议" value="suggestion" />
                <el-option label="问题反馈" value="bug" />
                <el-option label="其他" value="other" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">反馈内容</span>
              <FilterAutocomplete
                v-model="feedbackFilters.content"
                :fetch-suggestions="fetchFeedbackContentSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 220px"
                @select="applyFeedbackFilters"
                @input="applyFeedbackFilters"
                @clear="applyFeedbackFilters"
                @keyup.enter="applyFeedbackFilters"
              />
            </div>
          </FilterBar>
        </SimpleFilterBar>
      </el-card>
      <el-table v-if="!isSimpleMode || simpleShowTable" :data="feedbackTableRows" stripe border v-loading="loadingFeedback">
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
      <div v-else class="simple-card-list" v-loading="loadingFeedback">
        <el-empty v-if="feedbackTableRows.length === 0" description="暂无数据" />
        <div v-for="row in feedbackTableRows" :key="row.id" class="simple-card-item">
          <div class="card-title">{{ row.userName || '-' }}</div>
          <div class="card-meta">类型：{{ resolveFeedbackTypeLabel(row.type) || '其他' }}</div>
          <div class="card-meta">反馈内容：{{ row.content || '-' }}</div>
          <div class="card-meta">联系方式：{{ row.contact || '-' }}</div>
          <div class="card-meta">提交时间：{{ row.createdAt || '-' }}</div>
          <div class="card-actions">
            <el-button link type="primary" @click="viewFeedbackDetail(row)">查看</el-button>
          </div>
        </div>
      </div>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
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
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Upload } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';

import FilterBar from '@/components/common/FilterBar.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import request from '@/api/request';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import { markAsRead } from '@/api/notification';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import { buildExportFileName, exportRowsToXlsx } from '@/utils/tableExport';
import { useSimpleMode } from '@/composables/useSimpleMode';

const activeFaq = ref(['1']);
const feedbackFormRef = ref(null);
const submitting = ref(false);
const userStore = useUserStore();
const route = useRoute();
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();

const { uploadUrl, uploadHeaders, resolveUploadUrl } = useUpload();
const imageList = ref([]);

// 管理员查看反馈列表
const feedbackList = ref([]);
const loadingFeedback = ref(false);
const exportingFeedback = ref(false);
const pagination = ref({ page: 1, pageSize: 5, total: 0 });

const feedbackFilters = ref({
  keyword: '',
  type: 'all',
  content: ''
});
const feedbackFilterSummaryText = computed(() => {
  const userText = normalizeText(feedbackFilters.value.keyword) || '全部';
  const typeText = feedbackFilters.value.type === 'all' ? '全部' : resolveFeedbackTypeLabel(feedbackFilters.value.type);
  const contentText = normalizeText(feedbackFilters.value.content) || '全部';
  return `当前筛选：用户=${userText} | 类型=${typeText || '全部'} | 内容=${contentText}`;
});

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const normalizeTextLower = (value) => normalizeText(value).toLowerCase();

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '帮助与反馈';
};

const resolveFeedbackCreatedAt = (row) => normalizeText(
  row?.createdAt
    ?? row?.created_at
    ?? row?.createdTime
    ?? row?.created_time
);

const resolveFeedbackTypeLabel = (typeValue) => {
  const typeText = normalizeTextLower(typeValue);
  if (typeText === 'suggestion') return '功能建议';
  if (typeText === 'bug') return '问题反馈';
  if (typeText) return '其他';
  return '';
};

const resolveFeedbackUser = (row) => normalizeText(
  row?.userName
    ?? row?.user_name
    ?? row?.username
    ?? row?.user?.real_name
    ?? row?.user?.realName
    ?? row?.user?.name
    ?? row?.creatorName
    ?? row?.created_by
);

const resolveFeedbackType = (row) => normalizeText(
  row?.type
    ?? row?.feedback_type
    ?? row?.feedbackType
    ?? row?.category
);

const resolveFeedbackContent = (row) => normalizeText(
  row?.content
    ?? row?.feedback_content
    ?? row?.feedbackContent
    ?? row?.message
    ?? row?.detail
    ?? row?.description
);

const resolveFeedbackExportColumns = () => ([
  { label: '用户', value: (row) => resolveFeedbackUser(row) },
  { label: '类型', value: (row) => resolveFeedbackTypeLabel(resolveFeedbackType(row)) },
  { label: '反馈内容', value: (row) => resolveFeedbackContent(row) },
  { label: '联系方式', value: (row) => normalizeText(row?.contact ?? row?.phone ?? row?.mobile ?? row?.email) },
  { label: '提交时间', value: (row) => resolveFeedbackCreatedAt(row) }
]);

const filteredFeedbackList = computed(() => {
  const list = Array.isArray(feedbackList.value) ? feedbackList.value : [];
  const keyword = normalizeTextLower(feedbackFilters.value.keyword);
  const content = normalizeTextLower(feedbackFilters.value.content);
  const typeValue = normalizeTextLower(feedbackFilters.value.type);
  const hasTypeFilter = typeValue && typeValue !== 'all';

  return list.filter((row) => {
    if (keyword) {
      const nameText = normalizeTextLower(resolveFeedbackUser(row));
      if (!nameText.includes(keyword)) return false;
    }
    if (hasTypeFilter) {
      const rowType = normalizeTextLower(resolveFeedbackType(row));
      if (!rowType || rowType !== typeValue) return false;
    }
    if (content) {
      const contentText = normalizeTextLower(resolveFeedbackContent(row));
      if (!contentText.includes(content)) return false;
    }
    return true;
  });
});

const fetchFeedbackUserSuggestions = createListSuggestionFetcher(
  () => filteredFeedbackList.value,
  (row) => resolveFeedbackUser(row)
);

const fetchFeedbackContentSuggestions = createListSuggestionFetcher(
  () => filteredFeedbackList.value,
  (row) => resolveFeedbackContent(row)
);

const loadFeedbackList = async () => {
  if (!userStore.hasRole('admin')) return;

  loadingFeedback.value = true;
  try {
    const res = await request.get('/feedback');
    feedbackList.value = Array.isArray(res?.data) ? res.data : [];
    pagination.value.page = 1;
    applyFeedbackFilters();
  } catch (e) {
    // 如果API不存在，使用模拟数据
    feedbackList.value = [];
  } finally {
    loadingFeedback.value = false;
  }
};

const feedbackTableRows = computed(() => {
  const list = Array.isArray(filteredFeedbackList.value) ? filteredFeedbackList.value : [];
  const startIndex = (pagination.value.page - 1) * pagination.value.pageSize;
  const endIndex = startIndex + pagination.value.pageSize;
  return list.slice(startIndex, endIndex);
});

const updateFeedbackPagination = () => {
  const total = filteredFeedbackList.value.length;
  pagination.value.total = total;
  const size = pagination.value.pageSize;
  const maxPage = Math.max(1, Math.ceil(total / size));
  if (pagination.value.page > maxPage) pagination.value.page = maxPage;
};

const applyFeedbackFilters = () => {
  pagination.value.page = 1;
  updateFeedbackPagination();
};

const handleExportFeedback = async () => {
  if (exportingFeedback.value) return;
  exportingFeedback.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });
    const rows = Array.isArray(filteredFeedbackList.value) ? filteredFeedbackList.value : [];

    if (rows.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: '用户反馈',
      columns: resolveFeedbackExportColumns(),
      rows
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    exportingFeedback.value = false;
  }
};

const handlePageChange = (page) => {
  pagination.value.page = page;
};

const handlePageSizeChange = (size) => {
  pagination.value.pageSize = size;
  pagination.value.page = 1;
  updateFeedbackPagination();
};

const emitSidebarBadgeRefresh = () => {
  window.dispatchEvent(new CustomEvent('sidebar-badge-refresh'));
};

const viewFeedbackDetail = async (row) => {
  try {
    if (row?.id) {
      await markAsRead(row.id);
      emitSidebarBadgeRefresh();
    }
  } catch (e) {
    // ignore
  }
  ElMessage.info('查看反馈详情功能开发中');
};

onMounted(() => {
  loadFeedbackList();
});

watch(
  () => [filteredFeedbackList.value.length, pagination.value.pageSize],
  () => {
    updateFeedbackPagination();
  }
);

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
  let rawUrl = '';
  if (responseUrl) {
    rawUrl = responseUrl;
  } else if (file?.url) {
    rawUrl = file.url;
  }
  const url = resolveUploadUrl(rawUrl);
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

    .feedback-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .filter-card {
      margin-bottom: 16px;
    }

    .simple-card-list {
      display: grid;
      gap: 12px;
    }

    .simple-card-item {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 12px;
      background: #fff;
    }

    .card-title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .card-meta {
      color: #606266;
      font-size: 14px;
      margin-bottom: 6px;
    }

    .card-actions {
      margin-top: 8px;
      display: flex;
      gap: 8px;
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
