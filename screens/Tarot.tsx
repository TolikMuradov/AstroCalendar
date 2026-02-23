import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Dimensions, ImageBackground, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, Screen } from '../types';
import { coinService, CoinBalance } from '../services/coinService';
import { storage } from '../services/storage';
import { translations } from '../i18n/translations';
import Icon from '../components/Icon';
import Navigation from '../components/Navigation';
import { colors, glassPanel } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface TarotProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const TarotCardItem = ({ title, price, icon, onPress, disabled, done }: { title: string, price: number, icon: string, onPress: () => void, disabled?: boolean, done?: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.cardItemContainer, { transform: [{ scale: scaleAnim }] }, done && { opacity: 0.5 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardItemInner}
      >
        <View style={styles.cardIconBox}>
          <Text style={{ fontSize: 32 }}>{icon}</Text>
        </View>
        <Text style={styles.cardItemTitle}>{title}</Text>
        {done ? (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>✓</Text>
          </View>
        ) : (
          <View style={styles.cardItemPriceRow}>
            <Text style={styles.cardItemPriceText}>🪙 {price}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const TarotScreen: React.FC<TarotProps> = ({ profile, navigate }) => {
  const locale = profile.locale || 'en';
  const t = translations[locale];
  const [coinBalance, setCoinBalance] = useState<CoinBalance>({ coins: 0, rewardCountToday: 0, dailyLimit: 10, canWatchAd: true });
  const [hasUsedDaily, setHasUsedDaily] = useState(false);
  const [spreadStatus, setSpreadStatus] = useState<Record<string, boolean>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();

    let unsubCoins: any = null;
    const loadData = async () => {
      try {
        const bal = await coinService.getBalance();
        setCoinBalance(bal);
      } catch { }
      unsubCoins = coinService.subscribe(setCoinBalance);
    };
    loadData();

    const loadSpreadStatus = async () => {
      const status = await storage.getTodaySpreadStatus(profile.uid);
      setSpreadStatus(status);
      setHasUsedDaily(!!status['daily']);
    };
    loadSpreadStatus();

    return () => {
      if (unsubCoins) unsubCoins();
    };
  }, []);

  const handleReadingPress = (type: string, cost: number) => {
    if (type === 'daily') {
      navigate('DAILY_CARD');
      return;
    }
    if (type === 'past_present_future') {
      // Always navigate — screen handles cache internally
      navigate('PAST_PRESENT_FUTURE');
      return;
    }
    if (type === 'you_them_energy') {
      navigate('YOU_THEM_ENERGY');
      return;
    }

    // For other spreads: if already done today, still navigate (show cached)
    if (spreadStatus[type]) {
      // @ts-ignore
      navigate('EMPTY_READING', { readingType: type });
      return;
    }

    if (coinBalance.coins < cost && !profile.subscription?.isPremium) {
      alert("Not enough coins");
      return;
    }
    // @ts-ignore - Temporary until we update types
    navigate('EMPTY_READING', { readingType: type });
  };

  const tarotOptions = [
    { id: 'past_present_future', title: t.spreadPastPresentFuture, icon: '⏳' },
    { id: 'you_them_energy', title: t.spreadYouThemEnergy, icon: '☯️' },
    { id: 'love_reading', title: t.spreadLoveReading, icon: '❤️' },
    { id: 'career_money', title: t.spreadCareerMoney, icon: '💼' },
    { id: 'shadow_energy', title: t.spreadShadowEnergy, icon: '🌑' },
    { id: 'fate_choose', title: t.spreadFateChoose, icon: '✨' },
  ];



  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={[colors.backgroundDark, '#1a0808', colors.backgroundDark]} style={StyleSheet.absoluteFill} />

      {/* Background Stars (Visual Placeholder for now) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.particle, { top: '10%', left: '20%' }]} />
        <View style={[styles.particle, { top: '25%', left: '80%' }]} />
        <View style={[styles.particle, { top: '45%', left: '15%' }]} />
        <View style={[styles.particle, { top: '70%', left: '85%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.tarot || "Tarot"}</Text>
          <View style={styles.coinBadge}>
            <Text style={styles.coinBadgeText}>🪙 {coinBalance.coins}</Text>
          </View>
        </View>

        {/* Daily Free Card */}
        <View style={styles.dailySection}>
          <Text style={styles.sectionTitle}>{t.tarotDailyReading}</Text>
          <Animated.View style={[
            styles.dailyCard,
            !hasUsedDaily && {
              borderColor: colors.accentGold,
              borderWidth: 1.5,
              shadowColor: colors.accentGold,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.6] }),
              shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 15] }),
            },
            hasUsedDaily && {
              opacity: 0.7,
              borderColor: 'rgba(255,255,255,0.05)',
            }
          ]}>
            <Pressable style={styles.dailyCardInner} onPress={() => handleReadingPress('daily', 0)}>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.dailyTitle}>{t.tarotDailyCard}</Text>
                  {!hasUsedDaily && (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>{t.tarotFreeBadge}</Text>
                    </View>
                  )}
                </View>
                {hasUsedDaily ? (
                  <View style={styles.usedBadge}>
                    <Text style={styles.usedBadgeText}>Available tomorrow</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.dailySubtitle}>{t.tarotFreeOncePerDay}</Text>
                    <Text style={styles.dailyPrice}>🪙 0</Text>
                  </>
                )}
              </View>
              <Text style={{ fontSize: 44 }}>✨</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Grid Section */}
        <View style={styles.gridContainer}>
          <Text style={styles.sectionTitle}>{t.tarotSpiritualSpreads}</Text>
          <View style={styles.grid}>
            {tarotOptions.map((opt) => {
              const cost = 10;
              const isDone = !!spreadStatus[opt.id];
              return (
                <TarotCardItem
                  key={opt.id}
                  title={opt.title}
                  price={cost}
                  icon={opt.icon}
                  done={isDone}
                  onPress={() => handleReadingPress(opt.id, cost)}
                />
              );
            })}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Navigation activeScreen="TAROT" navigate={navigate} isPremium={!!profile.subscription?.isPremium} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundDark },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { color: '#fff', fontSize: 34, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  coinBadge: { ...glassPanel, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  coinBadgeText: { color: colors.accentGold, fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  dailySection: { marginBottom: 32 },
  dailyCard: { ...glassPanel, borderRadius: 24, overflow: 'hidden' },
  dailyCardInner: { padding: 24, flexDirection: 'row', alignItems: 'center' },
  dailyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginRight: 10 },
  dailySubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  dailyPrice: { color: colors.accentGold, fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  freeBadge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  usedBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 12, alignSelf: 'flex-start' },
  usedBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500' },
  gridContainer: { marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardItemContainer: { width: '48%', marginBottom: 16 },
  cardItemInner: { ...glassPanel, borderRadius: 18, padding: 20, alignItems: 'center', minHeight: 160 },
  cardIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' },

  cardItemTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, lineHeight: 18 },
  cardItemPriceRow: { flexDirection: 'row', alignItems: 'center' },
  cardItemPriceText: { color: colors.accentGold, fontSize: 13, fontWeight: 'bold' },
  doneBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  doneBadgeText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  particle: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
});

export default TarotScreen;
