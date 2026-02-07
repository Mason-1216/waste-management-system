const guardSelector = '.table-wrapper, .table-scroll, .table-container, .list-table-wrapper, .el-table, .el-table__body-wrapper, .el-scrollbar__wrap';
const scrollOverflowValues = ['auto', 'scroll', 'overlay'];
const dragThreshold = 6;
const edgeThreshold = 24;

const hasHorizontalOverflow = (element) => element.scrollWidth - element.clientWidth > 0;

const isNativeScrollableX = (element) => {
  const overflowX = window.getComputedStyle(element).overflowX;
  return scrollOverflowValues.includes(overflowX);
};

const isScrollableX = (element) => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  if (!hasHorizontalOverflow(element)) {
    return false;
  }
  if (isNativeScrollableX(element)) {
    return true;
  }
  return element.classList.contains('el-scrollbar__wrap')
    || element.classList.contains('el-table__body-wrapper');
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
  const table = target instanceof Element ? target.closest('.el-table') : null;
  if (table instanceof HTMLElement) {
    const bodyWrapper = table.querySelector('.el-table__body-wrapper');
    const scrollbarWrap = bodyWrapper?.querySelector('.el-scrollbar__wrap');
    const candidates = [scrollbarWrap, bodyWrapper].filter((el) => el instanceof HTMLElement);
    const resolved = candidates.find((el) => isScrollableX(el));
    if (resolved) {
      return resolved;
    }
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
    reset();
    if (event.touches.length !== 1) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const scrollable = findScrollableX(target);
    if (!scrollable) {
      return;
    }
    if (isNativeScrollableX(scrollable)) {
      return;
    }
    const startX = event.touches[0].clientX;
    const startY = event.touches[0].clientY;
    const edgeStart =
      startX <= edgeThreshold ||
      startX >= (window.innerWidth || document.documentElement.clientWidth) - edgeThreshold;
    if (edgeStart) {
      return;
    }
    state.active = true;
    state.dragging = false;
    state.target = scrollable;
    state.startX = startX;
    state.startY = startY;
    state.startScrollLeft = scrollable.scrollLeft;
    state.edgeStart = edgeStart;
  };

  const onTouchMove = (event) => {
    if (!state.active) {
      return;
    }
    if (!(state.target instanceof HTMLElement)) {
      reset();
      return;
    }
    if (!state.target.isConnected || !isScrollableX(state.target)) {
      reset();
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

    if (event.cancelable) {
      event.preventDefault();
    }
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
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', reset);
  window.addEventListener('popstate', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      reset();
    }
  });
};

export default setupHorizontalScrollGuard;
