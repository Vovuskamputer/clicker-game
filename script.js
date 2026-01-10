const API_URL = "https://script.google.com/macros/s/AKfycbzFz77-x2BvbJcxa78kRJfxowzf_YGTcfFiCcelWa9XvmwxNRAVnbcQjRzA8n7lY-q3/exec"; // ← замени на свой!

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

let gameState = null;
let isEnded = false;

function showStatus(msg, duration = 2000) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', duration);
}

async function fetchGameState() {
  try {
    const res = await fetch(`${API_URL}?action=get_game_state&user_id=${userId}&t=${Date.now()}`);
    const data = await res.json();
    gameState = data;
    isEnded = data.is_ended;

    // Применяем настройки
    document.body.style.backgroundColor = data.settings.bg_color || '#f9f9f9';
    document.body.style.color = data.settings.text_color || '#000';

    document.getElementById('game-title').textContent = data.settings.title || 'Кликер';
    document.getElementById('game-desc').textContent = data.settings.description || '';
    document.getElementById('click-btn').textContent = data.settings.button_text || '+1';

    const btn = document.getElementById('click-btn');
    btn.style.backgroundColor = data.settings.btn_color || '#ccc';

    // Показываем игру
    document.getElementById('loading').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    // Обновляем лидеров
    const leadersList = document.getElementById('leaders-list');
    leadersList.innerHTML = data.leaders.map((l, i) =>
      `<div>${i + 1}. ID: ${l.id} — ${l.score}</div>`
    ).join('');

    // Управление состоянием
    if (isEnded) {
      document.getElementById('active-area').style.display = 'none';
      document.getElementById('ended').style.display = 'block';
    } else {
      document.getElementById('active-area').style.display = 'block';
      document.getElementById('ended').style.display = 'none';
    }
  } catch (e) {
    console.error(e);
    showStatus("Ошибка загрузки", 3000);
  }
}

async function handleClick() {
  if (isEnded) return;
  try {
    const res = await fetch(`${API_URL}?action=click&user_id=${userId}`);
    const result = await res.json();
    if (result.success) {
      showStatus("+1 очко!");
      fetchGameState(); // обновить счёт и лидеров
    } else {
      showStatus("Не удалось кликнуть");
    }
  } catch (e) {
    showStatus("Ошибка сети");
  }
}

// Инициализация
document.getElementById('click-btn').onclick = handleClick;
fetchGameState();

// Автообновление каждые 5 секунд (чтобы поймать окончание)
setInterval(() => {
  if (!isEnded) fetchGameState();
}, 5000);
