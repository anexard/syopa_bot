const fields = [
  { key: 'method',       question: 'Метод' },
  { key: 'location',       question: 'Локация' },
  { key: 'trigger',       question: 'Триггер' },
  { key: 'triggerDur',       question: 'Дистанция до триггера' },
  { key: 'syopaChoice',       question: 'Выбор Сёпы' },
  { key: 'handlerInfl',       question: 'Хозяин собаки' },
  { key: 'explosions',       question: 'Взрыв' },
  { key: 'arousalPeak',       question: 'Максимум возбуждения (1-5)' },
  { key: 'RecovTime',       question: 'Время восстановления' },
  { 
    key: 'result', 
    question: 'Результат занятия', 
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
  name: 'bat',
  sheetName: 'bat!A:Z',      // или 'CU!A1', главное — верный таб

  // порядок столбцов в таблице
  columns: [
    'timestamp',   // добавим автоматически
    'location',
    'trigger',
    'triggerDur',
    'syopaChoice',
    'handlerInfl',
    'explosions',
    'arousalPeak',
    'RecovTime',
    'result',
    'comment'
  ],

  fields,                       // массив объектов
  questions: fields.map(f => f.question) // пригодится, если где-то нужно только тексты
};