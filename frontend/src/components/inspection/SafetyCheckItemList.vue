<template>
  <div v-for="group in groups" :key="group.workType.id" class="check-group">
    <el-divider content-position="left">{{ group.workType.work_type_name }}</el-divider>
    <div class="check-item-list">
      <div v-for="entry in group.items" :key="entry.parent.id" class="check-item-group">
        <div class="check-item">
          <div class="check-item-header">
            <div class="check-item-title">
              <el-tag v-if="entry.children.length > 0" size="small" type="info">{{ parentLabel }}</el-tag>
              <span>{{ entry.parent.item_name }}</span>
            </div>
            <el-radio-group
              v-model="entry.parent[statusField]"
              :size="radioGroupSize"
              @change="onStatusChange(entry.parent)"
            >
              <template v-if="useButtonRadio">
                <el-radio-button :label="passValue">{{ passLabel }}</el-radio-button>
                <el-radio-button :label="failValue">{{ failLabel }}</el-radio-button>
              </template>
              <template v-else>
                <el-radio :label="passValue">{{ passLabel }}</el-radio>
                <el-radio :label="failValue">{{ failLabel }}</el-radio>
              </template>
            </el-radio-group>
          </div>
          <div class="check-item-standard" v-if="entry.parent.item_standard">
            {{ standardLabel }}{{ entry.parent.item_standard }}
          </div>
          <div class="check-item-remark" v-if="showRemark && isFail(entry.parent) && remarkPosition === 'before'">
            <el-input
              v-model="entry.parent[remarkField]"
              :placeholder="remarkPlaceholder"
              size="small"
              style="margin-top: 8px"
            />
          </div>
          <div class="check-item-photo" v-if="isFail(entry.parent)">
            <div v-if="photoLabel" class="photo-label">{{ photoLabel }}</div>
            <BaseUpload
              :action="uploadUrl"
              :headers="uploadHeaders"
              list-type="picture-card"
              accept="image/*"
              :limit="photoLimit"
              :file-list="entry.parent[photoListField] || []"
              @change="(file, fileList) => onPhotoChange(entry.parent, fileList)"
              @success="(response, file, fileList) => onPhotoChange(entry.parent, fileList)"
              @remove="(file, fileList) => onPhotoChange(entry.parent, fileList)"
              @error="handleUploadError"
            >
              <el-icon><Plus /></el-icon>
            </BaseUpload>
            <el-input
              v-if="showRemark && remarkPosition === 'after'"
              v-model="entry.parent[remarkField]"
              type="textarea"
              :rows="2"
              :placeholder="remarkPlaceholder"
              style="margin-top: 8px"
            />
          </div>
        </div>

        <template v-for="child in entry.children" :key="child.id">
          <div
            v-if="isChildVisible(child)"
            class="check-item child"
          >
            <div class="check-item-header">
              <div class="check-item-title">
                <el-tag size="small" type="info">{{ childLabel }}</el-tag>
                <span>{{ child.item_name }}</span>
              </div>
              <el-radio-group
                v-model="child[statusField]"
                :size="radioGroupSize"
                @change="onStatusChange(child)"
              >
                <template v-if="useButtonRadio">
                  <el-radio-button :label="passValue">{{ passLabel }}</el-radio-button>
                  <el-radio-button :label="failValue">{{ failLabel }}</el-radio-button>
                </template>
                <template v-else>
                  <el-radio :label="passValue">{{ passLabel }}</el-radio>
                  <el-radio :label="failValue">{{ failLabel }}</el-radio>
                </template>
              </el-radio-group>
            </div>
            <div class="check-item-standard" v-if="child.item_standard">
              {{ standardLabel }}{{ child.item_standard }}
            </div>
            <div class="check-item-remark" v-if="showRemark && isFail(child) && remarkPosition === 'before'">
              <el-input
                v-model="child[remarkField]"
                :placeholder="remarkPlaceholder"
                size="small"
                style="margin-top: 8px"
              />
            </div>
            <div class="check-item-photo" v-if="isFail(child)">
              <div v-if="photoLabel" class="photo-label">{{ photoLabel }}</div>
              <BaseUpload
                :action="uploadUrl"
                :headers="uploadHeaders"
                list-type="picture-card"
                accept="image/*"
                :limit="photoLimit"
                :file-list="child[photoListField] || []"
                @change="(file, fileList) => onPhotoChange(child, fileList)"
                @success="(response, file, fileList) => onPhotoChange(child, fileList)"
                @remove="(file, fileList) => onPhotoChange(child, fileList)"
                @error="handleUploadError"
              >
                <el-icon><Plus /></el-icon>
              </BaseUpload>
              <el-input
                v-if="showRemark && remarkPosition === 'after'"
                v-model="child[remarkField]"
                type="textarea"
                :rows="2"
                :placeholder="remarkPlaceholder"
                style="margin-top: 8px"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue';

const emit = defineEmits(['status-change', 'photo-change', 'upload-error']);

const props = defineProps({
  groups: {
    type: Array,
    default: () => []
  },
  uploadUrl: {
    type: String,
    default: ''
  },
  uploadHeaders: {
    type: Object,
    default: () => ({})
  },
  statusField: {
    type: String,
    default: 'result'
  },
  passValue: {
    type: [String, Number],
    default: 'pass'
  },
  failValue: {
    type: [String, Number],
    default: 'fail'
  },
  passLabel: {
    type: String,
    default: ''
  },
  failLabel: {
    type: String,
    default: ''
  },
  parentLabel: {
    type: String,
    default: ''
  },
  childLabel: {
    type: String,
    default: ''
  },
  standardLabel: {
    type: String,
    default: ''
  },
  photoLabel: {
    type: String,
    default: ''
  },
  photoLimit: {
    type: Number,
    default: 3
  },
  photoListField: {
    type: String,
    default: 'photoList'
  },
  showRemark: {
    type: Boolean,
    default: false
  },
  remarkField: {
    type: String,
    default: 'remark'
  },
  remarkPlaceholder: {
    type: String,
    default: ''
  },
  remarkPosition: {
    type: String,
    default: 'after'
  },
  useButtonRadio: {
    type: Boolean,
    default: false
  },
  radioGroupSize: {
    type: String,
    default: ''
  },
  isChildVisible: {
    type: Function,
    default: () => true
  }
});

const isFail = (item) => item?.[props.statusField] === props.failValue;
const onStatusChange = (item) => emit('status-change', item);
const onPhotoChange = (item, fileList) => emit('photo-change', item, fileList);
const handleUploadError = (error) => emit('upload-error', error);
</script>

<style lang="scss" scoped>
.check-group {
  margin-bottom: 16px;
}

.check-item-list {
  padding-left: 20px;
}

.check-item-group {
  margin-bottom: 12px;
}

.check-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;

  .check-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
  }

  .check-item-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    color: #303133;
  }

  .check-item-standard {
    color: #909399;
    font-size: 12px;
    margin-top: 4px;
  }

  .check-item-remark {
    margin-top: 8px;
  }

  .check-item-photo {
    margin-top: 10px;

    .photo-label {
      font-size: 12px;
      color: #f56c6c;
      margin-bottom: 8px;
    }

    :deep(.el-textarea) {
      margin-top: 8px;
    }

    :deep(.el-upload--picture-card) {
      width: 80px;
      height: 80px;
    }

    :deep(.el-upload-list--picture-card .el-upload-list__item) {
      width: 80px;
      height: 80px;
    }
  }
}

.check-item.child {
  margin-top: 8px;
  margin-left: 16px;
  background: #fff;
  border: 1px dashed #dcdfe6;
}
</style>
