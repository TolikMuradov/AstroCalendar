import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Image, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, DailyInsight, YearlyInsight, Screen, LUCKY_LOCKED_COST, DAILY_REWARD_LIMIT } from '../types';
import { storage } from '../services/storage';
import { coinService, CoinBalance } from '../services/coinService';
import { generateDailyInsight, generateYearlyInsight } from '../services/geminiService';
import { getFallbackDailyInsight, getFallbackYearlyInsight, getZodiacIcon, getChineseAnimalIcon, getElementTrait, getCurrentYearAnimal } from '../utils/astrology';
import { getLuckyUnlocksForToday, addLuckyUnlockForToday } from '../utils/dailyState';
import { WesternZodiacImages, ChineseZodiacImages } from '../utils/zodiacImages';
import { translations } from '../i18n/translations';
import Icon from '../components/Icon';
import CoinDisplay from '../components/CoinDisplay';
import Navigation from '../components/Navigation';
import RewardedAdModal from '../components/RewardedAdModal';
import CosmicLoader from '../components/CosmicLoader';
import { colors, glassPanel } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const COLOR_MAP: Record<string, string> = {
  red: '#e53e3e', crimson: '#dc143c', scarlet: '#ff2400',
  blue: '#4299e1', 'navy blue': '#001f5b', 'royal blue': '#4169e1', 'sky blue': '#87ceeb', 'sapphire blue': '#0f52ba', 'light blue': '#add8e6', 'dark blue': '#00008b', cobalt: '#0047ab',
  green: '#48bb78', 'emerald green': '#50c878', 'forest green': '#228b22', 'olive green': '#808000', 'lime green': '#32cd32', mint: '#3eb489', 'mint green': '#98fb98', sage: '#87ae73', teal: '#008080', emerald: '#50c878',
  yellow: '#ecc94b', gold: '#ffd700', golden: '#ffd700', amber: '#ffbf00', mustard: '#e1ad01',
  orange: '#ed8936', tangerine: '#ff9966', coral: '#ff7f50', peach: '#ffcba4',
  purple: '#9f7aea', violet: '#8b5cf6', 'royal purple': '#7851a9', lavender: '#b794f4', plum: '#8e4585', mauve: '#e0b0ff', lilac: '#c8a2c8', magenta: '#ff00ff', indigo: '#4b0082',
  pink: '#ed64a6', rose: '#ff007f', 'hot pink': '#ff69b4', blush: '#de5d83', salmon: '#fa8072', fuchsia: '#ff00ff',
  white: '#f7fafc', ivory: '#fffff0', cream: '#fffdd0', pearl: '#eae0c8',
  black: '#1a202c', charcoal: '#36454f', onyx: '#353839',
  gray: '#a0aec0', grey: '#a0aec0', silver: '#c0c0c0', 'slate gray': '#708090',
  brown: '#8b4513', chocolate: '#7b3f00', copper: '#b87333', bronze: '#cd7f32', maroon: '#800000', burgundy: '#800020',
  turquoise: '#40e0d0', aqua: '#00ffff', cyan: '#00ffff', aquamarine: '#7fffd4',
  beige: '#f5f5dc', taupe: '#483c32', khaki: '#c3b091',
  ruby: '#e0115f', sapphire: '#0f52ba', topaz: '#ffc87c',
};

function getColorHex(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return '#f3c623';
}

interface DashboardProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const DashboardScreen: React.FC<DashboardProps> = ({ profile, navigate }) => {
  const [locale, setLocale] = useState(profile.locale || 'en');
  const t = translations[locale];
  const today = new Date().toISOString().split('T')[0];

  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [yearly, setYearly] = useState<YearlyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  // Coin & ad state
  const [coinBalance, setCoinBalance] = useState<CoinBalance>({ coins: 0, rewardCountToday: 0, dailyLimit: DAILY_REWARD_LIMIT, canWatchAd: true });
  const [showAdModal, setShowAdModal] = useState(false);

  // Lucky unlocks
  const [unlockedIndices, setUnlockedIndices] = useState<number[]>([]);
  const isPremium = profile.subscription?.isPremium;

  // Ritual checkboxes
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>([]);

