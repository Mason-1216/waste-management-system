<template>
  <div class="inventory-page">
    <div class="page-header">
      <h2>库存管理</h2>
    </div>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalInbound }}</div>
            <div class="stat-label">累计进料(吨)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalOutbound }}</div>
            <div class="stat-label">累计出料(吨)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ stats.currentStock }}</div>
            <div class="stat-label">当前库存(吨)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ stats.capacity }}%</div>
            <div class="stat-label">库容占用</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>库存明细</template>
      <el-table :data="inventoryList" stripe border>
        <el-table-column prop="wasteType" label="类型" width="120">
          <template #default="{ row }">
            {{ getTypeLabel(row.wasteType) }}
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="重量(吨)" width="120" />
        <el-table-column prop="percentage" label="占比" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.percentage" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdate" label="最后更新" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '@/api/request';

const stats = ref({ totalInbound: 0, totalOutbound: 0, currentStock: 0, capacity: 0 });
const inventoryList = ref([]);

const getTypeLabel = (type) => {
  const labels = { kitchen: '厨余垃圾', recyclable: '可回收物', hazardous: '有害垃圾', other: '其他垃圾' };
  return labels[type] || type;
};

const loadData = async () => {
  try {
    const res = await request.get('/inventory/stats');
    stats.value = res.stats || stats.value;
    inventoryList.value = res.list || [];
  } catch (e) {  }
};

onMounted(() => loadData());
</script>

<style lang="scss" scoped>
.inventory-page {
  .page-header {
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 20px; }
  }
  .stat-cards {
    margin-bottom: 20px;
    .stat-item {
      text-align: center;
      padding: 20px 0;
      .stat-value { font-size: 28px; font-weight: bold; color: #409EFF; }
      .stat-label { font-size: 14px; color: #909399; margin-top: 8px; }
    }
  }
}
</style>
