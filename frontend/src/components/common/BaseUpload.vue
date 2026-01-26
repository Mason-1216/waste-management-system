<template>
  <el-upload ref="uploadRef">
    <slot />
    <template v-if="$slots.trigger" #trigger>
      <slot name="trigger" />
    </template>
    <template v-if="$slots.tip" #tip>
      <slot name="tip" />
    </template>
    <template v-if="$slots.file" #file="slotProps">
      <slot name="file" v-bind="slotProps" />
    </template>
  </el-upload>
</template>

<script setup>
import { ref } from 'vue';

const uploadRef = ref(null);

const callUploadMethod = (method) => (...args) => uploadRef.value?.[method]?.(...args);

defineExpose({
  abort: callUploadMethod('abort'),
  clearFiles: callUploadMethod('clearFiles'),
  handleRemove: callUploadMethod('handleRemove'),
  submit: callUploadMethod('submit'),
  upload: callUploadMethod('upload')
});
</script>
