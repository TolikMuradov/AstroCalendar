import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput, Image, Platform, Vibration, Dimensions, Modal, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, UserProfile, ShadowSession as ShadowSessionType, ShadowReflection, ShadowCardData, SHADOW_FIRST_COST, SHADOW_SESSION_COST, SHADOW_REFLECTION_COST } from '../types';
import { coinService } from '../services/coinService';
import { drawRandomCard, TarotCard, getCardName, TAROT_DECK } from '../utils/tarotDeck';
import { TAROT_IMAGES } from '../utils/tarotImages';
import { generateShadowQuestion1, generateShadowQuestion2, generateShadowMainInterpretation, generateShadowSecretInterpretation, generateShadowIntegration, generateShadowReflectionFollowup } from '../services/geminiService';
import { storage } from '../services/storage';
import { translations } from '../i18n/translations';
import { colors, glassPanel } from '../styles/theme';
import CosmicLoader from '../components/CosmicLoader';
import { CardLoadingOverlay, InterpretingShimmer } from '../components/CardLoadingOverlay';
import { showReadingExitAd } from '../services/admobInterstitial';
import Icon from '../components/Icon';

type Stage = 'ENTRY' | 'Q1' | 'Q2' | 'MAIN_CARD' | 'INTERPRETATION' | 'SECRET' | 'INTEGRATION' | 'REFLECTION_ENTRY' | 'REFLECTION_RESULT';

interface ShadowSessionProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 15;

// Sanitize user text input
const sanitizeInput = (text: string): string => {
  return text
    .replace(/[<>{}[\]\\]/g, '')
    .replace(/\b(system|prompt|ignore|instruction|override|forget|pretend|act as|you are)\b/gi, '')
    .trim()
    .slice(0, 200);
};

// Weighted card draw: 70% random, 30% keyword-influenced from user answers
const drawWeightedCard = (answers: string[], excludeIds: number[] = []): TarotCard => {
  const available = TAROT_DECK.filter(c => !excludeIds.includes(c.id));
  if (Math.random() > 0.3) {
    // 70% pure random
    return available[Math.floor(Math.random() * available.length)];
  }
  // 30% keyword-influenced: score cards by keyword overlap with answers
  const answerWords = answers.join(' ').toLowerCase().split(/\s+/);
  const scored = available.map(card => {
    const matchCount = card.keywords.filter(kw =>
      answerWords.some(w => w.includes(kw.toLowerCase()) || kw.toLowerCase().includes(w))
    ).length;
    return { card, score: matchCount };
  });
  scored.sort((a, b) => b.score - a.score);
  // Pick from top 5 scored cards randomly
  const topCards = scored.slice(0, Math.min(5, scored.length));
  return topCards[Math.floor(Math.random() * topCards.length)].card;
};

// Floating shadow particle — subtle dark motes
const ShadowMote: React.FC<{ delay: number; startX: number; size: number }> = ({ delay, startX, size }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 30)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_HEIGHT + 30);
      translateX.setValue(0);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 10000 + Math.random() * 6000,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 60,
          duration: 10000 + Math.random() * 6000,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.15, duration: 2000, delay, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.15, duration: 5000 + Math.random() * 4000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 3000, useNativeDriver: true }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(120,100,140,0.2)',
        transform: [{ translateY }, { translateX }],
        opacity,
      }}
      pointerEvents="none"
    />
  );
};

