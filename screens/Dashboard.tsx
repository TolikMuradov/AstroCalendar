
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Screen, UserProfile, DailyInsight, YearlyInsight, MonthlyDayInsight } from '../types';
import { generateDailyInsight, generateYearlyInsight } from '../services/geminiService';
import { storage } from '../services/storage';
import { translations } from '../i18n/translations';
import { getFallbackDailyInsight, getFallbackYearlyInsight, getZodiacIcon, getElementTrait, getChineseAnimalIcon, getCurrentYearAnimal } from '../utils/astrology';
import Navigation from '../components/Navigation';

interface DashboardProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const DashboardScreen: React.FC<DashboardProps> = ({ profile, navigate }) => {
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [yearlyInsight, setYearlyInsight] = useState<YearlyInsight | null>(null);
  const [todayFromMonthly, setTodayFromMonthly] = useState<MonthlyDayInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const fetchingRef = useRef(false);
  
  const t = translations[profile.locale] || translations.en;

  const getLocalDateKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const fetchInsights = useCallback(async () => {
    if (!profile?.uid || fetchingRef.current) return;
    
    const todayKey = getLocalDateKey();
    const currentYear = new Date().getFullYear();
    
    const cachedDaily = storage.getDailyCache(profile.uid, todayKey, profile.locale);
    const cachedYearly = storage.getYearlyCache(profile.uid, currentYear, profile.locale);
    
    if (cachedDaily) setInsight(cachedDaily);
    if (cachedYearly) setYearlyInsight(cachedYearly);
    
    if (cachedDaily && cachedYearly) return;

    setLoading(true);
    setIsOfflineMode(false);
    fetchingRef.current = true;

    try {
      let dailyData = cachedDaily;
      if (!dailyData) {
        dailyData = await generateDailyInsight(profile, todayKey);
        storage.setDailyCache(profile.uid, dailyData);
        setInsight(dailyData);
      }

      let yearlyData = cachedYearly;
      if (!yearlyData) {
        yearlyData = await generateYearlyInsight(profile, currentYear);
        storage.setYearlyCache(profile.uid, yearlyData);
        setYearlyInsight(yearlyData);
      }
    } catch (e: any) {
      console.error("Dashboard Insight Error:", e);
      console.warn("AI Engine currently transitioning. Using celestial fallback.");
      setIsOfflineMode(true);
      
      const fallbackDaily = cachedDaily || getFallbackDailyInsight(profile, todayKey);
      setInsight(fallbackDaily);
      storage.setDailyCache(profile.uid, fallbackDaily);

      const fallbackYearly = cachedYearly || getFallbackYearlyInsight(profile, currentYear);
      setYearlyInsight(fallbackYearly);
      storage.setYearlyCache(profile.uid, fallbackYearly);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [profile]);

  useEffect(() => {
    fetchInsights();
    
    // Check for monthly calendar insight and get today's data
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const today = now.getDate();
    
    const monthlyCache = storage.getMonthlyCache(profile.uid, currentYear, currentMonth, profile.locale);
    if (monthlyCache) {
      const todayData = monthlyCache.days.find(d => d.day === today);
      if (todayData) {
        setTodayFromMonthly(todayData);
      }
    }
  }, [fetchInsights, profile.uid, profile.locale]);

  const westernSign = profile.computedProfile.westernZodiac.sign;
  const westernElement = profile.computedProfile.westernZodiac.element;
  const elementTrait = getElementTrait(westernElement, profile.locale);
  const zodiacSymbol = getZodiacIcon(westernSign);

  const chineseAnimal = profile.computedProfile.chineseZodiac.animal;
  const chineseElement = profile.computedProfile.chineseZodiac.element;
  const currentYearAnimal = getCurrentYearAnimal();
  const chineseIcon = getChineseAnimalIcon(chineseAnimal);

  const elementColors: any = {
    Fire: "from-red-500/20 to-orange-500/5",
    Earth: "from-emerald-500/20 to-brown-500/5",
    Air: "from-sky-500/20 to-indigo-500/5",
    Water: "from-blue-600/20 to-indigo-900/5"
  };

  // Color name to hex mapping for lucky color display
  const colorNameToHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      // Reds & Pinks
      'red': '#ef4444', 'crimson': '#dc143c', 'scarlet': '#ff2400', 'ruby': '#e0115f',
      'rose': '#ff007f', 'pink': '#ec4899', 'coral': '#ff7f50', 'salmon': '#fa8072',
      'kırmızı': '#ef4444', 'pembe': '#ec4899', 'mercan': '#ff7f50',
      // Oranges
      'orange': '#f97316', 'tangerine': '#ff9966', 'peach': '#ffcba4', 'amber': '#ffbf00',
      'turuncu': '#f97316', 'portakal': '#f97316',
      // Yellows & Golds
      'yellow': '#eab308', 'gold': '#ffd700', 'golden': '#ffd700', 'lemon': '#fff44f',
      'sunshine': '#fffd37', 'honey': '#eb9605',
      'sarı': '#eab308', 'altın': '#ffd700',
      // Greens
      'green': '#22c55e', 'emerald': '#50c878', 'emerald green': '#50c878', 'jade': '#00a86b', 'mint': '#3eb489',
      'lime': '#84cc16', 'olive': '#808000', 'forest': '#228b22', 'sage': '#9dc183',
      'teal': '#14b8a6', 'turquoise': '#40e0d0',
      'yeşil': '#22c55e', 'zümrüt': '#50c878', 'nane': '#3eb489', 'limon': '#84cc16',
      // Blues
      'blue': '#3b82f6', 'navy': '#000080', 'royal': '#4169e1', 'sky': '#0ea5e9',
      'azure': '#007fff', 'cobalt': '#0047ab', 'sapphire': '#0f52ba', 'indigo': '#4b0082',
      'cyan': '#06b6d4', 'aqua': '#00ffff', 'ocean': '#006994',
      'mavi': '#3b82f6', 'lacivert': '#000080', 'gökyüzü': '#0ea5e9',
      // Purples
      'purple': '#a855f7', 'violet': '#8b5cf6', 'lavender': '#e6e6fa', 'lilac': '#c8a2c8',
      'plum': '#dda0dd', 'magenta': '#ff00ff', 'orchid': '#da70d6', 'amethyst': '#9966cc',
      'mor': '#a855f7', 'menekşe': '#8b5cf6', 'lavanta': '#e6e6fa',
      // Browns & Neutrals
      'brown': '#92400e', 'chocolate': '#7b3f00', 'copper': '#b87333', 'bronze': '#cd7f32',
      'tan': '#d2b48c', 'beige': '#f5f5dc', 'cream': '#fffdd0',
      'kahverengi': '#92400e', 'bej': '#f5f5dc',
      // Blacks, Whites, Grays
      'black': '#1f2937', 'white': '#f9fafb', 'silver': '#c0c0c0', 'gray': '#6b7280', 'grey': '#6b7280',
      'siyah': '#1f2937', 'beyaz': '#f9fafb', 'gümüş': '#c0c0c0', 'gri': '#6b7280',
      // Special
      'maroon': '#800000', 'burgundy': '#800020', 'wine': '#722f37', 'champagne': '#f7e7ce'
    };
    
    // Try exact match first (case-insensitive)
    const lower = colorName.toLowerCase().trim();
    if (colorMap[lower]) return colorMap[lower];
    
    // Try to find partial match (e.g., "Royal Purple" -> check for "purple" or "royal")
    for (const [key, value] of Object.entries(colorMap)) {
      if (lower.includes(key)) return value;
    }
    
    // Log if no match found for debugging
    console.warn('Color not found in mapping:', colorName, '- using default purple');
    
    // Default purple if no match
    return '#8a2be2';
  };

