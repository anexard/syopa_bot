const fields = [
  { key: 'leashPull',       question: 'Частота нападений на поводок' },
  { 
    key: 'walkArousals', 
    question: 'Возбуждение на прогулке', 
    type: 'choice',
    options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Зеленый', value: 'green' },
    ]
  },
  { 
    key: 'homeArousals', 
    question: 'Возбуждение дома', 
    type: 'choice',
    options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Зеленый', value: 'green' },
    ]
  },
  { 
    key: 'evening', 
    question: 'Состояние вечером', 
    type: 'choice',
    options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Зеленый', value: 'green' },
    ]
  },
  { key: 'feeding',       question: 'Время кормления' },
  { key: 'dayContext',       question: 'Контекст дня' },
  { key: 'health',       question: 'Нюансы по здоровью' },
  { 
    key: 'result', 
    question: 'Результат дня', 
    type: 'choice',
    options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Зеленый', value: 'green' },
    ]
  },
  { key: 'comment',       question: 'Комментарий' },
];

module.exports = {
  name: 'day',
  sheetName: 'day!A:Z',      // или 'CU!A1', главное — верный таб

  // порядок столбцов в таблице
  columns: [
    'timestamp',
    'walks',
    'leashPull',
    'walkArousals',
    'homeArousals',
    'evening',
    'feeding',
    'dayContext',
    'health',
    'result',
    'comment',
  ],

  fields,                       // массив объектов
  questions: fields.map(f => f.question) // пригодится, если где-то нужно только тексты
};