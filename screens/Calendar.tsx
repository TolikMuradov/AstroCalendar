import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, MonthlyInsight, MonthlyDayInsight, Screen } from '../types';
import { storage } from '../services/storage';
import { generateMonthlyInsight } from '../services/geminiService';
import { translations } from '../i18n/translations';
import Icon from '../components/Icon';
import Navigation from '../components/Navigation';
import CosmicLoader from '../components/CosmicLoader';
import { colors, glassPanel } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');
const CELL_SIZE = Math.floor((screenWidth - 40 - 6 * 4) / 7); // 7 cols, 20px padding each side, 4px gap

interface CalendarProps {
  profile: UserProfile | null;
  navigate: (screen: Screen) => void;
}

const dayTypeColors: Record<string, string> = {
  cleansing: '#60a5fa',
  manifestation: '#f59e0b',
  rest: '#a78bfa',
  action: '#ef4444',
  reflection: '#38bdf8',
  social: '#ec4899',
  gratitude: '#34d399',
  creativity: '#fb923c',
};

const dayTypeEmojis: Record<string, string> = {
  cleansing: '🧘',
  manifestation: '✨',
  rest: '😴',
  action: '🔥',
  reflection: '🔮',
  social: '🤝',
  gratitude: '🙏',
  creativity: '🎨',
};

