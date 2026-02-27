import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput, Image, Platform, Vibration, Dimensions, Modal, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, UserProfile, CareerReading, CareerCardData, CareerDiagnostic, CAREER_SPREAD_COST } from '../types';
import { coinService } from '../services/coinService';
import { drawRandomCard, TarotCard, getCardName } from '../utils/tarotDeck';
import { TAROT_IMAGES } from '../utils/tarotImages';
import { generateCareerCardInterpretation, generateCareerFinalSynthesis } from '../services/geminiService';
import { storage } from '../services/storage';
import { translations } from '../i18n/translations';
import { colors, glassPanel } from '../styles/theme';
import CosmicLoader from '../components/CosmicLoader';
import { CardLoadingOverlay, InterpretingShimmer } from '../components/CardLoadingOverlay';
import { showReadingExitAd } from '../services/admobInterstitial';
import Icon from '../components/Icon';

type Stage = 'SETUP' | 'DIAGNOSTIC' | 'READING';

interface DrawnCard extends TarotCard {
  isReversed: boolean;
  isRevealed: boolean;
  objectiveMeaning: string;
  directAssessment: string;
  isLoading: boolean;
}

interface CareerReadingProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const POSITIONS = ['CurrentPosition', 'HiddenBlock', 'Opportunity'] as const;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 12;

// Floating particle for professional ambience (subtle dots, not hearts)
const FloatingDot: React.FC<{ delay: number; startX: number; size: number }> = ({ delay, startX, size }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_HEIGHT + 30);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -40,
          duration: 8000 + Math.random() * 5000,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 1500, delay, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 4000 + Math.random() * 3000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
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
        backgroundColor: 'rgba(59,130,246,0.25)',
        transform: [{ translateY }],
        opacity,
      }}
      pointerEvents="none"
    />
  );
};

// Sanitize user text input to prevent prompt injection
const sanitizeInput = (text: string): string => {
  return text
    .replace(/[<>{}[\]\\]/g, '')
    .replace(/\b(system|prompt|ignore|instruction|override|forget|pretend|act as|you are)\b/gi, '')
    .trim()
    .slice(0, 200);
};

const WORK_OPTIONS = (t: any) => [
  { key: 'employed_stagnant', label: t.careerEmployedStagnant || 'Employed but stagnant' },
  { key: 'overworked', label: t.careerOverworked || 'Overworked and underpaid' },
  { key: 'looking_change', label: t.careerLookingChange || 'Looking for change' },
  { key: 'unemployed', label: t.careerUnemployed || 'Unemployed' },
  { key: 'own_path', label: t.careerOwnPath || 'Building my own path' },
];

const STRESS_OPTIONS = (t: any) => [
  { key: 'stable', label: t.careerStable || 'Stable' },
  { key: 'slightly_concerned', label: t.careerSlightlyConcerned || 'Slightly concerned' },
  { key: 'frequently_stressed', label: t.careerFrequentlyStressed || 'Frequently stressed' },
  { key: 'serious_pressure', label: t.careerSeriousPressure || 'In serious pressure' },
];

const OBSTACLE_OPTIONS = (t: any) => [
  { key: 'fear_risk', label: t.careerFearRisk || 'Fear of risk' },
  { key: 'lack_clarity', label: t.careerLackClarity || 'Lack of clarity' },
  { key: 'low_confidence', label: t.careerLowConfidence || 'Low confidence' },
  { key: 'discipline', label: t.careerDiscipline || 'Discipline issues' },
  { key: 'external', label: t.careerExternal || 'External circumstances' },
];