  // Use color from monthly calendar if available, otherwise fall back to daily insight
  const displayColor = todayFromMonthly?.wearColor || insight?.color || 'Purple';
  const luckyColorHex = colorNameToHex(displayColor);

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-32">
      <div className={`fixed inset-0 bg-gradient-to-b ${elementColors[westernElement] || 'from-primary/10 to-transparent'} nebula-glow pointer-events-none`}></div>
      
      <div className="flex-1 animate-fade-in relative z-10">
        <header className="flex items-center p-6 justify-between sticky top-0 bg-background-dark/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-4">
            <div 
              className="size-10 rounded-full border border-white/10 p-0.5 bg-gradient-to-tr from-primary/50 to-accent-gold/50 cursor-pointer overflow-hidden"
              onClick={() => navigate('PROFILE')}
            >
              <div 
                 className="w-full h-full rounded-full bg-cover bg-center"
                 style={{ backgroundImage: `url(https://picsum.photos/seed/${profile?.uid}/100/100)` }}
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-white text-sm font-bold leading-none mb-1">{profile.name.split(' ')[0]}</h2>
              <div className="flex items-center gap-1.5">
                 <span className={`size-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : (isOfflineMode ? 'bg-blue-400' : 'bg-emerald-500')}`}></span>
                 <p className="text-[8px] text-white/40 font-bold uppercase tracking-[0.2em]">
                   {loading ? 'Aligning...' : (isOfflineMode ? 'Omni Engine' : 'AI Active')}
                 </p>
              </div>
            </div>
          </div>
          <button className="text-white/20 hover:text-white transition-colors" onClick={() => navigate('CALENDAR')}>
            <span className="material-symbols-outlined text-xl">calendar_month</span>
          </button>
        </header>

