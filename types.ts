export type Screen = 'WELCOME' | 'SIGN_IN' | 'LANG_SELECT' | 'ONBOARDING' | 'DASHBOARD' | 'CALENDAR' | 'TAROT' | 'PROFILE' | 'PREMIUM' | 'COMPARE' | 'EMPTY_READING' | 'DAILY_CARD' | 'PAST_PRESENT_FUTURE' | 'YOU_THEM_ENERGY' | 'LOVE_READING' | 'CAREER_READING' | 'SHADOW_READING' | 'DEEP_REFLECTION';

export type Locale = 'en' | 'tr' | 'th' | 'es' | 'fr' | 'de' | 'ja';

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string | null;
  birthPlace?: string | null;
  timezone: string;
  locale: Locale;
  focusAreas: string[];
  computedProfile: ComputedProfile;
  subscription: {
    isPremium: boolean;
  };
}

export interface ComputedProfile {
  westernZodiac: {
    sign: string;
    element: string;
  };
  chineseZodiac: {
    animal: string;
    element: string;
    yinYang: string;
  };
}

export interface DailyInsight {
  date: string;
  locale: Locale;
  energyScore: number;
  title: string;
  description: string;
  color: string;
  luckyNumbers: number[]; // Array for 3 numbers
  focusOn: string[];
  avoid: string[];
  ritual: {
    title: string;
    steps: string[];
  };
  generatedAt: string;
}

