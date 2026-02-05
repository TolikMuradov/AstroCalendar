
import React, { useState } from 'react';
import { UserProfile, Locale } from '../types';
import { computeProfile } from '../utils/astrology';
import { storage } from '../services/storage';

interface OnboardingProps {
  uid: string;
  initialName?: string;
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
}

const OnboardingScreen: React.FC<OnboardingProps> = ({ uid, initialName = '', onComplete, onBack }) => {
  const [profile, setProfile] = useState({
    name: initialName,
    birthDate: '',
  });
  const [loading, setLoading] = useState(false);
  const locale = storage.getLocale();

  const handleComplete = () => {
    if (!profile.name || !profile.birthDate) return;
    setLoading(true);
    
    setTimeout(() => {
      const computed = computeProfile(profile.birthDate);
      const finalProfile: UserProfile = {
        uid,
        name: profile.name,
        birthDate: profile.birthDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale,
        focusAreas: ['Balance', 'Growth'],
        computedProfile: computed,
        subscription: { isPremium: false }
      };
      onComplete(finalProfile);
    }, 1500); // Aesthetic delay for "star calculation"
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark star-field animate-fade-in">
      <header className="flex items-center p-6 justify-between z-10">
        <button onClick={onBack} className="size-10 glass-panel rounded-full flex items-center justify-center text-white/60">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Profile Discovery</div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col px-8 pt-12 z-10">
        <div className="text-center mb-12">
           <h1 className="text-white text-4xl font-serif italic font-bold mb-4">The Universe awaits.</h1>
           <p className="text-white/40 text-sm">Tell the stars who you are to receive your daily energy map.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] pl-1">Celestial Name</label>
            <input 
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              className="w-full rounded-2xl text-white bg-white/5 h-16 px-6 focus:ring-1 focus:ring-primary focus:bg-white/8 border border-white/10 focus:border-primary/50 outline-none transition-all"
              placeholder="How shall the stars call you?" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] pl-1">Arrival Date</label>
            <input 
              type="date"
              value={profile.birthDate}
              onChange={(e) => setProfile({...profile, birthDate: e.target.value})}
              className="w-full rounded-2xl text-white bg-white/5 h-16 px-6 focus:ring-1 focus:ring-primary focus:bg-white/8 border border-white/10 focus:border-primary/50 [color-scheme:dark] outline-none transition-all" 
            />
            <p className="text-[10px] text-white/20 italic pl-1 mt-2">Required for accurate zodiac and energy calculations.</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
           <div className="flex gap-4">
              <div className="size-2 bg-primary/40 rounded-full animate-pulse"></div>
              <div className="size-2 bg-primary/60 rounded-full animate-pulse delay-150"></div>
              <div className="size-2 bg-primary/80 rounded-full animate-pulse delay-300"></div>
           </div>
        </div>
      </main>

      <footer className="p-8 z-10">
        <button 
          onClick={handleComplete}
          disabled={!profile.name || !profile.birthDate || loading}
          className="w-full h-16 bg-primary text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
        >
          {loading ? (
            <>
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating Stars...
            </>
          ) : (
            <>
              Sync My Soul
              <span className="material-symbols-outlined text-[20px]">flare</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default OnboardingScreen;