        <main className="px-6 space-y-6 mt-2">
          {/* Cosmic Identity Hero */}
          <section className="relative glass-panel rounded-[40px] p-8 border-white/5 flex flex-col items-center overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none"></div>
            
            <div className="flex justify-between w-full mb-8 z-10">
               <div className="flex flex-col items-center flex-1">
                  <span className="text-5xl mb-3 drop-shadow-[0_0_15px_rgba(243,198,35,0.4)] animate-float">{zodiacSymbol}</span>
                  <p className="text-[9px] text-white/30 uppercase font-bold tracking-[0.2em] mb-1">Western</p>
                  <p className="text-white font-serif italic text-lg">{westernSign}</p>
               </div>
               <div className="flex flex-col items-center justify-center px-4">
                  <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
               </div>
               <div className="flex flex-col items-center flex-1">
                  <span className="text-5xl mb-3 drop-shadow-[0_0_15px_rgba(138,43,226,0.4)] animate-float delay-700">{chineseIcon}</span>
                  <p className="text-[9px] text-white/30 uppercase font-bold tracking-[0.2em] mb-1">Chinese</p>
                  <p className="text-white font-serif italic text-lg">{chineseAnimal}</p>
               </div>
            </div>

            <div className="flex items-center gap-2 mb-10 bg-white/5 px-5 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.2em]">{westernElement}</span>
                <span className="size-1 bg-white/20 rounded-full"></span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{chineseElement} Spirit</span>
            </div>

