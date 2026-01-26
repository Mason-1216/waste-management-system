const guardSelector = '.table-wrapper, .table-scroll, .table-container, .list-table-wrapper, .el-table, .el-table__body-wrapper, .el-scrollbar__wrap';
const scrollOverflowValues = ['auto', 'scroll', 'overlay'];
const dragThreshold = 6;
const edgeThreshold = 24;

const isScrollableX = (element) => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const computed = window.getComputedStyle(element);
  const overflowX = computed.overflowX;
  const canOverflow = scrollOverflowValues.includes(overflowX);
  const maxScrollLeft = element.scrollWidth - element.clientWidth;
  return canOverflow && maxScrollLeft > 0;
};

const hasGuardAncestor = (element) => {
  if (!(element instanceof Element)) {
    return false;
  }
  const guard = element.closest(guardSelector);
  return guard instanceof Element;
};

const findScrollableX = (target) => {
  let current = target;
  while (current && current !== document.body) {
    if (current instanceof HTMLElement && isScrollableX(current) && hasGuardAncestor(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

const setupHorizontalScrollGuard = () => {
  const state = {
    active: false,
    dragging: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    target: null,
    edgeStart: false
  };

  const reset = () => {
    state.active = false;
    state.dragging = false;
    state.target = null;
    state.edgeStart = false;
  };

  const onTouchStart = (event) => {
    if (event.touches.length !== 1) {
      reset();
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      reset();
      return;
    }
    const scrollable = findScrollableX(target);
    if (!scrollable) {
      reset();
      return;
    }
    state.active = true;
    state.dragging = false;
    state.target = scrollable;
    state.startX = event.touches[0].clientX;
    state.startY = event.touches[0].clientY;
    state.startScrollLeft = scrollable.scrollLeft;
    state.edgeStart =
      state.startX <= edgeThreshold ||
      state.startX >= (window.innerWidth || document.documentElement.clientWidth) - edgeThreshold;
  };

  const onTouchMove = (event) => {
    if (!state.active) {
      return;
    }
    if (!(state.target instanceof HTMLElement)) {
      return;
    }
    if (event.touches.length !== 1) {
      return;
    }
    const touch = event.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!state.dragging) {
      const threshold = state.edgeStart ? 0 : dragThreshold;
      if (absX <= threshold) {
        if (absY > dragThreshold) {
          reset();
        }
        return;
      }
      if (absX <= absY) {
        if (absY > dragThreshold) {
          reset();
        }
        return;
      }
      state.dragging = true;
    }

    event.preventDefault();
    const maxScrollLeft = Math.max(0, state.target.scrollWidth - state.target.clientWidth);
    let nextScrollLeft = state.startScrollLeft - deltaX;
    if (nextScrollLeft < 0) {
      nextScrollLeft = 0;
    }
    if (nextScrollLeft > maxScrollLeft) {
      nextScrollLeft = maxScrollLeft;
    }
    state.target.scrollLeft = nextScrollLeft;
  };

  const onTouchEnd = () => {
    reset();
  };

  document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
  document.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
};

export default setupHorizontalScrollGuard;
