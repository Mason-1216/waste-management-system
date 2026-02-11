<template>
  <div class="module-permission-config">
    <el-empty
      v-if="permissionGroups.length === 0"
      description="未加载到模块权限列表"
    />

    <div v-else v-for="group in permissionGroups" :key="group.code" class="module-group">
      <div class="module-header">{{ group.name }}</div>
      <div class="module-items">
        <div v-for="item in group.items" :key="item.viewCode" class="permission-row">
          <span class="permission-label">{{ item.label }}</span>
          <div class="permission-checkboxes">
            <el-checkbox
              :model-value="hasPermission(item.viewCode)"
              @change="(val) => handleViewChange(item, val)"
            >
              查看
            </el-checkbox>
            <el-checkbox
              v-if="item.editCode"
              :model-value="hasPermission(item.editCode)"
              :disabled="!hasPermission(item.viewCode)"
              @change="(val) => handleEditChange(item, val)"
            >
              编辑
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { menuConfig } from '@/config/menuConfig';

const props = defineProps({
  permissions: {
    type: Array,
    default: () => []
  },
  selectedIds: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:selectedIds']);

// 构建权限code到id的映射
const codeToId = computed(() => {
  const map = new Map();
  (props.permissions || []).forEach(p => {
    const code = p?.code ?? p?.permissionCode ?? p?.permission_code;
    const id = p?.id ?? p?.permissionId ?? p?.permission_id;
    if (code && id) {
      map.set(code, id);
    }
  });
  return map;
});

// 构建权限code到name的映射
const codeToName = computed(() => {
  const map = new Map();
  (props.permissions || []).forEach(p => {
    const code = p?.code ?? p?.permissionCode ?? p?.permission_code;
    const name = p?.name ?? p?.permissionName ?? p?.permission_name;
    if (code && name) {
      map.set(code, name);
    }
  });
  return map;
});

// 从所有角色菜单构建菜单名称映射
const buildMenuNameMap = () => {
  const map = new Map();
  const walk = (items) => {
    (items || []).forEach(item => {
      if (item?.path && item?.name) {
        // 将路径转换为模块码格式
        const moduleCode = item.path.startsWith('/') ? item.path.slice(1) : item.path;
        map.set(moduleCode, item.name);
      }
      if (Array.isArray(item?.children)) {
        walk(item.children);
      }
    });
  };
  Object.values(menuConfig).forEach(walk);
  return map;
};

const menuNameMap = buildMenuNameMap();

// 分组配置：定义每个分组包含哪些模块前缀
const groupConfig = [
  { key: 'schedule', name: '排班表', prefixes: ['module:schedule'] },
  { key: 'safety', name: '安全检查', prefixes: ['module:safety-self-inspection', 'module:safety-other-inspection', 'module:safety-check-management'] },
  { key: 'safety-rectification', name: '安全隐患', prefixes: ['module:safety-rectification'] },
  { key: 'hygiene', name: '卫生检查', prefixes: ['module:hygiene-self-inspection', 'module:hygiene-other-inspection', 'module:hygiene-work-arrangement'] },
  { key: 'position-work', name: '岗位工作', prefixes: ['module:position-work'] },
  { key: 'temporary-tasks', name: '临时任务', prefixes: ['module:temporary-tasks'] },
  { key: 'maintenance-task', name: '设备保养', prefixes: ['module:maintenance-task'] },
  { key: 'device-faults', name: '设备故障', prefixes: ['module:device-faults', 'module:fault-report', 'module:repair-work', 'module:maintenance-approval'] },
  { key: 'plc', name: 'PLC监控', prefixes: ['module:plc-records', 'module:plc-data-report', 'module:plc-visual-report'] },
  { key: 'reports', name: '维保数据报表', prefixes: ['module:reports'] },
  { key: 'points-summary', name: '积分统计', prefixes: ['module:points-summary'] },
  { key: 'notifications', name: '消息通知', prefixes: ['module:notifications'] },
  { key: 'user', name: '用户管理', prefixes: ['module:user'] },
  { key: 'organization', name: '组织架构', prefixes: ['module:organization'] },
  { key: 'help-feedback', name: '帮助与反馈', prefixes: ['module:help-feedback'] }
];

// 从权限名称中提取简短标签
const extractLabel = (code, name) => {
  if (!name) return code;
  // 移除 "-查看" 或 "-编辑" 后缀
  let label = name.replace(/-查看$/, '').replace(/-编辑$/, '');
  return label;
};

// 构建权限分组
const permissionGroups = computed(() => {
  // 获取所有 module:xxx:view 权限
  const viewPermissions = [];
  codeToId.value.forEach((id, code) => {
    if (code.startsWith('module:') && code.endsWith(':view')) {
      viewPermissions.push({
        code,
        id,
        name: codeToName.value.get(code) || code
      });
    }
  });

  const groups = [];
  const usedCodes = new Set();

  groupConfig.forEach(config => {
    const items = [];

    viewPermissions.forEach(perm => {
      // 检查是否匹配任何前缀
      const matches = config.prefixes.some(prefix => perm.code.startsWith(prefix + ':'));
      if (matches && !usedCodes.has(perm.code)) {
        usedCodes.add(perm.code);

        // 获取对应的 edit 权限码
        const editCode = perm.code.replace(/:view$/, ':edit');
        const hasEdit = codeToId.value.has(editCode);

        items.push({
          viewCode: perm.code,
          editCode: hasEdit ? editCode : null,
          label: extractLabel(perm.code, perm.name)
        });
      }
    });

    if (items.length > 0) {
      // 按标签排序
      items.sort((a, b) => a.label.localeCompare(b.label));
      groups.push({
        code: config.key,
        name: config.name,
        items
      });
    }
  });

  // 处理未分组的权限
  const otherItems = [];
  viewPermissions.forEach(perm => {
    if (!usedCodes.has(perm.code)) {
      const editCode = perm.code.replace(/:view$/, ':edit');
      const hasEdit = codeToId.value.has(editCode);
      otherItems.push({
        viewCode: perm.code,
        editCode: hasEdit ? editCode : null,
        label: extractLabel(perm.code, perm.name)
      });
    }
  });

  if (otherItems.length > 0) {
    otherItems.sort((a, b) => a.label.localeCompare(b.label));
    groups.push({
      code: '__other__',
      name: '其他',
      items: otherItems
    });
  }

  return groups;
});

// 检查是否有某个权限
const hasPermission = (code) => {
  if (!code) return false;
  const id = codeToId.value.get(code);
  return id && props.selectedIds.includes(id);
};

// 处理查看权限变更
const handleViewChange = (item, checked) => {
  const viewId = codeToId.value.get(item.viewCode);
  const editId = codeToId.value.get(item.editCode);

  let newIds = [...props.selectedIds];

  if (checked) {
    if (viewId && !newIds.includes(viewId)) {
      newIds.push(viewId);
    }
  } else {
    newIds = newIds.filter(id => id !== viewId && id !== editId);
  }

  emit('update:selectedIds', newIds);
};

// 处理编辑权限变更
const handleEditChange = (item, checked) => {
  if (!item.editCode) return;
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
