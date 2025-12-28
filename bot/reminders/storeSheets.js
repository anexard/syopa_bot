// bot/reminders/storeSheets.js
const sheetsService = require('../../services/sheets');

const SHEET = 'Reminders';

function parseBool(v) {
  return String(v).toLowerCase() === 'true' || String(v) === '1';
}

function toRow(rem) {
  return [
    rem.id,
    rem.enabled ? 'TRUE' : 'FALSE',
    String(rem.chatId),
    String(rem.userId || ''),
    rem.flowName,
    rem.time,                 // "HH:MM"
    rem.timezone || 'Asia/Tbilisi',
    rem.text || '',
    rem.lastSent || '',
  ];
}

function fromRow(row) {
  return {
    id: String(row[0] || ''),
    enabled: parseBool(row[1] || 'FALSE'),
    chatId: Number(row[2] || 0),
    userId: Number(row[3] || 0) || null,
    flowName: String(row[4] || '').toLowerCase(),
    time: String(row[5] || ''),
    timezone: String(row[6] || 'Asia/Tbilisi'),
    text: String(row[7] || ''),
    lastSent: String(row[8] || ''),
  };
}

// --- API ---

async function listReminders() {
  const rows = await sheetsService.getSheetValues(`${SHEET}!A2:I`);
  return (rows || []).map(fromRow).filter(r => r.id);
}

async function addReminder({ chatId, userId, flowName, time, text, timezone }) {
  const items = await listReminders();
  const maxId = items.reduce((acc, r) => Math.max(acc, Number(r.id) || 0), 0);
  const id = String(maxId + 1);

  const reminder = {
    id,
    enabled: true,
    chatId,
    userId,
    flowName,
    time,
    timezone: timezone || 'Asia/Tbilisi',
    text,
    lastSent: '',
  };

  await sheetsService.appendRawRow(SHEET, toRow(reminder));
  return reminder;
}

async function setEnabled(id, enabled) {
  // находим строку по id и обновляем B (enabled)
  return sheetsService.updateReminderEnabledById(SHEET, id, enabled); // добавим функцию ниже
}

function getTimezone() {
  return 'Asia/Tbilisi';
}

module.exports = {
  listReminders,
  addReminder,
  setEnabled,
  getTimezone,
};
