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
let cfg = null;

// === INIT ===
(async () => {
  if (!window.Telegram?.WebApp) return showError();
  const WebApp = window.Telegram.WebApp;
  WebApp.ready(); WebApp.expand();

  const user = WebApp.initDataUnsafe?.user;
  if (!user?.id) return showError();

  userId = String(user.id);
  username = user.username || (user.first_name || 'Player') + (user.last_name ? ' ' + user.last_name : '');

  cfg = window.GAME_CONFIG;
  applyConfig();
  await loadSave();
  setInterval(saveToFirebase, 10000);
  startAutoClick();
  checkGamePause();
  setInterval(checkGamePause, 5000);

  if (userId === ADMIN_ID) {
    document.getElementById('adminPanelBtn').style.display = 'flex';
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lastOnline = Date.now();
      saveToFirebase();
    }
  });
})();

function applyConfig() {
  const c = cfg;
  document.getElementById('pageTitle').textContent = c.title;
  document.getElementById('gameTitle').innerHTML = `${c.emojis.titleIcon} ${c.title}`;
  document.getElementById('scorePrefix').textContent = c.scorePrefix;
  document.getElementById('offlineUnit').textContent = c.scorePrefix.replace(':', '').trim();
  document.body.style.background = c.theme.background;
  document.getElementById('clickBtn').textContent = c.emojis.cookie;
  document.getElementById('clickBtn').style.background = c.theme.cookieBtn;

  upgrades = JSON.parse(JSON.stringify(c.upgrades));
  renderUpgradesTab('click');
}

function calculateAutoClickPower() {
  return upgrades
    .filter(u => !['double_click', 'poison_protection'].includes(u.id))
    .reduce((sum, u) => sum + u.owned * u.effect, 0);
}

function getClickPower() {
  let power = 1;
  const boost = upgrades
    .filter(u => u.id === 'click_power')
    .reduce((sum, u) => sum + u.owned * u.effect, 0);
  return power + boost;
}

function startAutoClick() {
  if (autoClickInterval) clearInterval(autoClickInterval);
  autoClickInterval = setInterval(() => {
    if (gamePaused) return;
    const power = calculateAutoClickPower();
    if (power > 0) {
      score += power;
      updateEverything();
    }
  }, 1000);
}

function updateEverything() {
  score = Math.floor(score);
  updateUI();
  saveToFirebase();
}

function updateUI() {
  document.getElementById('score').textContent = score;
}

async function handleClick() {
  if (gamePaused) return;

  if (isPoisonActive) {
    const antidote = upgrades.find(u => u.id === 'poison_protection');
    const chancePercent = antidote ? Math.min(antidote.owned, 25) : 0;
    const roll = Math.random() * 100;

    if (roll < chancePercent) {
      showMessage('🧤 Защита сработала!');
    } else {
      const penalty = Math.floor(score / 2);
      score = Math.max(0, score - penalty);
      showMessage(`🧊 -${penalty}`);
    }
    resetCookie();
    updateEverything();
    return;
  }

  let clickPower = getClickPower();
  const doubleChance = upgrades
    .filter(u => u.id === 'double_click')
    .reduce((sum, u) => sum + u.owned * cfg.probabilities.doubleClickChanceBase, 0);
  if (Math.random() < doubleChance) {
    clickPower *= 2;
    showMessage('🌀 x2!');
  }

  score += clickPower;
  updateEverything();

  if (!isPoisonActive && Math.random() < cfg.probabilities.poisonChance) {
    activatePoisonCookie();
  }
}

function activatePoisonCookie() {
  isPoisonActive = true;
  document.getElementById('clickBtn').textContent = cfg.emojis.poisonCookie;
  document.getElementById('clickBtn').style.background = '#b71c1c';
  clearTimeout(poisonTimeout);
  poisonTimeout = setTimeout(resetCookie, 2000);
}

function resetCookie() {
  isPoisonActive = false;
  document.getElementById('clickBtn').textContent = cfg.emojis.cookie;
  document.getElementById('clickBtn').style.background = cfg.theme.cookieBtn;
}

async function buyUpgrade(id) {
  if (gamePaused) return;
  const u = upgrades.find(x => x.id === id);
  if (!u) return;
  if (u.maxLevel && u.owned >= u.maxLevel) return;
  const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned));
  if (score < cost) return;
  score -= cost;
  u.owned++;
  updateEverything();
  renderCurrentTab();
}

