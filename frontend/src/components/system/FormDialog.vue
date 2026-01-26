<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    v-bind="$attrs"
  >
    <slot />
    <template #footer>
      <slot name="footer">
        <el-button v-if="showCancel" @click="handleCancel">{{ cancelText }}</el-button>
        <el-button v-if="showConfirm" type="primary" :loading="confirmLoading" @click="handleConfirm">
          {{ confirmText }}
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ inheritAttrs: false });

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: '500px'
  },
  confirmText: {
    type: String,
    default: ''
  },
  cancelText: {
    type: String,
    default: ''
  },
  confirmLoading: {
    type: Boolean,
    default: false
  },
  closeOnClickModal: {
    type: Boolean,
    default: true
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  showConfirm: {
    type: Boolean,
    default: true
  }
});

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const handleCancel = () => {
  emit('update:modelValue', false);
  emit('cancel');
};

const handleConfirm = () => emit('confirm');
</script>
