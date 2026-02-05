
import { Locale, DailyInsight, YearlyInsight, UserProfile, MonthlyInsight } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PREFIX = 'astro_v1_';

export const storage = {
  setLocale: (locale: Locale) => localStorage.setItem(`${PREFIX}locale`, locale),
  getLocale: (): Locale => (localStorage.getItem(`${PREFIX}locale`) as Locale) || 'en',
  
  setProfile: (profile: UserProfile) => localStorage.setItem(`${PREFIX}profile`, JSON.stringify(profile)),
  getProfile: (): UserProfile | null => {
    const data = localStorage.getItem(`${PREFIX}profile`);
    return data ? JSON.parse(data) : null;
  },
  
  getDailyCache: (uid: string, date: string, locale: Locale): DailyInsight | null => {
    const key = `${PREFIX}daily_${uid}_${date}_${locale}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  setDailyCache: (uid: string, insight: DailyInsight) => {
    const key = `${PREFIX}daily_${uid}_${insight.date}_${insight.locale}`;
    localStorage.setItem(key, JSON.stringify(insight));
  },
  
  getYearlyCache: (uid: string, year: number, locale: Locale): YearlyInsight | null => {
    const key = `${PREFIX}yearly_${uid}_${year}_${locale}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  setYearlyCache: (uid: string, insight: YearlyInsight) => {
    const key = `${PREFIX}yearly_${uid}_${insight.year}_${insight.locale}`;
    localStorage.setItem(key, JSON.stringify(insight));
  },

  // Monthly calendar insights (1 AI request per month)
  getMonthlyCache: (uid: string, year: number, month: number, locale: Locale): MonthlyInsight | null => {
    const key = `${PREFIX}monthly_${uid}_${year}_${month}_${locale}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  setMonthlyCache: (uid: string, insight: MonthlyInsight) => {
    const key = `${PREFIX}monthly_${uid}_${insight.year}_${insight.month}_${insight.locale}`;
    localStorage.setItem(key, JSON.stringify(insight));
  },

  // Firebase sync for user profiles
  async saveProfileToFirebase(profile: UserProfile): Promise<void> {
    try {
      const userRef = doc(db, 'users', profile.uid);
      await setDoc(userRef, {
        name: profile.name,
        email: profile.email,
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        birthPlace: profile.birthPlace,
        timezone: profile.timezone,
        locale: profile.locale,
        focusAreas: profile.focusAreas,
        computedProfile: profile.computedProfile,
        subscription: profile.subscription,
        updatedAt: new Date().toISOString()
      });
      console.log('Profile saved to Firebase');
    } catch (error) {
      console.error('Error saving profile to Firebase:', error);
      throw error;
    }
  },

  async getProfileFromFirebase(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        console.log('Profile loaded from Firebase');
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
          subscription: data.subscription
        };
      }
      
      console.log('No profile found in Firebase');
      return null;
    } catch (error) {
      console.error('Error loading profile from Firebase:', error);
      return null;
    }
  },

  clearAll: () => {
    localStorage.clear();
  }
};
