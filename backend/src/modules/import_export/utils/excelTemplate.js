const headerFill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9EAF7' }
};

const defaultFont = { name: '宋体', size: 12 };

const getTextWidth = (text) => {
  if (!text) return 0;
  return Array.from(text).reduce((sum, char) => {
    const code = char.charCodeAt(0);
    return sum + (code > 255 ? 2 : 1);
  }, 0);
};

export const applyTemplateHeaderStyle = (worksheet, headerRowIndex = 1) => {
  const columnWidths = new Map();
  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    row.height = 25;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const text = cell.text ?? '';
      const textWidth = getTextWidth(String(text));
      const current = columnWidths.get(colNumber) ?? 0;
      if (textWidth > current) {
        columnWidths.set(colNumber, textWidth);
      }
      cell.font = defaultFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (rowNumber === headerRowIndex) {
        cell.fill = headerFill;
      }
    });
  });

  columnWidths.forEach((width, colNumber) => {
    const column = worksheet.getColumn(colNumber);
    column.width = Math.max(width + 2, 2);
    column.alignment = { vertical: 'middle', horizontal: 'center' };
    column.font = defaultFont;
  });
};

export const addTemplateInstructionSheet = (workbook, rows = []) => {
  const sheet = workbook.addWorksheet('填写说明');
  sheet.columns = [{ width: 20 }, { width: 60 }];
  sheet.addRow(['表头', '填写说明']);

  const dataRows = Array.isArray(rows) ? rows : [];
  dataRows.forEach((line) => {
    const rowData = Array.isArray(line) ? line : [line];
    const normalized = [rowData[0] ?? '', rowData[1] ?? ''];
    sheet.addRow(normalized);
  });

  applyTemplateHeaderStyle(sheet, 1);

  return sheet;
};
