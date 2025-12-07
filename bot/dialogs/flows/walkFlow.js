// bot/dialogs/flows/walkFlow.js

const fields = [
  { key: 'time',         question: 'Во сколько была прогулка?', type: 'text' },
  { key: 'duration',     question: 'Сколько длилась прогулка?', type: 'text' },
  { key: 'leashPull',    question: 'Нападения на поводок (0–5)?', type: 'text' },
  { key: 'walkArousals', question: 'Возбуждение на прогулке (0–5)?', type: 'text' },
];

module.exports = {
  name: 'walk',
  mode: 'appendToCell',            // пометим, что это спец-флоу
  sheetName: 'day',                // вкладка
  cell: 'B2',                      // ячейка, куда пишем все прогулки за день
  fields,
};
