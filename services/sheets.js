const { google } = require('googleapis');
const config = require('../config/config');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: config.google.clientEmail,
    private_key: config.google.privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? '';
}

async function appendRow(flow, answers) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Собираем строку в порядке columns
  const row = flow.columns.map((columnName) => {
    if (columnName === 'timestamp') {
      return new Date().toISOString().slice(0, 10);
    }
    return answers[columnName] ?? '';
  });

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${flow.sheetName}!A:Z`,      // например 'CU'
    valueInputOption: 'RAW',
    resource: { values: [row] },
  });

  return res;
}

async function appendToCell(sheetName, cell, newValue) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // 1. читаем текущее значение
  const readRes = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!${cell}`,
  });

  const oldValue = readRes.data.values ? readRes.data.values[0][0] : '';

  // 2. склеиваем
  let updatedValue;
  if (!oldValue || oldValue.trim() === '') {
    updatedValue = newValue;
  } else {
    // можно через запятую или с переносом строки
    updatedValue = `${oldValue}\n${newValue}`;
  }

  // 3. пишем обратно
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!${cell}`,
    valueInputOption: 'RAW',
    resource: { values: [[updatedValue]] },
  });

  return updatedValue;
}

// найти или создать строку с сегодняшней датой в колонке A
async function findOrCreateRowByDate(sheetName, dateISO) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!A:A`,
  });

  const rows = res.data.values || [];

  // пропускаем заголовок (i = 1)
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const cell = (rows[i][0] || '').toString();
    if (cell.slice(0, 10) === dateISO) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex !== -1) {
    return rowIndex + 1; // номер строки (1-based)
  }

  // строки нет — создаём новую
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: 'RAW',
    resource: { values: [[dateISO]] },
  });

  return rows.length + 1;
}

// помощник: номер колонки -> буква (0 = A, 1 = B, 2 = C...)
function indexToColumnLetter(index) {
  let n = index;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

// буква -> индекс (A=0, B=1, C=2...)
function columnLetterToIndex(letter) {
  let n = 0;
  for (let i = 0; i < letter.length; i++) {
    n = n * 26 + (letter.charCodeAt(i) - 64);
  }
  return n - 1;
}

// обновить строку указанного дня значениями dayFlow
async function updateRowByDate(flow, answers, dateISO) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const rowNumber = await findOrInsertRowByDate(flow.sheetName, dateISO);

  const startIndex = columnLetterToIndex(flow.startColumn); // 'C' -> 2
  const endIndex   = startIndex + flow.columns.length - 1;
  const endColumn  = indexToColumnLetter(endIndex);

  const range = `${flow.sheetName}!${flow.startColumn}${rowNumber}:${endColumn}${rowNumber}`;

  const row = flow.columns.map((columnName) =>
    normalizeValue(answers[columnName])
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range,
    valueInputOption: 'RAW',
    resource: { values: [row] },
  });
}

async function getSheetValues(rangeA1) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: rangeA1,
  });

  return res.data.values || [];
}

async function appendRawRow(sheetName, row) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!A:I`,
    valueInputOption: 'RAW',
    resource: { values: [row] },
  });
}

// включить/выключить по id (ищем id в колонке A)
async function updateReminderEnabledById(sheetName, id, enabled) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const rows = await getSheetValues(`${sheetName}!A:A`);
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') === String(id)) {
      rowIndex = i + 1; // 1-based
      break;
    }
  }
  if (rowIndex === -1) return false;

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!B${rowIndex}`,
    valueInputOption: 'RAW',
    resource: { values: [[enabled ? 'TRUE' : 'FALSE']] },
  });

  return true;
}

async function findOrInsertRowByDate(sheetName, dateISO) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // 1) читаем колонку A
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!A:A`,
  });

  const rows = res.data.values || [];

  // 2) ищем позицию
  // rows[0] — заголовок
  let insertRowIndex = rows.length; // по умолчанию — в конец

  for (let i = 1; i < rows.length; i++) {
    const cellDate = (rows[i][0] || '').slice(0, 10);
    if (cellDate && cellDate > dateISO) {
      insertRowIndex = i;
      break;
    }
    if (cellDate === dateISO) {
      // дата уже есть
      return i + 1; // 1-based
    }
  }

  // 3) получаем sheetId
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: config.spreadsheetId,
  });

  const sheet = meta.data.sheets.find(
    s => s.properties.title === sheetName
  );
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

  const sheetId = sheet.properties.sheetId;

  // 4) вставляем строку
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: config.spreadsheetId,
    resource: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: insertRowIndex,
              endIndex: insertRowIndex + 1,
            },
            inheritFromBefore: false,
          },
        },
      ],
    },
  });

  // 5) пишем дату в колонку A
  const rowNumber = insertRowIndex + 1; // 1-based

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!A${rowNumber}`,
    valueInputOption: 'RAW',
    resource: { values: [[dateISO]] },
  });

  return rowNumber;
}

async function getHeaderMap(sheetName) {
  const header = await getSheetValues(`${sheetName}!1:1`);
  const row = header[0] || [];
  const map = {};
  row.forEach((name, idx) => {
    if (name) map[String(name).trim()] = idx; // имя колонки -> индекс (0-based)
  });
  return map;
}

// Обновить конкретные колонки (по именам) в строке нужной даты
async function updateRowColumnsByDate(sheetName, dateISO, updates) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const rowNumber = await findOrInsertRowByDate(sheetName, dateISO); // у вас уже есть
  const headerMap = await getHeaderMap(sheetName);

  const data = [];
  for (const [colName, rawValue] of Object.entries(updates)) {
    const idx = headerMap[colName];
    if (idx === undefined) continue; // колонка не найдена — просто пропускаем

    const colLetter = indexToColumnLetter(idx);
    const range = `${sheetName}!${colLetter}${rowNumber}`;
    data.push({
      range,
      values: [[normalizeValue(rawValue)]],
    });
  }

  if (!data.length) return false;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: config.spreadsheetId,
    resource: {
      valueInputOption: 'RAW',
      data,
    },
  });

  return true;
}


module.exports = {
  appendRow,
  appendToCell,
  findOrCreateRowByDate,
  updateRowByDate,
  updateRowColumnsByDate,
  getSheetValues,
  appendRawRow,
  updateReminderEnabledById,
  findOrInsertRowByDate
};