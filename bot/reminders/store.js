const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, 'store.json');

function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify({ timezone: 'Asia/Tbilisi', reminders: [] }, null, 2),
      'utf8'
    );
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    // если файл сломали руками — откатываемся
    const fallback = { timezone: 'Asia/Tbilisi', reminders: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(reminders) {
  const max = reminders.reduce((acc, r) => Math.max(acc, Number(r.id) || 0), 0);
  return String(max + 1);
}

function listReminders() {
  const store = readStore();
  return store.reminders || [];
}

function addReminder({ chatId, flowName, timeHHMM, text, enabled = true }) {
  const store = readStore();
  const reminders = store.reminders || [];
  const id = nextId(reminders);

  const reminder = {
    id,
    chatId,
    flowName,
    time: timeHHMM, // "HH:MM"
    text,
    enabled,
    createdAt: new Date().toISOString(),
  };

  reminders.push(reminder);
  store.reminders = reminders;
  writeStore(store);

  return reminder;
}

function deleteReminder(id) {
  const store = readStore();
  const reminders = store.reminders || [];
  const idx = reminders.findIndex(r => String(r.id) === String(id));
  if (idx === -1) return null;

  const [removed] = reminders.splice(idx, 1);
  store.reminders = reminders;
  writeStore(store);

  return removed;
}

function getTimezone() {
  const store = readStore();
  return store.timezone || 'Asia/Tbilisi';
}

module.exports = {
  readStore,
  writeStore,
  listReminders,
  addReminder,
  deleteReminder,
  getTimezone,
};
