export const createListSuggestionFetcher = (getList, getValue, options) => {
  const maxOptions = options && typeof options.maxOptions === 'number'
    ? options.maxOptions
    : 50;

  return (queryString, callback) => {
    const list = getList();
    const query = typeof queryString === 'string' ? queryString.trim().toLowerCase() : '';

    const suggestions = [];
    const seen = new Set();

    if (Array.isArray(list)) {
      for (const row of list) {
        const raw = getValue(row);
        if (raw === undefined || raw === null) {
          continue;
        }
        const text = String(raw).trim();
        if (!text) {
          continue;
        }
        if (seen.has(text)) {
          continue;
        }
        seen.add(text);
        suggestions.push({ value: text });
        if (suggestions.length >= maxOptions) {
          break;
        }
      }
    }

    if (!query) {
      callback(suggestions);
      return;
    }

    const filtered = suggestions.filter((item) => item.value.toLowerCase().includes(query));
    callback(filtered);
  };
};

