const dialogManager = require('./dialogs/dialogManager');
const { registerGuide } = require('./guideRouter');
const remStore = require('./reminders/storeSheets');
const registry = require('./reminders/registry');

module.exports = function(bot) {
    bot.command('day', (ctx) => dialogManager.startFlow(ctx, 'day'));
    bot.command('walk', (ctx) => dialogManager.startFlow(ctx, 'walk'));
    bot.command('cu', (ctx) => { dialogManager.startFlow(ctx, 'cu'); });
    bot.command('bat', (ctx) => { dialogManager.startFlow(ctx, 'bat'); });
    bot.command('relax', (ctx) => { dialogManager.startFlow(ctx, 'relax'); });

    bot.command('help', (ctx) => {
        ctx.reply(
        `Доступные команды:
        /day — запись результатов дня
        /walk — Прогулки
        /cu — запись тренировки CU
        /bat — запись BAT 2.0
        /relax — запись Relax Protocol
        /cancel — отменить текущий диалог`
        );
    });

    bot.command('remind', async (ctx) => {
        const msg = (ctx.message?.text || '').trim();

        const flows = dialogManager.flows; // у тебя экспортируется
        const availableFlows = Object.keys(flows);

        const isValidFlow = (name) => Boolean(flows[name]);

        const parseAddArgs = (text) => {
            // /remind add cu 12:30 Текст...
            const m = text.match(/^\/remind\s+add\s+(\w+)\s+(\d{1,2}:\d{2})\s+(.+)$/i);
            if (!m) return null;
            return {
            flowName: m[1].toLowerCase(),
            time: m[2],
            text: m[3].replace(/^"(.*)"$/, '$1').trim(),
            };
        };

        // list (или просто /remind)
        if (msg === '/remind' || /^\/remind\s+list/i.test(msg)) {
            const all = await remStore.listReminders();
            const items = all.filter(r => Number(r.chatId) === Number(ctx.chat.id));

            if (items.length === 0) {
                return ctx.reply(
                'Напоминалок нет.\n\n' +
                'Добавить:\n/remind add cu 12:30 CU 5–7 минут\n\n' +
                'Список:\n/remind list\n\n' +
                'Удалить:\n/remind del 3'
                );
            }

            const lines = items.map(r => {
                const status = r.enabled ? '✅' : '⛔';
                // r.time и r.flowName — как в storeSheets
                return `#${r.id} ${status} ${r.time} — ${r.flowName} — ${r.text}`;
            });

            return ctx.reply(lines.join('\n'));
            }

        // del
        if (/^\/remind\s+del\s+/i.test(msg)) {
            const m = msg.match(/^\/remind\s+del\s+(\d+)/i);
            if (!m) return ctx.reply('Формат: /remind del 3');

            const id = m[1];

            const ok = await remStore.setEnabled(id, false);
            if (!ok) return ctx.reply(`Не нашёл напоминалку #${id}`);

            registry.unscheduleOne(id);
            return ctx.reply(`🗑 Отключил #${id}`);
            }

        // add
        if (/^\/remind\s+add\s+/i.test(msg)) {
            const parsed = parseAddArgs(msg);
            if (!parsed) {
                return ctx.reply(
                'Формат:\n' +
                '/remind add cu 12:30 CU 5–7 минут\n\n' +
                `Доступные flows: ${availableFlows.join(', ')}`
                );
            }

            const isTextReminder = parsed.flowName === 'text';

            if (!isTextReminder && !isValidFlow(parsed.flowName)) {
                return ctx.reply(
                    `Неизвестный flow: ${parsed.flowName}\n` +
                    `Доступные flows: ${availableFlows.join(', ')}\n` +
                    `Или используй "text" для обычного напоминания.`
                );
            }

            const reminder = await remStore.addReminder({
                chatId: ctx.chat.id,
                userId: ctx.from.id,
                flowName: parsed.flowName,
                time: parsed.time,
                text: parsed.text,
                timezone: 'Asia/Tbilisi',
            });

            registry.scheduleOne(bot, reminder);

            return ctx.reply(
                `✅ Создано #${reminder.id}\n` +
                `${reminder.time} каждый день — ${reminder.flowName}\n` +
                `${reminder.text}`
            );
            }

        // help
        return ctx.reply(
            'Команды напоминалок:\n' +
            '/remind add cu 12:30 CU 5–7 минут\n' +
            '/remind list\n' +
            '/remind del 3'
        );
    });

    // Instructions catalogue
    registerGuide(bot, {
        userState: dialogManager.userState,
        captureReturnPoint: dialogManager.captureReturnPoint,
        resumeFromReturnPoint: dialogManager.resumeFromReturnPoint,
    });

    bot.command('cancel', (ctx) => {
        dialogManager.cancelFlow(ctx);
    });
}