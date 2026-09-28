export const skillProgress = [
  { name: 'Vocabulary', icon: 'dictionary', level: 31, percent: 76 },
  { name: 'Grammar', icon: 'menu_book', level: 24, percent: 58 },
  { name: 'Listening', icon: 'headphones', level: 18, percent: 43 },
  { name: 'Speaking', icon: 'record_voice_over', level: 15, percent: 34 },
];
export const dailyQuests = [
  {
    title: 'Make words your own',
    detail: 'Practice 10 new words',
    current: 6,
    total: 10,
    xp: 50,
    icon: 'dictionary',
    to: '/app/learn',
  },
  {
    title: 'A little conversation',
    detail: 'Meet a new character',
    current: 0,
    total: 1,
    xp: 75,
    icon: 'forum',
    to: '/app/ai/characters',
  },
  {
    title: 'Play your way forward',
    detail: 'Explore a practice game',
    current: 0,
    total: 1,
    xp: 50,
    icon: 'sports_esports',
    to: '/app/games',
  },
];
