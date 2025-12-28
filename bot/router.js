const dialogManager = require('./dialogs/dialogManager');
const { registerGuide } = require('./guideRouter');

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