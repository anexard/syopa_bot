// bot/dialogs/flows/dayFlow.js
const fields = [
  {
    key: "homeArousals",
    question: "Возбуждение дома",
    type: "choice",
    options: [
      { label: "🟥 Красный", value: "red" },
      { label: "🟧 Оранжевый", value: "orange" },
      { label: "🟨 Желтый", value: "yellow" },
      { label: "🟩 Лаймовый", value: "lime" },
      { label: "🟩 Зеленый", value: "green" },
    ],
  },
  {
    key: "evening",
    question: "Состояние вечером",
    type: "choice",
    options: [
      { label: "🟥 Красный", value: "red" },
      { label: "🟧 Оранжевый", value: "orange" },
      { label: "🟨 Желтый", value: "yellow" },
      { label: "🟩 Лаймовый", value: "lime" },
      { label: "🟩 Зеленый", value: "green" },
    ],
  },
  { key: "feeding", question: "Время кормления" },
  { key: "dayContext", question: "Контекст дня" },
  { key: "health", question: "Нюансы по здоровью" },
  {
    key: "result",
    question: "Результат дня",
    type: "choice",
    options: [
      { label: "🟥 Красный", value: "red" },
      { label: "🟧 Оранжевый", value: "orange" },
      { label: "🟨 Желтый", value: "yellow" },
      { label: "🟩 Лаймовый", value: "lime" },
      { label: "🟩 Зеленый", value: "green" },
    ],
  },
  {
    key: "everyday_practices",
    question: "Ежедневные практики",
    type: "multi_choice",
    options: [
      { label: "Long sit", value: "long sit" },
      { label: "Targeting", value: "targeting" },
      { label: "Alone sit", value: "sit alone" },
    ],
  },
  {
    key: "attention_requests",
    question: "Просьбы внимания",
    type: "choice",
    options: [
      { label: "High: 5+", value: "red" },
      { label: "Medium: 3-4", value: "yellow" },
      { label: "Low: 1-2", value: "green" },
      { label: "None", value: "gray" },
    ],
  },
  { key: "comment", question: "Комментарий" },
  {
    key: "behavior",
    question: "Поведение",
    type: "choice",
    options: [
      { label: "🟨 Желтый", value: "yellow" },
      { label: "🟩 Зеленый", value: "green" },
    ],
  },
];

module.exports = {
  name: "day",
  sheetName: "day", // без диапазона, только имя листа
  mode: "updateTodayRow", // специальный режим для дневной строки
  startColumn: "M", // с какой колонки писать (A=Date, B=walk)
  useDate: true,

  columns: [
    "homeArousals",
    "evening",
    "feeding",
    "dayContext",
    "health",
    "result",
    "everyday_practices",
    "attention_requests",
    "comment",
    "behavior",
  ],

  fields,
};