const ShadowSessionScreen: React.FC<ShadowSessionProps> = ({ profile, navigate }) => {
  const t = translations[profile.locale as keyof typeof translations] || translations.en;
  const [stage, setStage] = useState<Stage>('ENTRY');
  const [coins, setCoins] = useState(0);
  const [isFirstUse, setIsFirstUse] = useState(true);
  const [sessionCost, setSessionCost] = useState(SHADOW_FIRST_COST);
  const [error, setError] = useState<string | null>(null);

  // Q&A state
  const [question1, setQuestion1] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [q1Loading, setQ1Loading] = useState(false);
  const [q2Loading, setQ2Loading] = useState(false);

  // Card state
  const [mainCard, setMainCard] = useState<(TarotCard & { isReversed: boolean }) | null>(null);
  const [mainText, setMainText] = useState('');
  const [intensityScore, setIntensityScore] = useState(0);
  const [mainLoading, setMainLoading] = useState(false);

  // Secret card state
  const [secretCard, setSecretCard] = useState<(TarotCard & { isReversed: boolean }) | null>(null);
  const [secretText, setSecretText] = useState('');
  const [secretLoading, setSecretLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Integration state
  const [integrationText, setIntegrationText] = useState('');
  const [integrationLoading, setIntegrationLoading] = useState(false);

  // Reflection state
  const [yesterdaySession, setYesterdaySession] = useState<ShadowSessionType | null>(null);
  const [existingReflection, setExistingReflection] = useState<ShadowReflection | null>(null);
  const [reflectionInput, setReflectionInput] = useState('');
  const [reflectionResult, setReflectionResult] = useState('');
  const [reflectionLoading, setReflectionLoading] = useState(false);

  // Existing session restore
  const [restored, setRestored] = useState(false);
  const [mainFlipped, setMainFlipped] = useState(false);
  const [secretFlipped, setSecretFlipped] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const entryIconScale = useRef(new Animated.Value(0.5)).current;
  const entryIconOpacity = useRef(new Animated.Value(0)).current;
  const questionFade = useRef(new Animated.Value(0)).current;
  const answerFade = useRef(new Animated.Value(0)).current;
  const cardEntranceY = useRef(new Animated.Value(80)).current;
  const cardEntranceOpacity = useRef(new Animated.Value(0)).current;
  const cardFlipAnim = useRef(new Animated.Value(0)).current;
  const interpretFade = useRef(new Animated.Value(0)).current;
  const secretEntranceY = useRef(new Animated.Value(60)).current;
  const secretEntranceOpacity = useRef(new Animated.Value(0)).current;
  const secretFlipAnim = useRef(new Animated.Value(0)).current;
  const secretTextFade = useRef(new Animated.Value(0)).current;
  const secretPulse = useRef(new Animated.Value(1)).current;
  const integrationFade = useRef(new Animated.Value(0)).current;
  const intensityBarAnim = useRef(new Animated.Value(0)).current;
  const previewScale = useRef(new Animated.Value(0)).current;
  const previewRotateY = useRef(new Animated.Value(0)).current;
  const previewBackdrop = useRef(new Animated.Value(0)).current;
  const [previewCard, setPreviewCard] = useState<'main' | 'secret' | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Particle data
  const motesData = useRef(
    Array.from({ length: NUM_PARTICLES }, (_, i) => ({
      delay: i * 600,
      startX: Math.random() * SCREEN_WIDTH,
      size: 2 + Math.random() * 6,
    }))
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Entry icon animation
    Animated.parallel([
      Animated.spring(entryIconScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      Animated.timing(entryIconOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start();

    let unsub: any = null;
    const init = async () => {
      try {
        const bal = await coinService.getBalance();
        setCoins(bal.coins);
      } catch { }
      unsub = coinService.subscribe(bal => setCoins(bal.coins));

      // Check first use
      const firstUsed = await storage.isShadowFirstUsed(profile.uid);
      setIsFirstUse(!firstUsed);
      setSessionCost(firstUsed ? SHADOW_SESSION_COST : SHADOW_FIRST_COST);

      // Check existing today session
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getShadowSession(profile.uid, today);
      if (existing) {
        restoreSession(existing);
        return;
      }

      // Check yesterday session for reflection
      const yesterday = await storage.getYesterdayShadowSession(profile.uid);
      if (yesterday) {
        setYesterdaySession(yesterday);
        const ref = await storage.getShadowReflection(yesterday.id);
        if (ref) {
          setExistingReflection(ref);
        }
      }
    };
    init();
    return () => { if (unsub) unsub(); };
  }, []);

  const restoreSession = (session: ShadowSessionType) => {
    setRestored(true);
    setQuestion1(session.question1);
    setAnswer1(session.answer1);
    setQuestion2(session.question2);
    setAnswer2(session.answer2);
    setMainCard({
      id: session.mainCard.id,
      name: session.mainCard.name,
      nameTr: '',
      nameTh: '',
      emoji: '',
      keywords: session.mainCard.keywords,
      arcana: 'major' as const,
      gradient: '',
      isReversed: session.mainCard.isReversed,
    });
    setMainText(session.mainText);
    setIntensityScore(session.intensityScore);
    if (session.secretCard && session.secretText) {
      setSecretCard({
        id: session.secretCard.id,
        name: session.secretCard.name,
        nameTr: '',
        nameTh: '',
        emoji: '',
        keywords: session.secretCard.keywords,
        arcana: 'major' as const,
        gradient: '',
        isReversed: session.secretCard.isReversed,
      });
      setSecretText(session.secretText);
      setShowSecret(true);
    }
    setIntegrationText(session.integrationText);
    setStage('INTEGRATION');

    // Skip animations
    cardFlipAnim.setValue(1);
    setMainFlipped(true);
    interpretFade.setValue(1);
    integrationFade.setValue(1);
    intensityBarAnim.setValue(session.intensityScore / 10);
    cardEntranceY.setValue(0);
    cardEntranceOpacity.setValue(1);
    if (session.secretCard) {
      secretFlipAnim.setValue(1);
      setSecretFlipped(true);
      secretTextFade.setValue(1);
      secretEntranceY.setValue(0);
      secretEntranceOpacity.setValue(1);
    }
  };

  // ============================
  // SESSION FLOW
  // ============================

  const handleStartSession = async () => {
    const canAfford = coins >= sessionCost || profile.subscription?.isPremium;
    if (!canAfford) return;

    if (!profile.subscription?.isPremium) {
      try { await coinService.spendCoins(sessionCost); } catch {
        setError((t as any).ppfErrorCoins || 'Could not process coins.');
        return;
      }
    }

    // Mark first use
    if (isFirstUse) {
      await storage.markShadowFirstUsed(profile.uid);
    }

    setStage('Q1');
    setQ1Loading(true);

    // Fade in question area
    Animated.timing(questionFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    try {
      const result = await generateShadowQuestion1(profile);
      setQuestion1(result.question);
    } catch (err) {
      console.error('Shadow Q1 generation failed:', err);
      setError((t as any).ppfErrorReading || 'Failed to generate reading.');
      setStage('ENTRY');
    } finally {
      setQ1Loading(false);
    }
  };

  const handleSubmitAnswer1 = async () => {
    if (!answer1.trim()) return;
    const sanitized = sanitizeInput(answer1);
    setAnswer1(sanitized);

    setStage('Q2');
    setQ2Loading(true);
    questionFade.setValue(0);
    Animated.timing(questionFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    try {
      const result = await generateShadowQuestion2(profile, question1, sanitized);
      setQuestion2(result.question);
    } catch (err) {
      console.error('Shadow Q2 generation failed:', err);
      setError((t as any).ppfErrorReading || 'Failed to generate reading.');
    } finally {
      setQ2Loading(false);
    }
  };

  const handleSubmitAnswer2 = async () => {
    if (!answer2.trim()) return;
    const sanitized = sanitizeInput(answer2);
    setAnswer2(sanitized);

    setStage('MAIN_CARD');

    // Draw weighted card
    const card = drawWeightedCard([answer1, sanitized]);
    const isReversed = Math.random() > 0.5;
    setMainCard({ ...card, isReversed });

    // Card entrance animation
    Animated.parallel([
      Animated.spring(cardEntranceY, { toValue: 0, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.timing(cardEntranceOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const handleRevealMainCard = async () => {
    if (!mainCard) return;
    try { Vibration.vibrate(80); } catch { }

    // Slow card flip
    Animated.timing(cardFlipAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setMainFlipped(true));

    setStage('INTERPRETATION');
    setMainLoading(true);

    try {
      const result = await generateShadowMainInterpretation(
        profile,
        mainCard.name,
        mainCard.isReversed,
        question1,
        sanitizeInput(answer1),
        question2,
        sanitizeInput(answer2)
      );
      setMainText(result.mainText);
      setIntensityScore(result.intensityScore);

      // Fade in interpretation
      Animated.timing(interpretFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();

      // Intensity bar animation
      Animated.timing(intensityBarAnim, {
        toValue: result.intensityScore / 10,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Determine secret card
      await handleSecretCardLogic(result.intensityScore);
    } catch (err) {
      console.error('Shadow main interpretation failed:', err);
      setError((t as any).ppfErrorReading || 'Failed to generate reading.');
    } finally {
      setMainLoading(false);
    }
  };

  const handleSecretCardLogic = async (intensity: number) => {
    let shouldShowSecret = false;
    if (intensity >= 7) {
      shouldShowSecret = true;
    } else if (intensity >= 5) {
      shouldShowSecret = Math.random() < 0.3;
    }

    if (shouldShowSecret && mainCard) {
      const secret = drawRandomCard([mainCard.id]);
      const isReversed = Math.random() > 0.5;
      setSecretCard({ ...secret, isReversed });
      setShowSecret(true);

      // Secret card entrance — appears face-down
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(secretEntranceY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
          Animated.timing(secretEntranceOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start(() => {
          // Scroll down so user sees the secret card
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
          // Start pulse hint on unrevealed card
          startSecretPulse();
        });
      }, 800);
      // Do NOT call integration yet — wait for user to tap the secret card
    } else {
      // No secret card — go directly to integration
      await handleIntegration(false);
    }
  };

  const startSecretPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(secretPulse, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(secretPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  };

  const handleRevealSecretCard = async () => {
    if (!secretCard || !mainCard) return;
    try { Vibration.vibrate(80); } catch { }

    // Stop pulse
    secretPulse.stopAnimation();
    secretPulse.setValue(1);

    // Flip animation
    Animated.timing(secretFlipAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setSecretFlipped(true));

    // Fetch interpretation after flip starts
    setSecretLoading(true);
    try {
      const result = await generateShadowSecretInterpretation(
        profile,
        mainCard.name,
        secretCard.name,
        secretCard.isReversed,
        question1,
        sanitizeInput(answer1),
        question2,
        sanitizeInput(answer2),
        mainText
      );
      setSecretText(result.secretText);

      setTimeout(() => {
        Animated.timing(secretTextFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      }, 600);
    } catch (err) {
      console.error('Shadow secret interpretation failed:', err);
    } finally {
      setSecretLoading(false);
    }

    // Now trigger integration
    await handleIntegration(true);
  };

  const handleIntegration = async (hasSecret: boolean) => {
    setIntegrationLoading(true);
    try {
      const result = await generateShadowIntegration(
        profile,
        mainCard?.name || '',
        hasSecret && secretCard ? secretCard.name : null,
        question1,
        sanitizeInput(answer1),
        question2,
        sanitizeInput(answer2)
      );
      setIntegrationText(result.integrationText);
      setStage('INTEGRATION');

      Animated.timing(integrationFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();

      // Save session
      await saveSession(result.integrationText);
    } catch (err) {
      console.error('Shadow integration failed:', err);
      setError((t as any).ppfErrorReading || 'Failed to generate reading.');
    } finally {
      setIntegrationLoading(false);
    }
  };

  const saveSession = async (integration: string) => {
    if (!mainCard) return;
    const today = new Date().toISOString().split('T')[0];

    const session: ShadowSessionType = {
      id: `shadow_${Date.now()}`,
      userId: profile.uid,
      date: today,
      question1,
      answer1: sanitizeInput(answer1),
      question2,
      answer2: sanitizeInput(answer2),
      mainCard: {
        id: mainCard.id,
        name: mainCard.name,
        isReversed: mainCard.isReversed,
        keywords: mainCard.keywords,
      },
      mainText,
      intensityScore,
      secretCard: secretCard ? {
        id: secretCard.id,
        name: secretCard.name,
        isReversed: secretCard.isReversed,
        keywords: secretCard.keywords,
      } : null,
      secretText: secretText || null,
      integrationText: integration,
      locale: profile.locale,
      generatedAt: new Date().toISOString(),
    };

    await storage.saveShadowSession(profile.uid, session);
  };

  // ============================
  // REFLECTION FLOW
  // ============================

  const handleStartReflection = async () => {
    if (!yesterdaySession) return;

    const canAfford = coins >= SHADOW_REFLECTION_COST || profile.subscription?.isPremium;
    if (!canAfford) return;

    if (!profile.subscription?.isPremium) {
      try { await coinService.spendCoins(SHADOW_REFLECTION_COST); } catch {
        setError((t as any).ppfErrorCoins || 'Could not process coins.');
        return;
      }
    }

    setStage('REFLECTION_ENTRY');
    questionFade.setValue(0);
    Animated.timing(questionFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };

  const handleSubmitReflection = async () => {
    if (!reflectionInput.trim() || !yesterdaySession) return;
    const sanitized = sanitizeInput(reflectionInput);

    setReflectionLoading(true);
    setStage('REFLECTION_RESULT');

    try {
      const result = await generateShadowReflectionFollowup(
        profile,
        {
          question1: yesterdaySession.question1,
          answer1: yesterdaySession.answer1,
          question2: yesterdaySession.question2,
          answer2: yesterdaySession.answer2,
          mainCardName: yesterdaySession.mainCard.name,
          mainText: yesterdaySession.mainText,
        },
        sanitized
      );
      setReflectionResult(result.aiFollowupText);

      // Save reflection
      const reflection: ShadowReflection = {
        id: `ref_${Date.now()}`,
        sessionId: yesterdaySession.id,
        date: new Date().toISOString().split('T')[0],
        userReflectionText: sanitized,
        aiFollowupText: result.aiFollowupText,
        locale: profile.locale,
        generatedAt: new Date().toISOString(),
      };
      await storage.saveShadowReflection(reflection);
      setExistingReflection(reflection);

      Animated.timing(integrationFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    } catch (err) {
      console.error('Shadow reflection failed:', err);
      setError((t as any).ppfErrorReading || 'Failed to generate reading.');
    } finally {
      setReflectionLoading(false);
    }
  };

  // ============================
  // CARD PREVIEW
  // ============================

  const openCardPreview = (which: 'main' | 'secret') => {
    setPreviewCard(which);
    previewScale.setValue(0.3);
    previewRotateY.setValue(-90);
    previewBackdrop.setValue(0);

    Animated.parallel([
      Animated.spring(previewScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(previewRotateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(previewBackdrop, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeCardPreview = () => {
    Animated.parallel([
      Animated.timing(previewScale, { toValue: 0.3, duration: 250, useNativeDriver: true }),
      Animated.timing(previewRotateY, { toValue: 90, duration: 300, useNativeDriver: true }),
      Animated.timing(previewBackdrop, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setPreviewCard(null));
  };

  // ============================
  // RENDER: ENTRY
  // ============================

  const renderEntry = () => {
    const canAfford = coins >= sessionCost || profile.subscription?.isPremium;
    const hasReflection = yesterdaySession && !existingReflection;
    const canAffordReflection = coins >= SHADOW_REFLECTION_COST || profile.subscription?.isPremium;

    return (
      <ScrollView contentContainerStyle={styles.entryContainer} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
          <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.4)" />
        </Pressable>

        <Animated.View style={[styles.entryIconWrap, { transform: [{ scale: entryIconScale }], opacity: entryIconOpacity }]}>
          <Text style={styles.entryIconEmoji}>🌑</Text>
        </Animated.View>

        <Text style={styles.screenTitle}>{(t as any).shadowTitle || 'Shadow Session'}</Text>
        <Text style={styles.screenSubtitle}>{(t as any).shadowSubtitle || 'This is about what quietly shapes your choices.'}</Text>

        {/* Price chip */}
        <View style={styles.priceRow}>
          <View style={styles.priceChip}>
            <Text style={styles.priceChipText}>
              {profile.subscription?.isPremium ? (t as any).freeForPremium || 'Free for Premium' : `🪙 ${sessionCost} ${t.coins}`}
            </Text>
          </View>
          {isFirstUse && !profile.subscription?.isPremium && (
            <View style={styles.firstOfferBadge}>
              <Text style={styles.firstOfferText}>{(t as any).shadowFirstOffer || 'First Session Offer'}</Text>
            </View>
          )}
        </View>

        {!canAfford && (
          <Text style={styles.warningText}>{(t as any).ppfErrorCoins || 'Not enough coins.'}</Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          onPress={handleStartSession}
          disabled={!canAfford}
          style={[styles.actionBtn, !canAfford && styles.actionBtnDisabled]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#3d3456', '#1a1a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtnGradient}
          >
            <Text style={styles.actionBtnText}>🌑 {(t as any).shadowStartSession || 'Begin Shadow Work'}</Text>
          </LinearGradient>
        </Pressable>

        {/* Reflection section */}
        {hasReflection && (
          <View style={styles.reflectionEntryBlock}>
            <View style={styles.reflectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{(t as any).shadowReflectionCost || 'Reflection'}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.reflectionTitle}>{(t as any).shadowReflectionTitle || "Revisit Yesterday's Shadow"}</Text>
            <Text style={styles.reflectionSubtitle}>{(t as any).shadowReflectionSubtitle || 'How did this show up today?'}</Text>

            <View style={styles.priceChip}>
              <Text style={styles.priceChipText}>
                {profile.subscription?.isPremium ? (t as any).freeForPremium || 'Free' : `🪙 ${SHADOW_REFLECTION_COST} ${t.coins}`}
              </Text>
            </View>

            <Pressable
              onPress={handleStartReflection}
              disabled={!canAffordReflection}
              style={[styles.reflectionBtn, !canAffordReflection && styles.actionBtnDisabled]}
            >
              <Text style={styles.reflectionBtnText}>{(t as any).shadowStartReflection || 'Begin Reflection'}</Text>
            </Pressable>
          </View>
        )}

        {existingReflection && yesterdaySession && (
          <View style={styles.reflectionEntryBlock}>
            <Text style={styles.reflectionDoneText}>{(t as any).shadowAlreadyReflected || 'You have already reflected on this session.'}</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // ============================
  // RENDER: QUESTION STAGES
  // ============================

  const renderQuestion = (stageType: 'Q1' | 'Q2') => {
    const isQ1 = stageType === 'Q1';
    const currentQuestion = isQ1 ? question1 : question2;
    const currentAnswer = isQ1 ? answer1 : answer2;
    const setCurrentAnswer = isQ1 ? setAnswer1 : setAnswer2;
    const isLoading = isQ1 ? q1Loading : q2Loading;
    const handleSubmit = isQ1 ? handleSubmitAnswer1 : handleSubmitAnswer2;
    const label = isQ1 ? (t as any).shadowQuestion1Label : (t as any).shadowQuestion2Label;

    return (
      <Animated.View style={[styles.questionContainer, { opacity: questionFade }]}>
        <ScrollView contentContainerStyle={styles.questionScroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
            <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.4)" />
          </Pressable>

          <Text style={styles.stageLabel}>{label || (isQ1 ? 'The shadow asks...' : 'Going deeper...')}</Text>

          {isLoading ? (
            <View style={styles.questionLoadingWrap}>
              <InterpretingShimmer message={label || 'Preparing...'} color="rgba(120,100,140,0.6)" lineCount={2} />
            </View>
          ) : (
            <>
              <Text style={styles.questionText}>{currentQuestion}</Text>

              <TextInput
                style={styles.answerInput}
                placeholder={(t as any).shadowAnswerPlaceholder || 'Be honest with yourself...'}
                placeholderTextColor="rgba(120,100,140,0.3)"
                value={currentAnswer}
                onChangeText={setCurrentAnswer}
                maxLength={200}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.charCount}>{currentAnswer.length}/200</Text>

              <Pressable
                onPress={handleSubmit}
                disabled={!currentAnswer.trim()}
                style={[styles.actionBtn, !currentAnswer.trim() && styles.actionBtnDisabled]}
              >
                <LinearGradient
                  colors={['#1a1a2e', '#3d3456', '#1a1a2e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  <Text style={styles.actionBtnText}>{(t as any).shadowSubmitAnswer || 'Continue'}</Text>
                </LinearGradient>
              </Pressable>
            </>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  // ============================
  // RENDER: MAIN CARD (unrevealed)
  // ============================

  const renderMainCard = () => {
    if (!mainCard) return null;

    return (
      <ScrollView contentContainerStyle={styles.cardStageContainer} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
          <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.4)" />
        </Pressable>

        <Text style={styles.stageLabel}>{(t as any).shadowMainCardLabel || 'Your Shadow Card'}</Text>

        <Animated.View style={[
          styles.singleCardWrap,
          {
            transform: [{ translateY: cardEntranceY }],
            opacity: cardEntranceOpacity,
          }
        ]}>
          <Pressable onPress={handleRevealMainCard} style={styles.singleCardTouch}>
            {/* Card back */}
            <View style={styles.cardBackWrap}>
              <LinearGradient colors={['#0d0d1a', '#1a1a2e', '#0d0d1a']} style={styles.cardBackGradient}>
                <Text style={styles.cardBackSymbol}>🌑</Text>
                <Text style={styles.tapToReveal}>{(t as any).shadowRevealCard || 'Reveal Your Shadow Card'}</Text>
              </LinearGradient>
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  };

  // ============================
  // RENDER: INTERPRETATION + SECRET + INTEGRATION
  // ============================

  const renderInterpretation = () => {
    if (!mainCard) return null;

    const backOpacity = cardFlipAnim.interpolate({
      inputRange: [0, 0.49, 0.5, 1],
      outputRange: [1, 1, 0, 0],
    });
    const frontOpacity = cardFlipAnim.interpolate({
      inputRange: [0, 0.49, 0.5, 1],
      outputRange: [0, 0, 1, 1],
    });

    const secretBackOpacity = secretFlipAnim.interpolate({
      inputRange: [0, 0.49, 0.5, 1],
      outputRange: [1, 1, 0, 0],
    });
    const secretFrontOpacity = secretFlipAnim.interpolate({
      inputRange: [0, 0.49, 0.5, 1],
      outputRange: [0, 0, 1, 1],
    });

    const intensityColor = intensityScore >= 7 ? '#dc2626' : intensityScore >= 5 ? '#f59e0b' : '#6b7280';

    return (
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.readingContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
          <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.4)" />
        </Pressable>

        <Text style={[styles.screenTitle, { marginBottom: 24 }]}>🌑 {(t as any).shadowTitle || 'Shadow Session'}</Text>

        {/* Main Card */}
        <View style={styles.mainCardSection}>
          <Text style={styles.cardLabel}>{(t as any).shadowMainCardLabel || 'Your Shadow Card'}</Text>

          <Pressable
            onPress={() => mainFlipped && openCardPreview('main')}
            style={styles.singleCardTouch}
          >
            {/* Card back */}
            <Animated.View style={[styles.cardFace, { opacity: backOpacity }]}>
              <LinearGradient colors={['#0d0d1a', '#1a1a2e', '#0d0d1a']} style={styles.cardBackGradient}>
                <Text style={styles.cardBackSymbol}>🌑</Text>
              </LinearGradient>
            </Animated.View>

            {/* Card front */}
            <Animated.View style={[styles.cardFace, styles.cardFront, { opacity: frontOpacity }]}>
              <Image
                source={TAROT_IMAGES[mainCard.id]}
                style={[styles.cardImage, mainCard.isReversed && { transform: [{ rotate: '180deg' }] }]}
              />
            </Animated.View>

            {/* Loading overlay */}
            {mainLoading && <CardLoadingOverlay color="rgba(120,100,140,0.8)" />}
          </Pressable>

          {mainFlipped && (
            <Text style={styles.cardNameLabel}>
              {getCardName(mainCard, profile.locale) || mainCard.name}
              {mainCard.isReversed ? ` (${t.reversed})` : ` (${t.upright})`}
            </Text>
          )}
        </View>

        {/* Intensity bar */}
        {mainText ? (
          <View style={styles.intensitySection}>
            <Text style={styles.intensityLabel}>{(t as any).shadowIntensityLabel || 'Shadow Intensity'}</Text>
            <View style={styles.intensityTrack}>
              <Animated.View
                style={[
                  styles.intensityFill,
                  {
                    width: intensityBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: intensityColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.intensityValue, { color: intensityColor }]}>{intensityScore}/10</Text>
          </View>
        ) : null}

        {/* Main interpretation */}
        {mainLoading ? (
          <InterpretingShimmer message={(t as any).shadowInterpreting || 'Reading your shadow patterns...'} color="rgba(120,100,140,0.6)" lineCount={6} />
        ) : mainText ? (
          <Animated.View style={[styles.interpretationBlock, { opacity: interpretFade }]}>
            <View style={styles.interpretationDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{(t as any).shadowArchetype || 'Shadow Archetype'}</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.bodyText}>{mainText}</Text>
          </Animated.View>
        ) : null}

        {/* Secret Card */}
        {showSecret && secretCard && (
          <Animated.View style={[
            styles.secretSection,
            {
              transform: [{ translateY: secretEntranceY }],
              opacity: secretEntranceOpacity,
            }
          ]}>
            <View style={styles.interpretationDivider}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, { color: 'rgba(220,38,38,0.5)' }]}>{(t as any).shadowSecretCardLabel || 'The Secret Card'}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.secretAppears}>{(t as any).shadowSecretAppears || 'A deeper layer has surfaced.'}</Text>

            <Animated.View style={!secretFlipped ? { transform: [{ scale: secretPulse }] } : undefined}>
              <Pressable
                onPress={() => secretFlipped ? openCardPreview('secret') : handleRevealSecretCard()}
                style={styles.secretCardTouch}
              >
                <Animated.View style={[styles.cardFace, { opacity: secretBackOpacity }]}>
                  <LinearGradient colors={['#1a0000', '#2d0a0a', '#1a0000']} style={styles.cardBackGradient}>
                    <Text style={styles.cardBackSymbol}>🔮</Text>
                    {!secretFlipped && !secretLoading && (
                      <Text style={styles.tapToReveal}>{(t as any).shadowRevealCard || 'Tap to Reveal'}</Text>
                    )}
                  </LinearGradient>
                </Animated.View>

                <Animated.View style={[styles.cardFace, styles.cardFront, { opacity: secretFrontOpacity }]}>
                  <Image
                    source={TAROT_IMAGES[secretCard.id]}
                    style={[styles.cardImage, secretCard.isReversed && { transform: [{ rotate: '180deg' }] }]}
                  />
                </Animated.View>

                {secretLoading && <CardLoadingOverlay color="rgba(220,38,38,0.6)" />}
              </Pressable>
            </Animated.View>

            {secretFlipped && (
              <Text style={styles.cardNameLabel}>
                {getCardName(secretCard, profile.locale) || secretCard.name}
                {secretCard.isReversed ? ` (${t.reversed})` : ` (${t.upright})`}
              </Text>
            )}

            {secretLoading ? (
              <InterpretingShimmer message={(t as any).shadowSecretInterpreting || 'Uncovering the hidden layer...'} color="rgba(220,38,38,0.4)" lineCount={4} />
            ) : secretText ? (
              <Animated.View style={[styles.interpretationBlock, { opacity: secretTextFade }]}>
                <View style={styles.interpretationDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={[styles.dividerText, { color: 'rgba(220,38,38,0.5)' }]}>{(t as any).shadowDeeperLayer || 'Deeper Shadow Layer'}</Text>
                  <View style={styles.dividerLine} />
                </View>
                <Text style={styles.bodyText}>{secretText}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        )}

        {/* Integration */}
        {integrationLoading && (
          <InterpretingShimmer message={(t as any).shadowIntegrating || 'Integrating your shadow work...'} color="rgba(120,100,140,0.6)" lineCount={5} />
        )}

        {integrationText ? (
          <Animated.View style={[styles.integrationBlock, { opacity: integrationFade }]}>
            <View style={styles.interpretationDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{(t as any).shadowIntegrationTitle || 'Shadow Integration'}</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.bodyText}>{integrationText}</Text>
          </Animated.View>
        ) : null}

        {error && <Text style={[styles.errorText, { marginTop: 16 }]}>{error}</Text>}

        {/* Exit */}
        {integrationText ? (
          <View style={styles.exitBlock}>
            <Text style={styles.closingText}>{(t as any).shadowClosing || 'What you see, you can begin to choose differently.'}</Text>
            <Pressable onPress={() => showReadingExitAd(!!profile.subscription?.isPremium, () => navigate('TAROT'))} style={styles.exitBtn}>
              <Text style={styles.exitBtnText}>{(t as any).ppfExploreAnother || 'Explore Another Reading'}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    );
  };

  // ============================
  // RENDER: REFLECTION
  // ============================

  const renderReflectionEntry = () => (
    <Animated.View style={[styles.questionContainer, { opacity: questionFade }]}>
      <ScrollView contentContainerStyle={styles.questionScroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setStage('ENTRY')} style={styles.backBtn}>
          <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.4)" />
        </Pressable>

        <Text style={styles.screenTitle}>{(t as any).shadowReflectionTitle || "Revisit Yesterday's Shadow"}</Text>
        <Text style={styles.screenSubtitle}>{(t as any).shadowReflectionSubtitle || 'How did this show up today?'}</Text>

        <Text style={styles.stageLabel}>{(t as any).shadowReflectionPrompt || 'Did you notice this pattern today?'}</Text>

        <TextInput
          style={styles.answerInput}
          placeholder={(t as any).shadowReflectionPlaceholder || 'What did you observe?'}
          placeholderTextColor="rgba(120,100,140,0.3)"
          value={reflectionInput}
          onChangeText={setReflectionInput}
          maxLength={200}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.charCount}>{reflectionInput.length}/200</Text>

        <Pressable
          onPress={handleSubmitReflection}
          disabled={!reflectionInput.trim()}
          style={[styles.actionBtn, !reflectionInput.trim() && styles.actionBtnDisabled]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#3d3456', '#1a1a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtnGradient}
          >
            <Text style={styles.actionBtnText}>{(t as any).shadowSubmitReflection || 'Submit Reflection'}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );

  const renderReflectionResult = () => (
    <ScrollView contentContainerStyle={styles.readingContainer} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
        <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.4)" />
      </Pressable>

      <Text style={styles.screenTitle}>{(t as any).shadowReflectionComplete || 'Reflection Complete'}</Text>

      {reflectionLoading ? (
        <InterpretingShimmer message={(t as any).shadowReflectionProcessing || 'Processing your reflection...'} color="rgba(120,100,140,0.6)" lineCount={5} />
      ) : reflectionResult ? (
        <Animated.View style={[styles.integrationBlock, { opacity: integrationFade }]}>
          <Text style={styles.bodyText}>{reflectionResult}</Text>
        </Animated.View>
      ) : null}

      {error && <Text style={[styles.errorText, { marginTop: 16 }]}>{error}</Text>}

      {reflectionResult ? (
        <View style={styles.exitBlock}>
          <Text style={styles.closingText}>{(t as any).shadowClosing || 'What you see, you can begin to choose differently.'}</Text>
          <Pressable onPress={() => showReadingExitAd(!!profile.subscription?.isPremium, () => navigate('TAROT'))} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>{(t as any).ppfExploreAnother || 'Explore Another Reading'}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );

  // ============================
  // CARD PREVIEW MODAL
  // ============================

  const renderCardPreview = () => {
    if (!previewCard) return null;
    const card = previewCard === 'main' ? mainCard : secretCard;
    if (!card) return null;

    const cardW = SCREEN_WIDTH * 0.7;
    const cardH = cardW / 0.62;

    const rotateInterpolate = previewRotateY.interpolate({
      inputRange: [-90, 0, 90],
      outputRange: ['-90deg', '0deg', '90deg'],
    });

    return (
      <Modal transparent visible animationType="none" onRequestClose={closeCardPreview}>
        <Pressable style={styles.previewBackdropPress} onPress={closeCardPreview}>
          <Animated.View style={[styles.previewBackdrop, { opacity: previewBackdrop }]} />
          <Animated.View
            style={[
              styles.previewCardWrap,
              {
                width: cardW,
                height: cardH,
                transform: [
                  { scale: previewScale },
                  { perspective: 1000 },
                  { rotateY: rotateInterpolate },
                ],
              },
            ]}
          >
            <Image
              source={TAROT_IMAGES[card.id]}
              style={[
                styles.previewCardImage,
                card.isReversed && { transform: [{ rotate: '180deg' }] },
              ]}
            />
            <View style={styles.previewGlowBorder} />
          </Animated.View>
          <Animated.View style={{ opacity: previewBackdrop, marginTop: 20, alignItems: 'center' }}>
            <Text style={styles.previewCardName}>
              {getCardName(card, profile.locale) || card.name}
            </Text>
            <Text style={styles.previewCardPosition}>
              {previewCard === 'main' ? ((t as any).shadowMainCardLabel || 'Shadow Card') : ((t as any).shadowSecretCardLabel || 'Secret Card')} • {card.isReversed ? t.reversed : t.upright}
            </Text>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };

  // ============================
  // MAIN RENDER
  // ============================

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={['#050510', '#0d0d1a', '#050510']} style={StyleSheet.absoluteFill} />

      {/* Floating shadow motes */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {motesData.map((d, i) => (
          <ShadowMote key={i} delay={d.delay} startX={d.startX} size={d.size} />
        ))}
      </View>

      {stage === 'ENTRY' && renderEntry()}
      {(stage === 'Q1' || stage === 'Q2') && renderQuestion(stage)}
      {stage === 'MAIN_CARD' && renderMainCard()}
      {(stage === 'INTERPRETATION' || stage === 'SECRET' || stage === 'INTEGRATION') && renderInterpretation()}
      {stage === 'REFLECTION_ENTRY' && renderReflectionEntry()}
      {stage === 'REFLECTION_RESULT' && renderReflectionResult()}
      {renderCardPreview()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },

  backBtn: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    ...glassPanel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderColor: 'rgba(120,100,140,0.1)',
  },

  // Entry stage
  entryContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 60,
    alignItems: 'center',
  },
  entryIconWrap: {
    marginBottom: 20,
  },
  entryIconEmoji: {
    fontSize: 80,
  },
  screenTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  screenSubtitle: {
    fontSize: 14,
    color: 'rgba(148,163,184,0.45)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  priceChip: {
    backgroundColor: 'rgba(120,100,140,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(120,100,140,0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  priceChipText: {
    color: 'rgba(180,160,200,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  firstOfferBadge: {
    backgroundColor: 'rgba(120,100,140,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(120,100,140,0.3)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  firstOfferText: {
    color: 'rgba(200,180,220,0.8)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  warningText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Action buttons
  actionBtn: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: 'rgba(120,100,140,0.5)',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginTop: 24,
  },
  actionBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(120,100,140,0.15)',
  },
  actionBtnDisabled: {
    opacity: 0.35,
    shadowOpacity: 0,
  },
  actionBtnText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Reflection entry
  reflectionEntryBlock: {
    width: '100%',
    marginTop: 40,
    alignItems: 'center',
  },
  reflectionTitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 6,
  },
  reflectionSubtitle: {
    fontSize: 13,
    color: 'rgba(148,163,184,0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  reflectionBtn: {
    backgroundColor: 'rgba(120,100,140,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(120,100,140,0.2)',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  reflectionBtnText: {
    color: 'rgba(200,180,220,0.7)',
    fontSize: 15,
    fontWeight: '600',
  },
  reflectionDoneText: {
    color: 'rgba(148,163,184,0.35)',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Question stages
  questionContainer: {
    flex: 1,
  },
  questionScroll: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 60,
  },
  stageLabel: {
    color: 'rgba(120,100,140,0.5)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionLoadingWrap: {
    paddingVertical: 40,
  },
  questionText: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  answerInput: {
    width: '100%',
    backgroundColor: 'rgba(120,100,140,0.04)',
    color: 'rgba(255,255,255,0.85)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120,100,140,0.12)',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    color: 'rgba(120,100,140,0.25)',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },

  // Card stages
  cardStageContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 60,
    alignItems: 'center',
  },
  singleCardWrap: {
    alignItems: 'center',
    marginTop: 40,
  },
  singleCardTouch: {
    width: SCREEN_WIDTH * 0.55,
    aspectRatio: 0.62,
    borderRadius: 12,
  },
  cardBackWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardBackGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120,100,140,0.15)',
  },
  cardBackSymbol: {
    fontSize: 36,
    marginBottom: 12,
  },
  tapToReveal: {
    color: 'rgba(180,160,200,0.4)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },

  // Reading stage
  readingContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 80,
  },
  mainCardSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardLabel: {
    color: 'rgba(120,100,140,0.4)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardFront: {
    backfaceVisibility: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,100,140,0.2)',
  },
  cardNameLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Intensity bar
  intensitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  intensityLabel: {
    color: 'rgba(120,100,140,0.4)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginRight: 12,
  },
  intensityTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,100,140,0.08)',
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    borderRadius: 2,
  },
  intensityValue: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
  },

  // Interpretation blocks
  interpretationBlock: {
    width: '100%',
    marginTop: 12,
  },
  interpretationDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  reflectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(120,100,140,0.1)',
  },
  dividerText: {
    color: 'rgba(120,100,140,0.4)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  bodyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 26,
    letterSpacing: 0.2,
  },

  // Secret card section
  secretSection: {
    width: '100%',
    marginTop: 36,
    alignItems: 'center',
  },
  secretAppears: {
    color: 'rgba(220,38,38,0.4)',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  secretCardTouch: {
    width: SCREEN_WIDTH * 0.45,
    aspectRatio: 0.62,
    borderRadius: 12,
    marginBottom: 8,
  },

  // Integration
  integrationBlock: {
    width: '100%',
    marginTop: 32,
  },

  // Exit
  exitBlock: {
    alignItems: 'center',
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120,100,140,0.06)',
  },
  closingText: {
    color: 'rgba(148,163,184,0.35)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  exitBtn: {
    backgroundColor: 'rgba(120,100,140,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(120,100,140,0.15)',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  exitBtnText: {
    color: 'rgba(200,180,220,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },

  // Card Preview Modal
  previewBackdropPress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,16,0.92)',
  },
  previewCardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(120,100,140,0.5)',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  previewCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 16,
  },
  previewGlowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(120,100,140,0.25)',
  },
  previewCardName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  previewCardPosition: {
    color: 'rgba(180,160,200,0.5)',
    fontSize: 13,
    marginTop: 4,
  },
});

export default ShadowSessionScreen;
