
import React, { useState } from 'react';
import { Screen, UserProfile, ComparisonResult } from '../types';
import { getPartnerComparison } from '../services/geminiService';
import { translations } from '../i18n/translations';
import Navigation from '../components/Navigation';

interface CompareProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const CompareScreen: React.FC<CompareProps> = ({ profile, navigate }) => {
  const [partnerName, setPartnerName] = useState('');
  const [partnerBirth, setPartnerBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const t = translations[profile.locale];

  const handleCompare = async () => {
    if (!partnerName || !partnerBirth) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPartnerComparison(profile, partnerName, partnerBirth);
      setResult(data);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("429") || e.status === 429) {
        setError(t.errorQuota);
      } else {
        setError(t.errorGeneral);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark pb-32">
      <div className="fixed inset-0 nebula-glow bg-primary/5 pointer-events-none"></div>

      <div className="flex-1 animate-fade-in relative z-10">
        <header className="flex items-center p-6 justify-between">
          <button className="size-10 rounded-full glass-panel flex items-center justify-center" onClick={() => navigate('DASHBOARD')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-white text-lg font-serif italic">Energetic Synchronization</h2>
          <div className="size-10 rounded-full glass-panel flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">sync</span>
          </div>
        </header>

        <main className="px-6 flex-1 space-y-8 mt-4">
          {error && (
            <div className="glass-panel border-red-500/20 bg-red-500/5 p-4 rounded-3xl animate-fade-in">
               <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                 <p className="text-white/80 text-xs flex-1">{error}</p>
               </div>
            </div>
          )}

          {!result ? (
            <div className="space-y-10 pt-4">
              <div className="text-center space-y-3">
                <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 mb-6">
                   <span className="material-symbols-outlined text-primary text-4xl animate-float">favorite</span>
                </div>
                <h3 className="text-white text-3xl font-serif italic font-bold">Synastry Alignment</h3>
                <p className="text-white/30 text-sm max-w-[240px] mx-auto leading-relaxed">Map the energetic harmony between you and another celestial traveler.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest pl-2">Partner Name</label>
                   <input 
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Enter Name..."
                    className="w-full h-16 glass-panel rounded-3xl px-6 text-white border-white/5 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest pl-2">Arrival Date</label>
                   <input 
                    type="date"
                    value={partnerBirth}
                    onChange={(e) => setPartnerBirth(e.target.value)}
                    className="w-full h-16 glass-panel rounded-3xl px-6 text-white border-white/5 [color-scheme:dark] outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={handleCompare}
                  disabled={loading}
                  className="w-full h-16 bg-primary text-white font-bold rounded-3xl shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin size-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>
                      Verify Compatibility
                      <span className="material-symbols-outlined text-lg">bolt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in space-y-8">
               <div className="relative flex justify-center items-center h-56 pt-4">
                  <div className="absolute size-44 bg-primary/20 nebula-glow rounded-full animate-pulse"></div>
                  <div className="relative size-36 rounded-full glass-panel border border-accent-gold/40 flex flex-col items-center justify-center shadow-inner shadow-accent-gold/5 bg-gradient-to-tr from-accent-gold/10 to-transparent">
                     <span className="text-5xl font-serif italic font-bold text-accent-gold drop-shadow-md">{result.harmonyScore}%</span>
                     <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-white/40 mt-1">Harmony</span>
                  </div>
               </div>

               <div className="glass-panel p-7 rounded-[32px] border-white/5 shadow-xl">
                  <h4 className="text-white font-bold mb-4 flex items-center gap-3">
                     <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                     </div>
                     Celestial Summary
                  </h4>
                  <p className="text-white/60 text-sm leading-relaxed font-light italic">"{result.summary}"</p>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  <div className="bg-emerald-500/5 p-6 rounded-[32px] border border-emerald-500/10">
                     <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">add_circle</span>
                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Resonances</p>
                     </div>
                     <ul className="text-xs text-white/70 space-y-3 pl-1">
                        {result.strengths.map((s, i) => <li key={i} className="flex gap-2"><span>✨</span>{s}</li>)}
                     </ul>
                  </div>
                  <div className="bg-red-500/5 p-6 rounded-[32px] border border-red-500/10">
                     <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-red-400 text-sm">remove_circle</span>
                        <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">Frictions</p>
                     </div>
                     <ul className="text-xs text-white/70 space-y-3 pl-1">
                        {result.challenges.map((c, i) => <li key={i} className="flex gap-2"><span>🌙</span>{c}</li>)}
                     </ul>
                  </div>
               </div>

               <button 
                 onClick={() => setResult(null)}
                 className="w-full py-6 text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] hover:text-white transition-colors"
               >
                 New Synchronization
               </button>
            </div>
          )}
        </main>
      </div>

      <Navigation activeScreen="COMPARE" navigate={navigate} />
    </div>
  );
};

export default CompareScreen;
