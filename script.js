// === ВСТАВЬ СЮДА СВОЙ APPS SCRIPT URL ПОЗЖЕ ===
const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec";

// Получение Telegram User ID
let userId = localStorage.getItem('telegramUserId');
if (!userId) {
  userId = prompt("Введите ваш Telegram User ID:");
  if (userId && /^\d+$/.test(userId)) {
    localStorage.setItem('telegramUserId', userId);
  } else {
    alert("Неверный ID. Обновите страницу.");
    throw new Error("No user ID");
  }
}

// Остальной код будет добавлен позже
