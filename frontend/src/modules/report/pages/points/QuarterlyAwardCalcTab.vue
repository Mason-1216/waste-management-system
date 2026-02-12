<template>
  <div class="quarterly-award-calc-tab">
    <div class="table-toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAddGroup">新建分组</el-button>
    </div>

    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummaryText"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">年份</span>
            <FilterSelect v-model="filters.year" style="width: 120px" @change="handleSearch">
              <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">季度</span>
            <FilterSelect v-model="filters.quarter" style="width: 120px" @change="handleSearch">
              <el-option v-for="q in 4" :key="q" :label="'Q' + q" :value="q" />
            </FilterSelect>
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <div v-loading="loading" class="groups-container">
      <el-empty v-if="groups.length === 0" description="暂无分组数据" />

      <el-card v-for="group in groups" :key="group.id" class="group-card">
        <template #header>
          <div class="group-header">
            <el-input
              v-if="group.editing"
              v-model="group.group_name"
              style="width: 200px"
              placeholder="分组名称"
            />
            <span v-else class="group-name">{{ group.group_name }}</span>
            <div class="group-actions">
              <el-button v-if="!group.editing" type="primary" link @click="handleEditGroup(group)">编辑</el-button>
              <el-button v-if="group.editing" type="success" link :loading="group.saving" @click="handleSaveGroup(group)">保存</el-button>
              <el-button v-if="group.editing" type="info" link @click="handleCancelEdit(group)">取消</el-button>
              <el-button type="primary" link @click="handleCalculate(group)">计算</el-button>
              <el-popconfirm title="确定删除该分组？" @confirm="handleDeleteGroup(group)">
                <template #reference>
                  <el-button type="danger" link>删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </template>

        <el-form :model="group" label-width="140px" class="group-form">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="关联往期分组">
                <el-select
                  v-model="group.linked_group_id"
                  :disabled="!group.editing"
                  clearable
                  placeholder="选择往期分组"
                  style="width: 100%"
                  @change="handleLinkedGroupChange(group)"
                >
                  <el-option
                    v-for="pg in previousGroups"
                    :key="pg.id"
                    :label="`${pg.group_name} (${pg.year}年Q${pg.quarter})`"
                    :value="pg.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="人员选择">
                <el-select
                  v-model="group.user_ids"
                  :disabled="!group.editing"
                  multiple
                  filterable
                  placeholder="选择人员"
                  style="width: 100%"
                >
                  <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="人均季度奖金预算">
                <el-input-number
                  v-model="group.per_capita_budget"
                  :disabled="!group.editing"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="分组绩效分值">
                <el-input-number
                  v-model="group.performance_score"
                  :disabled="!group.editing"
                  :min="0"
                  :max="200"
                  :precision="2"
                  style="width: 100%"
                  @change="updateCoefficient(group)"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="季度积分奖系数">
                <el-input v-model="group.award_coefficient" disabled style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="分组积分总和">
                <el-input :value="group.total_points || '-'" disabled style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="总季度奖金预算">
                <el-input :value="calcTotalBudget(group)" disabled style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-table :data="group.details || []" stripe border size="small" class="detail-table">
          <el-table-column prop="ranking" label="排名" width="80" align="center" />
          <el-table-column prop="user_name" label="姓名" min-width="100" />
          <el-table-column prop="total_points" label="季度积分" min-width="120" align="center">
            <template #default="{ row }">{{ formatNumber(row.total_points) }}</template>
          </el-table-column>
          <el-table-column prop="points_ratio" label="积分占比" min-width="120" align="center">
            <template #default="{ row }">{{ formatPercent(row.points_ratio) }}</template>
          </el-table-column>
          <el-table-column prop="award_amount" label="个人季度积分奖" min-width="140" align="center">
            <template #default="{ row }">{{ formatNumber(row.award_amount) }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 新建分组对话框 -->
    <el-dialog v-model="dialogVisible" title="新建分组" width="500px">
      <el-form :model="newGroup" label-width="120px">
        <el-form-item label="分组名称" required>
          <el-input v-model="newGroup.group_name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="关联往期分组">
          <el-select v-model="newGroup.linked_group_id" clearable placeholder="选择往期分组" style="width: 100%">
            <el-option
              v-for="pg in previousGroups"
              :key="pg.id"
              :label="`${pg.group_name} (${pg.year}年Q${pg.quarter})`"
              :value="pg.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreateGroup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import FilterBar from '@/components/common/FilterBar.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import { useSimpleMode } from '@/composables/useSimpleMode';
import request from '@/api/request';
import {
  getQuarterlyAwardGroups,
  getPreviousGroups,
  createQuarterlyAwardGroup,
  updateQuarterlyAwardGroup,
  deleteQuarterlyAwardGroup,
  calculateQuarterlyAward
} from '../../api/quarterlyAward';

const { isSimpleMode, simpleFilterExpanded } = useSimpleMode();

const loading = ref(false);
const creating = ref(false);
const dialogVisible = ref(false);
const groups = ref([]);
const previousGroups = ref([]);
const userOptions = ref([]);

const currentYear = dayjs().year();
const currentQuarter = Math.ceil((dayjs().month() + 1) / 3);

const filters = reactive({
  year: currentYear,
  quarter: currentQuarter
});

const newGroup = reactive({
  group_name: '',
  linked_group_id: null
});

const yearOptions = computed(() => {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y);
  }
  return years;
});

const simpleFilterSummaryText = computed(() => `年份：${filters.year}年；季度：Q${filters.quarter}`);

