const fields = [
  { key: 'stage',       question: 'Этап' },
  { key: 'location',       question: 'Локация' },
  { key: 'duration',       question: 'Длительность' },
  { key: 'arousalStart',       question: 'Начало возбуждения (минута)' },
  { key: 'arousalEnd',       question: 'Конец возбуждения (минута)' },
  { key: 'difficultSteps',       question: 'Тяжелое упражнение' },
  { key: 'recoveries',       question: 'Восстановления' },
  { 
    key: 'overallEase', 
    question: 'Уровень общего возбуждения', 
    type: 'choice',
    options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟧 Оранжевый', value: 'orange' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Лаймовый', value: 'lime' },
      { label: '🟩 Зеленый', value: 'green' },
    ]
  },
  { 
    key: 'result', 
    question: 'Результат занятия', 
    type: 'choice',
    options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟧 Оранжевый', value: 'orange' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Лаймовый', value: 'lime' },
      { label: '🟩 Зеленый', value: 'green' },
    ]
  },
  { key: 'comment',       question: 'Комментарий' },
];

module.exports = {
  name: 'relax',
  sheetName: 'relax',
  useDate: false,

  // порядок столбцов в таблице
  columns: [
    'timestamp',   // добавим автоматически
    'location',
    'duration',
    'arousalStart',
    'arousalEnd',
    'difficultSteps',
    'recoveries',
    'overallEase',
    'RecovTime',
    'result',
    'comment'
  ],

  fields,                       // массив объектов
  questions: fields.map(f => f.question) // пригодится, если где-то нужно только тексты
};