const CalendarScreen: React.FC<CalendarProps> = ({ profile, navigate }) => {
  const [locale, setLocale] = useState(profile?.locale || 'en');
  const t = translations[locale];
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthly, setMonthly] = useState<MonthlyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<MonthlyDayInsight | null>(null);
  const isPremium = profile?.subscription?.isPremium;

  useEffect(() => {
    (async () => {
      const loc = await storage.getLocale();
      if (loc) setLocale(loc);
    })();
  }, []);

  useEffect(() => {
    if (profile) loadMonth();
  }, [year, month]);

  // Auto-select today
  useEffect(() => {
    if (monthly) {
      const currentNow = new Date();
      if (year === currentNow.getFullYear() && month === currentNow.getMonth() + 1) {
        const todayInsight = monthly.days.find(d => d.day === currentNow.getDate());
        if (todayInsight && !selectedDay) {
          setSelectedDay(todayInsight);
        }
      }
    }
  }, [monthly, year, month]);

  const loadMonth = async () => {
    if (!profile) return;
    const cached = await storage.getMonthlyCache(profile.uid, year, month, locale);
    if (cached) { setMonthly(cached); return; }

    setLoading(true);
    try {
      const result = await generateMonthlyInsight(profile, year, month);
      await storage.setMonthlyCache(profile.uid, result);
      setMonthly(result);
    } catch (err) {
      console.error('Monthly insight error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (dir: number) => {
    setSelectedDay(null);
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  };

  const monthName = new Date(year, month - 1).toLocaleDateString(
    locale === 'tr' ? 'tr-TR' : locale === 'th' ? 'th-TH' : 'en-US', { month: 'long' }
  );
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const weekDays = locale === 'tr' ? ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'] :
    locale === 'th' ? ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'] :
      ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Adjust first day (0=Sun) → Mon-based
  const adjustedFirst = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const getDayInsight = (day: number): MonthlyDayInsight | undefined => {
    return monthly?.days.find(d => d.day === day);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0202', '#1a0808']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <Icon name="chevron_left" size={24} color="#fff" />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.monthTitle}>{monthName}</Text>
            <Text style={styles.yearText}>{year}</Text>
          </View>
          <Pressable onPress={() => changeMonth(1)} style={styles.navBtn}>
            <Icon name="chevron_right" size={24} color="#fff" />
          </Pressable>
        </View>

        {monthly?.monthTheme && (
          <View style={styles.themeBadge}>
            <Text style={styles.themeText}>{monthly.monthTheme}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <CosmicLoader size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t.connectingCosmos}</Text>
          </View>
        ) : (
          <>
            {/* Week day headers */}
            <View style={styles.weekRow}>
              {weekDays.map((d, i) => (
                <Text key={i} style={styles.weekDay}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.gridWrap}>
              {/* Empty cells for offset */}
              {Array.from({ length: adjustedFirst }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.cell} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayInfo = getDayInsight(day);
                const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                const isSelected = selectedDay?.day === day;
                const typeColor = dayInfo ? dayTypeColors[dayInfo.dayType] || '#666' : '#333';

                return (
                  <Pressable
                    key={day}
                    onPress={() => dayInfo && setSelectedDay(isSelected ? null : dayInfo)}
                    style={[styles.cell, isToday && styles.cellToday, isSelected && styles.cellSelected]}
                  >
                    <Text style={[styles.cellText, isToday && { color: colors.accentGold }]}>{day}</Text>
                    {dayInfo && <View style={[styles.dot, { backgroundColor: typeColor }]} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Day type legend */}
            <View style={styles.legendWrap}>
              {Object.entries(dayTypeColors).map(([type, color]) => (
                <View key={type} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{type}</Text>
                </View>
              ))}
            </View>

            {/* Selected day detail */}
            {selectedDay && (
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={{ fontSize: 24 }}>{dayTypeEmojis[selectedDay.dayType] || '✨'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle}>Day {selectedDay.day} — {selectedDay.dayType}</Text>
                    {selectedDay.isWeekend && <Text style={styles.weekendBadge}>Weekend</Text>}
                  </View>
                </View>

                <Text style={styles.detailMessage}>{selectedDay.message}</Text>

                <View style={styles.detailGrid}>
                  <DetailItem icon="diamond" label="Stone" value={selectedDay.stone} sub={selectedDay.stoneEnergy} />
                  <DetailItem icon="directions_run" label="Activity" value={selectedDay.activity} />
                  <DetailItem icon="local_cafe" label="Drink" value={selectedDay.drink} />
                  <DetailItem icon="palette" label="Wear" value={selectedDay.wearColor} />
                </View>

                <View style={styles.affirmationBox}>
                  <Text style={styles.affirmationText}>"{selectedDay.affirmation}"</Text>
                </View>

                {selectedDay.weekendTip && (
                  <View style={styles.weekendTipBox}>
                    <Icon name="weekend" size={16} color={colors.accentGold} />
                    <Text style={styles.weekendTipText}>{selectedDay.weekendTip}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navigation activeScreen="CALENDAR" navigate={navigate} isPremium={!!isPremium} />
    </View>
  );
};

const DetailItem: React.FC<{ icon: string; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
  <View style={styles.detailItem}>
    <Icon name={icon} size={18} color={colors.accentGold} />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
    {sub && <Text style={styles.detailSub}>{sub}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { width: 44, height: 44, borderRadius: 22, ...glassPanel, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', fontStyle: 'italic' },
  yearText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 2 },
  themeBadge: { ...glassPanel, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 20, alignSelf: 'center' },
  themeText: { color: colors.accentGold, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  loadingBox: { ...glassPanel, borderRadius: 20, padding: 48, alignItems: 'center', gap: 16 },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDay: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold', width: CELL_SIZE, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  cellToday: { borderWidth: 1, borderColor: colors.accentGold },
  cellSelected: { backgroundColor: 'rgba(142,5,5,0.2)', borderWidth: 1, borderColor: colors.primary },
  cellText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  legendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, textTransform: 'capitalize' },
  detailCard: { ...glassPanel, borderRadius: 20, padding: 20, marginTop: 8 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize' },
  weekendBadge: { color: colors.accentGold, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  detailMessage: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  detailGrid: { gap: 12, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  detailLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, width: 60 },
  detailValue: { color: '#fff', fontSize: 13, fontWeight: '500', flex: 1 },
  detailSub: { color: 'rgba(255,255,255,0.3)', fontSize: 11, width: '100%', marginLeft: 86 },
  affirmationBox: { ...glassPanel, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  affirmationText: { color: colors.accentGold, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  weekendTipBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(243,198,35,0.05)', borderRadius: 8, padding: 12 },
  weekendTipText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, flex: 1 },
});

export default CalendarScreen;
