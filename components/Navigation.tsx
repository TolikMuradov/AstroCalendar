
import React from 'react';
import { Screen } from '../types';

interface NavigationProps {
  activeScreen: Screen;
  navigate: (screen: Screen) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeScreen, navigate }) => {
  const items = [
    { screen: 'DASHBOARD' as Screen, icon: 'home', label: 'Home' },
    { screen: 'CALENDAR' as Screen, icon: 'calendar_month', label: 'Moon' },
    { screen: 'PREMIUM' as Screen, icon: 'auto_awesome', label: 'Pro', isCenter: true },
    { screen: 'COMPARE' as Screen, icon: 'sync_alt', label: 'Sync' },
    { screen: 'PROFILE' as Screen, icon: 'person', label: 'Soul' },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 max-w-sm mx-auto glass-panel rounded-full flex justify-between items-center h-16 px-4 z-[9999] shadow-2xl border-white/5 backdrop-blur-xl">
      {items.map((item) => {
        const isActive = activeScreen === item.screen;
        
        if (item.isCenter) {
          return (
            <button 
              key={item.screen}
              onClick={() => navigate(item.screen)}
              className={`-translate-y-4 size-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isActive ? 'bg-accent-gold text-black scale-110 shadow-accent-gold/40' : 'bg-primary text-white shadow-primary/40 hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>{item.icon}</span>
            </button>
          );
        }

        return (
          <button 
            key={item.screen}
            onClick={() => navigate(item.screen)}
            className={`flex flex-col items-center justify-center w-12 transition-all group ${
              isActive ? 'text-primary' : 'text-white/30 hover:text-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[24px] group-active:scale-90 transition-transform" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>{item.icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
