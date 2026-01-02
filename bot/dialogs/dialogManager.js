// bot/dialogs/dialogManager.js
const flows = {
  cu: require('./flows/cuFlow'),
  bat: require('./flows/batFlow'),
  relax: require('./flows/relaxFlow'),
  day: require('./flows/dayFlow'),
  walk: require('./flows/walkFlow'),
};

const userState = {};

const sheetsService = require('../../services/sheets');

// ---------- Date helpers ----------
const BOT_TZ = 'Asia/Tbilisi';

function formatISODateInTZ(date = new Date(), timeZone = BOT_TZ) {
  // en-CA даёт YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function parseUserDate(input) {
  if (!input) return null;
  const s = String(input).trim();

  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // DD.MM or DD.MM.YYYY
  m = s.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2}|\d{4}))?$/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');

    let yyyy;
    if (!m[3]) {
      // если год не указан — берём текущий (в TZ)
      yyyy = formatISODateInTZ().slice(0, 4);
    } else {
      yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
    }
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

function askDate(ctx) {
  return ctx.reply('На какую дату записать?', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Сегодня', callback_data: 'date:today' },
          { text: 'Вчера', callback_data: 'date:yesterday' },
        ],
        [{ text: 'Другая дата…', callback_data: 'date:custom' }],
      ],
    },
  });
}

// ---------- Flow core ----------
function startFlow(ctx, flowName) {
  const flow = flows[flowName];
  if (!flow) return ctx.reply('No such flow');

  userState[ctx.from.id] = {
    flow: flowName,
    step: 0,
    answers: {},
    targetDate: formatISODateInTZ(), // default: today (Tbilisi)
    awaitingDateChoice: true,
    awaitingDateText: false,
  };

  // если нужно отключать дату для каких-то flow — можно поставить flow.useDate = false
  if (flow.useDate === false) {
    userState[ctx.from.id].awaitingDateChoice = false;
    return askNext(ctx, flow, 0);
  }

  return askDate(ctx);
}

function askNext(ctx, flow, step) {
  const field = flow.fields[step];

  // ✅ multi_choice
  if (field.type === 'multi_choice' && field.options) {
    const uid = ctx.from.id;
    const state = userState[uid];

    // гарантируем массив
    const selected = Array.isArray(state.answers[field.key])
      ? state.answers[field.key]
      : (state.answers[field.key] = []);

    return ctx.reply(field.question, {
      reply_markup: buildMultiChoiceKeyboard(field, selected),
    });
  }

  if (field.type === 'choice' && field.options) {
    return ctx.reply(field.question, {
      reply_markup: {
        inline_keyboard: [
          field.options.map(o => ({
            text: o.label,
            callback_data: `choice:${o.value}`,
          })),
        ],
      },
    });
  }

  return ctx.reply(field.question);
}

async function handleMessage(ctx) {
  const id = ctx.from.id;
  const state = userState[id];
  if (!state) return;

  if (state.awaitingDateText) {
    const parsed = parseUserDate(ctx.message.text);
    if (!parsed) {
      return ctx.reply(
        'Не понял дату 😅\nФорматы: 2025-11-23 или 23.11 или 23.11.2025'
      );
    }

    state.targetDate = parsed;
    state.awaitingDateText = false;

    const flow = flows[state.flow];
    return askNext(ctx, flow, state.step);
  }

  // если ждём ввод даты текстом
  if (state.awaitingDateText) {
    const parsed = parseUserDate(ctx.message.text);
    if (!parsed) {
      return ctx.reply('Не понял дату 😅\nФорматы: 2025-12-28 или 28.12 или 28.12.2025');
    }
    state.targetDate = parsed;
    state.awaitingDateText = false;
    state.awaitingDateChoice = false;
    const flow = flows[state.flow];
    return askNext(ctx, flow, state.step);
  }

  if (state.guide) {
    if (!state.guide.warned) {
      state.guide.warned = true;
      return ctx.reply('Сейчас открыт каталог инструкций 📚\nЗакрой его или нажми “↩️ Вернуться в занятие”.');
    }
    return;
  }

  const flow = flows[state.flow];
  const field = flow.fields[state.step];

  if (field.type === 'choice') {
    return ctx.reply('tap a button');
  }

  state.answers[field.key] = ctx.message.text;
  await nextStep(ctx, state, flow);
}

