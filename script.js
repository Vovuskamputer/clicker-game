// script.js — обновлённая логика

const DB_URL = 'https://strrent-game-bot-default-rtdb.firebaseio.com';
const ADMIN_ID = '1021907470';

let userId = null;
let username = 'Player';
let score = 0;
let upgrades = [];
let autoClickInterval = null;
let isPoisonActive = false;
let poisonTimeout = null;
let gamePaused = false;
let lastOnline = Date.now();
let offlineEarned = 0;

// === ИНИЦИАЛИЗАЦИЯ ===
(async () => {
  if (!window.Telegram?.WebApp) {
    showError(); return;
  }

  const WebApp = window.Telegram.WebApp;
  WebApp.ready(); WebApp.expand();

  const user = WebApp.initDataUnsafe?.user;
  if (!user?.id) { showError(); return; }

  userId = String(user.id);
  username = user.username || (user.first_name || 'Player') + (user.last_name ? ' ' + user.last_name : '');

  applyConfig();
  await loadSave();
  setInterval(saveToFirebase, 10000);
  startAutoClick();
  checkGamePause();
  setInterval(checkGamePause, 5000); // проверка паузы каждые 5 сек

  if (userId === ADMIN_ID) addAdminPanel();

  // Сохраняем время ухода
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lastOnline = Date.now();
      saveToFirebase();
    }
  });
})();

function applyConfig() {
  const cfg = window.GAME_CONFIG;
  document.getElementById('pageTitle').textContent = cfg.title;
  document.getElementById('gameTitle').innerHTML = `${cfg.emojis.titleIcon} ${cfg.title}`;
  document.getElementById('scorePrefix').textContent = cfg.scorePrefix;
  document.getElementById('clickBtn').innerHTML = `${cfg.emojis.clickBtn} ${cfg.buttonText}`;
  document.body.style.background = cfg.theme.background;
  upgrades = JSON.parse(JSON.stringify(cfg.upgrades));
  renderUpgrades();
}

function calculateAutoClickPower() {
  return upgrades
    .filter(u => u.id !== 'double_click' && u.id !== 'poison_protection')
    .reduce((sum, u) => sum + u.owned * u.effect, 0);
}

function startAutoClick() {
  if (autoClickInterval) clearInterval(autoClickInterval);
  autoClickInterval = setInterval(() => {
    if (gamePaused) return;
    const power = calculateAutoClickPower();
    if (power > 0) {
      score += power;
      updateUI();
    }
  }, 1000);
}

function updateUI() {
  document.getElementById('score').textContent = Math.floor(score);
}

async function handleClick() {
  if (gamePaused) return;

  if (isPoisonActive) {
    // Клик по ядовитой
    const penalty = Math.floor(score / 2);
    score = Math.max(0, score - penalty);
    showMessage(`💀 -${penalty}`);
    resetCookie();
    saveToFirebase();
    return;
  }

  // Обычный клик
  let clickPower = 1;

  // Усиление клика
  const clickBoost = upgrades
    .filter(u => u.id === 'click_power')
    .reduce((sum, u) => sum + u.owned * u.effect, 0);
  clickPower += clickBoost;

  // Шанс двойного клика
  const doubleChance = upgrades
    .filter(u => u.id === 'double_click')
    .reduce((sum, u) => sum + u.owned * u.effect, 0);
  if (Math.random() < doubleChance) {
    clickPower *= 2;
    showMessage(`✨ x2!`);
  }

  score += clickPower;
  updateUI();
  showMessage(`+${clickPower}`);

  // 5% шанс стать ядовитой
  if (!isPoisonActive && Math.random() < 0.05) {
    activatePoisonCookie();
  }

  saveToFirebase();
  renderUpgrades();
}

function activatePoisonCookie() {
  isPoisonActive = true;
  const btn = document.getElementById('clickBtn');
  btn.innerHTML = `${window.GAME_CONFIG.emojis.poisonCookie} POISON!`;
  btn.style.background = '#8B0000';

  clearTimeout(poisonTimeout);
  poisonTimeout = setTimeout(() => {
    if (isPoisonActive) {
      resetCookie();
    }
  }, 2000);
}

function resetCookie() {
  isPoisonActive = false;
  const cfg = window.GAME_CONFIG;
  document.getElementById('clickBtn').innerHTML = `${cfg.emojis.clickBtn} ${cfg.buttonText}`;
  document.getElementById('clickBtn').style.background = '#ff6f61';
}

async function buyUpgrade(upgradeId) {
  if (gamePaused) return;
  const u = upgrades.find(x => x.id === upgradeId);
  if (!u) return;
  const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned));
  if (score < cost) return;
  score -= cost;
  u.owned++;
  updateUI();
  renderUpgrades();
  saveToFirebase();
}

function renderUpgrades() {
  const container = document.getElementById('upgrades');
  container.innerHTML = upgrades.map(u => {
    const currentCost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned));
    const canAfford = score >= currentCost;
    return `
      <div class="upgrade-item">
        <div class="upgrade-info">
          <div class="upgrade-name">${window.GAME_CONFIG.emojis.upgrade} ${u.name}</div>
          <div class="upgrade-desc">${u.description}</div>
        </div>
        <div>
          <span class="upgrade-cost">${currentCost}</span>
          <button class="upgrade-btn" ${canAfford ? '' : 'disabled'}
                  onclick="buyUpgrade('${u.id}')">Buy</button>
        </div>
      </div>
    `;
  }).join('');
}