// 计算季度积分奖系数
const calcCoefficient = (score) => {
  const s = Number(score) || 0;
  if (s < 50) return 0;
  return Math.floor((s - 100) / 5) / 10 + 1;
};

const updateCoefficient = (group) => {
  group.award_coefficient = calcCoefficient(group.performance_score);
};

const calcTotalBudget = (group) => {
  const perCapita = Number(group.per_capita_budget) || 0;
  const memberCount = group.user_ids?.length || group.details?.length || 0;
  return (perCapita * memberCount).toFixed(2);
};

const formatNumber = (val) => {
  const num = Number(val);
  return Number.isFinite(num) ? num.toFixed(2) : '-';
};

const formatPercent = (val) => {
  const num = Number(val);
  return Number.isFinite(num) ? (num * 100).toFixed(2) + '%' : '-';
};

const resolveUserName = (user) => {
  const byRealName = typeof user?.real_name === 'string' ? user.real_name.trim() : '';
  if (byRealName) return byRealName;

  const byCamel = typeof user?.realName === 'string' ? user.realName.trim() : '';
  if (byCamel) return byCamel;

  const byUsername = typeof user?.username === 'string' ? user.username.trim() : '';
  return byUsername;
};

const loadUsers = async () => {
  try {
    const data = await request.get('/users', { params: { status: 1, pageSize: 500 } });
    const list = Array.isArray(data?.list) ? data.list : [];
    userOptions.value = list
      .map((u) => ({ id: u.id, name: resolveUserName(u) }))
      .filter((u) => u.id && u.name);
  } catch {
    userOptions.value = [];
  }
};

const loadPreviousGroups = async () => {
  try {
    previousGroups.value = await getPreviousGroups(filters.year, filters.quarter);
  } catch {
    previousGroups.value = [];
  }
};

const loadGroups = async () => {
  loading.value = true;
  try {
    const data = await getQuarterlyAwardGroups({ year: filters.year, quarter: filters.quarter });
    groups.value = (data || []).map(g => ({
      ...g,
      editing: false,
      saving: false,
      user_ids: g.details?.map(d => d.user_id) || [],
      originalData: JSON.parse(JSON.stringify(g))
    }));
  } catch {
    groups.value = [];
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  loadGroups();
  loadPreviousGroups();
};

const handleAddGroup = () => {
  newGroup.group_name = '';
  newGroup.linked_group_id = null;
  dialogVisible.value = true;
};

const handleCreateGroup = async () => {
  if (!newGroup.group_name?.trim()) {
    ElMessage.warning('请输入分组名称');
    return;
  }
  creating.value = true;
  try {
    await createQuarterlyAwardGroup({
      group_name: newGroup.group_name,
      year: filters.year,
      quarter: filters.quarter,
      linked_group_id: newGroup.linked_group_id
    });
    ElMessage.success('创建成功');
    dialogVisible.value = false;
    loadGroups();
  } catch {
    ElMessage.error('创建失败');
  } finally {
    creating.value = false;
  }
};

const handleEditGroup = (group) => {
  group.editing = true;
};

const handleCancelEdit = (group) => {
  Object.assign(group, group.originalData, { editing: false, saving: false });
  group.user_ids = group.details?.map(d => d.user_id) || [];
};

const handleSaveGroup = async (group) => {
  group.saving = true;
  try {
    await updateQuarterlyAwardGroup(group.id, {
      group_name: group.group_name,
      per_capita_budget: group.per_capita_budget,
      performance_score: group.performance_score,
      linked_group_id: group.linked_group_id,
      user_ids: group.user_ids
    });
    ElMessage.success('保存成功');
    group.editing = false;
    loadGroups();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    group.saving = false;
  }
};

const handleDeleteGroup = async (group) => {
  try {
    await deleteQuarterlyAwardGroup(group.id);
    ElMessage.success('删除成功');
    loadGroups();
  } catch {
    ElMessage.error('删除失败');
  }
};

const handleCalculate = async (group) => {
  if (!group.user_ids?.length && !group.details?.length) {
    ElMessage.warning('请先添加分组成员');
    return;
  }
  loading.value = true;
  try {
    await calculateQuarterlyAward(group.id);
    ElMessage.success('计算完成');
    loadGroups();
  } catch {
    ElMessage.error('计算失败');
  } finally {
    loading.value = false;
  }
};

const handleLinkedGroupChange = async (group) => {
  if (!group.linked_group_id) return;
  // 从关联分组获取人员
  const linked = previousGroups.value.find(pg => pg.id === group.linked_group_id);
  if (linked) {
    try {
      const data = await getQuarterlyAwardGroups({ year: linked.year, quarter: linked.quarter });
      const linkedGroup = data?.find(g => g.id === group.linked_group_id);
      if (linkedGroup?.details) {
        group.user_ids = linkedGroup.details.map(d => d.user_id);
      }
    } catch {
      // ignore
    }
  }
};

onMounted(() => {
  loadUsers();
  loadGroups();
  loadPreviousGroups();
});
</script>

<style lang="scss" scoped>
.quarterly-award-calc-tab {
  .table-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .groups-container {
    min-height: 200px;
  }

  .group-card {
    margin-bottom: 20px;

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .group-name {
        font-size: 16px;
        font-weight: 600;
      }

      .group-actions {
        display: flex;
        gap: 8px;
      }
    }

    .group-form {
      margin-bottom: 16px;
    }

    .detail-table {
      margin-top: 16px;
    }
  }
}
</style>
