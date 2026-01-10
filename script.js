const DB_URL = 'https://strrent-game-bot-default-rtdb.firebaseio.com';
let userId = null;
let score = 0;

window.addEventListener('load', async () => {
  // Получаем ID из Telegram или создаём временный
  if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    userId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
  } else {
    userId = localStorage.getItem('tempUserId') || 'temp_' + Date.now();
    localStorage.setItem('tempUserId', userId);
  }

  // Загружаем счёт и лидерборд
  await loadScore();
  await updateLeaderboard();

  // Вешаем обработчик клика
  document.getElementById('clickBtn').addEventListener('click', handleClick);
});

async function handleClick() {
  score++;
  document.getElementById('score').textContent = score;
  showMessage('+1');
  await saveScore();
  await updateLeaderboard(); // Обновляем лидерборд после каждого клика
}

async function saveScore() {
  try {
    // Получаем username или имя из Telegram
    let username = 'player_' + userId;
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      username = user.username || (user.first_name || 'Player') + (user.last_name ? ' ' + user.last_name : '');
    }

    const payload = {
      score: score,
      username: username
    };

    await fetch(`${DB_URL}/leaderboard/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Save error:', e);
  }
}

async function loadScore() {
  try {
    const res = await fetch(`${DB_URL}/scores/${userId}.json`);
    const saved = await res.json();
    if (typeof saved === 'number') {
      score = saved;
      document.getElementById('score').textContent = score;
    }
  } catch (e) {
    console.log('No saved score or error:', e);
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

