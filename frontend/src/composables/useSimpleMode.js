import { computed, ref, watch } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useUiModeStore } from '@/store/modules/uiMode';

export function useSimpleMode() {
  const userStore = useUserStore();
  const uiModeStore = useUiModeStore();

  const canUseSimpleMode = computed(() => (
    userStore.roleCode === 'dev_test' || userStore.baseRoleCode === 'dev_test'
  ));
  const isSimpleMode = computed(() => canUseSimpleMode.value && uiModeStore.isSimpleMode);
  const simpleShowTable = ref(false);
  const simpleFilterExpanded = ref(false);

  watch(isSimpleMode, (enabled) => {
    if (!enabled) {
      simpleShowTable.value = false;
      simpleFilterExpanded.value = false;
    }
  });

  return {
    canUseSimpleMode,
    isSimpleMode,
    simpleShowTable,
    simpleFilterExpanded
  };
}
