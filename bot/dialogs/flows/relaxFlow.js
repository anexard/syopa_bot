const fields = [
  { key: 'step',       question: 'Этап' },
  { key: 'location',       question: 'Локация' },
  { key: 'duration',       question: 'Длительность' },
  { key: 'arousals',       question: 'Arousal-recoveries: start, end, duration (minutes)' },
  { 
    key: 'rewardDensity', 
    question: 'Reward Density: насколько еда держит состояние?', 
    type: 'choice',
    options: [
      { label: 'Frequent', value: 'red' },
      { label: 'Medium', value: 'yellow' },
      { label: 'Rare', value: 'green' },
      { label: 'not today', value: '-' },
    ]
  },
  { 
    key: 'environment_load', 
    question: 'Нагрузка среды', 
    type: 'choice',
    options: [
      { label: 'High: собаки, люди, звуки', value: 'red' },
      { label: 'Medium: просто прошли, просто фон', value: 'yellow' },
      { label: 'Low: очень спокойно', value: 'green' },
      { label: 'None', value: '-' },
    ]
  },
  { 
    key: 'orientation', 
    question: 'Направление фокуса', 
    type: 'choice',
    options: [
      { label: 'Environment: смотрел вокруг', value: 'Environment, green' },
      { label: 'Handler: больше смотрел на меня', value: 'Handler, yellow' },
      { label: 'Mixed', value: 'Mixed, lime' },
      { label: 'None', value: '-' },
    ]
  },
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
    key: 'end_state', 
    question: 'Состояние в конце', 
    type: 'choice',
    options: [
      { label: '🟥 Break', value: 'red' },
      { label: '🟧 Seeking (ожидает еду/меня)', value: 'orange' },
      { label: '🟨 Mild arousal', value: 'yellow' },
      { label: '🟩 Neutral (lime)', value: 'lime' },
      { label: '🟩 Soft (green)', value: 'green' },
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
  { key: 'difficultSteps',       question: 'Тяжелое упражнение' },
  { key: 'comment',       question: 'Комментарий' },
];

module.exports = {
  name: 'relax',
  sheetName: 'relax',
  useDate: false,

  // порядок столбцов в таблице
  columns: [
    'timestamp',   // добавим автоматически
    'step',
    'location',
    'duration',
    'arousals',
    'rewardDensity',
    'environment_load',
    'orientation',
    'overallEase',
    'end_state',
    'result',
    'difficultSteps',
    'comment'
  ],

  fields,                       // массив объектов
  questions: fields.map(f => f.question) // пригодится, если где-то нужно только тексты
};