const cron = require('node-cron');
const { sendReminder } = require('./sendReminder');
const store = require('./storeSheets');

const jobs = new Map(); // id -> cronTask

function timeToCron(timeHHMM) {
  // "12:30" -> "30 12 * * *"
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeHHMM);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${mm} ${hh} * * *`;
}

function scheduleOne(bot, reminder) {
  const tz = reminder.timezone || store.getTimezone();
  const cronExpr = timeToCron(reminder.time);
  if (!cronExpr) return null;
  if (!reminder.enabled) return null;

  // если уже был job — уберём
  unscheduleOne(reminder.id);

  const task = cron.schedule(
    cronExpr,
    () => {
      if (reminder.flowName === 'text') {
        // ✅ текстовая напоминалка без кнопок
        bot.telegram.sendMessage(reminder.chatId, reminder.text);
        return;
      }

      sendReminder(bot, reminder.chatId, reminder.flowName, reminder.text);
    },
    { timezone: tz }
  );

  jobs.set(String(reminder.id), task);
  return task;
}

function unscheduleOne(id) {
  const key = String(id);
  const task = jobs.get(key);
  if (task) {
    task.stop();
    jobs.delete(key);
    return true;
  }
  return false;
}

async function rescheduleAll(bot) {
  // stop old jobs...
  const reminders = await store.listReminders();
  reminders.forEach(r => scheduleOne(bot, r));
  return reminders.length;
}

module.exports = {
  timeToCron,
  scheduleOne,
  unscheduleOne,
  rescheduleAll,
};
