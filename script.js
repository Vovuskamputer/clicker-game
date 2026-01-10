// === КОНФИГ ===
const DB_URL = 'https://strrent-game-bot-default-rtdb.firebaseio.com';
const ADMIN_ID = '1021907470';

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let userId = null;
let username = 'Player';
let score = 0;

// === ИНИЦИАЛИЗАЦИЯ ===
(async () => {
  // Проверяем: запущено ли в Telegram?
  if (!window.Telegram || !window.Telegram.WebApp) {
    showError();
    return;
  }

  const WebApp = window.Telegram.WebApp;
  WebApp.ready();
  WebApp.expand();

  // Получаем пользователя — ОБЯЗАТЕЛЬНО через initDataUnsafe.user
  const user = WebApp.initDataUnsafe?.user;
  if (!user || !user.id) {
    showError();
    return;
  }

  userId = String(user.id);
  username = user.username || (user.first_name || 'Player') + (user.last_name ? ' ' + user.last_name : '');

  // Загружаем данные
  await loadScore();
  await updateLeaderboard();

  // Вешаем клик
  document.getElementById('clickBtn').addEventListener('click', handleClick);

  // Кнопка админа — ТОЛЬКО тебе
  if (userId === ADMIN_ID) {
    addAdminButton();
  }
})();

// === ОСНОВНЫЕ ФУНКЦИИ ===
async function handleClick() {
  score++;
  document.getElementById('score').textContent = score;
  showMessage('+1');
  await saveToFirebase();
  await updateLeaderboard();
}

async function saveToFirebase() {
  try {
    await fetch(`${DB_URL}/leaderboard/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, username })
    });
  } catch (e) {
    console.error('Save failed:', e);
  }
}

async function loadScore() {
  try {
    const res = await fetch(`${DB_URL}/leaderboard/${userId}.json`);
    const data = await res.json();
    if (data && typeof data.score === 'number') {
      score = data.score;
      document.getElementById('score').textContent = score;
    }
  } catch (e) {
    // Нет данных — начинаем с нуля
  }
}

async function updateLeaderboard() {
  try {
    const res = await fetch(`${DB_URL}/leaderboard.json`);
    const raw = await res.json();
    if (!raw) return;

    const list = Object.entries(raw)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const el = document.getElementById('topList');
    el.innerHTML = list.map((p, i) => `
      <div class="leader-item">
        <span>${i + 1}.</span>
        <span>@${p.username}</span>
        <span>${p.score}</span>
      </div>
    `).join('');
  } catch (e) {
    console.error('Leaderboard load failed:', e);
  }
}

function showMessage(text) {
  const m = document.getElementById('message');
  m.textContent = text;
  m.style.opacity = '1';
  setTimeout(() => m.style.opacity = '0', 800);
}

function addAdminButton() {
  const btn = document.createElement('button');
  btn.textContent = '🗑️ Clear All';
  btn.style.cssText = `
    margin-top: 1.2rem; padding: 0.4rem 0.8rem;
    background: #ff3333; color: white; border: none;
    border-radius: 8px; cursor: pointer; font-size: 0.9rem;
  `;
  btn.onclick = async () => {
    if (confirm('⚠️ Удалить ВСЁ?')) {
      await fetch(`${DB_URL}/leaderboard.json`, { method: 'DELETE' });
      score = 0;
      document.getElementById('score').textContent = '0';
      updateLeaderboard();
      showMessage('✅ Cleared!');
    }
  };
  document.querySelector('.container').appendChild(btn);
}

function showError() {
  document.body.innerHTML = `
    <div style="padding:2rem;text-align:center;color:white;background:#d32f2f">
      <h3>❌ Только в Telegram!</h3>
      <p>Запустите игру из бота.</p>
    </div>
  `;
}
