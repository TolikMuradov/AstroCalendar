export interface TarotCard {
  id: number;
  name: string;
  nameTr: string;
  nameTh: string;
  emoji: string;
  keywords: string[];
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  gradient: string; // CSS gradient for card background
}

// Major Arcana (22 cards)
const majorArcana: TarotCard[] = [
  { id: 0, name: 'The Fool', nameTr: 'Deli', nameTh: 'คนโง่', emoji: '🃏', keywords: ['new beginnings', 'innocence', 'adventure'], arcana: 'major', gradient: 'from-yellow-400/30 via-cyan-400/20 to-purple-500/30' },
  { id: 1, name: 'The Magician', nameTr: 'Sihirbaz', nameTh: 'นักมายากล', emoji: '✨', keywords: ['willpower', 'manifestation', 'skill'], arcana: 'major', gradient: 'from-amber-500/30 via-red-500/20 to-purple-600/30' },
  { id: 2, name: 'The High Priestess', nameTr: 'Başrahibe', nameTh: 'นักบวชหญิง', emoji: '🌙', keywords: ['intuition', 'mystery', 'inner knowledge'], arcana: 'major', gradient: 'from-indigo-500/30 via-blue-600/20 to-violet-600/30' },
  { id: 3, name: 'The Empress', nameTr: 'İmparatoriçe', nameTh: 'จักรพรรดินี', emoji: '👑', keywords: ['abundance', 'nature', 'fertility'], arcana: 'major', gradient: 'from-emerald-500/30 via-green-400/20 to-teal-500/30' },
  { id: 4, name: 'The Emperor', nameTr: 'İmparator', nameTh: 'จักรพรรดิ', emoji: '🏛️', keywords: ['authority', 'structure', 'stability'], arcana: 'major', gradient: 'from-red-600/30 via-orange-500/20 to-amber-600/30' },
  { id: 5, name: 'The Hierophant', nameTr: 'Aziz', nameTh: 'พระสันตะปาปา', emoji: '📿', keywords: ['tradition', 'guidance', 'wisdom'], arcana: 'major', gradient: 'from-purple-600/30 via-indigo-500/20 to-blue-600/30' },
  { id: 6, name: 'The Lovers', nameTr: 'Aşıklar', nameTh: 'คู่รัก', emoji: '💕', keywords: ['love', 'harmony', 'choices'], arcana: 'major', gradient: 'from-pink-500/30 via-rose-400/20 to-red-400/30' },
  { id: 7, name: 'The Chariot', nameTr: 'Savaş Arabası', nameTh: 'รถศึก', emoji: '⚡', keywords: ['determination', 'victory', 'control'], arcana: 'major', gradient: 'from-sky-500/30 via-blue-500/20 to-indigo-500/30' },
  { id: 8, name: 'Strength', nameTr: 'Güç', nameTh: 'พลัง', emoji: '🦁', keywords: ['courage', 'patience', 'inner strength'], arcana: 'major', gradient: 'from-orange-500/30 via-amber-400/20 to-yellow-500/30' },
  { id: 9, name: 'The Hermit', nameTr: 'Ermiş', nameTh: 'ฤๅษี', emoji: '🏔️', keywords: ['solitude', 'reflection', 'inner guidance'], arcana: 'major', gradient: 'from-slate-500/30 via-gray-500/20 to-blue-800/30' },
  { id: 10, name: 'Wheel of Fortune', nameTr: 'Kader Çarkı', nameTh: 'วงล้อแห่งโชคชะตา', emoji: '🎡', keywords: ['destiny', 'cycles', 'turning point'], arcana: 'major', gradient: 'from-violet-500/30 via-purple-400/20 to-fuchsia-500/30' },
  { id: 11, name: 'Justice', nameTr: 'Adalet', nameTh: 'ความยุติธรรม', emoji: '⚖️', keywords: ['fairness', 'truth', 'balance'], arcana: 'major', gradient: 'from-blue-500/30 via-cyan-400/20 to-teal-500/30' },
  { id: 12, name: 'The Hanged Man', nameTr: 'Asılan Adam', nameTh: 'ชายที่ถูกแขวน', emoji: '🔮', keywords: ['surrender', 'new perspective', 'letting go'], arcana: 'major', gradient: 'from-teal-500/30 via-emerald-400/20 to-cyan-600/30' },
  { id: 13, name: 'Death', nameTr: 'Ölüm', nameTh: 'ความตาย', emoji: '🦋', keywords: ['transformation', 'ending', 'rebirth'], arcana: 'major', gradient: 'from-gray-700/30 via-purple-900/20 to-black/30' },
  { id: 14, name: 'Temperance', nameTr: 'Denge', nameTh: 'ความพอดี', emoji: '🌈', keywords: ['balance', 'patience', 'moderation'], arcana: 'major', gradient: 'from-sky-400/30 via-purple-400/20 to-pink-400/30' },
  { id: 15, name: 'The Devil', nameTr: 'Şeytan', nameTh: 'ปีศาจ', emoji: '🔗', keywords: ['bondage', 'materialism', 'shadow self'], arcana: 'major', gradient: 'from-red-900/30 via-gray-800/20 to-orange-900/30' },
  { id: 16, name: 'The Tower', nameTr: 'Kule', nameTh: 'หอคอย', emoji: '🌩️', keywords: ['upheaval', 'revelation', 'sudden change'], arcana: 'major', gradient: 'from-red-600/30 via-gray-700/20 to-yellow-600/30' },
  { id: 17, name: 'The Star', nameTr: 'Yıldız', nameTh: 'ดาว', emoji: '⭐', keywords: ['hope', 'inspiration', 'serenity'], arcana: 'major', gradient: 'from-cyan-400/30 via-blue-300/20 to-indigo-400/30' },
  { id: 18, name: 'The Moon', nameTr: 'Ay', nameTh: 'พระจันทร์', emoji: '🌕', keywords: ['illusion', 'intuition', 'subconscious'], arcana: 'major', gradient: 'from-indigo-600/30 via-purple-500/20 to-blue-700/30' },
  { id: 19, name: 'The Sun', nameTr: 'Güneş', nameTh: 'พระอาทิตย์', emoji: '☀️', keywords: ['joy', 'success', 'vitality'], arcana: 'major', gradient: 'from-yellow-400/30 via-orange-400/20 to-amber-400/30' },
  { id: 20, name: 'Judgement', nameTr: 'Mahkeme', nameTh: 'การพิพากษา', emoji: '📯', keywords: ['rebirth', 'calling', 'absolution'], arcana: 'major', gradient: 'from-amber-500/30 via-white/10 to-sky-500/30' },
  { id: 21, name: 'The World', nameTr: 'Dünya', nameTh: 'โลก', emoji: '🌍', keywords: ['completion', 'accomplishment', 'wholeness'], arcana: 'major', gradient: 'from-emerald-400/30 via-blue-400/20 to-purple-400/30' },
];

