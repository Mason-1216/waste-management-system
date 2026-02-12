<template>
  <div class="applied-hourly-history-tab">
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
            <FilterSelect v-model="filters.year" style="width: 140px" @change="handleYearChange">
              <el-option v-for="year in yearOptions" :key="year" :label="`${year}年`" :value="year" />
            </FilterSelect>
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <el-card class="user-select-card">
      <template #header>
        <div class="user-select-header">
          <span class="title">选择人员</span>
          <div class="actions">
            <FilterAutocomplete
              v-model="searchName"
              :fetch-suggestions="fetchUserNameSuggestions"
              trigger-on-focus
              clearable
              placeholder="输入姓名筛选"
              style="width: 180px"
              @select="handleSearchName"
              @input="handleSearchName"
              @clear="handleSearchName"
            />
            <el-button type="primary" size="small" @click="selectAll">全选</el-button>
            <el-button size="small" @click="clearAll">清除</el-button>
            <span class="selected-count">已选 {{ selectedUserKeys.size }} 人</span>
          </div>
        </div>
      </template>

      <div class="user-buttons">
        <el-button
          v-for="user in pagedUsers"
          :key="user.key"
          :type="selectedUserKeys.has(user.key) ? 'primary' : 'default'"
          :plain="!selectedUserKeys.has(user.key)"
          size="small"
          @click="toggleUser(user.key)"
        >
          {{ user.userName }}
        </el-button>
      </div>

      <div class="user-pagination">
        <el-pagination
          v-model:current-page="userPage"
          v-model:page-size="userPageSize"
          :total="filteredUsers.length"
          :page-sizes="[15, 30, 50, 100]"
          layout="total, sizes, prev, pager, next"
          small
        />
      </div>
    </el-card>

    <el-card class="table-card">
      <template #header>实际应用小时积分</template>
      <TableWrapper v-if="!isSimpleMode || simpleShowTable">
        <el-table v-loading="loading" :data="actualRows" stripe border class="history-table">
          <el-table-column prop="userName" label="姓名" min-width="120" fixed="left" />
          <el-table-column
            v-for="month in monthColumns"
            :key="`actual-${month}`"
            :label="formatMonthLabel(month)"
            min-width="100"
            align="center"
          >
            <template #default="{ row }">
              {{ row.values?.[month] ?? '-' }}
            </template>
          </el-table-column>
        </el-table>
      </TableWrapper>
      <div v-else class="simple-card-list" v-loading="loading">
        <el-empty v-if="actualRows.length === 0" description="暂无数据" />
        <div v-for="row in actualRows" :key="`actual-${row.userId || row.userName}`" class="simple-card-item">
          <div class="card-title">{{ row.userName || '-' }}</div>
          <div class="month-values">
            <div v-for="month in monthColumns" :key="`actual-${row.userId || row.userName}-${month}`" class="month-item">
              <span class="month-label">{{ formatMonthLabel(month) }}</span>
              <span class="month-value">{{ row.values?.[month] ?? '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="table-card">
      <template #header>修正应用小时积分</template>
      <TableWrapper v-if="!isSimpleMode || simpleShowTable">
        <el-table v-loading="loading" :data="adjustedRows" stripe border class="history-table">
          <el-table-column prop="userName" label="姓名" min-width="120" fixed="left" />
          <el-table-column
            v-for="month in monthColumns"
            :key="`adjusted-${month}`"
            :label="formatMonthLabel(month)"
            min-width="100"
            align="center"
          >
            <template #default="{ row }">
              {{ row.values?.[month] ?? '-' }}
            </template>
          </el-table-column>
        </el-table>
      </TableWrapper>
      <div v-else class="simple-card-list" v-loading="loading">
        <el-empty v-if="adjustedRows.length === 0" description="暂无数据" />
        <div v-for="row in adjustedRows" :key="`adjusted-${row.userId || row.userName}`" class="simple-card-item">
          <div class="card-title">{{ row.userName || '-' }}</div>
          <div class="month-values">
            <div v-for="month in monthColumns" :key="`adjusted-${row.userId || row.userName}-${month}`" class="month-item">
              <span class="month-label">{{ formatMonthLabel(month) }}</span>
              <span class="month-value">{{ row.values?.[month] ?? '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';

import FilterAutocomplete from '@/components/common/FilterAutocomplete.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import request from '@/api/request';
import { useSimpleMode } from '@/composables/useSimpleMode';

const loading = ref(false);
const allRows = ref([]);
const monthColumns = ref([]);

const currentYear = dayjs().year();
const yearOptions = computed(() => {
  const years = [];
  for (let year = currentYear; year >= currentYear - 5; year -= 1) {
    years.push(year);
  }
  return years;
});

const filters = reactive({
  year: currentYear
});
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();
const simpleFilterSummary = computed(() => `当前筛选：年份=${filters.year}`);

const searchName = ref('');
const selectedUserKeys = ref(new Set());
const userPage = ref(1);
const userPageSize = ref(15);

const normalizeUserKey = (row) => {
  const uid = row?.userId;
  if (uid !== undefined && uid !== null && uid !== '') return String(uid);
  const name = row?.userName ?? '';
  return name ? `name::${name}` : 'unknown';
};

const buildEndMonth = () => {
  return `${filters.year}-12`;
};

const userOptions = computed(() => {
  const rows = Array.isArray(allRows.value) ? allRows.value.slice() : [];
  rows.sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''));
  return rows.map(row => ({ key: normalizeUserKey(row), userName: row.userName }));
});

const fetchUserNameSuggestions = (queryString, callback) => {
  const query = typeof queryString === 'string' ? queryString.trim().toLowerCase() : '';
  const list = Array.isArray(userOptions.value) ? userOptions.value : [];
  const matched = query
    ? list.filter(item => (item.userName ?? '').toLowerCase().includes(query))
    : list;
  callback(matched.slice(0, 50).map(item => ({ value: item.userName })));
};

const filteredUsers = computed(() => {
  const keyword = (searchName.value ?? '').trim().toLowerCase();
  if (!keyword) return userOptions.value;
  return userOptions.value.filter(u => (u.userName ?? '').toLowerCase().includes(keyword));
});

const pagedUsers = computed(() => {
  const start = (userPage.value - 1) * userPageSize.value;
  return filteredUsers.value.slice(start, start + userPageSize.value);
});

const selectedRows = computed(() => {
  const keys = selectedUserKeys.value;
  if (keys.size === 0) return [];
  return allRows.value.filter(row => keys.has(normalizeUserKey(row)));
});

const actualRows = computed(() => {
  return selectedRows.value.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    values: row.actualPoints ?? {}
  }));
});

