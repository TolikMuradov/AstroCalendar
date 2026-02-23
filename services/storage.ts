import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale, DailyInsight, YearlyInsight, UserProfile, MonthlyInsight, TarotReading, DailyTarotReading, PastPresentFutureReading, YouThemEnergyReading } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PREFIX = 'astro_v1_';

export const storage = {
  async setLocale(locale: Locale): Promise<void> {
    await AsyncStorage.setItem(`${PREFIX}locale`, locale);
  },
  async getLocale(): Promise<Locale> {
    const val = await AsyncStorage.getItem(`${PREFIX}locale`);
    return (val as Locale) || 'en';
  },

  async setProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(`${PREFIX}profile`, JSON.stringify(profile));
  },
  async saveProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(`${PREFIX}profile`, JSON.stringify(profile));
  },
  async getProfile(): Promise<UserProfile | null> {
    const data = await AsyncStorage.getItem(`${PREFIX}profile`);
    return data ? JSON.parse(data) : null;
  },

  async getDailyCache(uid: string, date: string, locale: Locale): Promise<DailyInsight | null> {
    const key = `${PREFIX}daily_${uid}_${date}_${locale}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async setDailyCache(uid: string, insight: DailyInsight): Promise<void> {
    const key = `${PREFIX}daily_${uid}_${insight.date}_${insight.locale}`;
    await AsyncStorage.setItem(key, JSON.stringify(insight));
  },

  async getYearlyCache(uid: string, year: number, locale: Locale): Promise<YearlyInsight | null> {
    const key = `${PREFIX}yearly_${uid}_${year}_${locale}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async setYearlyCache(uid: string, insight: YearlyInsight): Promise<void> {
    const key = `${PREFIX}yearly_${uid}_${insight.year}_${insight.locale}`;
    await AsyncStorage.setItem(key, JSON.stringify(insight));
  },

  async getMonthlyCache(uid: string, year: number, month: number, locale: Locale): Promise<MonthlyInsight | null> {
    const key = `${PREFIX}monthly_${uid}_${year}_${month}_${locale}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async setMonthlyCache(uid: string, insight: MonthlyInsight): Promise<void> {
    const key = `${PREFIX}monthly_${uid}_${insight.year}_${insight.month}_${insight.locale}`;
    await AsyncStorage.setItem(key, JSON.stringify(insight));
  },

  async getTarotHistory(uid: string): Promise<TarotReading[]> {
    const key = `${PREFIX}tarot_history_${uid}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  async saveTarotReading(uid: string, reading: TarotReading): Promise<void> {
    const key = `${PREFIX}tarot_history_${uid}`;
    const history = await storage.getTarotHistory(uid);
    history.unshift(reading);
    const trimmed = history.slice(0, 50);
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
  },
  async getDailyTarotReading(uid: string, date: string): Promise<TarotReading | null> {
    const history = await storage.getTarotHistory(uid);
    return history.find(r => r.date === date) || null;
  },

  async getDailyFreeTarot(uid: string, date: string): Promise<DailyTarotReading | null> {
    const key = `${PREFIX}daily_tarot_${uid}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async saveDailyFreeTarot(uid: string, reading: DailyTarotReading): Promise<void> {
    const key = `${PREFIX}daily_tarot_${uid}_${reading.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(reading));
  },

  async getPastPresentFutureReading(uid: string, date: string): Promise<PastPresentFutureReading | null> {
    const key = `${PREFIX}ppf_tarot_${uid}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async savePastPresentFutureReading(uid: string, reading: PastPresentFutureReading): Promise<void> {
    const key = `${PREFIX}ppf_tarot_${uid}_${reading.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(reading));
  },

  async getYouThemEnergyReading(uid: string, date: string): Promise<YouThemEnergyReading | null> {
    const key = `${PREFIX}yte_tarot_${uid}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async saveYouThemEnergyReading(uid: string, reading: YouThemEnergyReading): Promise<void> {
    const key = `${PREFIX}yte_tarot_${uid}_${reading.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(reading));
  },

  // Generic spread completion tracking (for non-PPF spreads)
  async getSpreadReading(uid: string, spreadType: string, date: string): Promise<any | null> {
    const key = `${PREFIX}spread_${spreadType}_${uid}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async saveSpreadReading(uid: string, spreadType: string, reading: any): Promise<void> {
    const key = `${PREFIX}spread_${spreadType}_${uid}_${reading.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(reading));
  },

  // Check all spread completions for today
  async getTodaySpreadStatus(uid: string): Promise<Record<string, boolean>> {
    const today = new Date().toISOString().split('T')[0];
    const spreads = ['past_present_future', 'you_them_energy', 'love_reading', 'career_money', 'shadow_energy', 'fate_choose'];
    const status: Record<string, boolean> = {};

    // Check daily free tarot
    const daily = await storage.getDailyFreeTarot(uid, today);
    status['daily'] = !!daily;

    // Check PPF
    const ppf = await storage.getPastPresentFutureReading(uid, today);
    status['past_present_future'] = !!ppf;

    // Check YTE
    const yte = await storage.getYouThemEnergyReading(uid, today);
    status['you_them_energy'] = !!yte;

    // Check other spreads
    for (const spread of spreads) {
      if (spread === 'past_present_future' || spread === 'you_them_energy') continue;
      const data = await storage.getSpreadReading(uid, spread, today);
      status[spread] = !!data;
    }

    return status;
  },

  async saveProfileToFirebase(profile: UserProfile): Promise<void> {
    try {
      const userRef = doc(db, 'users', profile.uid);
      const data: Record<string, unknown> = {
        name: profile.name,
        birthDate: profile.birthDate,
        timezone: profile.timezone,
        locale: profile.locale,
        focusAreas: profile.focusAreas || [],
        computedProfile: profile.computedProfile,
        subscription: profile.subscription || { isPremium: false },
        updatedAt: new Date().toISOString(),
      };
      if (profile.email) data.email = profile.email;
      if (profile.birthTime) data.birthTime = profile.birthTime;
      if (profile.birthPlace) data.birthPlace = profile.birthPlace;
      await setDoc(userRef, data);
    } catch (error) {
      console.warn('Firebase save skipped:', error instanceof Error ? error.message : error);
    }
  },

  async getProfileFromFirebase(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          uid,
          name: data.name,
          email: data.email,
          birthDate: data.birthDate,
          birthTime: data.birthTime,
          birthPlace: data.birthPlace,
          timezone: data.timezone,
          locale: data.locale,
          focusAreas: data.focusAreas,
          computedProfile: data.computedProfile,
          subscription: data.subscription,
        };
      }
      return null;
    } catch (error) {
      console.warn('Firebase read skipped:', error instanceof Error ? error.message : error);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(k => k.startsWith(PREFIX));
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
    }
  },
};
