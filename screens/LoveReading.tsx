import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput, Image, Platform, Vibration, Dimensions, Modal, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, UserProfile, LoveReading, LoveCardData } from '../types';
import { coinService } from '../services/coinService';
import { drawRandomCard, TarotCard, getCardName } from '../utils/tarotDeck';
import { TAROT_IMAGES } from '../utils/tarotImages';
import { generateLoveCardInterpretation, generateLoveFinalIntegration } from '../services/geminiService';
import { storage } from '../services/storage';
import { translations } from '../i18n/translations';
import { colors, glassPanel } from '../styles/theme';
import CosmicLoader from '../components/CosmicLoader';
import Icon from '../components/Icon';

type Stage = 'SETUP' | 'READING';

interface DrawnCard extends TarotCard {
    isReversed: boolean;
    isRevealed: boolean;
    cardMeaning: string;
    personalInterpretation: string;
    isLoading: boolean;
}

interface LoveReadingProps {
    profile: UserProfile;
    navigate: (screen: Screen) => void;
}

const POSITIONS = ['Heart', 'Connection', 'Future'] as const;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_HEARTS = 15;
const NUM_SPARKLES = 20;

// Floating heart particle component
const FloatingHeart: React.FC<{ delay: number; startX: number; size: number }> = ({ delay, startX, size }) => {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 50)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            translateY.setValue(SCREEN_HEIGHT + 50);
            opacity.setValue(0);
            rotate.setValue(0);
            translateX.setValue(0);

            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -80,
                    duration: 6000 + Math.random() * 4000,
                    delay,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(opacity, { toValue: 0.6, duration: 1000, delay, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.6, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
                ]),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(translateX, { toValue: 30, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                        Animated.timing(translateX, { toValue: -30, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    ])
                ),
                Animated.timing(rotate, { toValue: 1, duration: 8000, delay, useNativeDriver: true }),
            ]).start(() => animate());
        };
        animate();
    }, []);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: startX,
                transform: [{ translateY }, { translateX }, { rotate: spin }],
                opacity,
            }}
            pointerEvents="none"
        >
            <Text style={{ fontSize: size, color: 'rgba(255,100,130,0.5)' }}>♥</Text>
        </Animated.View>
    );
};

// Sparkle burst on card flip
const SparkleParticle: React.FC<{ active: boolean; cx: number; cy: number; index: number }> = ({ active, cx, cy, index }) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!active) return;
        const angle = (index / NUM_SPARKLES) * Math.PI * 2;
        const distance = 40 + Math.random() * 60;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;

        scale.setValue(0);
        opacity.setValue(1);
        translateX.setValue(0);
        translateY.setValue(0);

        Animated.parallel([
            Animated.spring(scale, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: endX, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: endY, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.sequence([
                Animated.delay(300),
                Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]),
        ]).start();
    }, [active]);

    if (!active) return null;

    const sparkleColors = ['#ff6b9d', '#ff3366', '#ff69b4', '#ffb6c1', '#ffd700', '#ff1493'];
    const color = sparkleColors[index % sparkleColors.length];
    const sparkleSize = 4 + Math.random() * 6;

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: cx - sparkleSize / 2,
                top: cy - sparkleSize / 2,
                width: sparkleSize,
                height: sparkleSize,
                borderRadius: sparkleSize / 2,
                backgroundColor: color,
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
                shadowColor: color,
                shadowOpacity: 0.8,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
            }}
            pointerEvents="none"
        />
    );
};

