import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Screen, UserProfile, Locale } from './types';
import { storage } from './services/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { computeProfile } from './utils/astrology';
import { showAppOpenAd } from './services/admobAppOpen';
import WelcomeScreen from './screens/Welcome';
import SignInScreen from './screens/SignIn';
import LanguageSelectScreen from './screens/LanguageSelect';
import OnboardingScreen from './screens/Onboarding';
import DashboardScreen from './screens/Dashboard';
import CalendarScreen from './screens/Calendar';
import TarotScreen from './screens/Tarot';
import ProfileScreen from './screens/Profile';
import PremiumScreen from './screens/Premium';
import CompareScreen from './screens/Compare';
import EmptyReadingScreen from './screens/EmptyReading';
import DailyCardScreen from './screens/DailyCard';
import PastPresentFutureScreen from './screens/PastPresentFuture';
import YouThemEnergyScreen from './screens/YouThemEnergy';
import LoveReadingScreen from './screens/LoveReading';
import CareerReadingScreen from './screens/CareerReading';
import ShadowSessionScreen from './screens/ShadowSession';
import DeepReflectionScreen from './screens/DeepReflection';
import { colors } from './styles/theme';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('WELCOME');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tempUser, setTempUser] = useState<{ uid: string; name: string; email: string } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [appOpenAdShown, setAppOpenAdShown] = useState(false);

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const normalizeProfile = (profile: UserProfile | null): UserProfile | null => {
    if (!profile) return null;
    if (!profile.subscription) {
      const normalized = { ...profile, subscription: { isPremium: false } };
      storage.setProfile(normalized);
      return normalized;
    }
    return profile;
  };

  // Show App Open Ad when free user reaches Dashboard
  useEffect(() => {
    if (currentScreen === 'DASHBOARD' && userProfile && !userProfile.subscription?.isPremium && !appOpenAdShown) {
      setAppOpenAdShown(true);
      showAppOpenAd(false);
    }
  }, [currentScreen, userProfile, appOpenAdShown]);

  useEffect(() => {
    let profileUnsub: any = null;

    const unsub = onAuthStateChanged(auth, async (user) => {
      // Clear previous listener if any
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (user) {
        setTempUser({ uid: user.uid, name: user.displayName || '', email: user.email || '' });

        let existing = await storage.getProfile();

        if (!existing || existing.uid !== user.uid) {
          existing = await storage.getProfileFromFirebase(user.uid);
          if (existing) {
            const normalized = normalizeProfile(existing);
            if (normalized) await storage.setProfile(normalized);
            setUserProfile(normalized);
            setCurrentScreen('DASHBOARD');
          } else {
            setCurrentScreen('LANG_SELECT');
          }
        } else {
          if (!existing.computedProfile) {
            existing.computedProfile = computeProfile(existing.birthDate);
          }
          const normalized = normalizeProfile(existing);
          if (normalized) await storage.setProfile(normalized);
          setUserProfile(normalized);
          setCurrentScreen('DASHBOARD');
        }

        // --- REAL-TIME LISTENER FOR FIREBASE MANUAL UPDATES ---
        profileUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists() && existing) {
            const data = snap.data();
            setUserProfile((prev) => {
              if (!prev) return prev;
              const updated = { ...prev };
              let changed = false;

              if (data.subscription && JSON.stringify(data.subscription) !== JSON.stringify(prev.subscription)) {
                updated.subscription = data.subscription;
                changed = true;
              }
              if (data.name && data.name !== prev.name) {
                updated.name = data.name;
                changed = true;
              }

              if (changed) {
                storage.setProfile(updated); // arka planda cache'i güncelle
                return updated;
              }
              return prev;
            });
          }
        });

      } else {
        setUserProfile(null);
        setTempUser(null);
        setCurrentScreen((prev) => (prev !== 'WELCOME' && prev !== 'SIGN_IN' ? 'WELCOME' : prev));
      }
      setInitialized(true);
    });

    return () => {
      unsub();
      if (profileUnsub) {
        profileUnsub();
      }
    };
  }, []);

  const handleLanguageSelect = (lang: Locale) => {
    storage.setLocale(lang);
    navigate('ONBOARDING');
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    await storage.setProfile(profile);
    try { await storage.saveProfileToFirebase(profile); } catch { }
    navigate('DASHBOARD');
  };

  const handleLogout = async () => {
    await storage.clearAll();
    setUserProfile(null);
    setTempUser(null);
    setAppOpenAdShown(false);
    navigate('WELCOME');
  };

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    await storage.saveProfile(updatedProfile);
    try { await storage.saveProfileToFirebase(updatedProfile); } catch { }
  };

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', letterSpacing: 3, marginTop: 16, textTransform: 'uppercase' }}>
          Syncing Stars...
        </Text>
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'WELCOME': return <WelcomeScreen onContinue={() => navigate('SIGN_IN')} />;
      case 'SIGN_IN': return <SignInScreen onBack={() => navigate('WELCOME')} />;
      case 'LANG_SELECT': return <LanguageSelectScreen onSelect={handleLanguageSelect} />;
      case 'ONBOARDING': return <OnboardingScreen uid={tempUser?.uid || 'guest'} initialName={tempUser?.name || ''} onComplete={handleOnboardingComplete} onBack={() => navigate('LANG_SELECT')} />;
      case 'DASHBOARD': return userProfile ? <DashboardScreen profile={userProfile} navigate={navigate} /> : null;
      case 'CALENDAR': return <CalendarScreen profile={userProfile} navigate={navigate} />;
      case 'TAROT': return userProfile ? <TarotScreen profile={userProfile} navigate={navigate} /> : null;
      case 'PROFILE': return userProfile ? <ProfileScreen profile={userProfile} onLogout={handleLogout} navigate={navigate} onProfileUpdate={handleProfileUpdate} /> : null;
      case 'PREMIUM': return <PremiumScreen onClose={() => navigate('DASHBOARD')} profile={userProfile} />;
      case 'COMPARE': return userProfile ? <CompareScreen profile={userProfile} navigate={navigate} /> : null;
      case 'EMPTY_READING': return <EmptyReadingScreen route={{} as any} navigate={navigate} />;
      case 'DAILY_CARD': return userProfile ? <DailyCardScreen profile={userProfile} navigate={navigate} /> : null;
      case 'PAST_PRESENT_FUTURE': return userProfile ? <PastPresentFutureScreen profile={userProfile} navigate={navigate} /> : null;
      case 'YOU_THEM_ENERGY': return userProfile ? <YouThemEnergyScreen profile={userProfile} navigate={navigate} /> : null;
      case 'LOVE_READING': return userProfile ? <LoveReadingScreen profile={userProfile} navigate={navigate} /> : null;
      case 'CAREER_READING': return userProfile ? <CareerReadingScreen profile={userProfile} navigate={navigate} /> : null;
      case 'SHADOW_READING': return userProfile ? <ShadowSessionScreen profile={userProfile} navigate={navigate} /> : null;
      case 'DEEP_REFLECTION': return userProfile ? <DeepReflectionScreen profile={userProfile} navigate={navigate} /> : null;
      default: return <WelcomeScreen onContinue={() => navigate('SIGN_IN')} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark }}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
};

export default App;
