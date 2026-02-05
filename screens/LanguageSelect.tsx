
import React from 'react';
import { Locale } from '../types';

interface LanguageSelectProps {
  onSelect: (lang: Locale) => void;
}

const LanguageSelectScreen: React.FC<LanguageSelectProps> = ({ onSelect }) => {
  return (
    <div className="relative h-screen w-full bg-background-dark flex flex-col items-center justify-center px-8 star-field overflow-hidden animate-fade-in">
      <div className="absolute top-0 w-full h-1/2 bg-primary/20 nebula-glow rounded-full -translate-y-1/2"></div>
      
      <div className="z-10 text-center mb-12">
        <span className="material-symbols-outlined text-accent-gold text-5xl mb-6">language</span>
        <h1 className="text-white text-3xl font-serif italic font-bold mb-4">Choose your language</h1>
        <p className="text-white/40 text-sm">Dilinizi seçin ve kozmik yolculuğa başlayın.</p>
      </div>

      <div className="z-10 w-full space-y-4">
        <button 
          onClick={() => onSelect('en')}
          className="w-full h-16 glass-panel rounded-2xl flex items-center px-6 gap-4 hover:border-primary/50 transition-all group"
        >
          <div className="size-10 rounded-full bg-white/5 flex items-center justify-center text-xl">🇺🇸</div>
          <span className="text-white font-bold flex-1 text-left">English</span>
          <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">arrow_forward</span>
        </button>

        <button 
          onClick={() => onSelect('tr')}
          className="w-full h-16 glass-panel rounded-2xl flex items-center px-6 gap-4 hover:border-primary/50 transition-all group"
        >
          <div className="size-10 rounded-full bg-white/5 flex items-center justify-center text-xl">🇹🇷</div>
          <span className="text-white font-bold flex-1 text-left">Türkçe</span>
          <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">arrow_forward</span>
        </button>

        <button 
          onClick={() => onSelect('th')}
          className="w-full h-16 glass-panel rounded-2xl flex items-center px-6 gap-4 hover:border-primary/50 transition-all group"
        >
          <div className="size-10 rounded-full bg-white/5 flex items-center justify-center text-xl">🇹🇭</div>
          <span className="text-white font-bold flex-1 text-left">ไทย (Thai)</span>
          <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">arrow_forward</span>
        </button>
      </div>

      <p className="absolute bottom-12 text-[10px] text-white/20 uppercase tracking-[0.3em]">Cosmic Localization</p>
    </div>
  );
};

export default LanguageSelectScreen;