async function handleCallback(ctx) {
  const data = ctx.callbackQuery?.data || '';

  const id = ctx.from.id;
  const state = userState[id];
  if (!state) {
    await ctx.answerCbQuery();
    return;
  }

  const flow = flows[state.flow];
  const field = flow.fields[state.step];

  // 1) дата
  if (data.startsWith('date:')) {
    const id = ctx.from.id;
    const state = userState[id];
    if (!state) {
      await ctx.answerCbQuery();
      return;
    }

    const cmd = data.split(':')[1];
    if (cmd === 'today') {
      state.targetDate = formatISODateInTZ();
      state.awaitingDateChoice = false;
      const flow = flows[state.flow];
      await askNext(ctx, flow, state.step);
    } else if (cmd === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      state.targetDate = formatISODateInTZ(d);
      state.awaitingDateChoice = false;
      const flow = flows[state.flow];
      await askNext(ctx, flow, state.step);
    } else if (cmd === 'custom') {
      state.awaitingDateText = true;
      state.awaitingDateChoice = false;

      // сначала ответ в чат
      await ctx.reply(
        'Введи дату:\n2025-12-28 или 28.12 или 28.12.2025'
      );

      // потом закрываем callback
      await ctx.answerCbQuery();

      return;
    }

    await ctx.answerCbQuery();
    return;
  }

  if (!flow || !field) {
    await ctx.answerCbQuery();
    return;
  }

  // 2) multi_choice: toggle
  if (data.startsWith('mc:')) {
    const [, key, idxStr] = data.split(':'); // mc:<fieldKey>:<index>
    if (field.type !== 'multi_choice' || field.key !== key) {
      await ctx.answerCbQuery();
      return;
    }

    const idx = Number(idxStr);
    const opt = field.options?.[idx];
    if (!opt) {
      await ctx.answerCbQuery();
      return;
    }

    const value = opt.value;

    const arr = Array.isArray(state.answers[key])
      ? state.answers[key]
      : (state.answers[key] = []);

    const pos = arr.indexOf(value);
    if (pos === -1) arr.push(value);
    else arr.splice(pos, 1);

    await ctx.editMessageReplyMarkup(buildMultiChoiceKeyboard(field, arr));
    await ctx.answerCbQuery();
    return;
  }

  // 3) multi_choice: done
  if (data.startsWith('mc_done:')) {
    const [, key] = data.split(':'); // mc_done:<fieldKey>
    if (field.type !== 'multi_choice' || field.key !== key) {
      await ctx.answerCbQuery();
      return;
    }

    await ctx.answerCbQuery('Ок!');
    await nextStep(ctx, state, flow);
    return;
  }

  // 2) choice-кнопки
  if (!data.startsWith('choice:')) {
    await ctx.answerCbQuery();
    return;
  }

  const [, value] = data.split(':');

  if (field.type === 'choice') {
    state.answers[field.key] = value;
    await nextStep(ctx, state, flow);
  }

  await ctx.answerCbQuery();
}

async function nextStep(ctx, state, flow) {
  state.step++;

  if (state.step < flow.fields.length) {
    return askNext(ctx, flow, state.step);
  }

  // -------- save --------
  const date = state.targetDate; // YYYY-MM-DD

  if (flow.mode === 'appendToCell') {
    const a = state.answers;
    const line = `${a.time} — ${a.duration} (поводок: ${a.leashPull}/5, возб.: ${a.walkArousals}/5)`;

    const row = await sheetsService.findOrInsertRowByDate(flow.sheetName, date);
    const cell = `B${row}`;

    await sheetsService.appendToCell(flow.sheetName, cell, line);
    ctx.reply(`Прогулка записана 🐾 (${date})`);
  } else if (flow.mode === 'updateTodayRow') {
    await sheetsService.updateRowByDate(flow, state.answers, date);
    ctx.reply(`День записан ✅ (${date})`);
  } else {
    await sheetsService.appendRow(flow, { ...state.answers, date });
    ctx.reply('Готово, всё записал 👍');
  }

  delete userState[ctx.from.id];
}

function cancelFlow(ctx) {
  delete userState[ctx.from.id];
  ctx.reply('canceled');
}

function captureReturnPoint(ctx) {
  const s = userState[ctx.from.id];
  if (!s || !s.flow) return null;
  return { flow: s.flow, step: s.step };
}

function resumeFromReturnPoint(ctx, rp) {
  if (!rp) return ctx.reply('Не к чему возвращаться.');

  const flow = flows[rp.flow];
  if (!flow) return ctx.reply('Flow не найден.');

  userState[ctx.from.id] = userState[ctx.from.id] || {};
  userState[ctx.from.id].flow = rp.flow;
  userState[ctx.from.id].step = rp.step;
  userState[ctx.from.id].answers = userState[ctx.from.id].answers || {};
  // дату не трогаем: если юзер возобновляет — оставим текущую в state.targetDate

  return askNext(ctx, flow, rp.step);
}

function buildMultiChoiceKeyboard(field, selected = []) {
  const set = new Set(selected);

  const inline_keyboard = field.options.map((opt, i) => {
    const isOn = set.has(opt.value);
    const text = `${isOn ? '✅' : '⬜'} ${opt.label}`;
    // ✅ вместо value кладём индекс i
    return [{ text, callback_data: `mc:${field.key}:${i}` }];
  });

  inline_keyboard.push([{ text: 'Готово', callback_data: `mc_done:${field.key}` }]);

  return { inline_keyboard };
}

module.exports = {
  flows,
  userState,
  startFlow,
  handleMessage,
  handleCallback,
  cancelFlow,
  captureReturnPoint,
  resumeFromReturnPoint,
};
