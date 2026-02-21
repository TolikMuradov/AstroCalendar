
export type Screen = 'WELCOME' | 'SIGN_IN' | 'LANG_SELECT' | 'ONBOARDING' | 'DASHBOARD' | 'CALENDAR' | 'TAROT' | 'PROFILE' | 'PREMIUM' | 'COMPARE';

export type Locale = 'en' | 'tr' | 'th';

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

export const DAILY_REWARD_LIMIT = 3; // max ad rewards per day
export const COINS_PER_AD = 1; // coins earned per rewarded ad
export const LUCKY_LOCKED_COST = 1; // coins to unlock a locked lucky number
export const TAROT_READING_COST = 6; // coins for a tarot reading (free users)

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
