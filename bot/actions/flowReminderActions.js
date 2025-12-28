const schedule = require('node-schedule');
const { sendReminder } = require('../reminders/sendReminder');
const { startFlow, userState } = require('../dialogs/dialogManager');

function registerFlowReminderActions(bot) {
  // ▶️ Начать флоу
  bot.action(/^flow:start:(.+)$/, async (ctx) => {
    const flowName = ctx.match[1];
    const id = ctx.from.id;

    await ctx.answerCbQuery();

    const state = userState[id];

    if (state?.guide) {
      return ctx.reply('Закрой гайд, чтобы начать занятие 📚');
    }

    if (state?.flow) {
      return ctx.reply('У тебя уже идёт занятие. Заверши его или отмени.');
    }

    return startFlow(ctx, flowName);
  });

  // ⏭️ Отложить
  bot.action(/^flow:snooze:(.+):(\d+)$/, async (ctx) => {
    const flowName = ctx.match[1];
    const minutes = Number(ctx.match[2]);
    const chatId = ctx.chat.id;

    await ctx.answerCbQuery(`Ок, напомню через ${minutes} мин`);

    const when = new Date(Date.now() + minutes * 60 * 1000);

    schedule.scheduleJob(when, () => {
      sendReminder(
        bot,
        chatId,
        flowName,
        `⏰ Напоминание: пора сделать ${flowName.toUpperCase()}`
      );
    });
  });

  // ❌ Пропустить
  bot.action(/^flow:skip:(.+)$/, async (ctx) => {

    await ctx.answerCbQuery('Ок, пропускаем');

    // 1) пробуем убрать кнопки
    const ok = await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
        .then(() => true)
        .catch((e) => {
            return false;
        });

    // 2) если не получилось — хотя бы ответим сообщением
    if (!ok) {
        await ctx.reply('✅ Пропущено');
    }
    });

    bot.action(/^flow:/, async (ctx) => {
        await ctx.answerCbQuery();
    });
}

module.exports = { registerFlowReminderActions };