function renderCurrentTab() {
  const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
  renderUpgradesTab(activeTab);
}

function renderUpgradesTab(category) {
  const container = document.getElementById('upgradesContent');
  const filtered = upgrades.filter(u => u.category === category);
  container.innerHTML = filtered.map(u => {
    const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned));
    const canAfford = score >= cost;
    const disabled = !canAfford || (u.maxLevel && u.owned >= u.maxLevel);
    return `
      <div class="upgrade-card">
        <div class="upgrade-icon">${u.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-name">${u.name}</div>
          <div class="upgrade-desc">${u.description}</div>
        </div>
        <div class="upgrade-price">${cost}</div>
        <button class="upgrade-btn" ${disabled ? 'disabled' : ''} onclick="buyUpgrade('${u.id}')">
          ${disabled ? '🔒' : 'Купить'}
        </button>
      </div>
    `;
  }).join('');
}

// === TABS ===
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderUpgradesTab(btn.dataset.tab);
  });
});

// === OFFLINE INCOME ===
async function loadSave() {
  try {
    const res = await fetch(`${DB_URL}/saves/${userId}.json`);
    const data = await res.json();
    if (data) {
      score = Math.floor(data.score) || 0;
      username = data.username || username;
      lastOnline = data.lastOnline || Date.now();

      if (data.upgrades && Array.isArray(data.upgrades)) {
        for (let i = 0; i < upgrades.length; i++) {
          const saved = data.upgrades.find(s => s.id === upgrades[i].id);
          if (saved) upgrades[i].owned = saved.owned || 0;
        }
      }

      const now = Date.now();
      const secs = Math.min(Math.floor((now - lastOnline) / 1000), 24 * 3600);
      offlineEarned = Math.floor(secs * calculateAutoClickPower());

      if (offlineEarned > 0) {
        document.getElementById('offlineBtn').style.display = 'flex';
      }
    }
  } catch (e) {}
  updateEverything();
}

// === LEADERBOARD ===
async function showFullLeaderboard() {
  try {
    const res = await fetch(`${DB_URL}/saves.json`);
    const raw = await res.json();
    if (!raw) return;

    const list = Object.entries(raw)
      .map(([id, v]) => ({
        id,
        score: Math.floor(v.score) || 0,
        username: v.username || `ID:${id}`
      }))
      .sort((a, b) => b.score - a.score);

    const el = document.getElementById('fullLeaderboard');
    el.innerHTML = list.map((p, i) => {
      let medal = '', cls = '';
      if (i === 0) { medal = '🥇'; cls = 'gold'; }
      else if (i === 1) { medal = '🥈'; cls = 'silver'; }
      else if (i === 2) { medal = '🥉'; cls = 'bronze'; }
      else medal = (i + 1) + '.';

      return `<div class="leader-item ${cls}">
        <span>${medal}</span>
        <span>@${p.username}</span>
        <span>${p.score}</span>
      </div>`;
    }).join('');

    document.getElementById('leaderboardModal').style.display = 'flex';
  } catch (e) { console.error(e); }
}

// === PAUSE ===
async function checkGamePause() {
  try {
    const res = await fetch(`${DB_URL}/gameStatus/isPaused.json`);
    const paused = await res.json();
    gamePaused = paused === true;

    if (gamePaused && userId !== ADMIN_ID) {
      document.body.innerHTML = `<div style="padding:2rem;text-align:center;color:white;background:#b71c1c">
        <h3>⏸️ Игра приостановлена</h3>
        <p>Администратор временно отключил заработок.</p>
      </div>`;
    } else if (gamePaused && userId === ADMIN_ID) {
      let notice = document.getElementById('pauseNotice');
      if (!notice) {
        notice = document.createElement('div');
        notice.id = 'pauseNotice';
        notice.style.cssText = `
          position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
          background: #ff8f00; color: #000; padding: 0.4rem 1rem;
          border-radius: 20px; font-weight: bold; z-index: 999;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        `;
        notice.textContent = '⏸️ Игра приостановлена (только вы)';
        document.body.appendChild(notice);
      }
    } else {
      const notice = document.getElementById('pauseNotice');
      if (notice) notice.remove();
    }
  } catch (e) {}
}

