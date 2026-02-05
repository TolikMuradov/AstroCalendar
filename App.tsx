
import React, { useState, useEffect } from 'react';
import { Screen, UserProfile, Locale } from './types';
import { storage } from './services/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { computeProfile } from './utils/astrology';
import WelcomeScreen from './screens/Welcome';
import SignInScreen from './screens/SignIn';
import LanguageSelectScreen from './screens/LanguageSelect';
import OnboardingScreen from './screens/Onboarding';
import DashboardScreen from './screens/Dashboard';
import CalendarScreen from './screens/Calendar';
import ProfileScreen from './screens/Profile';
import PremiumScreen from './screens/Premium';
import CompareScreen from './screens/Compare';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('WELCOME');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(storage.getProfile());
  const [tempUser, setTempUser] = useState<{uid: string, name: string, email: string} | null>(null);
  const [initialized, setInitialized] = useState(false);

  const navigate = (screen: Screen) => setCurrentScreen(screen);

  useEffect(() => {
    // Auth observer: check Firebase for existing profile
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setTempUser({ uid: user.uid, name: user.displayName || '', email: user.email || '' });
        
        // First check localStorage
        let existing = storage.getProfile();
        
        // If not in localStorage or different user, check Firebase
        if (!existing || existing.uid !== user.uid) {
          console.log('Checking Firebase for user profile...');
          existing = await storage.getProfileFromFirebase(user.uid);
          
          if (existing) {
            // Profile found in Firebase, save to localStorage
            storage.setProfile(existing);
            setUserProfile(existing);
            console.log('Profile loaded from Firebase, navigating to Dashboard');
            setCurrentScreen(prev => (prev === 'WELCOME' || prev === 'SIGN_IN' ? 'DASHBOARD' : prev));
          } else {
            // No profile in Firebase, need onboarding
            console.log('No profile found, need onboarding');
            // SignIn component will navigate to LANG_SELECT
          }
        } else {
          // Profile exists in localStorage
          if (!existing.computedProfile) {
            existing.computedProfile = computeProfile(existing.birthDate);
            storage.setProfile(existing);
          }
          setUserProfile(existing);
          setCurrentScreen(prev => (prev === 'WELCOME' || prev === 'SIGN_IN' ? 'DASHBOARD' : prev));
        }
      } else {
        // Logged out
        setUserProfile(null);
        setTempUser(null);
        setCurrentScreen(prev => 
          (prev !== 'WELCOME' && prev !== 'SIGN_IN') ? 'WELCOME' : prev
        );
      }
      setInitialized(true);
    });
    return unsub;
  }, []); // Only run once on mount

  const handleLanguageSelect = (lang: Locale) => {
    storage.setLocale(lang);
    navigate('ONBOARDING');
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    storage.setProfile(profile);
    
    // Save to Firebase
    try {
      await storage.saveProfileToFirebase(profile);
      console.log('Profile saved to Firebase successfully');
    } catch (error) {
      console.error('Failed to save profile to Firebase:', error);
      // Still continue even if Firebase save fails
    }
    
    navigate('DASHBOARD');
  };

  const handleLogout = () => {
    storage.clearAll();
    setUserProfile(null);
    setTempUser(null);
    navigate('WELCOME');
  };

  if (!initialized) return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-white">
      <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Syncing Stars...</p>
    </div>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'WELCOME': 
        return <WelcomeScreen onContinue={() => navigate('SIGN_IN')} />;
      case 'SIGN_IN': 
        return <SignInScreen onBack={() => navigate('WELCOME')} onSignIn={() => navigate('LANG_SELECT')} />;
      case 'LANG_SELECT': 
        return <LanguageSelectScreen onSelect={handleLanguageSelect} />;
      case 'ONBOARDING': 
        return <OnboardingScreen uid={tempUser?.uid || 'guest'} initialName={tempUser?.name || ''} onComplete={handleOnboardingComplete} onBack={() => navigate('LANG_SELECT')} />;
      case 'DASHBOARD': 
        return userProfile ? <DashboardScreen profile={userProfile} navigate={navigate} /> : null;
      case 'CALENDAR': 
        return <CalendarScreen profile={userProfile} navigate={navigate} />;
      case 'PROFILE': 
        return userProfile ? <ProfileScreen profile={userProfile} onLogout={handleLogout} navigate={navigate} /> : null;
      case 'PREMIUM': 
        return <PremiumScreen onClose={() => navigate('DASHBOARD')} />;
      case 'COMPARE': 
        return userProfile ? <CompareScreen profile={userProfile} navigate={navigate} /> : null;
      default: 
        return <WelcomeScreen onContinue={() => navigate('SIGN_IN')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-dark max-w-md mx-auto relative overflow-x-hidden shadow-2xl ring-1 ring-white/5">
      {renderScreen()}
    </div>
  );
};

export default App;