// === ОФФЛАЙН ДОХОД ===
async function loadSave() {
  try {
    const res = await fetch(`${DB_URL}/saves/${userId}.json`);
    const data = await res.json();
    if (data) {
      score = data.score || 0;
      username = data.username || username;
      lastOnline = data.lastOnline || Date.now();

      if (data.upgrades && Array.isArray(data.upgrades)) {
        for (let i = 0; i < upgrades.length; i++) {
          const saved = data.upgrades.find(s => s.id === upgrades[i].id);
          if (saved) upgrades[i].owned = saved.owned || 0;
        }
      }

      // Расчёт оффлайн дохода
      const now = Date.now();
      const secsOffline = Math.floor((now - lastOnline) / 1000);
      const maxOfflineHours = 24;
      const cappedSecs = Math.min(secsOffline, maxOfflineHours * 3600);
      const autoPower = calculateAutoClickPower();
      offlineEarned = Math.floor(cappedSecs * autoPower);

      if (offlineEarned > 0) {
        document.getElementById('offlineAmount').textContent = offlineEarned;
        document.getElementById('offlinePanel').style.display = 'block';
      }
    }
  } catch (e) { /* новая игра */ }
  updateUI();
  renderUpgrades();
}

async function collectOffline() {
  if (offlineEarned > 0) {
    score += offlineEarned;
    offlineEarned = 0;
    updateUI();
    document.getElementById('offlinePanel').style.display = 'none';
    saveToFirebase();
    showMessage('✅ Собрано!');
  }
}

// === ЛИДЕРБОРД ===
async function showFullLeaderboard() {
  try {
    const res = await fetch(`${DB_URL}/saves.json`);
    const raw = await res.json();
    if (!raw) return;

    const list = Object.entries(raw)
      .map(([id, v]) => ({
        id,
        score: v.score || 0,
        username: v.username || `ID:${id}`
      }))
      .sort((a, b) => b.score - a.score);

    const el = document.getElementById('fullLeaderboard');
    el.innerHTML = list.map((p, i) => {
      let rank = i + 1;
      let medal = '';
      let cls = '';
      if (rank === 1) { medal = '🥇'; cls = 'gold'; }
      else if (rank === 2) { medal = '🥈'; cls = 'silver'; }
      else if (rank === 3) { medal = '🥉'; cls = 'bronze'; }
      else medal = rank + '.';

      return `<div class="leader-item ${cls}">
        <span>${medal}</span>
        <span>@${p.username}</span>
        <span>${p.score}</span>
      </div>`;
    }).join('');

    document.getElementById('leaderboardModal').style.display = 'flex';
  } catch (e) {
    console.error('Leaderboard error:', e);
  }
}

// === ПАУЗА ИГРЫ ===
async function checkGamePause() {
  try {
    const res = await fetch(`${DB_URL}/gameStatus/isPaused.json`);
    const paused = await res.json();
    gamePaused = paused === true;

    if (gamePaused) {
      document.body.innerHTML = `<div style="padding:2rem;text-align:center;color:white;background:#d32f2f">
        <h3>⏸️ Игра приостановлена</h3>
        <p>Администратор временно отключил заработок.</p>
      </div>`;
    }
  } catch (e) { /* игнор */ }
}

// === АДМИНКА ===
function addAdminPanel() {
  const container = document.querySelector('.container');

  // Кнопка очистки
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '🗑️ Clear All';
  clearBtn.className = 'upgrade-btn';
  clearBtn.style.marginTop = '1rem';
  clearBtn.onclick = async () => {
    if (confirm('⚠️ Удалить ВСЁ?')) {
      await fetch(`${DB_URL}/saves.json`, { method: 'DELETE' });
      score = 0;
      upgrades.forEach(u => u.owned = 0);
      updateUI();
      renderUpgrades();
      showMessage('✅ Cleared!');
    }
  };
  container.appendChild(clearBtn);

  // Кнопка паузы/возобновления
  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'upgrade-btn';
  pauseBtn.style.marginTop = '0.5rem';
  pauseBtn.style.background = '#ffcc00';
  pauseBtn.style.color = '#000';
  pauseBtn.onclick = async () => {
    const newPause = !gamePaused;
    await fetch(`${DB_URL}/gameStatus/isPaused.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPause)
    });
    gamePaused = newPause;
    alert(newPause ? '⏸️ Игра приостановлена' : '▶️ Игра возобновлена');
  };
  pauseBtn.textContent = '⏸️ Управление паузой';
  container.appendChild(pauseBtn);
}

// === ВСПОМОГАТЕЛЬНЫЕ ===
async function saveToFirebase() {
  try {
    await fetch(`${DB_URL}/saves/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, username, upgrades, lastOnline: Date.now() })
    });
  } catch (e) { console.error('Save failed:', e); }
}

function showMessage(text) {
  const m = document.getElementById('message');
  m.textContent = text;
  m.style.opacity = '1';
  setTimeout(() => m.style.opacity = '0', 1200);
}

function showError() {
  document.body.innerHTML = `<div style="padding:2rem;text-align:center;color:white;background:#d32f2f"><h3>❌ Только в Telegram!</h3><p>Запустите из бота.</p></div>`;
}

// Глобальные функции для кнопок
window.buyUpgrade = buyUpgrade;
window.collectOffline = collectOffline;
window.showFullLeaderboard = showFullLeaderboard;
window.closeLeaderboard = () => {
  document.getElementById('leaderboardModal').style.display = 'none';
};

// События
document.getElementById('clickBtn').addEventListener('click', handleClick);
document.getElementById('collectOfflineBtn').addEventListener('click', collectOffline);
document.getElementById('showLeaderboardBtn').addEventListener('click', showFullLeaderboard);
document.getElementById('closeLeaderboardBtn').addEventListener('click', window.closeLeaderboard);
