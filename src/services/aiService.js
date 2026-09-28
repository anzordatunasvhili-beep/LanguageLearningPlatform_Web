// Scripted adapter only. TODO: authenticated provider endpoint with bounded session memory,
// retention controls, structured output validation, and server-authoritative relationship rewards.
const scripts = {
  haruka: [
    {
      text: 'そうなんだ！ここの抹茶ラテ、おすすめだよ。',
      translation: 'I see! I recommend the matcha latte here.',
      options: ['抹茶ラテを一つください。', 'コーヒーはありますか？'],
    },
    {
      text: 'いいね！窓のそばに座ろう。日本語を勉強しているの？',
      translation: 'Nice! Let’s sit by the window. Are you studying Japanese?',
      options: ['はい、毎日少し勉強しています。', 'まだ始めたばかりです。'],
    },
    {
      text: 'すごい！また一緒に練習しようね。',
      translation: 'That’s great! Let’s practice together again.',
      options: [],
    },
  ],
  mateo: [
    {
      text: '¡Qué bien! ¿Quieres dar un paseo por el mercado?',
      translation: 'How nice! Would you like to walk around the market?',
      options: ['¡Sí, vamos!', '¿Qué me recomiendas?'],
    },
    {
      text: 'Podemos probar algo nuevo. Me encanta cocinar.',
      translation: 'We can try something new. I love cooking.',
      options: ['A mí también.', '¿Qué te gusta cocinar?'],
    },
    {
      text: '¡Seguimos otro día! Ha sido un placer.',
      translation: 'Let’s continue another day! It’s been a pleasure.',
      options: [],
    },
  ],
  elise: [
    {
      text: 'J’ai un petit roman parfait pour commencer.',
      translation: 'I have a short novel that’s perfect to start with.',
      options: ['Merci, je veux bien.', 'De quoi parle le livre ?'],
    },
    {
      text: 'C’est une histoire de voyage et d’amitié.',
      translation: 'It’s a story about travel and friendship.',
      options: ['Ça me plaît !', 'J’aime les voyages.'],
    },
    {
      text: 'Bonne lecture ! À très bientôt.',
      translation: 'Enjoy the book! See you very soon.',
      options: [],
    },
  ],
};
export const aiService = {
  async respond({ characterId, turn, message }) {
    if (typeof message !== 'string' || !message.trim() || message.length > 500)
      throw new Error('Write a response between 1 and 500 characters.');
    const line = scripts[characterId]?.[turn];
    if (!line) throw new Error('This sample scene has ended.');
    return { ...line, emotion: turn === 0 ? 'happy' : 'neutral', provider: 'scripted-preview' };
  },
};
