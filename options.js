// options.js — меняй всё здесь, не трогая основной код!

window.GAME_CONFIG = {
  // === ОБЩИЕ ===
  title: "🎄 New Year Clicker",
  buttonText: "🎁 CLICK!",
  scorePrefix: "Snowflakes:",
  
  // === ЭМОДЗИ И ТЕМА ===
  emojis: {
    titleIcon: "❄️",
    clickBtn: "🎅",
    leaderboard: "🏆",
    upgrade: "✨"
  },
  
  // === ЦВЕТА (опционально, можно в CSS) ===
  theme: {
    primary: "#ff6f61",
    background: "linear-gradient(135deg, #1e5799, #207cca, #2989d8, #1e5799)"
  },

  // === УЛУЧШЕНИЯ ===
  upgrades: [
    {
      id: 'click_power',
      name: 'Mega Click',
      description: '+1 очко за клик',
      baseCost: 10,
      costMultiplier: 1.5, // каждый следующий дороже в 1.5x
      effect: 1, // сколько добавляет
      owned: 0
    },
    {
      id: 'auto_clicker',
      name: 'Elf Helper',
      description: '+1 очко/сек',
      baseCost: 30,
      costMultiplier: 2,
      effect: 1,
      owned: 0
    }
  ]
};
