const headerFill = { patternType: 'solid', fgColor: { rgb: 'D9EAF7' } };
const defaultFont = { name: '宋体', sz: 12 };

const getTextWidth = (text) => {
  if (!text) return 0;
  return Array.from(text).reduce((sum, char) => {
    const code = char.charCodeAt(0);
    return sum + (code > 255 ? 2 : 1);
  }, 0);
};

const getCellText = (cell) => {
  if (!cell) return '';
  if (cell.w) return String(cell.w);
  if (cell.v === undefined || cell.v === null) return '';
  return String(cell.v);
};

export const applyTemplateHeaderStyle = (XLSX, worksheet, headerRowIndex = 1) => {
  if (!worksheet || !worksheet['!ref']) return;
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const rowIndex = headerRowIndex - 1;
  const colWidths = Array(range.e.c - range.s.c + 1).fill(0);

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddr];
      if (!cell) continue;
      const textWidth = getTextWidth(getCellText(cell));
      const widthIndex = col - range.s.c;
      if (textWidth > colWidths[widthIndex]) {
        colWidths[widthIndex] = textWidth;
      }
      cell.s = {
        font: defaultFont,
        alignment: { vertical: 'center', horizontal: 'center' }
      };
      if (row === rowIndex) {
        cell.s.fill = headerFill;
      }
    }
  }

  if (!worksheet['!rows']) worksheet['!rows'] = [];
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    worksheet['!rows'][row] = { hpt: 25 };
  }

  worksheet['!cols'] = colWidths.map((width) => ({
    wch: Math.max(width + 2, 2)
  }));
};

export const addTemplateInstructionSheet = (XLSX, workbook, rows = []) => {
  const dataRows = Array.isArray(rows)
    ? rows.map((line) => (Array.isArray(line) ? line : [line]))
    : [];
  const instructionData = [
    ['表头', '填写说明'],
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(instructionData);
  applyTemplateHeaderStyle(XLSX, ws, 1);
  XLSX.utils.book_append_sheet(workbook, ws, '填写说明');
  return ws;
};