const LoveReadingScreen: React.FC<LoveReadingProps> = ({ profile, navigate }) => {
    const t = translations[profile.locale as keyof typeof translations] || translations.en;
    const [stage, setStage] = useState<Stage>('SETUP');
    const [coins, setCoins] = useState(0);
    const [partnerName, setPartnerName] = useState('');
    const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
    const [finalIntegration, setFinalIntegration] = useState('');
    const [finalLoading, setFinalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [sparkleCard, setSparkleCard] = useState<number | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const heartPulse = useRef(new Animated.Value(1)).current;
    const setupHeartScale = useRef(new Animated.Value(0.8)).current;
    const setupHeartOpacity = useRef(new Animated.Value(0)).current;
    const previewScale = useRef(new Animated.Value(0)).current;
    const previewRotateY = useRef(new Animated.Value(0)).current;
    const previewBackdrop = useRef(new Animated.Value(0)).current;
    const cardFlipAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
    const textFadeAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
    const integrationFade = useRef(new Animated.Value(0)).current;
    const loveMeterAnim = useRef(new Animated.Value(0)).current;
    const cardEntryAnims = useRef([new Animated.Value(50), new Animated.Value(50), new Animated.Value(50)]).current;
    const cardEntryOpacity = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
    const scrollRef = useRef<ScrollView>(null);

    // Floating hearts data
    const heartsData = useRef(
        Array.from({ length: NUM_HEARTS }, (_, i) => ({
            delay: i * 600,
            startX: Math.random() * SCREEN_WIDTH,
            size: 14 + Math.random() * 18,
        }))
    ).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

        // Pulsing heart on setup
        Animated.loop(
            Animated.sequence([
                Animated.timing(heartPulse, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(heartPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Setup heart entrance
        Animated.parallel([
            Animated.spring(setupHeartScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
            Animated.timing(setupHeartOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]).start();

        let unsub: any = null;
        const init = async () => {
            try {
                const bal = await coinService.getBalance();
                setCoins(bal.coins);
            } catch { }
            unsub = coinService.subscribe(bal => setCoins(bal.coins));

            const today = new Date().toISOString().split('T')[0];
            const existing = await storage.getLoveReading(profile.uid, today);
            if (existing) {
                restoreReading(existing);
            }
        };
        init();
        return () => { if (unsub) unsub(); };
    }, []);

    const restoreReading = (reading: LoveReading) => {
        const cards: DrawnCard[] = [reading.heartCard, reading.connectionCard, reading.futureCard].map(c => ({
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
            cardMeaning: c.cardMeaning,
            personalInterpretation: c.personalInterpretation,
            isLoading: false,
        }));
        setDrawnCards(cards);
        setPartnerName(reading.partnerName);
        setFinalIntegration(reading.finalIntegration);
        setStage('READING');
        cardFlipAnims.forEach(a => a.setValue(1));
        textFadeAnims.forEach(a => a.setValue(1));
        integrationFade.setValue(1);
        loveMeterAnim.setValue(1);
        cardEntryAnims.forEach(a => a.setValue(0));
        cardEntryOpacity.forEach(a => a.setValue(1));
    };

    const handleRevealCards = async () => {
        if (!partnerName.trim()) return;

        const canAfford = coins >= 10 || profile.subscription?.isPremium;
        if (!canAfford) return;

        if (!profile.subscription?.isPremium) {
            try { await coinService.spendCoins(10); } catch {
                setError((t as any).ppfErrorCoins || 'Could not process coins.');
                return;
            }
        }

        const c1 = drawRandomCard();
        const c2 = drawRandomCard([c1.id]);
        const c3 = drawRandomCard([c1.id, c2.id]);

        const newCards: DrawnCard[] = [
            { ...c1, isReversed: Math.random() > 0.7, isRevealed: false, cardMeaning: '', personalInterpretation: '', isLoading: false },
            { ...c2, isReversed: Math.random() > 0.7, isRevealed: false, cardMeaning: '', personalInterpretation: '', isLoading: false },
            { ...c3, isReversed: Math.random() > 0.7, isRevealed: false, cardMeaning: '', personalInterpretation: '', isLoading: false },
        ];
        setDrawnCards(newCards);
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

        // Trigger sparkle burst
        setSparkleCard(index);
        setTimeout(() => setSparkleCard(null), 800);

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

            const result = await generateLoveCardInterpretation(
                profile,
                card.name,
                card.isReversed,
                position,
                partnerName
            );

            setDrawnCards(prev => {
                const next = [...prev];
                next[index] = {
                    ...next[index],
                    cardMeaning: result.cardMeaning,
                    personalInterpretation: result.personalInterpretation,
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
            console.error(`Love card ${index} interpretation failed:`, err);
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
            const result = await generateLoveFinalIntegration(
                profile,
                drawnCards[0].name,
                drawnCards[1].name,
                drawnCards[2].name,
                partnerName
            );
            setFinalIntegration(result.finalIntegration);

            // Love meter fill animation
            Animated.timing(loveMeterAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();

            Animated.timing(integrationFade, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();

            await saveReading(result.finalIntegration);
        } catch (err) {
            console.error('Love integration failed:', err);
            setError((t as any).ppfErrorReading || 'Failed to generate reading.');
        } finally {
            setFinalLoading(false);
        }
    };

    const saveReading = async (integration: string) => {
        const today = new Date().toISOString().split('T')[0];
        const latest = drawnCards;

        const mkCard = (c: DrawnCard): LoveCardData => ({
            id: c.id,
            name: c.name,
            isReversed: c.isReversed,
            keywords: c.keywords,
            cardMeaning: c.cardMeaning,
            personalInterpretation: c.personalInterpretation,
        });

        const reading: LoveReading = {
            id: `love_${Date.now()}`,
            partnerName,
            heartCard: mkCard(latest[0]),
            connectionCard: mkCard(latest[1]),
            futureCard: mkCard(latest[2]),
            finalIntegration: integration,
            date: today,
            locale: profile.locale,
            generatedAt: new Date().toISOString(),
        };

        await storage.saveLoveReading(profile.uid, reading);
    };

    // ============================
    // SETUP STAGE
    // ============================
    const renderSetup = () => {
        const canAfford = coins >= 10 || profile.subscription?.isPremium;
        const canProceed = partnerName.trim().length > 0 && canAfford;

        return (
            <ScrollView contentContainerStyle={styles.setupContainer} keyboardShouldPersistTaps="handled">
                <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
                    <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.6)" />
                </Pressable>

                {/* Big pulsing heart */}
                <Animated.View style={[styles.setupHeartWrap, { transform: [{ scale: Animated.multiply(setupHeartScale, heartPulse) }], opacity: setupHeartOpacity }]}>
                    <Text style={styles.setupHeartEmoji}>❤️</Text>
                </Animated.View>

                <Text style={styles.screenTitle}>{(t as any).spreadLoveReading || 'Love Reading'}</Text>
                <Text style={styles.screenSubtitle}>{(t as any).loveSubtitle || 'Let the cards reveal what your heart already knows.'}</Text>

                <View style={styles.priceChip}>
                    <Text style={styles.priceChipText}>
                        {profile.subscription?.isPremium ? (t as any).freeForPremium : `10 ${t.coins}`}
                    </Text>
                </View>

                {/* Partner name input */}
                <Text style={styles.fieldLabel}>{(t as any).lovePartnerName || 'Their Name'}</Text>
                <TextInput
                    style={styles.nameInput}
                    placeholder={(t as any).lovePartnerPlaceholder || 'Who holds your heart?'}
                    placeholderTextColor="rgba(255,150,180,0.3)"
                    value={partnerName}
                    onChangeText={setPartnerName}
                    maxLength={30}
                    autoFocus
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                    onPress={handleRevealCards}
                    disabled={!canProceed}
                    style={[styles.revealBtn, !canProceed && styles.revealBtnDisabled]}
                >
                    <LinearGradient
                        colors={['#ff3366', '#ff6b9d', '#ff3366']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.revealBtnGradient}
                    >
                        <Text style={styles.revealBtnText}>❤️ {(t as any).loveRevealCards || 'Open Your Heart'}</Text>
                    </LinearGradient>
                </Pressable>
            </ScrollView>
        );
    };

    // ============================
    // READING STAGE
    // ============================
    const renderReading = () => {
        const positionLabels = [
            (t as any).loveHeart || 'Your Heart',
            (t as any).loveConnection || 'The Connection',
            (t as any).loveFuture || "Love's Future",
        ];
        const positionEmojis = ['💗', '💞', '🔮'];

        return (
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.readingContainer}
                showsVerticalScrollIndicator={false}
            >
                <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
                    <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Text style={[styles.screenTitle, { marginBottom: 8 }]}>{(t as any).spreadLoveReading || 'Love Reading'}</Text>
                <Text style={styles.partnerLabel}>❤️ {partnerName}</Text>

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
                                <Text style={styles.positionLabel}>{positionEmojis[i]} {positionLabels[i]}</Text>
                                <Pressable
                                    onPress={() => card.isRevealed ? openCardPreview(i) : handleCardFlip(i)}
                                    disabled={!canFlip && !card.isRevealed}
                                    style={[styles.cardTouchArea, !canFlip && !card.isRevealed && { opacity: 0.4 }]}
                                >
                                    <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />

                                    <Animated.View style={[styles.cardFace, { opacity: backOpacity }]}>
                                        <LinearGradient colors={['#2a0a1a', '#3d0f28', '#2a0a1a']} style={styles.cardBackGradient}>
                                            <Animated.Text style={[styles.cardBackSymbol, { transform: [{ scale: heartPulse }] }]}>♥</Animated.Text>
                                        </LinearGradient>
                                    </Animated.View>

                                    <Animated.View style={[styles.cardFace, styles.cardFront, { opacity: frontOpacity }]}>
                                        <Image
                                            source={TAROT_IMAGES[card.id]}
                                            style={[styles.cardImage, card.isReversed && { transform: [{ rotate: '180deg' }] }]}
                                        />
                                    </Animated.View>

                                    {/* Sparkle burst */}
                                    {sparkleCard === i && (
                                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                            {Array.from({ length: NUM_SPARKLES }).map((_, si) => (
                                                <SparkleParticle
                                                    key={si}
                                                    active
                                                    cx={SCREEN_WIDTH * 0.155}
                                                    cy={SCREEN_WIDTH * 0.155 / 0.62 / 2}
                                                    index={si}
                                                />
                                            ))}
                                        </View>
                                    )}
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
                                <Text style={styles.dividerText}>{positionEmojis[i]} {positionLabels[i]}</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {card.isLoading ? (
                                <View style={styles.loadingBlock}>
                                    <CosmicLoader size="small" />
                                    <Text style={styles.loadingText}>{(t as any).loveCosmosInterpreting || 'The universe is reading your heart...'}</Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.cardHeader}>
                                        {((t as any).loveYourCard || 'The {position} card is').replace('{position}', positionLabels[i])}: {getCardName(card, profile.locale) || card.name}
                                        {card.isReversed ? ` (${t.reversed})` : ` (${t.upright})`}
                                    </Text>

                                    {card.cardMeaning ? (
                                        <>
                                            <Text style={styles.sectionTitle}>{(t as any).loveCardMeaning || 'Card Meaning'}</Text>
                                            <Text style={styles.bodyText}>{card.cardMeaning}</Text>
                                        </>
                                    ) : null}

                                    {card.personalInterpretation ? (
                                        <>
                                            <Text style={styles.sectionTitle}>{(t as any).lovePersonalMeaning || 'What This Means For Your Love'}</Text>
                                            <Text style={styles.bodyText}>{card.personalInterpretation}</Text>
                                        </>
                                    ) : null}
                                </>
                            )}
                        </Animated.View>
                    );
                })}

                {/* Final integration loading */}
                {finalLoading && (
                    <View style={styles.loadingBlock}>
                        <CosmicLoader size="small" />
                        <Text style={styles.loadingText}>{(t as any).loveIntegrating || 'Weaving your love story together...'}</Text>
                    </View>
                )}

                {/* Love meter + final integration */}
                {finalIntegration ? (
                    <Animated.View style={[styles.integrationBlock, { opacity: integrationFade }]}>
                        {/* Love Meter */}
                        <View style={styles.loveMeterContainer}>
                            <Text style={styles.loveMeterLabel}>❤️‍🔥</Text>
                            <View style={styles.loveMeterTrack}>
                                <Animated.View
                                    style={[
                                        styles.loveMeterFill,
                                        {
                                            width: loveMeterAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            }),
                                        },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#ff3366', '#ff6b9d', '#ff69b4']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                </Animated.View>
                            </View>
                            <Text style={styles.loveMeterLabel}>💖</Text>
                        </View>

                        <View style={styles.interpretationDivider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>{(t as any).loveIntegrationInsight || "Love's Message"}</Text>
                            <View style={styles.dividerLine} />
                        </View>
                        <Text style={styles.integrationText}>{finalIntegration}</Text>
                    </Animated.View>
                ) : null}

                {error && <Text style={[styles.errorText, { marginTop: 16 }]}>{error}</Text>}

                {finalIntegration ? (
                    <View style={styles.exitBlock}>
                        <Text style={styles.closingText}>{(t as any).loveClosing || 'Love speaks in whispers. Listen closely.'}</Text>
                        <Pressable onPress={() => navigate('TAROT')} style={styles.exitBtn}>
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
            (t as any).loveHeart || 'Your Heart',
            (t as any).loveConnection || 'The Connection',
            (t as any).loveFuture || "Love's Future",
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
            <LinearGradient colors={['#0a0205', '#1a0510', '#0a0205']} style={StyleSheet.absoluteFill} />

            {/* Floating hearts background */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {heartsData.map((h, i) => (
                    <FloatingHeart key={i} delay={h.delay} startX={h.startX} size={h.size} />
                ))}
            </View>

            {stage === 'SETUP' && renderSetup()}
            {stage === 'READING' && renderReading()}
            {renderCardPreview()}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0205' },

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
    setupHeartWrap: {
        marginBottom: 16,
    },
    setupHeartEmoji: {
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
        color: 'rgba(255,180,200,0.5)',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    priceChip: {
        alignSelf: 'center',
        backgroundColor: 'rgba(255,51,102,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,51,102,0.25)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 18,
        marginBottom: 32,
    },
    priceChipText: {
        color: '#ff6b9d',
        fontSize: 14,
        fontWeight: '600',
    },
    fieldLabel: {
        color: 'rgba(255,180,200,0.5)',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '600',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    nameInput: {
        width: '100%',
        backgroundColor: 'rgba(255,51,102,0.06)',
        color: '#fff',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,51,102,0.15)',
        fontSize: 16,
        marginBottom: 24,
    },
    revealBtn: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#ff3366',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        marginTop: 8,
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
    partnerLabel: {
        fontSize: 14,
        color: 'rgba(255,107,157,0.6)',
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 28,
        fontWeight: '600',
    },

    // Cards row
    cardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 12,
    },
    cardColumn: {
        width: '31%',
        alignItems: 'center',
    },
    positionLabel: {
        color: 'rgba(255,180,200,0.5)',
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
        backgroundColor: 'rgba(255,51,102,0.15)',
        shadowColor: '#ff3366',
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
        borderColor: 'rgba(255,51,102,0.2)',
    },
    cardBackSymbol: {
        color: 'rgba(255,51,102,0.3)',
        fontSize: 28,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,107,157,0.3)',
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
        backgroundColor: 'rgba(255,51,102,0.12)',
    },
    dividerText: {
        color: 'rgba(255,107,157,0.6)',
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
        color: 'rgba(255,107,157,0.6)',
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
        color: 'rgba(255,180,200,0.4)',
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 12,
    },

    // Love Meter
    loveMeterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    loveMeterLabel: {
        fontSize: 22,
    },
    loveMeterTrack: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255,51,102,0.1)',
        borderRadius: 4,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    loveMeterFill: {
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },

    // Integration
    integrationBlock: {
        width: '100%',
        marginTop: 32,
    },
    integrationText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        lineHeight: 26,
        fontStyle: 'italic',
    },

    // Exit
    exitBlock: {
        alignItems: 'center',
        marginTop: 40,
        paddingBottom: 20,
    },
    closingText: {
        color: 'rgba(255,180,200,0.3)',
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 24,
    },
    exitBtn: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,51,102,0.2)',
        width: '100%',
        alignItems: 'center',
    },
    exitBtnText: {
        color: 'rgba(255,180,200,0.6)',
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
        backgroundColor: 'rgba(10,2,5,0.95)',
    },
    previewCardWrap: {
        borderRadius: 16,
        overflow: 'visible',
        shadowColor: '#ff3366',
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
        borderColor: 'rgba(255,51,102,0.4)',
    },
    previewCardName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        textAlign: 'center',
    },
    previewCardPosition: {
        color: 'rgba(255,107,157,0.6)',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 8,
    },
});

export default LoveReadingScreen;
