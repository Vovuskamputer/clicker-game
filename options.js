window.GAME_CONFIG = {
  // === Основное ===
  title: "Ледяное Королевство",
  scorePrefix: "Снежинки:",

  // === Эмодзи ===
  emojis: {
    titleIcon: "❄️",
    cookie: "❄️",
    poisonCookie: "🧊",
    offline: "📥",
    leaderboard: "🏆",
    upgrades: "✨",
    stats: "ℹ️",
    admin: "🛠️"
  },

  // === Вероятности ===
  probabilities: {
    poisonChance: 0.05,
    doubleClickChanceBase: 0.05
  },

  // === Тема ===
  theme: {
    background: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
    cookieBtn: "#e0f7fa",
    primary: "#0288d1",
    danger: "#b71c1c",
    warning: "#ff8f00"
  },

  // === Улучшения (группируются по category) ===
  upgrades: [
    {
      id: 'click_power',
      name: 'Морозный Удар',
      description: '+1 снежинка за клик',
      baseCost: 15,
      costMultiplier: 1.5,
      effect: 1,
      owned: 0,
      icon: '👊',
      category: 'click'
    },
    {
      id: 'double_click',
      name: 'Эхо Метели',
      description: 'Шанс x2 за клик',
      baseCost: 200,
      costMultiplier: 2,
      effect: 0.05,
      owned: 0,
      icon: '🌀',
      category: 'click'
    },
    {
      id: 'cursor',
      name: 'Снеговик-Помощник',
      description: '+0.1 снежинок/сек',
      baseCost: 15,
      costMultiplier: 1.1,
      effect: 0.1,
      owned: 0,
      icon: '⛄',
      category: 'income'
    },
    {
      id: 'grandma',
      name: 'Бабушка-Ведьма',
      description: '+1 снежинка/сек',
      baseCost: 100,
      costMultiplier: 1.12,
      effect: 1,
      owned: 0,
      icon: '🧙‍♀️',
      category: 'income'
    },
    {
      id: 'farm',
      name: 'Ледяная Ферма',
      description: '+8 снежинок/сек',
      baseCost: 1100,
      costMultiplier: 1.13,
      effect: 8,
      owned: 0,
      icon: '🏔️',
      category: 'income'
    },
    {
      id: 'mine',
      name: 'Алмазная Шахта',
      description: '+47 снежинок/сек',
      baseCost: 12000,
      costMultiplier: 1.14,
      effect: 47,
      owned: 0,
      icon: '💎',
      category: 'income'
    },
    {
      id: 'poison_protection',
      name: 'Тёплая Перчатка',
      description: '+1% шанс избежать ловушки (макс. 25%)',
      baseCost: 500,
      costMultiplier: 3,
      effect: 1,
      owned: 0,
      icon: '🧤',
      category: 'other',
      maxLevel: 25
    }
  ]
};
