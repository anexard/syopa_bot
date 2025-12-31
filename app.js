require('dotenv').config();

const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const bot = require('./bot/bot');
async function start() {
  while (true) {
    try {
      await bot.launch();
      console.log('✅ Bot started');
      break;
    } catch (err) {
      console.error('❌ Bot launch failed:', err.code || err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

start();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));