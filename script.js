// === Supabase config ===
const SUPABASE_URL = 'https://ВАШ_ПРОЕКТ.supabase.co';
const SUPABASE_KEY = 'ВАШ_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === Получаем Telegram User ID ===
let userId = null;
if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
  userId = String(Telegram.WebApp.initDataUnsafe.user.id);
} else {
  userId = localStorage.getItem('telegramUserId');
  if (!userId) {
    userId = prompt("Введите ваш Telegram User ID:");
    if (userId && /^\d+$/.test(userId)) {
      localStorage.setItem('telegramUserId', userId);
    } else {
      alert("Неверный ID");
      throw new Error("No ID");
    }
  }
}

// === Состояние ===
let localScore = 0;
let isEnded = false;
let perClick = 1;

// === Показ статуса ===
function showStatus(msg, sec = 2) {
  let el = document.getElementById('status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'status';
    el.style.cssText = `position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:6px 12px;border-radius:4px;z-index:1000`;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', sec * 1000);
}

// === Загрузка игры ===
async function loadGame() {
  try {
    // Настройки
    const { data: settings, error: err1 } = await supabase.from('game_settings').select('key, value');
    if (err1) throw err1;

    const cfg = {};
    settings.forEach(r => cfg[r.key] = r.value);

    // Проверка окончания
    const endTime = new Date(cfg.end_datetime);
    isEnded = new Date() >= endTime;

    // Применяем стиль
    document.body.style.backgroundColor = cfg.bg_color || '#f9f9f9';
    document.body.style.color = cfg.text_color || '#000';
    document.getElementById('game-title').textContent = cfg.title || 'Кликер';
    document.getElementById('game-desc').textContent = cfg.description || '';
    document.getElementById('click-btn').textContent = cfg.button_text || '+1';
    document.getElementById('click-btn').style.backgroundColor = cfg.btn_color || '#ccc';
    perClick = parseInt(cfg.score_per_click) || 1;

    // Лидеры
    const { data: leaders, error: err2 } = await supabase
      .from('scores')
      .select('user_id, score')
      .order('score', { ascending: false })
      .limit(10);
    if (err2) throw err2;

    document.getElementById('leaders-list').innerHTML = 
      leaders.map((l, i) => `<div>${i+1}. ID: ${l.user_id} — ${l.score}</div>`).join('');

    // Скрыть загрузку
    document.getElementById('loading').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    if (isEnded) {
      document.getElementById('active-area').style.display = 'none';
      document.getElementById('ended').style.display = 'block';
    } else {
      document.getElementById('active-area').style.display = 'block';
      document.getElementById('ended').style.display = 'none';

      // Загружаем свой счёт
      const { data: myScore, error: err3 } = await supabase
        .from('scores')
        .select('score')
        .eq('user_id', userId)
        .single();

      localScore = myScore ? myScore.score : 0;
      document.getElementById('score').textContent = `Очки: ${localScore}`;
    }

  } catch (e) {
    console.error(e);
    showStatus("Ошибка", 3);
  }
}

// === Клик ===
async function handleClick() {
  if (isEnded || !userId) return;

  localScore += perClick;
  document.getElementById('score').textContent = `Очки: ${localScore}`;
  showStatus(`+${perClick}`);

  // Сохраняем
  const { error } = await supabase
    .from('scores')
    .upsert({ user_id: BigInt(userId), score: localScore }, { onConflict: 'user_id' });

  if (error) console.error("Save failed", error);
}

// === Запуск ===
document.getElementById('click-btn').onclick = handleClick;
loadGame();
setInterval(loadGame, 10000); // обновление каждые 10 сек
