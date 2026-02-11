<template>
  <div class="applied-hourly-calc-tab">
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">统计截止月</span>
          <el-date-picker
            v-model="filters.endMonth"
            type="month"
            value-format="YYYY-MM"
            style="width: 160px"
            @change="handleSearch"
          />
        </div>
      </FilterBar>
    </el-card>

    <TableWrapper>
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
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

import FilterBar from '@/components/common/FilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import request from '@/api/request';

const loading = ref(false);
const rows = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

const filters = reactive({
  endMonth: dayjs().format('YYYY-MM')
});

const buildParams = () => ({
  endMonth: filters.endMonth,
  page: pagination.page,
  pageSize: pagination.pageSize
});

// 计算修正应用小时积分的默认值
const calcAdjustedPoints = (actual) => {
  if (actual > 10) return 10;
  if (actual > 0) return actual;
  return 0;
};

const applyResponse = (payload) => {
  const list = Array.isArray(payload?.list) ? payload.list : [];
  rows.value = list.map(item => ({
    ...item,
    // 如果后端返回了 adjustedPoints 则使用，否则根据规则计算
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
      endMonth: filters.endMonth,
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
  .filter-card {
    margin-bottom: 20px;
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
