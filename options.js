window.GAME_CONFIG = {
  // === Основное ===
  title: "🍪 Cookie Empire",
  scorePrefix: "Cookies:",

  // === Эмодзи ===
  emojis: {
    titleIcon: "🍪",
    cookie: "🍪",
    poisonCookie: "💀",
    upgrade: "✨",
    offline: "📥",
    leaderboard: "🏆",
    admin: "🛠️"
  },

  // === Вероятности ===
  probabilities: {
    poisonChance: 0.05,        // 5%
    doubleClickChanceBase: 0.05 // база для улучшения
  },

  // === Тема ===
  theme: {
    background: "linear-gradient(135deg, #ff9a9e, #fad0c4)",
    cookieBtn: "#ffffff",
    primary: "#4caf50",
    danger: "#f44336",
    warning: "#ff9800"
  },

  // === Улучшения ===
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
      id: 'cursor',
      name: 'Cursor',
      description: '+0.1 cookie/sec',
      baseCost: 15,
      costMultiplier: 1.1,
      effect: 0.1,
      owned: 0
    },
    {
      id: 'grandma',
      name: 'Grandma',
      description: '+1 cookie/sec',
      baseCost: 100,
      costMultiplier: 1.12,
      effect: 1,
      owned: 0
    },
    {
      id: 'farm',
      name: 'Farm',
      description: '+8 cookies/sec',
      baseCost: 1100,
      costMultiplier: 1.13,
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
      description: 'Extra chance to double click',
      baseCost: 200,
      costMultiplier: 2,
      effect: 0.05,
      owned: 0
    },
    {
      id: 'poison_protection',
      name: 'Antidote',
      description: 'Ignore poison penalty',
      baseCost: 500,
      costMultiplier: 3,
      effect: 1,
      owned: 0
    }
  ]
};
