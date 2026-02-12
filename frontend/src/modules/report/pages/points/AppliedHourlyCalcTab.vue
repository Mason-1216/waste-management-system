<template>
  <div class="applied-hourly-calc-tab">
    <div class="table-toolbar" v-if="isSimpleMode">
      <el-button @click="simpleShowTable = !simpleShowTable">
        {{ simpleShowTable ? '切换卡片' : '切换表格' }}
      </el-button>
    </div>

    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummary"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">年份</span>
            <FilterSelect v-model="filters.year" style="width: 140px" @change="handleSearch">
              <el-option v-for="year in yearOptions" :key="year" :label="`${year}年`" :value="year" />
            </FilterSelect>
          </div>

          <div class="filter-item">
            <span class="filter-label">记录月份</span>
            <FilterSelect v-model="filters.month" style="width: 140px" @change="handleSearch">
              <el-option v-for="month in monthOptions" :key="month" :label="`${month}月`" :value="month" />
            </FilterSelect>
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <TableWrapper v-if="!isSimpleMode || simpleShowTable">
      <el-table v-loading="loading" :data="rows" stripe border class="points-table">
        <el-table-column prop="userName" label="姓名" min-width="140" />
        <el-table-column prop="totalPoints" label="6个月总积分" min-width="140" align="center" />
        <el-table-column prop="totalHours" label="6个月工时" min-width="140" align="center" />
        <el-table-column prop="appliedHourlyPoints" label="实际应用小时积分" min-width="160" align="center" />
        <el-table-column label="修正应用小时积分" min-width="160" align="center">
          <template #default="{ row }">
            <el-input-number
              v-if="row.editing"
              v-model="row.adjustedPoints"
              :min="0"
              :max="10"
              :precision="2"
              :step="0.1"
              size="small"
              style="width: 120px"
            />
            <span v-else>{{ row.adjustedPoints }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.editing" type="primary" link @click="handleEdit(row)">修改</el-button>
            <el-button v-else type="success" link :loading="row.saving" @click="handleSave(row)">保存</el-button>
            <el-button v-if="row.editing" type="info" link @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </TableWrapper>
    <div v-else class="simple-card-list" v-loading="loading">
      <el-empty v-if="rows.length === 0" description="暂无数据" />
      <div v-for="row in rows" :key="row.userId" class="simple-card-item">
        <div class="card-title">{{ row.userName || '-' }}</div>
        <div class="card-meta">6个月总积分：{{ row.totalPoints ?? '-' }}</div>
        <div class="card-meta">6个月工时：{{ row.totalHours ?? '-' }}</div>
        <div class="card-meta">实际应用小时积分：{{ row.appliedHourlyPoints ?? '-' }}</div>
        <div class="card-meta">
          修正应用小时积分：
          <el-input-number
            v-if="row.editing"
            v-model="row.adjustedPoints"
            :min="0"
            :max="10"
            :precision="2"
            :step="0.1"
            size="small"
            style="width: 120px"
          />
          <span v-else>{{ row.adjustedPoints }}</span>
        </div>
        <div class="card-actions">
          <el-button v-if="!row.editing" type="primary" link @click="handleEdit(row)">修改</el-button>
          <el-button v-else type="success" link :loading="row.saving" @click="handleSave(row)">保存</el-button>
          <el-button v-if="row.editing" type="info" link @click="handleCancel(row)">取消</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="load"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

import FilterBar from '@/components/common/FilterBar.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import request from '@/api/request';
import { useSimpleMode } from '@/composables/useSimpleMode';

const loading = ref(false);
const rows = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

const currentYear = dayjs().year();
const yearOptions = computed(() => {
  const years = [];
  for (let year = currentYear; year >= currentYear - 5; year -= 1) {
    years.push(year);
  }
  return years;
});

const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const filters = reactive({
  year: currentYear,
  month: dayjs().month() + 1
});
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();
const simpleFilterSummary = computed(() => `当前筛选：年份=${filters.year} | 记录月份=${filters.month}月`);

const endMonth = computed(() => {
  return `${filters.year}-${String(filters.month).padStart(2, '0')}`;
});

const buildParams = () => ({
  endMonth: endMonth.value,
  page: pagination.page,
  pageSize: pagination.pageSize
});

const calcAdjustedPoints = (actual) => {
  if (actual > 10) return 10;
  if (actual > 0) return actual;
  return 0;
};

const applyResponse = (payload) => {
  const list = Array.isArray(payload?.list) ? payload.list : [];
  rows.value = list.map(item => ({
    ...item,
    adjustedPoints: item.adjustedPoints ?? calcAdjustedPoints(item.appliedHourlyPoints),
    originalAdjusted: item.adjustedPoints ?? calcAdjustedPoints(item.appliedHourlyPoints),
    editing: false,
    saving: false
  }));
  const total = Number(payload?.total);
  pagination.total = Number.isFinite(total) ? total : list.length;
};

const load = async () => {
  loading.value = true;
  try {
    const data = await request.get('/reports/applied-hourly-points', { params: buildParams() });
    applyResponse(data);
  } catch {
    rows.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  load();
};

const handlePageSizeChange = () => {
  pagination.page = 1;
  load();
};

const handleEdit = (row) => {
  row.editing = true;
};

const handleCancel = (row) => {
  row.adjustedPoints = row.originalAdjusted;
  row.editing = false;
};

const handleSave = async (row) => {
  row.saving = true;
  try {
    await request.post('/reports/applied-hourly-points/adjust', {
      userId: row.userId,
      endMonth: endMonth.value,
      adjustedPoints: row.adjustedPoints
    });
    row.originalAdjusted = row.adjustedPoints;
    row.editing = false;
    ElMessage.success('保存成功');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    row.saving = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style lang="scss" scoped>
.applied-hourly-calc-tab {
  .table-toolbar {
    margin-bottom: 12px;
    display: flex;
    justify-content: flex-end;
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .simple-card-list {
    display: grid;
    gap: 12px;
  }

  .simple-card-item {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 12px;
  }

  .card-title {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .card-meta {
    color: #606266;
    margin-bottom: 6px;
    font-size: 14px;
  }

  .card-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }
}
</style>
