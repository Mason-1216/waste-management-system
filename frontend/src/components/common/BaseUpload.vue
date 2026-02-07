<template>
  <el-upload
    ref="uploadRef"
    v-bind="uploadAttrs"
    :before-upload="handleBeforeUpload"
    @touchend="handleTrigger"
  >
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
import { computed, ref, useAttrs } from 'vue';
import { ElMessage } from 'element-plus';

defineOptions({ inheritAttrs: false });

const uploadRef = ref(null);
const attrs = useAttrs();

const resolveAccept = () => (typeof attrs.accept === 'string' ? attrs.accept : '');
const resolveFileInput = () => {
  const root = uploadRef.value?.$el;
  if (!(root instanceof HTMLElement)) return null;
  return root.querySelector('input[type="file"]');
};
const resolveFileList = () => {
  const list = attrs.fileList ?? attrs['file-list'];
  return Array.isArray(list) ? list : [];
};
const resolveLimit = () => {
  const value = attrs.limit;
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};
const isUploadDisabled = () => {
  if (attrs.disabled === true || attrs.disabled === '') return true;
  const limit = resolveLimit();
  if (limit === null) return false;
  const list = resolveFileList();
  return list.length >= limit;
};

const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  if (navigator.userAgentData?.mobile) return true;
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    if (mediaQuery.matches) return true;
  }
  if (Number.isFinite(navigator.maxTouchPoints) && navigator.maxTouchPoints > 1) {
    return true;
  }
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
};

const uploadAttrs = computed(() => {
  const next = { ...attrs };
  delete next.beforeUpload;
  delete next['before-upload'];
  const hasCapture = next.capture !== undefined && next.capture !== null && next.capture !== '';
  const accept = resolveAccept();
  if (!hasCapture && isMobileDevice() && accept.includes('image')) {
    next.capture = 'environment';
  }
  return next;
});

const resolveExternalBeforeUpload = () => attrs.beforeUpload ?? attrs['before-upload'];

const isHeicFile = (file) => {
  const name = file?.name ?? '';
  const type = file?.type ? file.type.toLowerCase() : '';
  const lowerName = name.toLowerCase();
  if (type.includes('heic') || type.includes('heif')) return true;
  return lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
};

const resolveJpegName = (name) => {
  const safeName = name ?? '';
  const lowerName = safeName.toLowerCase();
  if (!safeName) return 'image.jpg';
  if (lowerName.endsWith('.heic') || lowerName.endsWith('.heif')) {
    return `${safeName.slice(0, safeName.lastIndexOf('.'))}.jpg`;
  }
  return `${safeName}.jpg`;
};

const convertHeicToJpeg = async (file) => {
  if (!isHeicFile(file)) return file;
  try {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!blob) return file;
    return new File([blob], resolveJpegName(file?.name), {
      type: 'image/jpeg',
      lastModified: file?.lastModified ?? Date.now()
    });
  } catch (error) {
    ElMessage.error('HEIC 图片转换失败，请重试或改用 JPG。');
    return false;
  }
};

const handleBeforeUpload = async (file) => {
  const converted = await convertHeicToJpeg(file);
  if (converted === false) return false;
  const nextFile = converted ?? file;
  const externalBeforeUpload = resolveExternalBeforeUpload();
  if (typeof externalBeforeUpload !== 'function') return nextFile;

  const result = externalBeforeUpload(nextFile);
  if (result instanceof Promise) {
    const resolved = await result;
    if (resolved === false) return false;
    if (resolved === true || resolved === undefined) return nextFile;
    return resolved;
  }
  if (result === false) return false;
  if (result === true || result === undefined) return nextFile;
  return result;
};

const handleTrigger = (event) => {
  if (isUploadDisabled()) return;
  if (event?.cancelable) {
    event.preventDefault();
  }
  const input = resolveFileInput();
  if (!input || input.disabled) return;
  if (event?.target === input) return;
  input.click();
};

const callUploadMethod = (method) => (...args) => uploadRef.value?.[method]?.(...args);

defineExpose({
  abort: callUploadMethod('abort'),
  clearFiles: callUploadMethod('clearFiles'),
  handleRemove: callUploadMethod('handleRemove'),
  submit: callUploadMethod('submit'),
  upload: callUploadMethod('upload')
});
</script>