// === ADMIN ===
function openAdminPanel() {
  document.getElementById('adminModal').style.display = 'flex';
}

async function clearAll() {
  if (confirm('⚠️ Удалить ВСЕ данные?')) {
    await fetch(`${DB_URL}/saves.json`, { method: 'DELETE' });
    score = 0;
    upgrades.forEach(u => u.owned = 0);
    updateEverything();
    showMessage('✅ Очищено!');
    document.getElementById('adminModal').style.display = 'none';
  }
}

async function togglePause() {
  const newPause = !gamePaused;
  await fetch(`${DB_URL}/gameStatus/isPaused.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPause)
  });
  alert(newPause ? '⏸️ Пауза включена' : '▶️ Игра возобновлена');
  document.getElementById('adminModal').style.display = 'none';
}

// === SAVE ===
async function saveToFirebase() {
  try {
    await fetch(`${DB_URL}/saves/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, username, upgrades, lastOnline: Date.now() })
    });
  } catch (e) { console.error('Save failed:', e); }
}

// === UTILS ===
function collectOffline() {
  if (offlineEarned > 0) {
    score += offlineEarned;
    offlineEarned = 0;
    document.getElementById('offlineBtn').style.display = 'none';
    updateEverything();
    showMessage('✅ Собрано!');
    document.getElementById('offlineModal').style.display = 'none';
  }
}

function showMessage(text) {
  const m = document.getElementById('message');
  m.textContent = text;
  m.style.opacity = '1';
  setTimeout(() => m.style.opacity = '0', 1200);
}

function showError() {
  document.body.innerHTML = `<div style="padding:2rem;text-align:center;color:white;background:#b71c1c">
    <h3>❌ Только в Telegram!</h3>
    <p>Запустите из бота.</p>
  </div>`;
}

// === STATS ===
function showStats() {
  const unit = cfg.scorePrefix.replace(':', '').trim();
  const autoPerSec = calculateAutoClickPower();
  const autoPerHour = Math.floor(autoPerSec * 3600);
  document.getElementById('statsContent').innerHTML = `
    <p><b>Текущий счёт:</b> ${score} ${unit}</p>
    <p><b>За клик:</b> ${getClickPower()} ${unit}</p>
    <p><b>Доход/сек:</b> ${autoPerSec.toFixed(1)} ${unit}</p>
    <p><b>Доход/час:</b> ${autoPerHour} ${unit}</p>
    <p><b>Уровень защиты:</b> ${upgrades.find(u => u.id === 'poison_protection')?.owned || 0}/25</p>
  `;
  document.getElementById('statsModal').style.display = 'flex';
}

// === GLOBAL ===
window.buyUpgrade = buyUpgrade;
window.collectOffline = collectOffline;
window.showFullLeaderboard = showFullLeaderboard;
window.openAdminPanel = openAdminPanel;
window.clearAll = clearAll;
window.togglePause = togglePause;
window.showStats = showStats;
window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };

// === EVENTS ===
document.getElementById('clickBtn').addEventListener('click', handleClick);
document.getElementById('offlineBtn').addEventListener('click', () => {
  document.getElementById('offlineAmount').textContent = offlineEarned;
  document.getElementById('offlineModal').style.display = 'flex';
});
document.getElementById('leaderboardBtn').addEventListener('click', showFullLeaderboard);
document.getElementById('upgradesBtn').addEventListener('click', () => {
  document.getElementById('upgradesModal').style.display = 'flex';
  renderUpgradesTab('click');
});
document.getElementById('statsBtn').addEventListener('click', showStats);
document.getElementById('adminPanelBtn').addEventListener('click', openAdminPanel);
document.getElementById('collectOfflineBtn').addEventListener('click', collectOffline);
document.getElementById('closeOfflineBtn').addEventListener('click', () => closeModal('offlineModal'));
document.getElementById('closeLbBtn').addEventListener('click', () => closeModal('leaderboardModal'));
document.getElementById('closeUpgradesBtn').addEventListener('click', () => closeModal('upgradesModal'));
document.getElementById('closeStatsBtn').addEventListener('click', () => closeModal('statsModal'));
document.getElementById('closeAdminBtn').addEventListener('click', () => closeModal('adminModal'));
document.getElementById('clearAllBtn').addEventListener('click', clearAll);
document.getElementById('togglePauseBtn').addEventListener('click', togglePause);
