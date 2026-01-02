// bot/dialogs/flows/walkFlow.js

const fields = [
  {
    key: 'walk_slot',
    question: 'Какая по счёту прогулка?',
    type: 'choice',
    options: [
      { label: '1', value: '1' },
      { label: '3', value: '3' },
    ],
  },

  { key: 'time',         question: 'В который час и длительность (tt:tt - m)', type: 'text' },
  { 
    key: 'leash', 
    question: 'Нападения на поводок', 
    type: 'choice',
    options: [
      { label: '🟥 Уничтожал поводок', value: 'red' },
      { label: '🟧 Атаковал 1-3 раза и играл с ним', value: 'orange' },
      { label: '🟨 Прикусил', value: 'yellow' },
      { label: '🟩 Заинтересовался', value: 'lime' },
      { label: '🟩 Не нападал', value: 'green' },
    ]
  },
  { key: 'arousal', question: 'Возбуждение на прогулке', type: 'text' },
  { key: 'notes', question: 'Коротко: что важного?', type: 'text' },
];

module.exports = {
  name: 'walk',
  mode: 'updateWalkSlot',  // новый режим
  sheetName: 'day',
  useDate: true,
  fields,
};