export interface YearlyInsight {
  year: number;
  locale: Locale;
  theme: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface ComparisonResult {
  harmonyScore: number;
  summary: string;
  strengths: string[];
  challenges: string[];
}

// Coin System Types
export interface RewardInfo {
  lastRewardDate: string; // ISO date, e.g. "2026-02-11"
  rewardCountToday: number; // coins earned today, default 0
}

export interface CoinData {
  coins: number;
  reward: RewardInfo;
}

export const DAILY_REWARD_LIMIT = 10; // max ad rewards per day
export const COINS_PER_AD = 1; // coins earned per rewarded ad
export const LUCKY_LOCKED_COST = 1; // coins to unlock a locked lucky number
export const TAROT_READING_COST = 0; // Daily card is free
export const TAROT_SPREAD_COST = 10; // Specialized spreads cost 10 coins
export const CAREER_SPREAD_COST = 12; // Career & Money spread costs 12 coins
export const SHADOW_FIRST_COST = 12; // Shadow Energy first session cost
export const SHADOW_SESSION_COST = 18; // Shadow Energy subsequent session cost
export const SHADOW_REFLECTION_COST = 2; // Shadow Energy reflection cost
export const DEEP_REF_SESSION_COST = 25; // Deep Reflection session entry cost
export const DEEP_REF_ACTION_COST = 5; // Deep Reflection each action cost

// Tarot Reading Types
export interface TarotReading {
  id: string; // unique reading ID
  cardId: number; // drawn card ID from deck
  cardName: string; // card name in user's locale
  isReversed: boolean; // upright or reversed
  interpretation: string; // AI-generated interpretation
  guidance: string; // AI-generated guidance/advice
  affirmation: string; // AI-generated affirmation
  date: string; // ISO date
  locale: Locale;
  generatedAt: string;
}

export interface DailyTarotReading {
  id: string; // unique reading ID
  cardId: number; // drawn card ID
  cardName: string; // card name in user locale
  isReversed: boolean;
  overallEnergy: string;
  emotionalTone: string;
  subtleAdvice: string;
  date: string; // ISO date
  locale: Locale;
  generatedAt: string;
}

export interface PPFCardData {
  id: number;
  name: string;
  isReversed: boolean;
  keywords: string[];
  cardMeaning: string;
  personalInterpretation: string;
}

export interface PastPresentFutureReading {
  id: string;
  category: string;
  readingContext?: string;
  pastCard: PPFCardData;
  presentCard: PPFCardData;
  futureCard: PPFCardData;
  finalIntegration: string;
  date: string;
  locale: Locale;
  generatedAt: string;
}

export interface YTECardData {
  id: number;
  name: string;
  isReversed: boolean;
  keywords: string[];
  cardMeaning: string;
  personalInterpretation: string;
}

export interface YouThemEnergyReading {
  id: string;
  personName: string;
  relationship: string;
  youCard: YTECardData;
  themCard: YTECardData;
  energyCard: YTECardData;
  finalIntegration: string;
  date: string;
  locale: Locale;
  generatedAt: string;
}

export interface CareerDiagnostic {
  workSituation: string;
  financialStress: string;
  internalObstacle: string;
  mainWorry?: string;
}

export interface CareerCardData {
  id: number;
  name: string;
  isReversed: boolean;
  keywords: string[];
  objectiveMeaning: string;
  directAssessment: string;
}

export interface CareerReading {
  id: string;
  diagnostic: CareerDiagnostic;
  currentPositionCard: CareerCardData;
  hiddenBlockCard: CareerCardData;
  opportunityCard: CareerCardData;
  finalSynthesis: string;
  date: string;
  locale: Locale;
  generatedAt: string;
}

export interface LoveCardData {
  id: number;
  name: string;
  isReversed: boolean;
  keywords: string[];
  cardMeaning: string;
  personalInterpretation: string;
}

export interface LoveReading {
  id: string;
  partnerName: string;
  heartCard: LoveCardData;
  connectionCard: LoveCardData;
  futureCard: LoveCardData;
  finalIntegration: string;
  date: string;
  locale: Locale;
  generatedAt: string;
}

// Monthly Calendar Spiritual Insights (1 AI request per month per user)
export interface MonthlyDayInsight {
  day: number;
  dayType: 'cleansing' | 'manifestation' | 'rest' | 'action' | 'reflection' | 'social' | 'gratitude' | 'creativity';
  message: string; // Daily spiritual/motivational message
  stone: string; // Crystal/stone name for the day
  stoneEnergy: string; // What energy this stone brings
  activity: string; // Recommended activity 
  drink: string; // Recommended drink (no meat suggestions)
  wearColor: string; // Color to wear today
  affirmation: string; // Daily affirmation
  isWeekend: boolean;
  weekendTip?: string; // "Stay home and recharge" or "Go out and socialize"
}

export interface MonthlyInsight {
  year: number;
  month: number; // 1-12
  locale: Locale;
  monthTheme: string; // Overall theme for the month
  days: MonthlyDayInsight[];
  generatedAt: string;
}

// Shadow Energy Types
export interface ShadowCardData {
  id: number;
  name: string;
  isReversed: boolean;
  keywords: string[];
}

export interface ShadowSession {
  id: string;
  userId: string;
  date: string;
  question1: string;
  answer1: string;
  question2: string;
  answer2: string;
  mainCard: ShadowCardData;
  mainText: string;
  intensityScore: number;
  secretCard: ShadowCardData | null;
  secretText: string | null;
  integrationText: string;
  locale: Locale;
  generatedAt: string;
}

export interface ShadowReflection {
  id: string;
  sessionId: string;
  date: string;
  userReflectionText: string;
  aiFollowupText: string;
  locale: Locale;
  generatedAt: string;
}

// Deep Reflection Types
export type DeepRefActionType = 'initial' | 'go_deeper' | 'reveal_card' | 'examine_role' | 'see_their_energy';

export interface DeepRefMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  actionType?: DeepRefActionType;
  cardName?: string;
  cardIsReversed?: boolean;
  timestamp: string;
}

export interface DeepRefSession {
  id: string;
  userId: string;
  date: string;
  initialText: string;
  messages: DeepRefMessage[];
  coinsSpentTotal: number;
  actionCount: number;
  status: 'active' | 'closed';
  locale: Locale;
  createdAt: string;
  closedAt?: string;
}
