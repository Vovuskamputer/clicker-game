// ============= НАСТРОЙКИ =============
const DB_URL = 'https://strrent-game-bot-default-rtdb.firebaseio.com';
let userId = null;
let score = 0;

// ============= ИНИЦИАЛИЗАЦИЯ =============
window.addEventListener('load', async () => {
  // Получаем ID пользователя из Telegram (если запущено в Mini App)
  if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    userId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
  } else {
    // Для теста на компьютере — временный ID
    userId = localStorage.getItem('tempUserId') || 'temp_' + Date.now();
    localStorage.setItem('tempUserId', userId);
  }

  // Загружаем сохранённый счёт
  await loadScore();
  // Загружаем и показываем лидерборд
  await updateLeaderboard();

  // Привязываем клик
  document.getElementById('clickBtn').addEventListener('click', handleClick);
});

// ============= КЛИК =============
async function handleClick() {
  score++;
  document.getElementById('score').textContent = score;
  showMessage('+1');
  await saveScore();
}

// ============= СОХРАНЕНИЕ =============
async function saveScore() {
  try {
    await fetch(`${DB_URL}/scores/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(score)
    });
  } catch (e) {
    console.error('Не удалось сохранить:', e);
  }
}

// ============= ЗАГРУЗКА СЧЁТА =============
async function loadScore() {
  try {
    const res = await fetch(`${DB_URL}/scores/${userId}.json`);
    const saved = await res.json();
    if (typeof saved === 'number') {
      score = saved;
      document.getElementById('score').textContent = score;
    }
  } catch (e) {
    console.log('Нет сохранённого счёта или ошибка:', e);
  }
}

// ============= ЛИДЕРБОРД =============
async function updateLeaderboard() {
  try {
    const res = await fetch(`${DB_URL}/scores.json`);
    const data = await res.json();
    
    if (!data) return;

    const leaderboard = Object.entries(data)
      .map(([id, s]) => ({ id, score: s }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Топ-5

    const topList = document.getElementById('topList');
    if (!topList) return;

    topList.innerHTML = leaderboard.map((p, i) => `
      <div class="leader-item">
        <span>${i + 1}.</span>
        <span>User ${p.id}</span>
        <span>${p.score}</span>
      </div>
    `).join('');
  } catch (e) {
    console.error('Ошибка загрузки лидерборда:', e);
  }
}

// ============= ВСПЛЫВАЮЩЕЕ СООБЩЕНИЕ =============
function showMessage(text) {
  const el = document.getElementById('message');
  if (!el) return;
  el.textContent = text;
  el.style.opacity = '1';
  setTimeout(() => el.style.opacity = '0', 800);
}