  // Glow animation for lucky color
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Load initial data
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();

    (async () => {
      const loc = await storage.getLocale();
      if (loc) setLocale(loc);
    })();
  }, []);

  useEffect(() => {
    loadInsight();
    loadUnlocks();

    let unsubCoins: any = null;
    const initCoins = async () => {
      try {
        const bal = await coinService.getBalance();
        setCoinBalance(bal);
      } catch { }
      unsubCoins = coinService.subscribe((bal) => setCoinBalance(bal));
    };
    initCoins();

    return () => {
      if (unsubCoins) unsubCoins();
    };
  }, []);

  const loadUnlocks = async () => {
    const unlocks = await getLuckyUnlocksForToday(profile.uid);
    setUnlockedIndices(unlocks);
  };

  const loadInsight = async () => {
    setLoading(true);
    setError(null);
    setIsFallback(false);

    // Check cache
    const cached = await storage.getDailyCache(profile.uid, today, locale);
    if (cached) {
      setInsight(cached);
      setCheckedSteps(new Array(cached.ritual?.steps?.length || 0).fill(false));
      setLoading(false);
      return;
    }

    try {
      const result = await generateDailyInsight(profile, today);
      await storage.setDailyCache(profile.uid, result);
      setInsight(result);
      setCheckedSteps(new Array(result.ritual?.steps?.length || 0).fill(false));
    } catch (err: any) {
      console.error('Daily insight error:', err);
      const fallback = getFallbackDailyInsight(profile, today);
      setInsight(fallback);
      setCheckedSteps(new Array(fallback.ritual?.steps?.length || 0).fill(false));
      setIsFallback(true);
      if (err.message?.includes('Rate') || err.message?.includes('429')) {
        setError(t.errorQuota);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadYearly = async () => {
    const year = new Date().getFullYear();
    const cached = await storage.getYearlyCache(profile.uid, year, locale);
    if (cached) { setYearly(cached); return; }

    setYearlyLoading(true);
    try {
      const result = await generateYearlyInsight(profile, year);
      await storage.setYearlyCache(profile.uid, result);
      setYearly(result);
    } catch {
      setYearly(getFallbackYearlyInsight(profile, year));
    } finally {
      setYearlyLoading(false);
    }
  };

  const handleUnlockLucky = async (index: number) => {
    if (isPremium || unlockedIndices.includes(index)) return;
    if (coinBalance.coins < LUCKY_LOCKED_COST) {
      setShowAdModal(true);
      return;
    }
    try {
      await coinService.spendCoins(LUCKY_LOCKED_COST);
      await addLuckyUnlockForToday(profile.uid, index);
      setUnlockedIndices(prev => [...prev, index]);
    } catch (err) {
      console.error('Unlock error:', err);
    }
  };

  const toggleStep = (i: number) => {
    setCheckedSteps(prev => { const next = [...prev]; next[i] = !next[i]; return next; });
  };

  const zodiacIcon = getZodiacIcon(profile.computedProfile.westernZodiac.sign);
  const chineseIcon = getChineseAnimalIcon(profile.computedProfile.chineseZodiac.animal);
  const elementTrait = getElementTrait(profile.computedProfile.westernZodiac.element, locale);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0202', '#1a0808', '#0a0202']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t.dashboard},</Text>
            <Text style={styles.userName}>{profile.name}</Text>
          </View>
          <CoinDisplay coins={coinBalance.coins} onClick={() => setShowAdModal(true)} />
        </View>

        {/* Zodiac Cards */}
        <View style={styles.zodiacRow}>
          <View style={styles.zodiacCard}>
            <Image source={WesternZodiacImages[profile.computedProfile.westernZodiac.sign]} style={{ width: 64, height: 64, resizeMode: 'contain', marginBottom: 8 }} />
            <Text style={styles.zodiacSign}>{profile.computedProfile.westernZodiac.sign}</Text>
            <Text style={styles.zodiacDetail}>{profile.computedProfile.westernZodiac.element} • {elementTrait}</Text>
          </View>
          <View style={styles.zodiacCard}>
            <Image source={ChineseZodiacImages[profile.computedProfile.chineseZodiac.animal]} style={{ width: 64, height: 64, resizeMode: 'contain', marginBottom: 8 }} />
            <Text style={styles.zodiacSign}>{profile.computedProfile.chineseZodiac.animal}</Text>
            <Text style={styles.zodiacDetail}>{profile.computedProfile.chineseZodiac.element} • {profile.computedProfile.chineseZodiac.yinYang}</Text>
          </View>
        </View>

        {/* Daily Insight */}
        {loading ? (
          <View style={styles.loadingCard}>
            <CosmicLoader size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t.connectingCosmos}</Text>
          </View>
        ) : insight ? (
          <>
            {/* Energy Score */}
            <View style={styles.insightCard}>
              {isFallback && (
                <View style={styles.fallbackBadge}>
                  <Icon name="info" size={14} color={colors.accentGold} />
                  <Text style={styles.fallbackText}>{t.fallbackNotice}</Text>
                </View>
              )}

              <View style={styles.energyRow}>
                <View>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDate}>{new Date(today).toLocaleDateString(locale === 'tr' ? 'tr-TR' : locale === 'th' ? 'th-TH' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                </View>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreText}>{Math.round(insight.energyScore)}</Text>
                </View>
              </View>

              <Text style={styles.descriptionText}>{insight.description}</Text>

              {/* Lucky Color */}
              <View style={{ marginVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                  {t.luckyColor}
                </Text>

                <Animated.View style={{
                  width: 100, height: 100, borderRadius: 50,
                  backgroundColor: getColorHex(insight.color) + '30',
                  alignItems: 'center', justifyContent: 'center',
                  borderColor: getColorHex(insight.color),
                  borderWidth: 2.5,
                  // Pulsing scale
                  transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
                  // Neon glow effect using shadow
                  shadowColor: getColorHex(insight.color),
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                  shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 25] }),
                  elevation: 10
                }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 24, backgroundColor: getColorHex(insight.color),
                    shadowColor: getColorHex(insight.color), shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 6,
                  }} />
                </Animated.View>

                <Text style={{
                  color: '#fff', fontSize: 14, fontWeight: '600', fontStyle: 'italic', textAlign: 'center',
                  marginTop: 10,
                  textShadowColor: getColorHex(insight.color), textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8
                }}>
                  {insight.color}
                </Text>
              </View>
            </View>

            {/* Lucky Numbers */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="casino" size={20} color={colors.accentGold} />
                <Text style={styles.sectionTitle}>{t.luckyNumber}</Text>
              </View>
              <View style={styles.luckyRow}>
                {insight.luckyNumbers.map((num, i) => {
                  const isFirst = i === 0;
                  const isLocked = !isPremium && !isFirst && !unlockedIndices.includes(i);
                  return (
                    <Pressable key={i} onPress={() => isLocked ? handleUnlockLucky(i) : null} style={[styles.luckyBall, isLocked && styles.luckyLocked]}>
                      {isLocked ? (
                        <View style={{ alignItems: 'center' }}>
                          <Icon name="lock" size={20} color="rgba(255,255,255,0.3)" />
                          <Text style={styles.unlockCost}>{LUCKY_LOCKED_COST} 🪙</Text>
                        </View>
                      ) : (
                        <Text style={styles.luckyNum}>{num}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Daily Ritual */}
            {insight.ritual && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="self_improvement" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>{t.ritual}</Text>
                </View>
                <Text style={styles.ritualTitle}>{insight.ritual.title}</Text>
                {insight.ritual.steps.map((step, i) => (
                  <Pressable key={i} onPress={() => toggleStep(i)} style={styles.stepRow}>
                    <View style={[styles.checkbox, checkedSteps[i] && styles.checkboxChecked]}>
                      {checkedSteps[i] && <Icon name="check" size={14} color="#fff" />}
                    </View>
                    <Text style={[styles.stepText, checkedSteps[i] && styles.stepDone]}>{step}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : null}

        {/* Earn Coins Card */}
        {!isPremium && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={{ fontSize: 20 }}>🪙</Text>
              <Text style={styles.sectionTitle}>{t.earnCoinsFirst}</Text>
            </View>
            <Text style={styles.earnDesc}>{coinBalance.rewardCountToday}/{DAILY_REWARD_LIMIT} {t.coins} earned today</Text>
            <Pressable onPress={() => setShowAdModal(true)} disabled={!coinBalance.canWatchAd}>
              <LinearGradient
                colors={coinBalance.canWatchAd ? [colors.accentGold, '#d4a017'] : ['#333', '#444']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.earnBtn}
              >
                <Icon name="play_circle" size={20} color={coinBalance.canWatchAd ? '#0a0202' : '#666'} />
                <Text style={[styles.earnBtnText, !coinBalance.canWatchAd && { color: '#666' }]}>
                  {coinBalance.canWatchAd ? 'Watch Ad → +1 🪙' : 'Limit Reached'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Yearly Forecast */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="auto_awesome" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t.yearlyInsight} {new Date().getFullYear()}</Text>
          </View>
          {yearly ? (
            <View style={{ gap: 12 }}>
              <Text style={styles.yearlyTheme}>{yearly.theme}</Text>
              <View>
                <Text style={styles.subLabel}>Strengths</Text>
                {yearly.strengths.map((s, i) => <Text key={i} style={styles.listItem}>✦ {s}</Text>)}
              </View>
              <View>
                <Text style={styles.subLabel}>Challenges</Text>
                {yearly.challenges.map((s, i) => <Text key={i} style={styles.listItem}>◈ {s}</Text>)}
              </View>
              <View>
                <Text style={styles.subLabel}>Recommendations</Text>
                {yearly.recommendations.map((s, i) => <Text key={i} style={styles.listItem}>→ {s}</Text>)}
              </View>
            </View>
          ) : (
            <Pressable onPress={loadYearly} disabled={yearlyLoading}>
              <LinearGradient colors={[colors.primary, '#991b1b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.generateBtn}>
                {yearlyLoading ? <CosmicLoader size="small" color="#fff" /> : <Text style={styles.generateText}>{t.generate}</Text>}
              </LinearGradient>
            </Pressable>
          )}
        </View>

        {/* Spacer for nav */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navigation */}
      <Navigation activeScreen="DASHBOARD" navigate={navigate} isPremium={!!isPremium} />

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        rewardCountToday={coinBalance.rewardCountToday}
        onCoinUpdate={(newBalance) => setCoinBalance(newBalance)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold', fontStyle: 'italic' },
  zodiacRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  zodiacCard: { flex: 1, ...glassPanel, borderRadius: 20, padding: 20, alignItems: 'center', gap: 4 },
  zodiacSign: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  zodiacDetail: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  loadingCard: { ...glassPanel, borderRadius: 20, padding: 40, alignItems: 'center', gap: 16, marginBottom: 20 },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  insightCard: { ...glassPanel, borderRadius: 20, padding: 20, marginBottom: 16 },
  fallbackBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, backgroundColor: 'rgba(243,198,35,0.05)', borderRadius: 8, padding: 8 },
  fallbackText: { color: colors.accentGold, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  energyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  insightTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', fontStyle: 'italic', maxWidth: screenWidth - 140 },
  insightDate: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  descriptionText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 'bold' },
  colorValue: { color: '#fff', fontSize: 14, fontStyle: 'italic' },
  sectionCard: { ...glassPanel, borderRadius: 20, padding: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  luckyRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  luckyBall: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.accentGold, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(243,198,35,0.05)' },
  luckyLocked: { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' },
  luckyNum: { color: colors.accentGold, fontSize: 22, fontWeight: 'bold', fontStyle: 'italic' },
  unlockCost: { color: 'rgba(255,255,255,0.3)', fontSize: 8, marginTop: 2 },
  ritualTitle: { color: colors.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20, flex: 1 },
  stepDone: { textDecorationLine: 'line-through', opacity: 0.4 },
  earnDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 },
  earnBtn: { height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  earnBtnText: { color: '#0a0202', fontSize: 14, fontWeight: 'bold' },
  yearlyTheme: { color: colors.accentGold, fontSize: 16, fontWeight: 'bold', fontStyle: 'italic', marginBottom: 8 },
  subLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  listItem: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20, marginLeft: 4 },
  generateBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  generateText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

export default DashboardScreen;
