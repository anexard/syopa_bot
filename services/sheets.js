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

async function findOrCreateTodayRow(sheetName) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!A:A`,
  });

  const rows = res.data.values || [];

  // ищем строку, где дата в A начинается с 'YYYY-MM-DD'
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) { // i = 1, чтобы пропустить заголовок "Date"
    const cell = (rows[i][0] || '').toString();
    if (cell.slice(0, 10) === today) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex !== -1) {
    // нашли существующую строку (i — 0-based -> +1 для номера строки)
    return rowIndex + 1;
  }

  // строки на сегодня нет — создаём новую
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: 'RAW',
    resource: { values: [[today]] },
  });

  return rows.length + 1; // новая строка внизу
}

module.exports = {
  appendRow,
  appendToCell,
  findOrCreateTodayRow,
};