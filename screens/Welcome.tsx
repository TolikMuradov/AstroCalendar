import React from 'react';

interface WelcomeProps {
  onContinue: () => void;
}

const WelcomeScreen: React.FC<WelcomeProps> = ({ onContinue }) => {
  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark overflow-hidden star-field">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary nebula-glow rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-gold/10 nebula-glow rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <header className="flex items-center p-8 justify-between z-10">
        <div className="flex items-center gap-3">
           <span className="material-symbols-outlined text-primary text-3xl animate-float">flare</span>
           <h2 className="text-white text-sm font-bold tracking-[0.4em] uppercase opacity-70">Astro</h2>
        </div>
        <div className="text-right">
           <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em]">Powered by</p>
           <p className="text-accent-gold text-xs font-bold tracking-[0.2em]">916.studio</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-10 text-center z-10 animate-fade-in">
        <div className="mb-12">
          <h1 className="text-white text-5xl font-serif italic font-bold leading-[1.1] mb-6 tracking-tight">
            Your cosmic <br/> journey begins.
          </h1>
          <p className="text-white/40 text-base font-light leading-relaxed max-w-[280px] mx-auto">
            Experience daily energy alignments and rituals curated by the stars.
          </p>
        </div>

        <div className="w-full space-y-3 mb-10">
          {[
            { icon: 'auto_awesome', title: 'Daily Insights', desc: 'Personalized guidance from the cosmos', color: 'text-primary', bgGlow: 'from-primary/20' },
            { icon: 'calendar_month', title: 'Monthly Rituals', desc: 'Sacred practices for every day', color: 'text-accent-gold', bgGlow: 'from-accent-gold/20' },
            { icon: 'psychology', title: 'Deep Analysis', desc: 'Your complete astrological profile', color: 'text-violet-400', bgGlow: 'from-violet-400/20' }
          ].map((feat, i) => (
            <div key={i} className={`flex items-center gap-4 glass-panel p-5 rounded-2xl border-white/5 bg-gradient-to-r ${feat.bgGlow} to-transparent hover:border-white/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}>
              <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                <span className={`material-symbols-outlined ${feat.color} text-2xl`}>{feat.icon}</span>
              </div>
              <div className="text-left flex-1">
                <p className="text-white text-sm font-bold tracking-tight mb-0.5">{feat.title}</p>
                <p className="text-white/30 text-[10px] leading-tight">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cosmic stats */}
        <div className="grid grid-cols-3 gap-4 w-full mb-8 px-4">
          <div className="text-center">
            <p className="text-accent-gold text-2xl font-serif italic mb-1">12</p>
            <p className="text-white/30 text-[8px] uppercase tracking-wider font-bold">Zodiacs</p>
          </div>
          <div className="text-center">
            <p className="text-primary text-2xl font-serif italic mb-1">∞</p>
            <p className="text-white/30 text-[8px] uppercase tracking-wider font-bold">Insights</p>
          </div>
          <div className="text-center">
            <p className="text-violet-400 text-2xl font-serif italic mb-1">24/7</p>
            <p className="text-white/30 text-[8px] uppercase tracking-wider font-bold">Guidance</p>
          </div>
        </div>
      </main>

      <footer className="p-10 z-10">
        <button 
          onClick={onContinue}
          className="w-full h-16 bg-gradient-to-r from-primary via-violet-600 to-accent-gold text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group animate-gradient bg-[length:200%_auto]"
        >
          <span className="relative z-10">Begin Seeking</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer"></div>
        </button>
        <p className="text-white/30 text-[10px] text-center mt-6 uppercase tracking-[0.25em]">
          © 2024 <span className="text-accent-gold/50">916.studio</span> • Cosmic Intelligence
        </p>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
