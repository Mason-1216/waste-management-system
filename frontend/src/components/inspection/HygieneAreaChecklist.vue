<template>
  <div>
    <div v-if="!areas.length" class="empty-hint">
      <el-empty :description="emptyDescription" />
    </div>
    <div v-else>
      <div v-for="area in areas" :key="area.id" class="area-section">
        <el-divider v-if="headerType === 'divider'" content-position="left">
          {{ resolveAreaName(area) }}
        </el-divider>
        <h4 v-else-if="headerType === 'title'" class="area-title">
          {{ resolveAreaName(area) }}
        </h4>

        <div class="point-list">
          <div v-for="point in resolvePoints(area)" :key="point.id" class="point-item">
            <div class="point-header">
              <span class="point-name">{{ resolvePointName(point) }}</span>
              <el-radio-group v-model="point.checkStatus" @change="onPointStatusChange(point)">
                <el-radio :label="1">{{ passLabel }}</el-radio>
                <el-radio :label="0">{{ failLabel }}</el-radio>
              </el-radio-group>
            </div>

            <div class="point-requirement">
              <span v-if="requirementPrefix">{{ requirementPrefix }}</span>
              {{ resolveRequirement(point) }}
            </div>

            <el-input
              v-if="showPointRemark && point.checkStatus === 0"
              v-model="point.remark"
              type="textarea"
              :rows="2"
              :placeholder="remarkPlaceholder"
              style="margin-top: 8px"
            />

            <div class="point-photo" v-if="point.checkStatus === 0">
              <div v-if="pointPhotoLabel" class="photo-label">{{ pointPhotoLabel }}</div>
              <BaseUpload
                :action="uploadUrl"
                :headers="uploadHeaders"
                list-type="picture-card"
                accept="image/*"
                :limit="pointPhotoLimit"
                :file-list="point.photoList || []"
                @change="(file, fileList) => onPointPhotoChange(point, fileList)"
                @success="(response, file, fileList) => onPointPhotoChange(point, fileList)"
                @remove="(file, fileList) => onPointPhotoChange(point, fileList)"
                @error="handleUploadError"
              >
                <el-icon><Plus /></el-icon>
              </BaseUpload>
            </div>
          </div>
        </div>

        <div v-if="showAreaPhotos" class="area-photo">
          <div v-if="areaPhotoLabel" class="photo-label">{{ areaPhotoLabel }}</div>
          <BaseUpload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            accept="image/*"
            :limit="areaPhotoLimit"
            :file-list="area.photoList || []"
            @change="(file, fileList) => onAreaPhotoChange(area, fileList)"
            @success="(response, file, fileList) => onAreaPhotoChange(area, fileList)"
            @remove="(file, fileList) => onAreaPhotoChange(area, fileList)"
            @error="handleUploadError"
          >
            <el-icon><Plus /></el-icon>
          </BaseUpload>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue';

const emit = defineEmits([
  'point-status-change',
  'point-photo-change',
  'area-photo-change',
  'upload-error'
]);

const props = defineProps({
  areas: {
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
  emptyDescription: {
    type: String,
    default: ''
  },
  headerType: {
    type: String,
    default: 'divider'
  },
  requirementPrefix: {
    type: String,
    default: ''
  },
  requirementFallback: {
    type: String,
    default: ''
  },
  passLabel: {
    type: String,
    default: ''
  },
  failLabel: {
    type: String,
    default: ''
  },
  showPointRemark: {
    type: Boolean,
    default: false
  },
  remarkPlaceholder: {
    type: String,
    default: ''
  },
  pointPhotoLabel: {
    type: String,
    default: ''
  },
  areaPhotoLabel: {
    type: String,
    default: ''
  },
  showAreaPhotos: {
    type: Boolean,
    default: false
  },
  pointPhotoLimit: {
    type: Number,
    default: 3
  },
  areaPhotoLimit: {
    type: Number,
    default: 3
  }
});

const resolveAreaName = (area) => area?.areaName ?? area?.area_name ?? '';
const resolvePointName = (point) => point?.pointName ?? point?.point_name ?? '';
const resolveRequirement = (point) => point?.workRequirements ?? point?.work_requirements ?? props.requirementFallback;
const resolvePoints = (area) => area?.points ?? [];

const onPointStatusChange = (point) => emit('point-status-change', point);
const onPointPhotoChange = (point, fileList) => emit('point-photo-change', point, fileList);
const onAreaPhotoChange = (area, fileList) => emit('area-photo-change', area, fileList);
const handleUploadError = (error) => emit('upload-error', error);
</script>

<style lang="scss" scoped>
.empty-hint {
  padding: 40px 0;
}

.area-section {
  margin-bottom: 24px;
}

.area-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
}

.point-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.point-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;

  .point-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .point-name {
      font-weight: 500;
      color: #303133;
    }
  }

  .point-requirement {
    font-size: 12px;
    color: #606266;
    margin-bottom: 8px;
  }

  .point-photo {
    margin-top: 8px;

    .photo-label {
      font-size: 12px;
      color: #f56c6c;
      margin-bottom: 8px;
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

.area-photo {
  margin-top: 12px;

  .photo-label {
    font-size: 12px;
    color: #f56c6c;
    margin-bottom: 8px;
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
</style>
