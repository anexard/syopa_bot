require('dotenv').config();
const bot = require('./bot/bot');

bot.launch();
console.log('Bot started');