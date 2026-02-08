<template>
  <div class="module-permission-config">
    <div v-for="module in moduleTree" :key="module.code" class="module-group">
      <div class="module-header">{{ module.name }}</div>
      <div class="module-items">
        <template v-if="module.subModules && module.subModules.length">
          <!-- 有子模块的情况（如组织架构管理） -->
          <div v-for="sub in module.subModules" :key="sub.code" class="permission-row">
            <span class="permission-label">{{ sub.name }}</span>
            <div class="permission-checkboxes">
              <el-checkbox
                :model-value="hasPermission(sub.viewCode)"
                @change="(val) => handleViewChange(sub, val)"
              >
                查看
              </el-checkbox>
              <el-checkbox
                :model-value="hasPermission(sub.editCode)"
                :disabled="!hasPermission(sub.viewCode)"
                @change="(val) => handleEditChange(sub, val)"
              >
                编辑
              </el-checkbox>
            </div>
          </div>
        </template>
        <template v-else>
          <!-- 没有子模块的情况 -->
          <div class="permission-row">
            <span class="permission-label">{{ module.name }}</span>
            <div class="permission-checkboxes">
              <el-checkbox
                :model-value="hasPermission(module.viewCode)"
                @change="(val) => handleViewChange(module, val)"
              >
                查看
              </el-checkbox>
              <el-checkbox
                :model-value="hasPermission(module.editCode)"
                :disabled="!hasPermission(module.viewCode)"
                @change="(val) => handleEditChange(module, val)"
              >
                编辑
              </el-checkbox>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 所有权限列表 [{id, code, name, type, parentId}]
  permissions: {
    type: Array,
    default: () => []
  },
  // 已选中的权限ID列表
  selectedIds: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:selectedIds']);

// 构建权限code到id的映射
const codeToId = computed(() => {
  const map = new Map();
  props.permissions.forEach(p => {
    map.set(p.code, p.id);
  });
  return map;
});

// 构建模块权限树
const moduleTree = computed(() => {
  const modules = props.permissions.filter(p => p.type === 'module');

  // 找出父模块（没有:view或:edit后缀的）
  const parentModules = modules.filter(m =>
    !m.code.endsWith(':view') && !m.code.endsWith(':edit')
  );

  return parentModules.map(parent => {
    // 找出子权限
    const children = modules.filter(m =>
      m.parentId === parent.id ||
      (m.code.startsWith(parent.code + ':') && m.code !== parent.code)
    );

    // 检查是否有子模块（如 organization 有 station, department 等子模块）
    const subModuleCodes = new Set();
    children.forEach(c => {
      // 从 module:organization:station:view 中提取 station
      const parts = c.code.replace(parent.code + ':', '').split(':');
      if (parts.length >= 2) {
        subModuleCodes.add(parts[0]);
      }
    });

    if (subModuleCodes.size > 0) {
      // 有子模块
      const subModules = Array.from(subModuleCodes).map(subCode => {
        const viewCode = `${parent.code}:${subCode}:view`;
        const editCode = `${parent.code}:${subCode}:edit`;
        const viewPerm = children.find(c => c.code === viewCode);
        return {
          code: subCode,
          name: viewPerm?.name?.replace('-查看', '') || subCode,
          viewCode,
          editCode
        };
      });
      return {
        ...parent,
        subModules
      };
    } else {
      // 没有子模块，直接有 view/edit
      const viewCode = `${parent.code}:view`;
      const editCode = `${parent.code}:edit`;
      return {
        ...parent,
        viewCode,
        editCode,
        subModules: null
      };
    }
  });
});

// 检查是否有某个权限
const hasPermission = (code) => {
  const id = codeToId.value.get(code);
  return id && props.selectedIds.includes(id);
};

// 处理查看权限变更
const handleViewChange = (item, checked) => {
  const viewId = codeToId.value.get(item.viewCode);
  const editId = codeToId.value.get(item.editCode);

  let newIds = [...props.selectedIds];

  if (checked) {
    // 添加查看权限
    if (viewId && !newIds.includes(viewId)) {
      newIds.push(viewId);
    }
  } else {
    // 移除查看权限，同时移除编辑权限
    newIds = newIds.filter(id => id !== viewId && id !== editId);
  }

  emit('update:selectedIds', newIds);
};

// 处理编辑权限变更
const handleEditChange = (item, checked) => {
  const editId = codeToId.value.get(item.editCode);

  let newIds = [...props.selectedIds];

  if (checked) {
    if (editId && !newIds.includes(editId)) {
      newIds.push(editId);
    }
  } else {
    newIds = newIds.filter(id => id !== editId);
  }

  emit('update:selectedIds', newIds);
};
</script>

<style lang="scss" scoped>
.module-permission-config {
  max-height: 400px;
  overflow-y: auto;

  .module-group {
    margin-bottom: 16px;
    border: 1px solid #ebeef5;
    border-radius: 4px;

    .module-header {
      padding: 8px 12px;
      background: #f5f7fa;
      font-weight: 500;
      border-bottom: 1px solid #ebeef5;
    }

    .module-items {
      padding: 8px 12px;
    }

    .permission-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .permission-label {
        flex: 1;
        font-size: 14px;
      }

      .permission-checkboxes {
        display: flex;
        gap: 16px;

        .el-checkbox {
          margin-right: 0;
        }
      }
    }
  }
}
</style>
