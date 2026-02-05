
import React from 'react';
import { Screen, UserProfile } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import Navigation from '../components/Navigation';

interface ProfileProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileProps> = ({ profile, navigate, onLogout }) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      onLogout();
    }
  };

  const westernSign = profile.computedProfile?.westernZodiac?.sign || 'Astro';
  const chineseAnimal = profile.computedProfile?.chineseZodiac?.animal || 'Spirit';
  const chineseElement = profile.computedProfile?.chineseZodiac?.element || '';

  return (
    <div className="min-h-screen flex flex-col bg-background-dark pb-32">
      <div className="fixed inset-0 star-field opacity-20 pointer-events-none"></div>

      <div className="flex-1 animate-fade-in">
        <header className="flex items-center p-6 justify-between relative z-10">
          <button className="size-10 rounded-full glass-panel flex items-center justify-center" onClick={() => navigate('DASHBOARD')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-white text-lg font-serif italic">Your Celestial Identity</h2>
          <button className="size-10 rounded-full glass-panel flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </header>

        <main className="px-6 pt-4 space-y-8 relative z-10">
          <div className="flex flex-col items-center">
            <div 
              className="size-36 rounded-full border-4 border-primary/20 p-1 mb-6 shadow-[0_0_50px_rgba(138,43,226,0.15)] relative"
            >
              <div 
                 className="w-full h-full rounded-full bg-cover bg-center border border-white/10"
                 style={{ backgroundImage: `url(https://picsum.photos/seed/${profile.uid}/200/200)` }}
              />
              <div className="absolute bottom-1 right-1 size-10 bg-accent-gold rounded-full flex items-center justify-center border-4 border-background-dark text-black">
                 <span className="material-symbols-outlined text-sm font-bold">verified</span>
              </div>
            </div>
            <h3 className="text-white text-3xl font-serif italic font-bold tracking-tight">{profile.name}</h3>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.3em] mt-2">Star Traveler • Level 12</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="glass-panel p-6 rounded-[32px] border-white/5 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="size-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                   <span className="material-symbols-outlined">flare</span>
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Western Zodiac</p>
                    <p className="text-white font-bold text-lg font-serif">{westernSign}</p>
                 </div>
                 <span className="text-2xl opacity-40">♈</span>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex items-center gap-4">
                 <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                   <span className="material-symbols-outlined">pets</span>
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Chinese Spirit</p>
                    <p className="text-white font-bold text-lg font-serif">{chineseElement} {chineseAnimal}</p>
                 </div>
                 <span className="text-2xl opacity-40">🐉</span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-[32px] border-white/5">
              <h4 className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-4">Cosmic Settings</h4>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between text-white/70 hover:text-white transition-colors">
                  <span className="text-sm">Notification Alerts</span>
                  <div className="w-10 h-5 bg-primary/40 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 size-4 bg-white rounded-full shadow-md"></div>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between text-white/70 hover:text-white transition-colors py-2">
                  <span className="text-sm">Language</span>
                  <span className="text-xs font-bold text-primary">{profile.locale.toUpperCase()}</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleSignOut}
              className="w-full h-16 border border-red-500/20 bg-red-500/5 text-red-400 font-bold rounded-3xl flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all active:scale-[0.98] mt-4"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Return to Earth
            </button>
          </div>
        </main>
      </div>

      <Navigation activeScreen="PROFILE" navigate={navigate} />
    </div>
  );
};

export default ProfileScreen;
