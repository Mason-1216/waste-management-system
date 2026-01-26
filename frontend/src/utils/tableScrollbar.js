const TABLE_SELECTOR = '.el-table';
const IGNORE_SELECTOR = '[data-scrollbar="ignore"], .wms-scrollbar-ignore';
const BAR_CLASS = 'wms-table-scrollbar';
const THUMB_CLASS = 'wms-table-scrollbar__thumb';
const HOST_CLASS = 'wms-table-scrollbar-host';
const MIN_THUMB_WIDTH = 24;
const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);

const tableStates = new Map();
let scanScheduled = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

const ensureHost = (tableElement) => {
  const parent = tableElement.parentElement;
  if (!parent) {
    return null;
  }
  if (parent.classList.contains(HOST_CLASS)) {
    return parent;
  }
  const host = document.createElement('div');
  host.className = HOST_CLASS;
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
  const candidates = [];
  if (scrollbarWrap instanceof HTMLElement) {
    candidates.push(scrollbarWrap);
  }
  if (bodyWrapper instanceof HTMLElement) {
    candidates.push(bodyWrapper);
  }

  let current = tableElement.parentElement;
  while (current && current !== document.body) {
    if (isScrollableX(current)) {
      candidates.push(current);
    }
    current = current.parentElement;
  }

  let best = null;
  let bestOverflow = 0;
  candidates.forEach((candidate) => {
    const overflow = candidate.scrollWidth - candidate.clientWidth;
    if (overflow > bestOverflow) {
      bestOverflow = overflow;
      best = candidate;
    }
  });

  if (best) {
    return best;
  }
  if (bodyWrapper instanceof HTMLElement) {
    return bodyWrapper;
  }
  return tableElement;
};

const updateScrollbar = (state) => {
  const { bar, thumb, scrollTarget } = state;
  if (!bar.isConnected || !scrollTarget.isConnected) {
    return;
  }
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

  host.insertBefore(bar, tableElement.nextSibling);

  const state = {
    bar,
    thumb,
    scrollTarget,
    host,
    dragging: false,
    dragStartX: 0,
    dragStartLeft: 0,
    maxScrollLeft: 0,
    maxThumbLeft: 0,
    thumbWidth: 0,
    currentThumbLeft: 0,
    resizeObserver: null,
    onScroll: null
  };

  const onScroll = () => updateScrollbar(state);
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  state.onScroll = onScroll;

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
  updateScrollbar(state);
};

const cleanupTables = () => {
  for (const [tableElement, state] of tableStates.entries()) {
    if (tableElement.isConnected) {
      continue;
    }
    state.resizeObserver?.disconnect();
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
};

const scheduleScan = () => {
  if (scanScheduled) {
    return;
  }
  scanScheduled = true;
  requestAnimationFrame(scanTables);
};

const setupTableScrollbars = () => {
  scheduleScan();
  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', scheduleScan);
};

export default setupTableScrollbars;
