// script.js — основная логика
const DB_URL = 'https://strrent-game-bot-default-rtdb.firebaseio.com';
const ADMIN_ID = '1021907470';

let userId = null;
let username = 'Player';
let score = 0;
let upgrades = [];
let autoClickInterval = null;

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

  // Применяем настройки из options.js
  applyConfig();

  // Загружаем сохранение
  await loadSave();

  // Сохраняем каждые 10 секунд (на случай закрытия)
  setInterval(saveToFirebase, 10000);

  // Автоклик
  startAutoClick();

  // Админка
  if (userId === ADMIN_ID) addAdminButton();
})();

function applyConfig() {
  const cfg = window.GAME_CONFIG;

  document.getElementById('pageTitle').textContent = cfg.title;
  document.getElementById('gameTitle').innerHTML = `${cfg.emojis.titleIcon} ${cfg.title}`;
  document.getElementById('scorePrefix').textContent = cfg.scorePrefix;
  document.getElementById('clickBtn').innerHTML = `${cfg.emojis.clickBtn} ${cfg.buttonText}`;
  document.getElementById('leaderboardTitle').innerHTML = `${cfg.emojis.leaderboard} Top Players`;

  // Применяем бэкграунд
  document.body.style.background = cfg.theme.background;

  // Клонируем улучшения (чтобы не трогать оригинал)
  upgrades = JSON.parse(JSON.stringify(cfg.upgrades));
  renderUpgrades();
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

async function buyUpgrade(upgradeId) {
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

function startAutoClick() {
  if (autoClickInterval) clearInterval(autoClickInterval);
  autoClickInterval = setInterval(() => {
    const autoPower = upgrades
      .filter(u => u.id === 'auto_clicker')
      .reduce((sum, u) => sum + u.owned * u.effect, 0);
    if (autoPower > 0) {
      score += autoPower;
      updateUI();
    }
  }, 1000);
}

function updateUI() {
  document.getElementById('score').textContent = score;
}

async function handleClick() {
  // Сила клика = базовая (1) + улучшения
  const clickPower = 1 + upgrades
    .filter(u => u.id === 'click_power')
    .reduce((sum, u) => sum + u.owned * u.effect, 0);

  score += clickPower;
  updateUI();
  showMessage(`+${clickPower}`);
  saveToFirebase();
  renderUpgrades(); // кнопки могут разблокироваться
}

// === ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений) ===
async function saveToFirebase() {
  try {
    await fetch(`${DB_URL}/saves/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, username, upgrades })
    });
  } catch (e) { console.error('Save failed:', e); }
}

async function loadSave() {
  try {
    const res = await fetch(`${DB_URL}/saves/${userId}.json`);
    const data = await res.json();
    if (data) {
      score = data.score || 0;
      username = data.username || username;
      
      // Восстанавливаем улучшения (сохраняем совместимость)
      if (data.upgrades && Array.isArray(data.upgrades)) {
        for (let i = 0; i < upgrades.length; i++) {
          const saved = data.upgrades.find(s => s.id === upgrades[i].id);
          if (saved) upgrades[i].owned = saved.owned || 0;
        }
      }
    }
  } catch (e) { /* новая игра */ }
  updateUI();
  renderUpgrades();
}

async function updateLeaderboard() {
  try {
    const res = await fetch(`${DB_URL}/saves.json`);
    const raw = await res.json();
    if (!raw) return;

    const list = Object.entries(raw)
      .map(([id, v]) => ({ id, score: v.score || 0, username: v.username || 'Anonymous' }))
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
  } catch (e) { console.error('Leaderboard error:', e); }
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
  btn.style.cssText = `margin-top:1rem;padding:0.4rem;background:#ff3333;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;`;
  btn.onclick = async () => {
    if (confirm('⚠️ Удалить ВСЁ?')) {
      await fetch(`${DB_URL}/saves.json`, { method: 'DELETE' });
      score = 0;
      upgrades.forEach(u => u.owned = 0);
      updateUI();
      renderUpgrades();
      showMessage('✅ Cleared!');
    }
  };
  document.querySelector('.container').appendChild(btn);
}

function showError() {
  document.body.innerHTML = `<div style="padding:2rem;text-align:center;color:white;background:#d32f2f"><h3>❌ Только в Telegram!</h3><p>Запустите из бота.</p></div>`;
}

// Для работы кнопок Buy
window.buyUpgrade = buyUpgrade;

// Обновляем лидерборд каждые 5 сек
setInterval(updateLeaderboard, 5000);
document.getElementById('clickBtn').addEventListener('click', handleClick);
