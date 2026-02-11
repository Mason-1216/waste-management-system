export const TASK_CATEGORY_OPTIONS = ['Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类'];

export const normalizeTaskCategory = (value, fallback = 'Ⅰ类') => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (TASK_CATEGORY_OPTIONS.includes(text)) return text;
  return fallback;
};

