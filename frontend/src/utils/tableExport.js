import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

const INVALID_FILENAME_CHARS_RE = /[\\/:*?"<>|]+/g;

const notifyExportForE2E = (payload) => {
  try {
    if (typeof window === 'undefined') return;
    const hook = window?.__WMS_EXPORT_HOOK__;
    if (typeof hook === 'function') {
      hook(payload);
    }
  } catch {
  }
};

export const sanitizeExportTitle = (title) => {
  const text = typeof title === 'string' ? title.trim() : '';
  if (!text) return '导出数据';
  const resolved = text.replaceAll(INVALID_FILENAME_CHARS_RE, '_').trim();
  if (!resolved) return '导出数据';
  return resolved;
};

export const buildExportFileName = ({ title, date = dayjs().format('YYYYMMDD') } = {}) => {
  const safeTitle = sanitizeExportTitle(title);
  const safeDate = typeof date === 'string' ? date.trim() : '';
  const suffix = safeDate ? `_${safeDate}` : '';
  return `${safeTitle}${suffix}.xlsx`;
};

const resolveValueByPath = (row, path) => {
  if (!path) return undefined;
  const segments = typeof path === 'string' ? path.split('.').filter(Boolean) : [];
  if (segments.length === 0) return undefined;

  let current = row;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    current = current[segment];
  }
  return current;
};

const normalizeCellValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildSheetAoA = (columns, rows) => {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  const header = safeColumns.map(col => col.label);
  const body = safeRows.map(row => safeColumns.map((col) => {
    const getter = typeof col?.value === 'function' ? col.value : null;
    if (getter) {
      return normalizeCellValue(getter(row));
    }
    return normalizeCellValue(resolveValueByPath(row, col.prop));
  }));

  return [header, ...body];
};

const flattenColumns = (columns) => {
  const list = Array.isArray(columns) ? columns : [];
  const out = [];

  for (const col of list) {
    const children = Array.isArray(col?.children) ? col.children : [];
    if (children.length > 0) {
      out.push(...flattenColumns(children));
      continue;
    }
    out.push(col);
  }

  return out;
};

export const resolveElTableExportColumns = (tableRef) => {
  const table = tableRef?.value ?? tableRef;
  const storeColumns = table?.store?.states?.columns?.value;
  const raw = Array.isArray(storeColumns) ? storeColumns : (Array.isArray(table?.columns) ? table.columns : []);
  const columns = flattenColumns(raw);

  const exportable = columns
    .filter((col) => {
      const type = typeof col?.type === 'string' ? col.type : '';
      if (type === 'selection' || type === 'index' || type === 'expand') return false;
      const label = typeof col?.label === 'string' ? col.label.trim() : '';
      return Boolean(label);
    })
    .map((col) => {
      const label = typeof col?.label === 'string' ? col.label.trim() : '';
      const prop = typeof col?.property === 'string' ? col.property : (typeof col?.prop === 'string' ? col.prop : '');
      return { label, prop };
    })
    .filter(col => Boolean(col.prop));

  return exportable;
};

export const exportRowsToXlsx = async ({
  title,
  fileName,
  sheetName,
  columns,
  rows
} = {}) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) {
    ElMessage.warning('没有可导出的数据');
    return;
  }

  const safeColumns = Array.isArray(columns) ? columns : [];
  if (safeColumns.length === 0) {
    ElMessage.warning('没有可导出的列');
    return;
  }

  const xlsxModule = await import('xlsx');
  const XLSX = xlsxModule?.default ? xlsxModule.default : xlsxModule;
  const ws = XLSX.utils.aoa_to_sheet(buildSheetAoA(safeColumns, safeRows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, typeof sheetName === 'string' && sheetName.trim() ? sheetName.trim() : 'Sheet1');

  const resolvedName = typeof fileName === 'string' && fileName.trim()
    ? fileName.trim()
    : buildExportFileName({ title });
  notifyExportForE2E({ fileName: resolvedName, title, sheetName });
  XLSX.writeFile(wb, resolvedName);
};

export const exportSheetsToXlsx = async ({
  title,
  fileName,
  sheets
} = {}) => {
  const safeSheets = Array.isArray(sheets) ? sheets : [];
  if (safeSheets.length === 0) {
    ElMessage.warning('没有可导出的数据');
    return;
  }

  const xlsxModule = await import('xlsx');
  const XLSX = xlsxModule?.default ? xlsxModule.default : xlsxModule;
  const wb = XLSX.utils.book_new();

  let appended = 0;
  safeSheets.forEach((sheet, idx) => {
    const sheetRows = Array.isArray(sheet?.rows) ? sheet.rows : [];
    const sheetColumns = Array.isArray(sheet?.columns) ? sheet.columns : [];
    if (sheetRows.length === 0 || sheetColumns.length === 0) return;

    const sheetName = typeof sheet?.name === 'string' && sheet.name.trim()
      ? sheet.name.trim()
      : `Sheet${idx + 1}`;

    const ws = XLSX.utils.aoa_to_sheet(buildSheetAoA(sheetColumns, sheetRows));
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    appended += 1;
  });

  if (appended === 0) {
    ElMessage.warning('没有可导出的数据');
    return;
  }

  const resolvedName = typeof fileName === 'string' && fileName.trim()
    ? fileName.trim()
    : buildExportFileName({ title });
  notifyExportForE2E({ fileName: resolvedName, title, sheets: appended });
  XLSX.writeFile(wb, resolvedName);
};

const normalizePagedPayload = (payload) => {
  if (Array.isArray(payload)) {
    return { list: payload, total: payload.length };
  }
  const list = Array.isArray(payload?.list) ? payload.list : [];
  const rawTotal = payload?.total;
  const total = Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : list.length;
  return { list, total };
};

export const fetchAllPaged = async ({
  fetchPage,
  pageSize = 5000,
  maxPages = 500,
  onProgress
} = {}) => {
  if (typeof fetchPage !== 'function') {
    throw new Error('fetchPage 必须是函数');
  }

  const resolvedPageSize = Number.isFinite(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 5000;
  const resolvedMaxPages = Number.isFinite(Number(maxPages)) && Number(maxPages) > 0 ? Number(maxPages) : 500;

  let page = 1;
  const allRows = [];
  let total = null;

  while (page <= resolvedMaxPages) {
    const data = await fetchPage({ page, pageSize: resolvedPageSize });
    const { list, total: pageTotal } = normalizePagedPayload(data);

    if (total === null && Number.isFinite(Number(pageTotal))) {
      total = Number(pageTotal);
    }

    allRows.push(...list);

    if (typeof onProgress === 'function') {
      onProgress({
        page,
        pageSize: resolvedPageSize,
        current: allRows.length,
        total: total ?? undefined
      });
    }

    if (list.length < resolvedPageSize) break;
    if (total !== null && allRows.length >= total) break;
    page += 1;
  }

  if (page > resolvedMaxPages) {
    ElMessage.warning('导出数据量过大，已达到最大分页限制');
  }

  return { rows: allRows, total: total ?? allRows.length };
};

export const exportElTableByPagedFetcher = async ({
  title,
  fileName,
  sheetName,
  tableRef,
  fetchPage,
  pageSize = 5000
} = {}) => {
  const columns = resolveElTableExportColumns(tableRef);
  const { rows } = await fetchAllPaged({ fetchPage, pageSize });
  await exportRowsToXlsx({
    title,
    fileName,
    sheetName,
    columns,
    rows
  });
};
