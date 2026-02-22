import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, TarotReading, Screen, TAROT_READING_COST } from '../types';
import { storage } from '../services/storage';
import { coinService, CoinBalance } from '../services/coinService';
import { generateTarotReading } from '../services/geminiService';
import { TAROT_DECK, TarotCard, getCardName as getCardNameFromDeck } from '../utils/tarotDeck';
import { translations } from '../i18n/translations';
import Icon from '../components/Icon';
import Navigation from '../components/Navigation';
import RewardedAdModal from '../components/RewardedAdModal';
import CosmicLoader from '../components/CosmicLoader';
import { colors, glassPanel } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

type Phase = 'idle' | 'shuffle' | 'reveal' | 'interpret' | 'complete';

interface TarotProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const TarotScreen: React.FC<TarotProps> = ({ profile, navigate }) => {
  const [locale, setLocale] = useState(profile.locale || 'en');
  const t = translations[locale];

  const [phase, setPhase] = useState<Phase>('idle');
  const [drawnCard, setDrawnCard] = useState<TarotCard | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [history, setHistory] = useState<TarotReading[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coin state
  const [coinBalance, setCoinBalance] = useState<CoinBalance>({ coins: 0, rewardCountToday: 0, dailyLimit: 3, canWatchAd: true });
  const [showAdModal, setShowAdModal] = useState(false);
  const [showCoinGate, setShowCoinGate] = useState(false);
  const isPremium = profile.subscription?.isPremium;

  // Animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shuffleAnim = useRef(new Animated.Value(0)).current;

  // Start shuffle animation when phase changes
  useEffect(() => {
    if (phase === 'shuffle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shuffleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(shuffleAnim, { toValue: -1, duration: 600, useNativeDriver: true }),
          Animated.timing(shuffleAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ])
      ).start();
    } else {
      shuffleAnim.stopAnimation();
      shuffleAnim.setValue(0);
    }
  }, [phase]);

  useEffect(() => {
    (async () => {
      const loc = await storage.getLocale();
      if (loc) setLocale(loc);
      const hist = await storage.getTarotHistory(profile.uid);
      setHistory(hist);

      // Check today's reading
      const today = new Date().toISOString().split('T')[0];
      const todayReading = await storage.getDailyTarotReading(profile.uid, today);
      if (todayReading) {
        const card = TAROT_DECK.find(c => c.id === todayReading.cardId);
        if (card) {
          setDrawnCard(card);
          setIsReversed(todayReading.isReversed);
          setReading(todayReading);
          setPhase('complete');
          flipAnim.setValue(1);
          fadeAnim.setValue(1);
        }
      }

      try {
        const bal = await coinService.getBalance();
        setCoinBalance(bal);
      } catch { }
    })();
  }, []);

  const getCardName = (card: TarotCard): string => {
    return getCardNameFromDeck(card, locale);
  };

  const handleDrawCard = async () => {
    // Coin check for free users
    if (!isPremium) {
      try {
        const bal = await coinService.getBalance();
        setCoinBalance(bal);
        if (bal.coins < TAROT_READING_COST) {
          setShowCoinGate(true);
          return;
        }
      } catch {
        setShowCoinGate(true);
        return;
      }
    }

    setError(null);
    setPhase('shuffle');

    // Shuffle animation (wait 2s)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Draw random card
    const card = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
    const reversed = Math.random() > 0.5;
    setDrawnCard(card);
    setIsReversed(reversed);

    // Reveal with flip animation
    setPhase('reveal');
    flipAnim.setValue(0);
    Animated.timing(flipAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    // Spend coins (free users)
    if (!isPremium) {
      try { await coinService.spendCoins(TAROT_READING_COST); } catch { }
    }

    // Get AI interpretation
    setPhase('interpret');
    fadeAnim.setValue(0);

    try {
      const result = await generateTarotReading(
        profile, card.name, card.keywords, reversed, card.arcana, card.suit
      );

      const today = new Date().toISOString().split('T')[0];
      const tarotReading: TarotReading = {
        id: `${Date.now()}-${card.id}`,
        cardId: card.id,
        cardName: getCardName(card),
        isReversed: reversed,
        interpretation: result.interpretation,
        guidance: result.guidance,
        affirmation: result.affirmation,
        date: today,
        locale,
        generatedAt: new Date().toISOString(),
      };

      await storage.saveTarotReading(profile.uid, tarotReading);
      setReading(tarotReading);
      setHistory(prev => [tarotReading, ...prev]);
      setPhase('complete');

      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (err: any) {
      console.error('Tarot reading error:', err);
      setError(t.errorGeneral);
      setPhase('reveal');
    }
  };

  const handleDrawAgain = () => {
    setPhase('idle');
    setDrawnCard(null);
    setReading(null);
    setError(null);
    flipAnim.setValue(0);
    fadeAnim.setValue(0);
  };

  const cardRotate = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '0deg'] });
  const cardOpacity = flipAnim.interpolate({ inputRange: [0, 0.45, 0.55, 1], outputRange: [0, 0, 1, 1] });

  // Shuffle Interpolations
  const card1Tx = shuffleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [60, 0, -60] });
  const card2Tx = shuffleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-60, 0, 60] });
  const card1Rot = shuffleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-5deg', '-15deg', '-25deg'] });
  const card2Rot = shuffleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['5deg', '15deg', '25deg'] });
  const card3Tx = shuffleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-20, 0, 20] });
  const card3Rot = shuffleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0202', '#1a0808', '#0a0202']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t.tarot}</Text>
            <Text style={styles.subtitle}>{t.tarotSubtitle}</Text>
          </View>
          <Pressable onPress={() => setShowHistory(!showHistory)} style={styles.historyBtn}>
            <Icon name="history" size={24} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>

        {/* Cost badge */}
        {!isPremium && phase === 'idle' && (
          <View style={styles.costBadge}>
            <Text style={styles.costText}>{t.tarotCost} • {t.freeForPremium}</Text>
          </View>
        )}

        {/* History */}
        {showHistory ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>{t.readingHistory}</Text>
            {history.length === 0 ? (
              <Text style={styles.emptyText}>{t.noReadings}</Text>
            ) : (
              history.slice(0, 10).map((r, i) => (
                <View key={i} style={styles.historyCard}>
                  <Text style={styles.historyCardName}>{r.cardName} {r.isReversed ? `(${t.reversed})` : `(${t.upright})`}</Text>
                  <Text style={styles.historyDate}>{r.date}</Text>
                  <Text style={styles.historyInterp} numberOfLines={2}>{r.interpretation}</Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <>
            {/* IDLE: Draw button */}
            {phase === 'idle' && (
              <View style={styles.centerArea}>
                <View style={styles.deckVisual}>
                  <Text style={{ fontSize: 64 }}>🃏</Text>
                </View>
                <Pressable onPress={handleDrawCard}>
                  <LinearGradient colors={[colors.primary, '#991b1b', colors.accentGold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.drawBtn}>
                    <Icon name="style" size={20} color="#fff" />
                    <Text style={styles.drawBtnText}>{t.drawCard}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* SHUFFLE */}
            {phase === 'shuffle' && (
              <View style={[styles.centerArea, { height: 320, justifyContent: 'center' }]}>
                <View style={{ position: 'relative', width: 120, height: 180 }}>
                  <Animated.View style={[styles.miniCard, { transform: [{ translateX: card1Tx }, { rotate: card1Rot }] }]}>
                    <Text style={{ fontSize: 50 }}>🃏</Text>
                  </Animated.View>
                  <Animated.View style={[styles.miniCard, { transform: [{ translateX: card2Tx }, { rotate: card2Rot }] }]}>
                    <Text style={{ fontSize: 50 }}>🃏</Text>
                  </Animated.View>
                  <Animated.View style={[styles.miniCard, { transform: [{ translateX: card3Tx }, { rotate: card3Rot }], zIndex: 10, borderColor: colors.accentGold, borderWidth: 2 }]}>
                    <Text style={{ fontSize: 50 }}>🃏</Text>
                  </Animated.View>
                </View>
                <Text style={[styles.shuffleText, { marginTop: 40 }]}>{t.shuffling}...</Text>
              </View>
            )}

            {/* REVEAL / INTERPRET / COMPLETE */}
            {(phase === 'reveal' || phase === 'interpret' || phase === 'complete') && drawnCard && (
              <View style={{ gap: 20 }}>
                {/* Card */}
                <Animated.View style={[styles.cardContainer, { transform: [{ rotateY: cardRotate }], opacity: cardOpacity }]}>
                  <View style={[styles.drawnCard, isReversed && { transform: [{ rotate: '180deg' }] }]}>
                    <Text style={{ fontSize: 48 }}>{drawnCard.emoji}</Text>
                    <Text style={styles.cardName}>{getCardName(drawnCard)}</Text>
                    <View style={[styles.positionBadge, isReversed ? { backgroundColor: 'rgba(239,68,68,0.2)' } : { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
                      <Text style={[styles.positionText, isReversed ? { color: '#f87171' } : { color: '#4ade80' }]}>
                        {isReversed ? t.reversed : t.upright}
                      </Text>
                    </View>
                    <Text style={styles.arcanaBadge}>
                      {drawnCard.arcana === 'major' ? t.majorArcana : t.minorArcana}
                      {drawnCard.suit ? ` • ${drawnCard.suit}` : ''}
                    </Text>
                  </View>
                </Animated.View>

                {/* Interpreting */}
                {phase === 'interpret' && (
                  <View style={styles.interpretingBox}>
                    <CosmicLoader size="small" color={colors.accentGold} />
                    <Text style={styles.interpretingText}>{t.consultingStars}</Text>
                  </View>
                )}

                {/* Reading result */}
                {phase === 'complete' && reading && (
                  <Animated.View style={{ opacity: fadeAnim, gap: 16 }}>
                    <View style={styles.readingCard}>
                      <Text style={styles.readingLabel}>{t.interpretation}</Text>
                      <Text style={styles.readingText}>{reading.interpretation}</Text>
                    </View>
                    <View style={styles.readingCard}>
                      <Text style={styles.readingLabel}>{t.guidance}</Text>
                      <Text style={styles.readingText}>{reading.guidance}</Text>
                    </View>
                    <View style={styles.affirmationCard}>
                      <Text style={styles.affirmationText}>"{reading.affirmation}"</Text>
                    </View>
                    <Pressable onPress={handleDrawAgain}>
                      <LinearGradient colors={[colors.primary, '#991b1b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.drawAgainBtn}>
                        <Text style={styles.drawAgainText}>{t.drawAgain}</Text>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                )}

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable onPress={handleDrawAgain} style={styles.retryBtn}>
                      <Text style={styles.retryText}>{t.retry}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navigation activeScreen="TAROT" navigate={navigate} isPremium={!!isPremium} />

      {/* Coin gate modal */}
      {showCoinGate && (
        <View style={styles.modalOverlay}>
          <View style={styles.gateCard}>
            <Text style={{ fontSize: 48 }}>🪙</Text>
            <Text style={styles.gateTitle}>{t.notEnoughCoins}</Text>
            <Text style={styles.gateDesc}>{t.needCoinsForTarot}</Text>
            <View style={styles.gateActions}>
              <Pressable onPress={() => { setShowCoinGate(false); setShowAdModal(true); }} style={styles.gateBtn}>
                <Text style={styles.gateBtnText}>{t.earnCoinsFirst}</Text>
              </Pressable>
              <Pressable onPress={() => { setShowCoinGate(false); navigate('PREMIUM'); }} style={[styles.gateBtn, { backgroundColor: 'rgba(243,198,35,0.1)', borderColor: 'rgba(243,198,35,0.3)' }]}>
                <Text style={[styles.gateBtnText, { color: colors.accentGold }]}>{t.goPremium}</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setShowCoinGate(false)} style={{ marginTop: 16 }}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}

      <RewardedAdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        rewardCountToday={coinBalance.rewardCountToday}
        onCoinUpdate={(newBal) => setCoinBalance(newBal)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', fontStyle: 'italic' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 },
  historyBtn: { width: 44, height: 44, borderRadius: 22, ...glassPanel, alignItems: 'center', justifyContent: 'center' },
  costBadge: { ...glassPanel, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'center', marginBottom: 20 },
  costText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', paddingVertical: 32 },
  historyCard: { ...glassPanel, borderRadius: 16, padding: 16 },
  historyCardName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  historyDate: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 },
  historyInterp: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 },
  centerArea: { alignItems: 'center', paddingVertical: 60, gap: 32 },
  deckVisual: { width: 160, height: 220, borderRadius: 20, ...glassPanel, alignItems: 'center', justifyContent: 'center' },
  drawBtn: { height: 56, paddingHorizontal: 40, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 8 },
  drawBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  shuffleText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
  cardContainer: { alignItems: 'center' },
  drawnCard: { width: 200, height: 280, borderRadius: 20, ...glassPanel, borderColor: 'rgba(243,198,35,0.3)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  cardName: { color: '#fff', fontSize: 20, fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 16 },
  miniCard: { position: 'absolute', width: 120, height: 180, borderRadius: 16, ...glassPanel, alignItems: 'center', justifyContent: 'center', top: 0, left: 0 },
  positionBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12 },
  positionText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  arcanaBadge: { color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'capitalize' },
  interpretingBox: { ...glassPanel, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  interpretingText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1 },
  readingCard: { ...glassPanel, borderRadius: 16, padding: 20 },
  readingLabel: { color: colors.accentGold, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  readingText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 },
  affirmationCard: { ...glassPanel, borderColor: 'rgba(243,198,35,0.2)', borderRadius: 16, padding: 20, alignItems: 'center' },
  affirmationText: { color: colors.accentGold, fontSize: 16, fontStyle: 'italic', textAlign: 'center', lineHeight: 24 },
  drawAgainBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  drawAgainText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  errorBox: { ...glassPanel, backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', borderRadius: 16, padding: 20, alignItems: 'center', gap: 12 },
  errorText: { color: '#f87171', fontSize: 13 },
  retryBtn: { ...glassPanel, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  retryText: { color: '#fff', fontSize: 12 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  gateCard: { ...glassPanel, borderRadius: 24, padding: 32, alignItems: 'center', width: screenWidth - 64, gap: 12 },
  gateTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  gateDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' },
  gateActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  gateBtn: { flex: 1, height: 44, borderRadius: 12, ...glassPanel, alignItems: 'center', justifyContent: 'center' },
  gateBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  closeText: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
});

export default TarotScreen;