const adjustedRows = computed(() => {
  return selectedRows.value.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    values: row.adjustedPoints ?? {}
  }));
});

const formatMonthLabel = (month) => {
  const parts = String(month).split('-');
  if (parts.length !== 2) return month;
  return `${parseInt(parts[1], 10)}月`;
};

const fetchPage = async ({ page, pageSize }) => {
  return request.get('/reports/applied-hourly-points/history', {
    params: {
      endMonth: buildEndMonth(),
      page,
      pageSize
    }
  });
};

const loadAllRows = async () => {
  const pageSize = 500;
  let page = 1;
  let total = 0;
  let loaded = 0;
  let months = [];
  const merged = [];

  while (page <= 200) {
    const payload = await fetchPage({ page, pageSize });
    const list = Array.isArray(payload?.list) ? payload.list : [];
    const payloadMonths = Array.isArray(payload?.months) ? payload.months : [];

    if (page === 1) {
      months = payloadMonths;
      const numericTotal = Number(payload?.total);
      total = Number.isFinite(numericTotal) ? numericTotal : list.length;
    }

    merged.push(...list);
    loaded += list.length;

    if (list.length === 0) break;
    if (loaded >= total) break;

    page += 1;
  }

  return { list: merged, months };
};

const load = async () => {
  loading.value = true;
  try {
    const payload = await loadAllRows();
    allRows.value = payload.list;
    monthColumns.value = payload.months;
    selectedUserKeys.value = new Set(payload.list.map(row => normalizeUserKey(row)));
  } catch {
    allRows.value = [];
    monthColumns.value = [];
    selectedUserKeys.value = new Set();
  } finally {
    loading.value = false;
  }
};

const handleSearchName = () => {
  userPage.value = 1;
};

const handleYearChange = () => {
  userPage.value = 1;
  searchName.value = '';
  load();
};

const toggleUser = (key) => {
  const keys = new Set(selectedUserKeys.value);
  if (keys.has(key)) {
    keys.delete(key);
  } else {
    keys.add(key);
  }
  selectedUserKeys.value = keys;
};

const selectAll = () => {
  const keys = new Set(filteredUsers.value.map(u => u.key));
  selectedUserKeys.value = keys;
};

const clearAll = () => {
  selectedUserKeys.value = new Set();
};

onMounted(() => {
  load();
});
</script>

<style lang="scss" scoped>
.applied-hourly-history-tab {
  .table-toolbar {
    margin-bottom: 12px;
    display: flex;
    justify-content: flex-end;
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .user-select-card {
    margin-bottom: 20px;

    .user-select-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .title {
        font-weight: 600;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;

        .selected-count {
          color: #909399;
          font-size: 13px;
        }
      }
    }

    .user-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 40px;
    }

    .user-pagination {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .table-card {
    margin-bottom: 20px;
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

  .month-values {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 8px;
  }

  .month-item {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: 13px;
    color: #606266;
    background: #f8f9fb;
    border-radius: 6px;
    padding: 6px 8px;
  }

  .month-label {
    color: #909399;
  }

  .month-value {
    color: #303133;
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .applied-hourly-history-tab {
    .user-select-card {
      .user-select-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  }
}
</style>
