const { Telegraf } = require('telegraf');
const config = require('../config/config');
const router = require('./router');
const dialogManager = require('./dialogs/dialogManager');

const { registerFlowReminderActions } = require('./actions/flowReminderActions');
const schedule = require('node-schedule');
const { initReminders } = require('./reminders/scheduler');

const bot = new Telegraf(config.botToken);

let TEST_CHAT_ID = null;

bot.start((ctx) => {
    TEST_CHAT_ID = ctx.chat.id;
    ctx.reply('Hello! chatId is saved for test')
});

router(bot);

// регистрируем обработчики кнопок
registerFlowReminderActions(bot);
console.log('[init] flowReminderActions registered');
initReminders(bot);

bot.on('text', (ctx) => dialogManager.handleMessage(ctx));
bot.on('callback_query', async (ctx, next) => {
  const data = ctx.callbackQuery?.data || '';

  // ✅ dialogManager обслуживает choice + date
  if (data.startsWith('choice:') || data.startsWith('date:')) {
    await dialogManager.handleCallback(ctx);
    return;
  }

  return next();
});

bot.catch((err, ctx) => {
  console.error('Bot error', err);
});

module.exports = bot;