// Minor Arcana suits
const suitConfig = {
  wands: { emoji: '🔥', element: 'Fire', gradientBase: 'from-red-500/25 via-orange-400/15 to-amber-500/25' },
  cups: { emoji: '💧', element: 'Water', gradientBase: 'from-blue-500/25 via-cyan-400/15 to-teal-500/25' },
  swords: { emoji: '💨', element: 'Air', gradientBase: 'from-sky-400/25 via-slate-400/15 to-indigo-500/25' },
  pentacles: { emoji: '🌿', element: 'Earth', gradientBase: 'from-emerald-500/25 via-green-400/15 to-lime-500/25' },
};

const suitNames = {
  wands: { en: 'Wands', tr: 'Asalar', th: 'ไม้เท้า' },
  cups: { en: 'Cups', tr: 'Kupalar', th: 'ถ้วย' },
  swords: { en: 'Swords', tr: 'Kılıçlar', th: 'ดาบ' },
  pentacles: { en: 'Pentacles', tr: 'Tılsımlar', th: 'เหรียญ' },
};

const rankNames: { rank: string; rankTr: string; rankTh: string; keywords: string[] }[] = [
  { rank: 'Ace', rankTr: 'As', rankTh: 'เอซ', keywords: ['beginning', 'potential', 'opportunity'] },
  { rank: 'Two', rankTr: 'İki', rankTh: 'สอง', keywords: ['balance', 'duality', 'partnership'] },
  { rank: 'Three', rankTr: 'Üç', rankTh: 'สาม', keywords: ['growth', 'creativity', 'collaboration'] },
  { rank: 'Four', rankTr: 'Dört', rankTh: 'สี่', keywords: ['stability', 'foundation', 'structure'] },
  { rank: 'Five', rankTr: 'Beş', rankTh: 'ห้า', keywords: ['conflict', 'challenge', 'change'] },
  { rank: 'Six', rankTr: 'Altı', rankTh: 'หก', keywords: ['harmony', 'communication', 'transition'] },
  { rank: 'Seven', rankTr: 'Yedi', rankTh: 'เจ็ด', keywords: ['reflection', 'assessment', 'patience'] },
  { rank: 'Eight', rankTr: 'Sekiz', rankTh: 'แปด', keywords: ['movement', 'progress', 'mastery'] },
  { rank: 'Nine', rankTr: 'Dokuz', rankTh: 'เก้า', keywords: ['fulfillment', 'attainment', 'near completion'] },
  { rank: 'Ten', rankTr: 'On', rankTh: 'สิบ', keywords: ['completion', 'ending', 'legacy'] },
  { rank: 'Page', rankTr: 'Şövalye Çırağı', rankTh: 'เพจ', keywords: ['curiosity', 'message', 'learning'] },
  { rank: 'Knight', rankTr: 'Şövalye', rankTh: 'อัศวิน', keywords: ['action', 'pursuit', 'adventure'] },
  { rank: 'Queen', rankTr: 'Kraliçe', rankTh: 'ราชินี', keywords: ['nurturing', 'mastery', 'intuition'] },
  { rank: 'King', rankTr: 'Kral', rankTh: 'ราชา', keywords: ['leadership', 'authority', 'experience'] },
];

