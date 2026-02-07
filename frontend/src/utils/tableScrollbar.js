const TABLE_SELECTOR = '.el-table';
const IGNORE_SELECTOR = '[data-scrollbar="ignore"], .wms-scrollbar-ignore';
const HOST_SELECTOR = '.table-wrapper, .table-scroll, .list-table-wrapper, .table-container';
const BAR_CLASS = 'wms-table-scrollbar';
const THUMB_CLASS = 'wms-table-scrollbar__thumb';
const HOST_CLASS = 'wms-table-scrollbar-host';
const MIN_THUMB_WIDTH = 24;
const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);

const tableStates = new Map();
let scanScheduled = false;
let activeState = null;
let visibilityScheduled = false;
let visibilityObserver = null;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const isElementVisible = (rect) => rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;

const getVisibleArea = (rect) => {
  const left = Math.max(0, rect.left);
  const right = Math.min(window.innerWidth, rect.right);
  const top = Math.max(0, rect.top);
  const bottom = Math.min(window.innerHeight, rect.bottom);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  return width * height;
};

const getAnchorRect = (state) => {
  const anchor = state.host ? state.host : state.tableElement ? state.tableElement : state.scrollTarget;
  if (!anchor || !anchor.isConnected) {
    return null;
  }
  return anchor.getBoundingClientRect();
};

const updateBarPosition = (state) => {
  const { bar, scrollTarget } = state;
  if (!bar.isConnected || !scrollTarget.isConnected) {
    return;
  }
  const rect = getAnchorRect(state);
  if (!rect) {
    return;
  }
  const visible = isElementVisible(rect);
  if (!visible) {
    bar.classList.add('is-hidden');
    return;
  }
  const left = Math.max(0, rect.left);
  const right = Math.min(window.innerWidth, rect.right);
  const width = Math.max(0, right - left);
  if (width <= 0) {
    bar.classList.add('is-hidden');
    return;
  }
  bar.classList.remove('is-hidden');
  bar.style.left = `${left}px`;
  bar.style.width = `${width}px`;
};

const setActiveState = (state) => {
  if (!state) {
    return;
  }
  if (activeState && activeState !== state) {
    activeState.bar.classList.remove('is-active');
  }
  activeState = state;
  activeState.bar.classList.add('is-active');
  updateScrollbar(activeState);
};
const isScrollableX = (element) => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const overflowX = window.getComputedStyle(element).overflowX;
  if (!SCROLLABLE_OVERFLOW.has(overflowX)) {
    return false;
  }
  return element.scrollWidth > element.clientWidth;
};

const isScrollableYContainer = (element) => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const overflowY = window.getComputedStyle(element).overflowY;
  if (!SCROLLABLE_OVERFLOW.has(overflowY)) {
    return false;
  }
  return element.scrollHeight > element.clientHeight;
};

