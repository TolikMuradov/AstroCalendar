import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale, DailyInsight, YearlyInsight, UserProfile, MonthlyInsight, TarotReading, DailyTarotReading, PastPresentFutureReading, YouThemEnergyReading, LoveReading, CareerReading, ShadowSession, ShadowReflection, DeepRefSession } from '../types';
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

  async getLoveReading(uid: string, date: string): Promise<LoveReading | null> {
    const key = `${PREFIX}love_tarot_${uid}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async saveLoveReading(uid: string, reading: LoveReading): Promise<void> {
    const key = `${PREFIX}love_tarot_${uid}_${reading.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(reading));
  },

  async getCareerReading(uid: string, date: string): Promise<CareerReading | null> {
    const key = `${PREFIX}career_tarot_${uid}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async saveCareerReading(uid: string, reading: CareerReading): Promise<void> {
    const key = `${PREFIX}career_tarot_${uid}_${reading.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(reading));
  },

  // Shadow Energy session storage
  async getShadowSession(uid: string, date: string): Promise<ShadowSession | null> {
    const key = `${PREFIX}shadow_session_${uid}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async saveShadowSession(uid: string, session: ShadowSession): Promise<void> {
    const key = `${PREFIX}shadow_session_${uid}_${session.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(session));
  },
  async getYesterdayShadowSession(uid: string): Promise<ShadowSession | null> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    return storage.getShadowSession(uid, dateStr);
  },

  // Shadow Energy reflection storage
  async getShadowReflection(sessionId: string): Promise<ShadowReflection | null> {
    const key = `${PREFIX}shadow_reflection_${sessionId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async saveShadowReflection(reflection: ShadowReflection): Promise<void> {
    const key = `${PREFIX}shadow_reflection_${reflection.sessionId}`;
    await AsyncStorage.setItem(key, JSON.stringify(reflection));
  },

  // Shadow first-use tracking
  async isShadowFirstUsed(uid: string): Promise<boolean> {
    const key = `${PREFIX}shadow_first_used_${uid}`;
    const val = await AsyncStorage.getItem(key);
    return val === 'true';
  },
  async markShadowFirstUsed(uid: string): Promise<void> {
    const key = `${PREFIX}shadow_first_used_${uid}`;
    await AsyncStorage.setItem(key, 'true');
  },

  // Deep Reflection session (no resume — only save on close)
  async saveDeepRefSession(session: DeepRefSession): Promise<void> {
    const key = `${PREFIX}deep_ref_${session.userId}_${session.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(session));
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

    // Check Love Reading
    const love = await storage.getLoveReading(uid, today);
    status['love_reading'] = !!love;

    // Check Career Reading
    const career = await storage.getCareerReading(uid, today);
    status['career_money'] = !!career;

    // Check Shadow Session
    const shadow = await storage.getShadowSession(uid, today);
    status['shadow_energy'] = !!shadow;

    // Check other spreads
    for (const spread of spreads) {
      if (spread === 'past_present_future' || spread === 'you_them_energy' || spread === 'love_reading' || spread === 'career_money' || spread === 'shadow_energy') continue;
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