// Generate Minor Arcana cards
function generateMinorArcana(): TarotCard[] {
  const cards: TarotCard[] = [];
  let id = 22; // Start after Major Arcana

  for (const suit of ['wands', 'cups', 'swords', 'pentacles'] as const) {
    const config = suitConfig[suit];
    const names = suitNames[suit];

    for (const rank of rankNames) {
      cards.push({
        id: id++,
        name: `${rank.rank} of ${names.en}`,
        nameTr: `${names.tr} ${rank.rankTr}`,
        nameTh: `${rank.rankTh}แห่ง${names.th}`,
        emoji: config.emoji,
        keywords: rank.keywords,
        arcana: 'minor',
        suit,
        gradient: config.gradientBase,
      });
    }
  }

  return cards;
}

export const TAROT_DECK: TarotCard[] = [...majorArcana, ...generateMinorArcana()];

export function getCardName(card: TarotCard, locale: string): string {
  if (locale === 'tr') return card.nameTr;
  if (locale === 'th') return card.nameTh;
  return card.name;
}

export function drawRandomCard(excludeIds: number[] = []): TarotCard {
  const available = TAROT_DECK.filter(c => !excludeIds.includes(c.id));
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

export function getSuitEmoji(suit?: string): string {
  if (!suit) return '🔮';
  return suitConfig[suit as keyof typeof suitConfig]?.emoji || '🔮';
}

export function getSuitName(suit: string, locale: string): string {
  const names = suitNames[suit as keyof typeof suitNames];
  if (!names) return suit;
  if (locale === 'tr') return names.tr;
  if (locale === 'th') return names.th;
  return names.en;
}
