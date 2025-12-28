function reminderKeyboard(flowName) {
  return {
    inline_keyboard: [
      [
        {
          text: `▶️ Начать ${flowName.toUpperCase()}`,
          callback_data: `flow:start:${flowName}`,
        },
      ],
      [
        {
          text: '⏭️ Отложить 10 мин',
          callback_data: `flow:snooze:${flowName}:10`,
        },
        {
          text: '❌ Пропустить',
          callback_data: `flow:skip:${flowName}`,
        },
      ],
    ],
  };
}

async function sendReminder(bot, chatId, flowName, text) {
  return bot.telegram.sendMessage(chatId, text, {
    reply_markup: reminderKeyboard(flowName),
  });
}

module.exports = { sendReminder };
