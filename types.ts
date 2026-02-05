
export type Screen = 'WELCOME' | 'SIGN_IN' | 'LANG_SELECT' | 'ONBOARDING' | 'DASHBOARD' | 'CALENDAR' | 'PROFILE' | 'PREMIUM' | 'COMPARE';

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
