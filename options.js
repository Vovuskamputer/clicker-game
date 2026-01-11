// options.js — настройки игры

window.GAME_CONFIG = {
  // === ОБЩИЕ ===
  title: "🍪 Cookie Clicker",
  buttonText: "🍪 CLICK!",
  scorePrefix: "Cookies:",
  
  // === ЭМОДЗИ ===
  emojis: {
    titleIcon: "🍪",
    clickBtn: "🍪",
    poisonCookie: "💀", // ядовитая печенька
    leaderboard: "🏆",
    upgrade: "✨"
  },
  
  // === ТЕМА ===
  theme: {
    background: "linear-gradient(135deg, #ff9a9e, #fad0c4)"
  },

  // === УЛУЧШЕНИЯ (расширено) ===
  upgrades: [
    {
      id: 'click_power',
      name: 'Mega Click',
      description: '+1 cookie per click',
      baseCost: 15,
      costMultiplier: 1.5,
      effect: 1,
      owned: 0
    },
    {
      id: 'auto_clicker',
      name: 'Grandma',
      description: '+1 cookie/sec',
      baseCost: 50,
      costMultiplier: 1.15,
      effect: 1,
      owned: 0
    },
    {
      id: 'cursor',
      name: 'Cursor',
      description: '+0.1 cookie/sec',
      baseCost: 15,
      costMultiplier: 1.1,
      effect: 0.1,
      owned: 0
    },
    {
      id: 'farm',
      name: 'Farm',
      description: '+8 cookies/sec',
      baseCost: 110,
      costMultiplier: 1.14,
      effect: 8,
      owned: 0
    },
    {
      id: 'mine',
      name: 'Mine',
      description: '+47 cookies/sec',
      baseCost: 12000,
      costMultiplier: 1.14,
      effect: 47,
      owned: 0
    },
    {
      id: 'double_click',
      name: 'Lucky Hand',
      description: '5% chance to double click',
      baseCost: 200,
      costMultiplier: 2,
      effect: 0.05, // шанс 5%
      owned: 0,
      type: 'chance'
    },
    {
      id: 'poison_protection',
      name: 'Antidote',
      description: 'Ignore poison cookie penalty',
      baseCost: 500,
      costMultiplier: 3,
      effect: 1,
      owned: 0,
      type: 'protection'
    }
  ]
};