const CareerReadingScreen: React.FC<CareerReadingProps> = ({ profile, navigate }) => {
  const t = translations[profile.locale as keyof typeof translations] || translations.en;
  const [stage, setStage] = useState<Stage>('SETUP');
  const [coins, setCoins] = useState(0);
  const [diagnostic, setDiagnostic] = useState<CareerDiagnostic>({
    workSituation: '',
    financialStress: '',
    internalObstacle: '',
    mainWorry: '',
  });
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [finalSynthesis, setFinalSynthesis] = useState('');
  const [finalLoading, setFinalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const setupIconScale = useRef(new Animated.Value(0.8)).current;
  const setupIconOpacity = useRef(new Animated.Value(0)).current;
  const diagnosticFade = useRef(new Animated.Value(0)).current;
  const previewScale = useRef(new Animated.Value(0)).current;
  const previewRotateY = useRef(new Animated.Value(0)).current;
  const previewBackdrop = useRef(new Animated.Value(0)).current;
  const cardFlipAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const textFadeAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const synthesisFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardEntryAnims = useRef([new Animated.Value(50), new Animated.Value(50), new Animated.Value(50)]).current;
  const cardEntryOpacity = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const scrollRef = useRef<ScrollView>(null);

  // Floating dots data
  const dotsData = useRef(
    Array.from({ length: NUM_PARTICLES }, (_, i) => ({
      delay: i * 700,
      startX: Math.random() * SCREEN_WIDTH,
      size: 3 + Math.random() * 5,
    }))
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Setup icon entrance
    Animated.parallel([
      Animated.spring(setupIconScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.timing(setupIconOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    let unsub: any = null;
    const init = async () => {
      try {
        const bal = await coinService.getBalance();
        setCoins(bal.coins);
      } catch { }
      unsub = coinService.subscribe(bal => setCoins(bal.coins));

      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getCareerReading(profile.uid, today);
      if (existing) {
        restoreReading(existing);
      }
    };
    init();
    return () => { if (unsub) unsub(); };
  }, []);

  const restoreReading = (reading: CareerReading) => {
    const cards: DrawnCard[] = [reading.currentPositionCard, reading.hiddenBlockCard, reading.opportunityCard].map(c => ({
      id: c.id,
      name: c.name,
      nameTr: '',
      nameTh: '',
      emoji: '',
      keywords: c.keywords,
      arcana: 'major' as const,
      gradient: '',
      isReversed: c.isReversed,
      isRevealed: true,
      objectiveMeaning: c.objectiveMeaning,
      directAssessment: c.directAssessment,
      isLoading: false,
    }));
    setDrawnCards(cards);
    setDiagnostic(reading.diagnostic);
    setFinalSynthesis(reading.finalSynthesis);
    setStage('READING');
    cardFlipAnims.forEach(a => a.setValue(1));
    textFadeAnims.forEach(a => a.setValue(1));
    synthesisFade.setValue(1);
    progressAnim.setValue(1);
    cardEntryAnims.forEach(a => a.setValue(0));
    cardEntryOpacity.forEach(a => a.setValue(1));
  };

  const handleStartDiagnostic = () => {
    setStage('DIAGNOSTIC');
    Animated.timing(diagnosticFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  const diagnosticComplete = diagnostic.workSituation && diagnostic.financialStress && diagnostic.internalObstacle;

  const handleRevealCards = async () => {
    if (!diagnosticComplete) return;

    const canAfford = coins >= CAREER_SPREAD_COST || profile.subscription?.isPremium;
    if (!canAfford) return;

    if (!profile.subscription?.isPremium) {
      try { await coinService.spendCoins(CAREER_SPREAD_COST); } catch {
        setError((t as any).ppfErrorCoins || 'Could not process coins.');
        return;
      }
    }

    // Sanitize worry input before sending to AI
    const sanitizedDiagnostic: CareerDiagnostic = {
      ...diagnostic,
      mainWorry: diagnostic.mainWorry ? sanitizeInput(diagnostic.mainWorry) : undefined,
    };

    const c1 = drawRandomCard();
    const c2 = drawRandomCard([c1.id]);
    const c3 = drawRandomCard([c1.id, c2.id]);

    const newCards: DrawnCard[] = [
      { ...c1, isReversed: Math.random() > 0.7, isRevealed: false, objectiveMeaning: '', directAssessment: '', isLoading: false },
      { ...c2, isReversed: Math.random() > 0.7, isRevealed: false, objectiveMeaning: '', directAssessment: '', isLoading: false },
      { ...c3, isReversed: Math.random() > 0.7, isRevealed: false, objectiveMeaning: '', directAssessment: '', isLoading: false },
    ];
    setDrawnCards(newCards);
    setDiagnostic(sanitizedDiagnostic);
    setStage('READING');

    // Staggered card entrance animation
    newCards.forEach((_, i) => {
      Animated.sequence([
        Animated.delay(i * 200),
        Animated.parallel([
          Animated.spring(cardEntryAnims[i], { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
          Animated.timing(cardEntryOpacity[i], { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    });
  };

  const openCardPreview = (index: number) => {
    setPreviewIndex(index);
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
    ]).start(() => setPreviewIndex(null));
  };

  const handleCardFlip = async (index: number) => {
    if (drawnCards[index].isRevealed) return;
    if (index > 0 && !drawnCards[index - 1].isRevealed) return;
    if (drawnCards.some(c => c.isLoading)) return;

    try { Vibration.vibrate(50); } catch { }

    Animated.timing(cardFlipAnims[index], {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    setDrawnCards(prev => {
      const next = [...prev];
      next[index] = { ...next[index], isRevealed: true, isLoading: true };
      return next;
    });

    try {
      const card = drawnCards[index];
      const position = POSITIONS[index];

      const result = await generateCareerCardInterpretation(
        profile,
        card.name,
        card.isReversed,
        position,
        diagnostic
      );

      setDrawnCards(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          objectiveMeaning: result.objectiveMeaning,
          directAssessment: result.directAssessment,
          isLoading: false,
        };
        return next;
      });

      Animated.timing(textFadeAnims[index], {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      if (index === 2) {
        await generateFinal();
      }
    } catch (err) {
      console.error(`Career card ${index} interpretation failed:`, err);
      setDrawnCards(prev => {
        const next = [...prev];
        next[index] = { ...next[index], isLoading: false };
        return next;
      });
      setError((t as any).ppfErrorReading || 'Failed to generate reading.');
    }
  };

  const generateFinal = async () => {
    setFinalLoading(true);
    try {
      const result = await generateCareerFinalSynthesis(
        profile,
        drawnCards[0].name,
        drawnCards[1].name,
        drawnCards[2].name,
        diagnostic
      );
      setFinalSynthesis(result.finalSynthesis);

      // Progress bar fill animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      Animated.timing(synthesisFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      await saveReading(result.finalSynthesis);
    } catch (err) {
      console.error('Career synthesis failed:', err);
      setError((t as any).ppfErrorReading || 'Failed to generate reading.');
    } finally {
      setFinalLoading(false);
    }
  };

  const saveReading = async (synthesis: string) => {
    const today = new Date().toISOString().split('T')[0];
    const latest = drawnCards;

    const mkCard = (c: DrawnCard): CareerCardData => ({
      id: c.id,
      name: c.name,
      isReversed: c.isReversed,
      keywords: c.keywords,
      objectiveMeaning: c.objectiveMeaning,
      directAssessment: c.directAssessment,
    });

    const reading: CareerReading = {
      id: `career_${Date.now()}`,
      diagnostic,
      currentPositionCard: mkCard(latest[0]),
      hiddenBlockCard: mkCard(latest[1]),
      opportunityCard: mkCard(latest[2]),
      finalSynthesis: synthesis,
      date: today,
      locale: profile.locale,
      generatedAt: new Date().toISOString(),
    };

    await storage.saveCareerReading(profile.uid, reading);
  };

  // ============================
  // SETUP STAGE
  // ============================
  const renderSetup = () => {
    const canAfford = coins >= CAREER_SPREAD_COST || profile.subscription?.isPremium;

    return (
      <ScrollView contentContainerStyle={styles.setupContainer} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
          <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>

        {/* Briefcase icon */}
        <Animated.View style={[styles.setupIconWrap, { transform: [{ scale: setupIconScale }], opacity: setupIconOpacity }]}>
          <Text style={styles.setupIconEmoji}>💼</Text>
        </Animated.View>

        <Text style={styles.screenTitle}>{(t as any).spreadCareerMoney || 'Career & Money'}</Text>
        <Text style={styles.screenSubtitle}>{(t as any).careerSubtitle || "Let's assess where you truly stand."}</Text>

        <View style={styles.priceChip}>
          <Text style={styles.priceChipText}>
            {profile.subscription?.isPremium ? (t as any).freeForPremium : `${CAREER_SPREAD_COST} ${t.coins}`}
          </Text>
        </View>

        {!canAfford && (
          <Text style={styles.warningText}>{(t as any).ppfErrorCoins || 'Not enough coins.'}</Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          onPress={handleStartDiagnostic}
          disabled={!canAfford}
          style={[styles.revealBtn, !canAfford && styles.revealBtnDisabled]}
        >
          <LinearGradient
            colors={['#1e40af', '#3b82f6', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.revealBtnGradient}
          >
            <Text style={styles.revealBtnText}>💼 {(t as any).careerStartAnalysis || 'Start Analysis'}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    );
  };

  // ============================
  // DIAGNOSTIC STAGE
  // ============================
  const renderOptionButton = (option: { key: string; label: string }, selected: boolean, onPress: () => void) => (
    <Pressable
      key={option.key}
      onPress={onPress}
      style={[styles.optionBtn, selected && styles.optionBtnSelected]}
    >
      <Text style={[styles.optionBtnText, selected && styles.optionBtnTextSelected]}>
        {option.label}
      </Text>
    </Pressable>
  );

  const renderDiagnostic = () => {
    const canProceed = diagnosticComplete;

    return (
      <Animated.View style={{ flex: 1, opacity: diagnosticFade }}>
        <ScrollView contentContainerStyle={styles.diagnosticContainer} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => setStage('SETUP')} style={styles.backBtn}>
            <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <Text style={styles.screenTitle}>💼 {(t as any).spreadCareerMoney || 'Career & Money'}</Text>
          <Text style={styles.diagnosticHint}>{(t as any).careerAnswerHonestly || 'Answer honestly.'}</Text>

          {/* Work Situation */}
          <Text style={styles.fieldLabel}>{(t as any).careerWorkSituation || 'Current Work Situation'}</Text>
          <View style={styles.optionsWrap}>
            {WORK_OPTIONS(t as any).map(opt =>
              renderOptionButton(opt, diagnostic.workSituation === opt.key, () =>
                setDiagnostic(prev => ({ ...prev, workSituation: opt.key }))
              )
            )}
          </View>

          {/* Financial Stress */}
          <Text style={styles.fieldLabel}>{(t as any).careerFinancialStress || 'Financial Stress Level'}</Text>
          <View style={styles.optionsWrap}>
            {STRESS_OPTIONS(t as any).map(opt =>
              renderOptionButton(opt, diagnostic.financialStress === opt.key, () =>
                setDiagnostic(prev => ({ ...prev, financialStress: opt.key }))
              )
            )}
          </View>

          {/* Internal Obstacle */}
          <Text style={styles.fieldLabel}>{(t as any).careerInternalObstacle || 'Main Internal Obstacle'}</Text>
          <View style={styles.optionsWrap}>
            {OBSTACLE_OPTIONS(t as any).map(opt =>
              renderOptionButton(opt, diagnostic.internalObstacle === opt.key, () =>
                setDiagnostic(prev => ({ ...prev, internalObstacle: opt.key }))
              )
            )}
          </View>

          {/* Main Worry (optional text) */}
          <Text style={styles.fieldLabel}>{(t as any).careerWorryLabel || 'Your biggest worry (optional)'}</Text>
          <TextInput
            style={styles.worryInput}
            placeholder={(t as any).careerWorryPlaceholder || 'What worries you most right now?'}
            placeholderTextColor="rgba(59,130,246,0.25)"
            value={diagnostic.mainWorry}
            onChangeText={(text) => setDiagnostic(prev => ({ ...prev, mainWorry: text }))}
            maxLength={200}
            multiline
            numberOfLines={3}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            onPress={handleRevealCards}
            disabled={!canProceed}
            style={[styles.revealBtn, !canProceed && styles.revealBtnDisabled]}
          >
            <LinearGradient
              colors={['#1e40af', '#3b82f6', '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.revealBtnGradient}
            >
              <Text style={styles.revealBtnText}>🔍 {(t as any).careerStartAnalysis || 'Start Analysis'}</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </Animated.View>
    );
  };

  // ============================
  // READING STAGE
  // ============================
  const renderReading = () => {
    const positionLabels = [
      (t as any).careerCurrentPosition || 'Current Position',
      (t as any).careerHiddenBlock || 'Hidden Block',
      (t as any).careerOpportunity || 'Opportunity Window',
    ];
    const positionIcons = ['📍', '🔒', '🚪'];

    return (
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.readingContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
          <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>

        <Text style={[styles.screenTitle, { marginBottom: 8 }]}>💼 {(t as any).spreadCareerMoney || 'Career & Money'}</Text>

        {/* Three cards in a row */}
        <View style={styles.cardsRow}>
          {drawnCards.map((card, i) => {
            const canFlip = !card.isRevealed && (i === 0 || drawnCards[i - 1].isRevealed) && !drawnCards.some(c => c.isLoading);
            const flipProgress = cardFlipAnims[i];
            const backOpacity = flipProgress.interpolate({
              inputRange: [0, 0.49, 0.5, 1],
              outputRange: [1, 1, 0, 0],
            });
            const frontOpacity = flipProgress.interpolate({
              inputRange: [0, 0.49, 0.5, 1],
              outputRange: [0, 0, 1, 1],
            });
            const glowOpacity = flipProgress.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 0.8, 0.8, 0],
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.cardColumn,
                  {
                    transform: [{ translateY: cardEntryAnims[i] }],
                    opacity: cardEntryOpacity[i],
                  },
                ]}
              >
                <Text style={styles.positionLabel}>{positionIcons[i]} {positionLabels[i]}</Text>
                <Pressable
                  onPress={() => card.isRevealed ? openCardPreview(i) : handleCardFlip(i)}
                  disabled={!canFlip && !card.isRevealed}
                  style={[styles.cardTouchArea, !canFlip && !card.isRevealed && { opacity: 0.4 }]}
                >
                  <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />

                  <Animated.View style={[styles.cardFace, { opacity: backOpacity }]}>
                    <LinearGradient colors={['#0a1628', '#132244', '#0a1628']} style={styles.cardBackGradient}>
                      <Text style={styles.cardBackSymbol}>💼</Text>
                    </LinearGradient>
                  </Animated.View>

                  <Animated.View style={[styles.cardFace, styles.cardFront, { opacity: frontOpacity }]}>
                    <Image
                      source={TAROT_IMAGES[card.id]}
                      style={[styles.cardImage, card.isReversed && { transform: [{ rotate: '180deg' }] }]}
                    />
                  </Animated.View>

                  {/* Loading overlay on card */}
                  {card.isRevealed && card.isLoading && <CardLoadingOverlay color="#3b82f6" />}
                </Pressable>
                {card.isRevealed && (
                  <Text style={styles.cardNameLabel} numberOfLines={2}>
                    {getCardName(card, profile.locale) || card.name}
                    {card.isReversed ? ` (${t.reversed})` : ''}
                  </Text>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Per-card interpretations */}
        {drawnCards.map((card, i) => {
          if (!card.isRevealed) return null;

          return (
            <Animated.View key={`interp-${i}`} style={[styles.interpretationBlock, { opacity: textFadeAnims[i] }]}>
              <View style={styles.interpretationDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{positionIcons[i]} {positionLabels[i]}</Text>
                <View style={styles.dividerLine} />
              </View>

              {card.isLoading ? (
                <InterpretingShimmer message={(t as any).careerInterpreting || 'Analyzing your professional landscape...'} color="#3b82f6" />
              ) : (
                <>
                  <Text style={styles.cardHeader}>
                    {((t as any).careerYourCard || 'Your {position} card is').replace('{position}', positionLabels[i])}: {getCardName(card, profile.locale) || card.name}
                    {card.isReversed ? ` (${t.reversed})` : ` (${t.upright})`}
                  </Text>

                  {card.objectiveMeaning ? (
                    <>
                      <Text style={styles.sectionTitle}>{(t as any).careerObjectiveMeaning || 'Objective Meaning'}</Text>
                      <Text style={styles.bodyText}>{card.objectiveMeaning}</Text>
                    </>
                  ) : null}

                  {card.directAssessment ? (
                    <>
                      <Text style={styles.sectionTitle}>{(t as any).careerDirectAssessment || 'Direct Assessment'}</Text>
                      <Text style={styles.bodyText}>{card.directAssessment}</Text>
                    </>
                  ) : null}
                </>
              )}
            </Animated.View>
          );
        })}

        {/* Final synthesis loading */}
        {finalLoading && (
          <InterpretingShimmer message={(t as any).careerSynthesizing || 'Compiling your career assessment...'} color="#3b82f6" lineCount={5} />
        )}

        {/* Progress bar + final synthesis */}
        {finalSynthesis ? (
          <Animated.View style={[styles.synthesisBlock, { opacity: synthesisFade }]}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressIcon}>📊</Text>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#1e40af', '#3b82f6', '#60a5fa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
              <Text style={styles.progressIcon}>✅</Text>
            </View>

            <View style={styles.interpretationDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{(t as any).careerSynthesisTitle || 'Professional Reality Check'}</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.synthesisText}>{finalSynthesis}</Text>
          </Animated.View>
        ) : null}

        {error && <Text style={[styles.errorText, { marginTop: 16 }]}>{error}</Text>}

        {finalSynthesis ? (
          <View style={styles.exitBlock}>
            <Text style={styles.closingText}>{(t as any).careerClosing || 'Clarity comes from honest assessment.'}</Text>
            <Pressable onPress={() => showReadingExitAd(!!profile.subscription?.isPremium, () => navigate('TAROT'))} style={styles.exitBtn}>
              <Text style={styles.exitBtnText}>{(t as any).ppfExploreAnother || 'Explore Another Reading'}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    );
  };

  const renderCardPreview = () => {
    if (previewIndex === null || !drawnCards[previewIndex]) return null;
    const card = drawnCards[previewIndex];
    const positionLabels = [
      (t as any).careerCurrentPosition || 'Current Position',
      (t as any).careerHiddenBlock || 'Hidden Block',
      (t as any).careerOpportunity || 'Opportunity Window',
    ];
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
              {positionLabels[previewIndex]} • {card.isReversed ? t.reversed : t.upright}
            </Text>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={['#020617', '#0f172a', '#020617']} style={StyleSheet.absoluteFill} />

      {/* Floating dots background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {dotsData.map((d, i) => (
          <FloatingDot key={i} delay={d.delay} startX={d.startX} size={d.size} />
        ))}
      </View>

      {stage === 'SETUP' && renderSetup()}
      {stage === 'DIAGNOSTIC' && renderDiagnostic()}
      {stage === 'READING' && renderReading()}
      {renderCardPreview()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },

  backBtn: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    ...glassPanel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  // Setup stage
  setupContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 60,
    alignItems: 'center',
  },
  setupIconWrap: {
    marginBottom: 16,
  },
  setupIconEmoji: {
    fontSize: 72,
  },
  screenTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    color: 'rgba(148,163,184,0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  priceChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginBottom: 32,
  },
  priceChipText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Diagnostic stage
  diagnosticContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 60,
  },
  diagnosticHint: {
    fontSize: 14,
    color: 'rgba(148,163,184,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 32,
  },
  fieldLabel: {
    color: 'rgba(148,163,184,0.6)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 24,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: '#3b82f6',
  },
  optionBtnText: {
    color: 'rgba(148,163,184,0.6)',
    fontSize: 14,
  },
  optionBtnTextSelected: {
    color: '#93c5fd',
    fontWeight: '600',
  },
  worryInput: {
    width: '100%',
    backgroundColor: 'rgba(59,130,246,0.06)',
    color: '#fff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    fontSize: 15,
    marginTop: 4,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Common buttons
  revealBtn: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginTop: 32,
  },
  revealBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 28,
  },
  revealBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  revealBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Reading stage
  readingContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 80,
  },

  // Cards row
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    marginTop: 20,
  },
  cardColumn: {
    width: '31%',
    alignItems: 'center',
  },
  positionLabel: {
    color: 'rgba(148,163,184,0.5)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardTouchArea: {
    width: '100%',
    aspectRatio: 0.62,
    borderRadius: 10,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.15)',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardFront: {
    backfaceVisibility: 'hidden',
  },
  cardBackGradient: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  cardBackSymbol: {
    fontSize: 28,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  cardNameLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },

  // Interpretation blocks
  interpretationBlock: {
    width: '100%',
    marginTop: 28,
  },
  interpretationDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  dividerText: {
    color: 'rgba(96,165,250,0.6)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  cardHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    color: 'rgba(96,165,250,0.6)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  bodyText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 24,
  },

  // Loading
  loadingBlock: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    color: 'rgba(148,163,184,0.4)',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 12,
  },

  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressIcon: {
    fontSize: 22,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },

  // Synthesis
  synthesisBlock: {
    width: '100%',
    marginTop: 32,
  },
  synthesisText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 26,
  },

  // Exit
  exitBlock: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  closingText: {
    color: 'rgba(148,163,184,0.3)',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  exitBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    width: '100%',
    alignItems: 'center',
  },
  exitBtnText: {
    color: 'rgba(148,163,184,0.6)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Error
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },

  // Card Preview Modal
  previewBackdropPress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.95)',
  },
  previewCardWrap: {
    borderRadius: 16,
    overflow: 'visible',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.5,
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
    borderColor: 'rgba(59,130,246,0.4)',
  },
  previewCardName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },
  previewCardPosition: {
    color: 'rgba(96,165,250,0.6)',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
});

export default CareerReadingScreen;
