const { google } = require('googleapis');
const config = require('../config/config');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: config.google.clientEmail,
    private_key: config.google.privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function appendRow(flow, answers) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Собираем строку в порядке columns
  const row = flow.columns.map((columnName) => {
    if (columnName === 'timestamp') {
      return new Date().toISOString().slice(0, 10);
    }
    // если ответа нет — кладём пустую строку
    return answers[columnName] ?? '';
  });

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: flow.sheetName,      // например 'CU!A:Z'
    valueInputOption: 'RAW',
    resource: { values: [row] },
  });

  console.log('Append OK:', res.status);
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
async function findOrCreateTodayRow(sheetName) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!A:A`,
  });

  const rows = res.data.values || [];

  // пропускаем заголовок (i = 1)
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const cell = (rows[i][0] || '').toString();
    if (cell.slice(0, 10) === today) {
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
    resource: { values: [[today]] },
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

// обновить строку сегодняшнего дня значениями dayFlow
async function updateTodayRow(flow, answers) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const rowNumber = await findOrCreateTodayRow(flow.sheetName);

  const startIndex = columnLetterToIndex(flow.startColumn); // 'C' -> 2
  const endIndex   = startIndex + flow.columns.length - 1;
  const endColumn  = indexToColumnLetter(endIndex);         // например 'K'

  const range = `${flow.sheetName}!${flow.startColumn}${rowNumber}:${endColumn}${rowNumber}`;

  const row = flow.columns.map((columnName) => answers[columnName] ?? '');

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range,
    valueInputOption: 'RAW',
    resource: { values: [row] },
  });
}

module.exports = {
  appendRow,
  appendToCell,
  findOrCreateTodayRow,
  updateTodayRow,
};