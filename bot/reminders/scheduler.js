const registry = require('./registry');

function initReminders(bot) {
  return registry.rescheduleAll(bot);
}

module.exports = { initReminders };