            {/* Energy Score Circle */}
            <div className="relative size-44 flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                 <circle 
                  cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="4" 
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * (insight?.energyScore || 0) / 100)}
                  className="text-primary transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                 />
              </svg>
              <div className="text-center z-10 flex flex-col items-center">
                <p className="text-5xl font-serif italic text-white drop-shadow-lg">{insight?.energyScore || '--'}</p>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mt-3">Daily Vibe</p>
              </div>
            </div>

            <div className="text-center space-y-4 w-full relative z-10">
               <h3 className="text-white text-xl font-serif italic">{insight?.title || 'Mapping Frequencies...'}</h3>
               <p className="text-white/50 text-sm leading-relaxed font-light italic px-4">
                 "{insight?.description || 'Aligning your soul with the current celestial movements.'}"
               </p>
            </div>
          </section>

          {/* Lucky Color & Stats Row */}
          <div className="grid grid-cols-4 gap-3">
             <div className="col-span-3 grid grid-cols-3 gap-2">
                {(insight?.luckyNumbers || [0, 0, 0]).map((num, i) => (
                  <div key={i} className="glass-panel py-5 rounded-[28px] flex flex-col items-center justify-center border-white/5 active:scale-95 transition-transform">
                     <p className="text-2xl font-serif italic text-accent-gold drop-shadow-sm">{num || '--'}</p>
                     <p className="text-[7px] text-white/20 uppercase font-bold mt-1 tracking-widest">#{i+1}</p>
                  </div>
                ))}
             </div>
             
             <div className="col-span-1 glass-panel py-5 rounded-[28px] flex flex-col items-center justify-center border-white/5 active:scale-95 transition-transform relative overflow-hidden group">
                <div 
                  className="absolute inset-0 opacity-30 pointer-events-none blur-xl group-hover:opacity-50 transition-opacity duration-1000" 
                  style={{ backgroundColor: luckyColorHex }}
                ></div>
                <div 
                  className="size-8 rounded-full shadow-[0_0_25px_rgba(255,255,255,0.4)] border-2 border-white/50 mb-2" 
                  style={{ backgroundColor: luckyColorHex, boxShadow: `0 0 20px ${luckyColorHex}` }}
                ></div>
                <p className="text-[7px] text-white/30 uppercase font-bold tracking-widest text-center">Color</p>
                <p className="text-[8px] text-white font-bold text-center px-1 truncate leading-none mt-1">{displayColor}</p>
             </div>
          </div>

          {/* Yearly Forecast - Fare/Okuz specific year outlook */}
          {yearlyInsight && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">{new Date().getFullYear()} Year of the {currentYearAnimal}</h4>
                 <div className="h-px flex-1 bg-white/5 ml-4"></div>
              </div>
              <div className="glass-panel p-7 rounded-[40px] border-accent-gold/20 bg-accent-gold/5 relative overflow-hidden group">
                <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000">
                   <span className="material-symbols-outlined text-9xl text-accent-gold">menu_book</span>
                </div>
                <div className="relative z-10">
                  <p className="text-accent-gold font-serif italic text-xl leading-tight mb-4">"{yearlyInsight.theme}"</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {yearlyInsight.strengths.map((s, i) => (
                      <span key={i} className="text-[9px] px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 font-medium">{s}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-1">Challenge</p>
                      <p className="text-[10px] text-white/60">{yearlyInsight.challenges[0]}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-1">Focus</p>
                      <p className="text-[10px] text-white/60">{yearlyInsight.recommendations[0]}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Daily Ritual */}
          {insight?.ritual && (
             <section className="space-y-4 pb-16">
               <div className="flex items-center justify-between px-2">
                  <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Today's Ritual</h4>
                  <div className="h-px flex-1 bg-white/5 ml-4"></div>
               </div>
               <div className="glass-panel p-8 rounded-[40px] border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-8xl text-primary">auto_awesome</span>
                 </div>
                 <div className="flex items-center gap-5 mb-8 relative">
                    <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                       <span className="material-symbols-outlined text-3xl">magic_button</span>
                    </div>
                    <div>
                       <h4 className="text-white font-bold text-base tracking-tight">{insight.ritual.title}</h4>
                       <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-1">Soul Sync Protocol</p>
                    </div>
                 </div>
                 <div className="space-y-6">
                    {insight.ritual.steps.map((step, i) => (
                       <div key={i} className="flex gap-5 items-start relative group">
                          <div className="size-7 rounded-full border border-primary/30 bg-background-dark flex items-center justify-center flex-shrink-0 z-10 shadow-sm transition-colors group-hover:border-primary">
                             <span className="text-[11px] font-bold text-primary">{i+1}</span>
                          </div>
                          {i < insight.ritual.steps.length - 1 && (
                            <div className="absolute top-7 left-[13px] w-px h-8 bg-primary/10"></div>
                          )}
                          <p className="text-white/70 text-sm leading-relaxed pt-1 group-hover:text-white transition-colors">{step}</p>
                       </div>
                    ))}
                 </div>
               </div>
             </section>
          )}
        </main>
      </div>

      <Navigation activeScreen="DASHBOARD" navigate={navigate} />
    </div>
  );
};

export default DashboardScreen;
