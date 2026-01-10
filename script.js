const DB_URL = 'https://strrent-game-bot-default-rtdb.firebaseio.com';
let userId = null;
let username = 'Anonymous';
let score = 0;
const ADMIN_ID = '1021907470';

function initTelegram() {
  if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
    const WebApp = window.Telegram.WebApp;
    WebApp.ready();
    WebApp.expand();

    // КРИТИЧЕСКИ ВАЖНО: ждём, пока данные прогрузятся
    const initData = WebApp.initData || '';
    const user = WebApp.initDataUnsafe?.user;

    if (user && user.id) {
      userId = String(user.id);
      username = user.username || 
                 (user.first_name ? (user.first_name + (user.last_name ? ' ' + user.last_name : '')) : 'Player');
      return true;
    } else {
      console.error('❌ Telegram user data missing!', { initData, unsafe: WebApp.initDataUnsafe });
      return false;
    }
  }
  return false;
}

window.addEventListener('load', async () => {
  const isTelegram = initTelegram();

  if (!isTelegram) {
    // ❌ Аварийный режим: показываем ошибку вместо игры
    document.body.innerHTML = `
      <div style="padding:2rem; text-align:center; color:white; background:#ff4d4d">
        <h2>🚫 Ошибка запуска</h2>
        <p>Эту игру можно запускать ТОЛЬКО через Telegram Mini App!</p>
        <p>Откройте её из бота.</p>
      </div>
    `;
    return;
  }

  console.log('✅ User:', { id: userId, name: username });

  await loadScore();
  await updateLeaderboard();

  document.getElementById('clickBtn').addEventListener('click', handleClick);

  if (userId === ADMIN_ID) {
    showAdminPanel();
  }
});

// ... остальной код БЕЗ ИЗМЕНЕНИЙ ...
async function handleClick() {
  score++;
  document.getElementById('score').textContent = score;
  showMessage('+1');
  await saveScore();
  await updateLeaderboard();
}

async function saveScore() {
  try {
    await fetch(`${DB_URL}/leaderboard/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, username })
    });
  } catch (e) {
    console.error('Save error:', e);
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
    console.log('No saved score:', e);
  }
}

async function updateLeaderboard() {
  try {
    const res = await fetch(`${DB_URL}/leaderboard.json`);
    const data = await res.json();
    if (!data) return;

    const leaderboard = Object.entries(data)
      .map(([id, info]) => ({
        id,
        score: info.score,
        username: info.username || 'Anonymous'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const topList = document.getElementById('topList');
    topList.innerHTML = leaderboard.map((p, i) => `
      <div class="leader-item">
        <span>${i + 1}.</span>
        <span>@${p.username}</span>
        <span>${p.score}</span>
      </div>
    `).join('');
  } catch (e) {
    console.error('Leaderboard error:', e);
  }
}

function showMessage(text) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.style.opacity = '1';
  setTimeout(() => el.style.opacity = '0', 800);
}

function showAdminPanel() {
  const container = document.querySelector('.container');
  const adminBtn = document.createElement('button');
  adminBtn.textContent = '🗑️ Clear All Scores';
  adminBtn.style.cssText = `
    margin-top: 1.2rem;
    padding: 0.4rem 0.8rem;
    background: #ff4d4d;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
  `;
  adminBtn.onclick = clearAllScores;
  container.appendChild(adminBtn);
}

async function clearAllScores() {
  if (confirm('⚠️ Удалить ВСЕ данные?')) {
    try {
      await fetch(`${DB_URL}/leaderboard.json`, { method: 'DELETE' });
      score = 0;
      document.getElementById('score').textContent = '0';
      await updateLeaderboard();
      showMessage('✅ Очищено!');
    } catch (e) {
      alert('Ошибка');
      console.error(e);
    }
  }
}
