// bot/dialogs/dialogManager.js
const flows = {
  cu: require('./flows/cuFlow'),
  bat: require('./flows/batFlow'),
  relax: require('./flows/relaxFlow'),
  day: require('./flows/dayFlow'),    // если есть
  walk: require('./flows/walkFlow'),  // 👈 новый
};

const userState = {};

function startFlow(ctx, flowName) {
  const flow = flows[flowName];
  if (!flow) return ctx.reply('No such flow');

  userState[ctx.from.id] = {
    flow: flowName,
    step: 0,
    answers: {},
  };

  askNext(ctx, flow, 0);
}

function askNext(ctx, flow, step) {
  const field = flow.fields[step];

  // Если это выбор из вариантов — рисуем кнопки
  if (field.type === 'choice' && field.options) {
    return ctx.reply(field.question, {
      reply_markup: {
        inline_keyboard: [
          field.options.map(o => ({
            text: o.label,
            callback_data: `choice:${o.value}`, // сюда вернётся value
          })),
        ],
      },
    });
  }

  // Обычный текстовый вопрос
  return ctx.reply(field.question);
}

async function handleMessage(ctx) {
  const id = ctx.from.id;
  const state = userState[id];
  if (!state) return;

  const flow = flows[state.flow];
  const field = flow.fields[state.step];

  // если сейчас ожидаем выбор кнопки, текст лучше не принимать
  if (field.type === 'choice') {
    return ctx.reply('tap a button');
  }

  state.answers[field.key] = ctx.message.text;
  await nextStep(ctx, state, flow);
}

// обработка callback_query от inline-кнопок
async function handleCallback(ctx) {
  const id = ctx.from.id;
  const state = userState[id];
  if (!state) {
    await ctx.answerCbQuery();
    return;
  }

  const flow = flows[state.flow];
  const field = flow.fields[state.step];

  const data = ctx.callbackQuery.data;      // "choice:red"
  const [type, value] = data.split(':');

  if (field.type === 'choice' && type === 'choice') {
    state.answers[field.key] = value;      // 'red' | 'yellow' | 'green'
    await nextStep(ctx, state, flow);
  }

  await ctx.answerCbQuery();               // убираем "часики" у кнопки
}

const sheetsService = require('../../services/sheets');

async function nextStep(ctx, state, flow) {
  state.step++;

  if (state.step < flow.fields.length) {
    return askNext(ctx, flow, state.step);
  }

  // все вопросы заданы → решаем, как сохранять
  if (flow.mode === 'appendToCell') {
    const a = state.answers;
    const line = `${a.time} — ${a.duration} (поводок: ${a.leashPull}/5, возб.: ${a.walkArousals}/5)`;

    const row = await sheetsService.findOrCreateTodayRow(flow.sheetName);
    const cell = `B${row}`; // колонка walk

    await sheetsService.appendToCell(flow.sheetName, cell, line);
    ctx.reply('Прогулка записана 🐾');
  } else if (flow.mode === 'updateTodayRow') {
    await sheetsService.updateTodayRow(flow, state.answers);
    ctx.reply('День записан ✅');
  } else {
    await sheetsService.appendRow(flow, state.answers);
    ctx.reply('Готово, всё записал 👍');
  }

  delete userState[ctx.from.id];
}

function cancelFlow(ctx) {
  delete userState[ctx.from.id];
  ctx.reply('canceled');
}

module.exports = {
  startFlow,
  handleMessage,
  handleCallback,
  cancelFlow,
};