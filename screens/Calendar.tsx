import React, { useState, useEffect } from 'react';
import { Screen, UserProfile, MonthlyInsight, MonthlyDayInsight } from '../types';
import { storage } from '../services/storage';
import { generateMonthlyInsight } from '../services/geminiService';
import { translations } from '../i18n/translations';
import Navigation from '../components/Navigation';

interface CalendarProps {
  profile: UserProfile | null;
  navigate: (screen: Screen) => void;
}

const dayTypeIcons: Record<string, string> = {
  cleansing: 'waves',
  manifestation: 'auto_awesome',
  rest: 'nights_stay',
  action: 'bolt',
  reflection: 'psychology',
  social: 'group',
  gratitude: 'favorite',
  creativity: 'palette'
};

const dayTypeLabels: Record<string, { en: string; tr: string; th: string }> = {
  cleansing: { en: 'Cleansing Day', tr: 'Arınma Günü', th: 'วันทำความสะอาด' },
  manifestation: { en: 'Manifestation Day', tr: 'Tezahür Günü', th: 'วันสิ่งที่ปรารถนา' },
  rest: { en: 'Rest Day', tr: 'Dinlenme Günü', th: 'วันพักผ่อน' },
  action: { en: 'Action Day', tr: 'Aksiyon Günü', th: 'วันสำหรับการกระทำ' },
  reflection: { en: 'Reflection Day', tr: 'Yansıma Günü', th: 'วันสำหรับการตรวจสอบ' },
  social: { en: 'Social Day', tr: 'Sosyal Gün', th: 'วันสังคม' },
  gratitude: { en: 'Gratitude Day', tr: 'Şükran Günü', th: 'วันขอบคุณ' },
  creativity: { en: 'Creativity Day', tr: 'Yaratıcılık Günü', th: 'วันความสร้างสรรค์' }
};

const dayTypeColors: Record<string, string> = {
  cleansing: 'from-blue-500/30 to-cyan-500/10',
  manifestation: 'from-amber-500/30 to-yellow-500/10',
  rest: 'from-indigo-500/30 to-purple-500/10',
  action: 'from-red-500/30 to-orange-500/10',
  reflection: 'from-violet-500/30 to-purple-500/10',
  social: 'from-pink-500/30 to-rose-500/10',
  gratitude: 'from-emerald-500/30 to-green-500/10',
  creativity: 'from-fuchsia-500/30 to-pink-500/10'
};

