const { Telegraf } = require('telegraf');
const config = require('../config/config');
const router = require('./router');
const dialogManager = require('./dialogs/dialogManager');

const bot = new Telegraf(config.botToken);

bot.start((ctx) => ctx.reply('Hello'));

router(bot);

bot.on('text', (ctx) => dialogManager.handleMessage(ctx));
bot.on('callback_query', (ctx) => dialogManager.handleCallback(ctx));

module.exports = bot;