const getScrollContainer = (tableElement) => {
  let current = tableElement.parentElement;
  while (current && current !== document.body) {
    if (isScrollableYContainer(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return window;
};

const ensureHost = (tableElement) => {
  const parent = tableElement.parentElement;
  if (!parent) {
    return null;
  }
  if (parent.classList.contains(HOST_CLASS)) {
    return parent;
  }
  const existingHost = tableElement.closest(HOST_SELECTOR);
  if (existingHost instanceof HTMLElement && existingHost !== tableElement) {
    existingHost.classList.add(HOST_CLASS);
    return existingHost;
  }
  const host = document.createElement('div');
  host.className = `${HOST_CLASS} table-wrapper`;
  parent.insertBefore(host, tableElement);
  host.appendChild(tableElement);
  return host;
};

const getScrollTarget = (tableElement) => {
  if (!(tableElement instanceof HTMLElement)) {
    return null;
  }
  const bodyWrapper = tableElement.querySelector('.el-table__body-wrapper');
  const scrollbarWrap = bodyWrapper?.querySelector('.el-scrollbar__wrap');
  if (scrollbarWrap instanceof HTMLElement) {
    return scrollbarWrap;
  }
  if (bodyWrapper instanceof HTMLElement) {
    return bodyWrapper;
  }

  let current = tableElement.parentElement;
  while (current && current !== document.body) {
    if (isScrollableX(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return tableElement;
};

const updateScrollbar = (state) => {
  if (activeState && activeState !== state) {
    state.bar.classList.remove('is-active');
    return;
  }
  const { bar, thumb, scrollTarget } = state;
  if (!bar.isConnected || !scrollTarget.isConnected) {
    return;
  }
  updateBarPosition(state);
  const scrollWidth = scrollTarget.scrollWidth;
  const clientWidth = scrollTarget.clientWidth;
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
  const barWidth = bar.clientWidth;
  if (barWidth <= 0) {
    return;
  }
  let thumbWidth = scrollWidth > 0 ? (barWidth * clientWidth) / scrollWidth : barWidth;
  thumbWidth = clamp(thumbWidth, MIN_THUMB_WIDTH, barWidth);
  const maxThumbLeft = Math.max(0, barWidth - thumbWidth);
  const thumbLeft = maxScrollLeft > 0
    ? (scrollTarget.scrollLeft / maxScrollLeft) * maxThumbLeft
    : 0;
  thumb.style.width = `${thumbWidth}px`;
  thumb.style.transform = `translateX(${thumbLeft}px)`;
  bar.classList.toggle('is-disabled', maxScrollLeft <= 0);
  state.maxScrollLeft = maxScrollLeft;
  state.maxThumbLeft = maxThumbLeft;
  state.thumbWidth = thumbWidth;
  state.currentThumbLeft = thumbLeft;
};

const bindScrollbar = (tableElement, scrollTarget, host) => {
  if (!host) {
    return;
  }
  const bar = document.createElement('div');
  bar.className = BAR_CLASS;
  const thumb = document.createElement('div');
  thumb.className = THUMB_CLASS;
  bar.appendChild(thumb);

  if (tableElement.parentElement === host) {
    host.insertBefore(bar, tableElement.nextSibling);
  } else {
    host.appendChild(bar);
  }

  const state = {
    tableElement,
    bar,
    thumb,
    scrollTarget,
    host,
    scrollContainer: null,
    visibilityTarget: null,
    dragging: false,
    dragStartX: 0,
    dragStartLeft: 0,
    maxScrollLeft: 0,
    maxThumbLeft: 0,
    thumbWidth: 0,
    currentThumbLeft: 0,
    resizeObserver: null,
    onScroll: null,
    onContainerScroll: null
  };

  const setActive = () => setActiveState(state);
  tableElement.addEventListener('mouseenter', setActive);
  tableElement.addEventListener('focusin', setActive);

  const onScroll = () => {
    setActiveState(state);
    scheduleVisibilityCheck();
  };
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  state.onScroll = onScroll;

  const scrollContainer = getScrollContainer(tableElement);
  const onContainerScroll = () => {
    scheduleVisibilityCheck();
    if (activeState) {
      updateBarPosition(activeState);
    }
  };
  scrollContainer.addEventListener('scroll', onContainerScroll, { passive: true });
  state.scrollContainer = scrollContainer;
  state.onContainerScroll = onContainerScroll;

  const visibilityTarget = state.host || tableElement;
  state.visibilityTarget = visibilityTarget;
  if (visibilityObserver && visibilityTarget) {
    visibilityObserver.observe(visibilityTarget);
  }

  const onPointerDown = (event) => {
    if (state.maxScrollLeft <= 0) {
      return;
    }
    if (event.button != null && event.button !== 0) {
      return;
    }
    event.preventDefault();
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const nextThumbLeft = clamp(clickX - state.thumbWidth / 2, 0, state.maxThumbLeft);
    if (event.target !== thumb) {
      const ratio = state.maxThumbLeft > 0 ? nextThumbLeft / state.maxThumbLeft : 0;
      scrollTarget.scrollLeft = ratio * state.maxScrollLeft;
      updateScrollbar(state);
      state.dragStartLeft = nextThumbLeft;
    } else {
      state.dragStartLeft = state.currentThumbLeft || 0;
    }
    state.dragging = true;
    state.dragStartX = event.clientX;
    bar.setPointerCapture(event.pointerId);
    bar.classList.add('is-dragging');
  };

  const onPointerMove = (event) => {
    if (!state.dragging || state.maxScrollLeft <= 0) {
      return;
    }
    event.preventDefault();
    const deltaX = event.clientX - state.dragStartX;
    const nextThumbLeft = clamp(state.dragStartLeft + deltaX, 0, state.maxThumbLeft);
    const ratio = state.maxThumbLeft > 0 ? nextThumbLeft / state.maxThumbLeft : 0;
    scrollTarget.scrollLeft = ratio * state.maxScrollLeft;
  };

  const onPointerUp = () => {
    if (!state.dragging) {
      return;
    }
    state.dragging = false;
    bar.classList.remove('is-dragging');
  };

  bar.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  state.resizeObserver = new ResizeObserver(() => updateScrollbar(state));
  state.resizeObserver.observe(tableElement);
  state.resizeObserver.observe(scrollTarget);

  if (scrollTarget.contains(bar)) {
    bar.classList.add('is-sticky');
  }

  tableStates.set(tableElement, state);
  if (!activeState) {
    setActiveState(state);
  } else {
    updateScrollbar(state);
  }
};

const cleanupTables = () => {
  for (const [tableElement, state] of tableStates.entries()) {
    if (tableElement.isConnected) {
      continue;
    }
    state.resizeObserver?.disconnect();
    state.scrollTarget?.removeEventListener('scroll', state.onScroll);
    state.scrollContainer?.removeEventListener('scroll', state.onContainerScroll);
    if (visibilityObserver && state.visibilityTarget) {
      visibilityObserver.unobserve(state.visibilityTarget);
    }
    if (activeState === state) {
      activeState = null;
    }
    state.bar.remove();
    if (state.host && state.host.childElementCount === 0) {
      state.host.remove();
    }
    tableStates.delete(tableElement);
  }
};

const scanTables = () => {
  scanScheduled = false;
  document.querySelectorAll(TABLE_SELECTOR).forEach((tableElement) => {
    if (tableElement.closest(IGNORE_SELECTOR)) {
      return;
    }
    const host = ensureHost(tableElement);
    if (!host) {
      return;
    }
    const scrollTarget = getScrollTarget(tableElement);
    if (!scrollTarget) {
      return;
    }
    const existingState = tableStates.get(tableElement);
    if (existingState) {
      if (existingState.host !== host) {
        existingState.host = host;
        if (!host.contains(existingState.bar)) {
          host.insertBefore(existingState.bar, tableElement.nextSibling);
        }
        const visibilityTarget = existingState.host || tableElement;
        if (existingState.visibilityTarget !== visibilityTarget) {
          if (visibilityObserver && existingState.visibilityTarget) {
            visibilityObserver.unobserve(existingState.visibilityTarget);
          }
          existingState.visibilityTarget = visibilityTarget;
          if (visibilityObserver && visibilityTarget) {
            visibilityObserver.observe(visibilityTarget);
          }
        }
      }
      const nextScrollContainer = getScrollContainer(tableElement);
      if (existingState.scrollContainer !== nextScrollContainer) {
        existingState.scrollContainer?.removeEventListener('scroll', existingState.onContainerScroll);
        nextScrollContainer.addEventListener('scroll', existingState.onContainerScroll, { passive: true });
        existingState.scrollContainer = nextScrollContainer;
      }
      if (existingState.scrollTarget !== scrollTarget) {
        existingState.scrollTarget.removeEventListener('scroll', existingState.onScroll);
        existingState.resizeObserver?.unobserve(existingState.scrollTarget);
        existingState.scrollTarget = scrollTarget;
        scrollTarget.addEventListener('scroll', existingState.onScroll, { passive: true });
        existingState.resizeObserver?.observe(scrollTarget);
        if (scrollTarget.contains(existingState.bar)) {
          existingState.bar.classList.add('is-sticky');
        } else {
          existingState.bar.classList.remove('is-sticky');
        }
      }
      updateScrollbar(existingState);
      return;
    }
    bindScrollbar(tableElement, scrollTarget, host);
  });
  cleanupTables();
  scheduleVisibilityCheck();
};

const scheduleScan = () => {
  if (scanScheduled) {
    return;
  }
  scanScheduled = true;
  requestAnimationFrame(scanTables);
};

const updateActiveByVisibility = () => {
  let bestScrollableState = null;
  let bestScrollableArea = 0;
  let bestState = null;
  let bestArea = 0;
  tableStates.forEach((state) => {
    if (!state.tableElement?.isConnected || !state.scrollTarget?.isConnected) {
      return;
    }
    const rect = getAnchorRect(state);
    if (!rect) {
      return;
    }
    const area = getVisibleArea(rect);
    if (area <= 0) {
      return;
    }
    const hasOverflow = state.scrollTarget.scrollWidth > state.scrollTarget.clientWidth;
    if (hasOverflow) {
      if (area > bestScrollableArea) {
        bestScrollableArea = area;
        bestScrollableState = state;
      }
    } else if (area > bestArea) {
      bestArea = area;
      bestState = state;
    }
  });
  const nextState = bestScrollableState ? bestScrollableState : bestState;
  if (nextState) {
    setActiveState(nextState);
  } else if (activeState) {
    activeState.bar.classList.remove('is-active');
  }
};

const scheduleVisibilityCheck = () => {
  if (visibilityScheduled) {
    return;
  }
  visibilityScheduled = true;
  requestAnimationFrame(() => {
    visibilityScheduled = false;
    updateActiveByVisibility();
  });
};

const setupTableScrollbars = () => {
  scheduleScan();
  if (typeof IntersectionObserver !== 'undefined') {
    visibilityObserver = new IntersectionObserver(() => {
      scheduleVisibilityCheck();
    }, { threshold: [0, 0.1, 0.25, 0.5, 1] });
  }
  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', () => {
    scheduleScan();
    scheduleVisibilityCheck();
  });
  const handleScroll = () => {
    if (activeState) {
      updateBarPosition(activeState);
    }
    scheduleVisibilityCheck();
  };
  document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
};

export default setupTableScrollbars;