const CalendarScreen: React.FC<CalendarProps> = ({ profile, navigate }) => {
  if (!profile) return null;
  const t = translations[profile.locale];
  
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [monthlyInsight, setMonthlyInsight] = useState<MonthlyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const today = now.getDate();
  const totalDays = new Date(currentYear, currentMonth, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  // Fetch or generate monthly insight
  useEffect(() => {
    const fetchMonthlyInsight = async () => {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cached = storage.getMonthlyCache(profile.uid, currentYear, currentMonth, profile.locale);
      if (cached) {
        console.log('Using cached monthly insight');
        setMonthlyInsight(cached);
        setLoading(false);
        return;
      }
      
      // Generate new monthly insight
      try {
        console.log('Generating new monthly insight...');
        const insight = await generateMonthlyInsight(profile, currentYear, currentMonth);
        storage.setMonthlyCache(profile.uid, insight);
        setMonthlyInsight(insight);
      } catch (err: any) {
        console.error('Failed to generate monthly insight:', err);
        setError(err.message || 'Failed to load monthly calendar');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyInsight();
  }, [profile.uid, currentYear, currentMonth, profile.locale]);

  const selectedDayInsight: MonthlyDayInsight | undefined = monthlyInsight?.days.find(d => d.day === selectedDay);
  const weekDays = profile.locale === 'tr' 
    ? ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct']
    : profile.locale === 'th'
    ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-32">
      <div className="fixed inset-0 star-field pointer-events-none opacity-40"></div>
      
      <div className="flex-1 animate-fade-in z-10">
        <header className="flex items-center p-6 justify-between mt-4">
          <button className="size-10 rounded-full glass-panel flex items-center justify-center" onClick={() => navigate('DASHBOARD')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-white text-lg font-serif italic">
             {new Date(currentYear, currentMonth - 1).toLocaleDateString(
               profile.locale === 'tr' ? 'tr-TR' : profile.locale === 'th' ? 'th-TH' : 'en-US',
               { month: 'long', year: 'numeric' }
             )}
          </h2>
          <div className="w-10"></div>
        </header>

        <main className="px-6 space-y-5">
          {/* Month Theme Banner */}
          {monthlyInsight && (
            <div className="glass-panel p-4 rounded-2xl border-primary/20 bg-gradient-to-r from-primary/10 to-accent-gold/10">
              <p className="text-white/80 text-sm text-center font-serif italic leading-relaxed">
                "{monthlyInsight.monthTheme}"
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="glass-panel p-10 rounded-[32px] text-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="size-12 rounded-full bg-primary/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                </div>
                <p className="text-white/50 text-sm">
                  {profile.locale === 'tr' ? 'Kozmik takviminiz hazırlanıyor...' : profile.locale === 'th' ? 'กำลังเตรียมปฏิทินจักรวาลของคุณ...' : 'Preparing your cosmic calendar...'}
                </p>
                <p className="text-white/30 text-xs">
                  {profile.locale === 'tr' ? 'Bu işlem bir kez yapılır, sonra ayın sonuna kadar saklanır' : profile.locale === 'th' ? 'สิ่งนี้เกิดขึ้นครั้งเดียว จากนั้นจะบันทึกไว้จนสิ้นสุดเดือน' : 'This happens once, then saved until month end'}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="glass-panel p-6 rounded-[32px] text-center border-red-500/30">
              <span className="material-symbols-outlined text-red-400 text-3xl mb-2">error</span>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-xs"
              >
                {profile.locale === 'tr' ? 'Tekrar Dene' : profile.locale === 'th' ? 'ลองใหม่' : 'Try Again'}
              </button>
            </div>
          )}

          {/* Calendar Grid */}
          {!loading && monthlyInsight && (
            <section className="glass-panel p-5 rounded-[32px] border-white/5 shadow-2xl">
              {/* Week days header */}
              <div className="grid grid-cols-7 gap-y-2 text-center mb-3">
                {weekDays.map((day, i) => (
                  <p key={i} className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{day}</p>
                ))}
              </div>
              
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for first week offset */}
                {Array(firstDayOfWeek).fill(0).map((_, i) => <div key={`empty-${i}`} className="h-11" />)}
                
                {days.map(d => {
                  const dayData = monthlyInsight.days.find(day => day.day === d);
                  const isToday = d === today;
                  const isSelected = d === selectedDay;
                  const isWeekend = dayData?.isWeekend;
                  
                  return (
                    <div 
                      key={d} 
                      className="flex flex-col items-center justify-center relative cursor-pointer py-1" 
                      onClick={() => setSelectedDay(d)}
                    >
                      <div className={`size-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        isSelected 
                          ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/50' 
                          : isToday 
                            ? 'bg-accent-gold/20 text-accent-gold ring-1 ring-accent-gold/50' 
                            : isWeekend
                              ? 'text-white/30 hover:text-white hover:bg-white/10'
                              : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}>
                        {d}
                      </div>
                      {/* Day type indicator dot */}
                      {dayData && (
                        <div className={`absolute -bottom-0.5 size-1.5 rounded-full ${
                          dayData.dayType === 'rest' ? 'bg-indigo-400' :
                          dayData.dayType === 'action' ? 'bg-orange-400' :
                          dayData.dayType === 'cleansing' ? 'bg-cyan-400' :
                          dayData.dayType === 'manifestation' ? 'bg-amber-400' :
                          dayData.dayType === 'social' ? 'bg-pink-400' :
                          dayData.dayType === 'gratitude' ? 'bg-emerald-400' :
                          dayData.dayType === 'creativity' ? 'bg-fuchsia-400' :
                          'bg-violet-400'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Day type legend */}
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2 justify-center">
                {['rest', 'action', 'cleansing', 'manifestation'].map(type => (
                  <div key={type} className="flex items-center gap-1">
                    <div className={`size-2 rounded-full ${
                      type === 'rest' ? 'bg-indigo-400' :
                      type === 'action' ? 'bg-orange-400' :
                      type === 'cleansing' ? 'bg-cyan-400' :
                      'bg-amber-400'
                    }`} />
                    <span className="text-[8px] text-white/30 uppercase tracking-wider">
                      {dayTypeLabels[type][profile.locale]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Selected Day Details */}
          {!loading && selectedDayInsight && (
            <section className="animate-fade-in space-y-4">
              {/* Day Header */}
              <div className="flex items-center gap-3 px-1">
                <div className={`size-12 rounded-2xl bg-gradient-to-br ${dayTypeColors[selectedDayInsight.dayType] || 'from-purple-500/30 to-violet-500/10'} flex items-center justify-center border border-white/10`}>
                  <span className="material-symbols-outlined text-white text-xl">
                    {dayTypeIcons[selectedDayInsight.dayType] || 'star'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">
                    {selectedDay} {new Date(currentYear, currentMonth - 1).toLocaleDateString(
                      profile.locale === 'tr' ? 'tr-TR' : profile.locale === 'th' ? 'th-TH' : 'en-US',
                      { month: 'long' }
                    )}
                  </h3>
                  <p className="text-primary text-xs font-medium">
                    {dayTypeLabels[selectedDayInsight.dayType]?.[profile.locale] || selectedDayInsight.dayType}
                  </p>
                </div>
                {selectedDayInsight.isWeekend && (
                  <div className="bg-accent-gold/20 px-3 py-1 rounded-full">
                    <span className="text-[10px] text-accent-gold font-bold uppercase tracking-wider">
                      {profile.locale === 'tr' ? 'Hafta Sonu' : profile.locale === 'th' ? 'วันหยุดสุดสัปดาห์' : 'Weekend'}
                    </span>
                  </div>
                )}
              </div>

              {/* Daily Message Card */}
              <div className="glass-panel p-6 rounded-[28px] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                <div className="flex items-start gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary/60 text-lg">format_quote</span>
                  <p className="text-white/80 text-sm leading-relaxed flex-1 font-serif italic">
                    {selectedDayInsight.message}
                  </p>
                </div>
                
                {/* Affirmation */}
                <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                  <p className="text-[9px] text-primary/60 uppercase tracking-[0.2em] font-bold mb-2">
                    {profile.locale === 'tr' ? 'Günün Olumlaması' : profile.locale === 'th' ? 'ข้อยืนยันของวัน' : "Today's Affirmation"}
                  </p>
                  <p className="text-white text-sm font-medium">"{selectedDayInsight.affirmation}"</p>
                </div>
              </div>

              {/* Stone & Energy Card */}
              <div className="glass-panel p-5 rounded-[28px] border-white/5">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-500/10 flex items-center justify-center border border-violet-500/20">
                    <span className="material-symbols-outlined text-violet-300 text-2xl">diamond</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold mb-1">
                      {profile.locale === 'tr' ? 'Günün Taşı' : profile.locale === 'th' ? 'หินของวัน' : "Today's Stone"}
                    </p>
                    <p className="text-white font-bold text-sm">{selectedDayInsight.stone}</p>
                    <p className="text-white/50 text-xs mt-1">{selectedDayInsight.stoneEnergy}</p>
                  </div>
                </div>
              </div>

              {/* Activity & Drink Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Activity */}
                <div className="glass-panel p-4 rounded-[24px] border-white/5">
                  <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-emerald-400">directions_walk</span>
                  </div>
                  <p className="text-[8px] text-white/40 uppercase tracking-[0.15em] font-bold mb-1">
                    {profile.locale === 'tr' ? 'Aktivite' : profile.locale === 'th' ? 'กิจกรรม' : 'Activity'}
                  </p>
                  <p className="text-white/80 text-xs leading-relaxed">{selectedDayInsight.activity}</p>
                </div>

                {/* Drink */}
                <div className="glass-panel p-4 rounded-[24px] border-white/5">
                  <div className="size-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-cyan-400">local_cafe</span>
                  </div>
                  <p className="text-[8px] text-white/40 uppercase tracking-[0.15em] font-bold mb-1">
                    {profile.locale === 'tr' ? 'İçecek' : profile.locale === 'th' ? 'เครื่องดื่ม' : 'Drink'}
                  </p>
                  <p className="text-white/80 text-xs leading-relaxed">{selectedDayInsight.drink}</p>
                </div>
              </div>

              {/* Wear Color Hint */}
              <div className="glass-panel p-4 rounded-[24px] border-white/5 flex items-center gap-4">
                <div className="size-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-pink-400">apparel</span>
                </div>
                <div className="flex-1">
                  <p className="text-[8px] text-white/40 uppercase tracking-[0.15em] font-bold mb-1">
                    {profile.locale === 'tr' ? 'Bugün Giyilecek Renk' : profile.locale === 'th' ? 'สีที่ใส่วันนี้' : 'Wear This Color Today'}
                  </p>
                  <p className="text-white font-medium text-sm">{selectedDayInsight.wearColor}</p>
                </div>
              </div>

              {/* Weekend Tip */}
              {selectedDayInsight.isWeekend && selectedDayInsight.weekendTip && (
                <div className="glass-panel p-5 rounded-[28px] border-accent-gold/20 bg-gradient-to-r from-accent-gold/10 to-amber-500/5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-accent-gold">
                        {selectedDayInsight.weekendTip.toLowerCase().includes('home') || 
                         selectedDayInsight.weekendTip.toLowerCase().includes('evde') 
                          ? 'home' 
                          : 'park'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] text-accent-gold/60 uppercase tracking-[0.2em] font-bold mb-1">
                        {profile.locale === 'tr' ? 'Hafta Sonu Önerisi' : profile.locale === 'th' ? 'คำแนะนำวันหยุด' : 'Weekend Tip'}
                      </p>
                      <p className="text-white/90 text-sm">{selectedDayInsight.weekendTip}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* CTA to Dashboard for numbers/colors */}
          {!loading && monthlyInsight && (
            <div className="text-center py-4">
              <button 
                onClick={() => navigate('DASHBOARD')} 
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors px-5 py-3 rounded-full"
              >
                <span className="material-symbols-outlined text-primary text-sm">dashboard</span>
                <span className="text-white/60 text-xs">
                  {profile.locale === 'tr' 
                    ? 'Günlük şanslı sayılar ve renkler için Ana Sayfaya git'
                    : profile.locale === 'th'
                    ? 'ไปที่แดชบอร์ดเพื่อดูจำนวนและสีโชคดีรายวัน'
                    : 'Go to Dashboard for daily lucky numbers & colors'}
                </span>
              </button>
            </div>
          )}
        </main>
      </div>

      <Navigation activeScreen="CALENDAR" navigate={navigate} />
    </div>
  );
};

export default CalendarScreen;
