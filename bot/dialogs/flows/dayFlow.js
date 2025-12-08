// bot/dialogs/flows/dayFlow.js
const fields = [
  { key: 'walkArousals',  question: 'Возбуждение на прогулке',  type: 'choice', options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟧 Оранжевый', value: 'orange' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Лаймовый', value: 'lime' },
      { label: '🟩 Зеленый', value: 'green' },
    ], },
  { key: 'homeArousals',  question: 'Возбуждение дома',         type: 'choice', options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟧 Оранжевый', value: 'orange' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Лаймовый', value: 'lime' },
      { label: '🟩 Зеленый', value: 'green' },
    ], },
  { key: 'evening',       question: 'Состояние вечером',        type: 'choice', options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟧 Оранжевый', value: 'orange' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Лаймовый', value: 'lime' },
      { label: '🟩 Зеленый', value: 'green' },
    ], },
  { key: 'feeding',       question: 'Время кормления' },
  { key: 'dayContext',    question: 'Контекст дня' },
  { key: 'health',        question: 'Нюансы по здоровью' },
  { key: 'result',        question: 'Результат дня',            type: 'choice', options: [
      { label: '🟥 Красный', value: 'red' },
      { label: '🟧 Оранжевый', value: 'orange' },
      { label: '🟨 Желтый', value: 'yellow' },
      { label: '🟩 Лаймовый', value: 'lime' },
      { label: '🟩 Зеленый', value: 'green' },
    ], },
  { key: 'comment',       question: 'Комментарий' },
];

module.exports = {
  name: 'day',
  sheetName: 'day',             // без диапазона, только имя листа
  mode: 'updateTodayRow',       // 👈 специальный режим для дневной строки
  startColumn: 'C',             // с какой колонки писать (A=Date, B=walk)

  columns: [
    'walkArousals',
    'homeArousals',
    'evening',
    'feeding',
    'dayContext',
    'health',
    'result',
    'comment',
  ],

  fields,
};
