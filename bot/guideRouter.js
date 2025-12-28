const { listCategories, listByCategory, readGuideBody, reloadCatalog } = require('./guides/repo');
const { renderMdToHtml } = require('./guides/render');

function kbCategories() {
  const cats = listCategories();
  return { inline_keyboard: [
    ...cats.map(c => [{ text: `📁 ${c}`, callback_data: `G:CAT:${c}` }]),
    [{ text: '✖️ Закрыть', callback_data: 'G:CLOSE' }]
  ]};
}

function kbGuides(category) {
  const items = listByCategory(category);
  return { inline_keyboard: [
    ...items.map(g => [{ text: `📄 ${g.title}`, callback_data: `G:OPEN:${g.id}` }]),
    [{ text: '⬅️ Назад', callback_data: 'G:ROOT' }],
  ]};
}

function registerGuide(bot, { userState, flows, captureReturnPoint, resumeFromReturnPoint }) {

  bot.command('guide', async (ctx) => {
    const uid = ctx.from.id;
    const rp = captureReturnPoint(ctx);

    userState[uid] = userState[uid] || {};
    userState[uid].guide = { returnPoint: rp };

    return ctx.reply('📚 Каталог инструкций:', { reply_markup: kbCategories() });
  });

  // (опционально) ручная перезагрузка каталога, удобно при разработке
  bot.command('guide_reload', async (ctx) => {
    reloadCatalog();
    return ctx.reply('Каталог инструкций обновлён 🔄');
  });

  bot.on('callback_query', async (ctx, next) => {
    const data = ctx.callbackQuery?.data;
    
    // если не гайд — пропускаем дальше, чтобы работали flow:* и choice:*
    if (!data || !data.startsWith('G:')) return next();

    const uid = ctx.from.id;
    const canReturn = !!(userState[uid]?.guide?.returnPoint);

    if (data === 'G:ROOT') {
      await ctx.answerCbQuery();
      return ctx.editMessageText('📚 Каталог инструкций:', { reply_markup: kbCategories() });
    }

    if (data.startsWith('G:CAT:')) {
      const category = data.split(':')[2];
      await ctx.answerCbQuery();
      return ctx.editMessageText(`📁 ${category}`, { reply_markup: kbGuides(category) });
    }

    if (data.startsWith('G:OPEN:')) {
      const id = data.slice('G:OPEN:'.length);
      const guide = readGuideBody(id);
      if (!guide) return ctx.answerCbQuery('Не найдено');

      const html = renderMdToHtml(guide.body);

      await ctx.answerCbQuery();
      return ctx.editMessageText(html, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧭 В каталог', callback_data: 'G:ROOT' }],
            ...(canReturn ? [[{ text: '↩️ Вернуться в занятие', callback_data: 'G:RETURN' }]] : []),
            [{ text: '✖️ Закрыть', callback_data: 'G:CLOSE' }],
          ]
        }
      });
    }

    if (data === 'G:RETURN') {
        const uid = ctx.from.id;
        const rp = userState[uid]?.guide?.returnPoint;

        if (!rp || !userState[uid]?.flow) {
          await ctx.answerCbQuery('Занятие уже завершено');
          return;
        }

        await ctx.answerCbQuery();
        userState[uid].guide = null;
        return resumeFromReturnPoint(ctx, rp);
    }

    if (data === 'G:CLOSE') {
      const uid = ctx.from.id;
      await ctx.answerCbQuery();

      // ✅ реально закрываем режим гайда
      if (userState[uid]) userState[uid].guide = null;

      // ✅ если был активный flow — вернём вопрос
      const hasFlow = !!userState[uid]?.flow;
      if (hasFlow) {
        // returnPoint уже может быть null, поэтому берём текущее состояние flow
        const rp = { flow: userState[uid].flow, step: userState[uid].step };
        return resumeFromReturnPoint(ctx, rp);
      }

      // иначе просто убираем сообщение каталога
      return ctx.editMessageText('Закрыто.');
    }
  });
}

module.exports = { registerGuide };
