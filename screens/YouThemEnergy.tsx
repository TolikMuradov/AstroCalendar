import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput, Image, Platform, Vibration, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, UserProfile, YouThemEnergyReading, YTECardData } from '../types';
import { coinService } from '../services/coinService';
import { drawRandomCard, TarotCard, getCardName } from '../utils/tarotDeck';
import { TAROT_IMAGES } from '../utils/tarotImages';
import { generateYTECardInterpretation, generateYTEFinalIntegration } from '../services/geminiService';
import { storage } from '../services/storage';
import { translations } from '../i18n/translations';
import { colors, glassPanel } from '../styles/theme';
import CosmicLoader from '../components/CosmicLoader';
import { CardLoadingOverlay, InterpretingShimmer } from '../components/CardLoadingOverlay';
import { showReadingExitAd } from '../services/admobInterstitial';
import Icon from '../components/Icon';

type Stage = 'SETUP' | 'READING';

interface DrawnCard extends TarotCard {
    isReversed: boolean;
    isRevealed: boolean;
    cardMeaning: string;
    personalInterpretation: string;
    isLoading: boolean;
}

interface YTEProps {
    profile: UserProfile;
    navigate: (screen: Screen) => void;
}

const POSITIONS = ['You', 'Them', 'Energy'] as const;

const YouThemEnergyScreen: React.FC<YTEProps> = ({ profile, navigate }) => {
    const t = translations[profile.locale as keyof typeof translations] || translations.en;
    const [stage, setStage] = useState<Stage>('SETUP');
    const [coins, setCoins] = useState(0);
    const [personName, setPersonName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
    const [finalIntegration, setFinalIntegration] = useState('');
    const [finalLoading, setFinalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const previewScale = useRef(new Animated.Value(0)).current;
    const previewRotateY = useRef(new Animated.Value(0)).current;
    const previewBackdrop = useRef(new Animated.Value(0)).current;
    const cardFlipAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
    const textFadeAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
    const integrationFade = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        let unsub: any = null;
        const init = async () => {
            try {
                const bal = await coinService.getBalance();
                setCoins(bal.coins);
            } catch { }
            unsub = coinService.subscribe(bal => setCoins(bal.coins));

            const today = new Date().toISOString().split('T')[0];
            const existing = await storage.getYouThemEnergyReading(profile.uid, today);
            if (existing) {
                restoreReading(existing);
            }
        };
        init();
        return () => { if (unsub) unsub(); };
    }, []);

    const restoreReading = (reading: YouThemEnergyReading) => {
        const cards: DrawnCard[] = [reading.youCard, reading.themCard, reading.energyCard].map(c => ({
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
        setPersonName(reading.personName);
        setRelationship(reading.relationship);
        setFinalIntegration(reading.finalIntegration);
        setStage('READING');
        cardFlipAnims.forEach(a => a.setValue(1));
        textFadeAnims.forEach(a => a.setValue(1));
        integrationFade.setValue(1);
    };

    const handleRevealCards = async () => {
        if (!personName.trim() || !relationship) return;

        const canAfford = coins >= 10 || profile.subscription?.isPremium;
        if (!canAfford) return;

        if (!profile.subscription?.isPremium) {
            try {
                await coinService.spendCoins(10);
            } catch {
                setError((t as any).ppfErrorCoins || 'Could not process coins.');
                return;
            }
        }

        const c1 = drawRandomCard();
        const c2 = drawRandomCard([c1.id]);
        const c3 = drawRandomCard([c1.id, c2.id]);

        setDrawnCards([
            { ...c1, isReversed: Math.random() > 0.7, isRevealed: false, cardMeaning: '', personalInterpretation: '', isLoading: false },
            { ...c2, isReversed: Math.random() > 0.7, isRevealed: false, cardMeaning: '', personalInterpretation: '', isLoading: false },
            { ...c3, isReversed: Math.random() > 0.7, isRevealed: false, cardMeaning: '', personalInterpretation: '', isLoading: false },
        ]);
        setStage('READING');
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

            const result = await generateYTECardInterpretation(
                profile,
                card.name,
                card.isReversed,
                position,
                personName,
                relationship
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
            console.error(`YTE card ${index} interpretation failed:`, err);
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
            const result = await generateYTEFinalIntegration(
                profile,
                drawnCards[0].name,
                drawnCards[1].name,
                drawnCards[2].name,
                personName,
                relationship
            );
            setFinalIntegration(result.finalIntegration);

            Animated.timing(integrationFade, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();

            await saveReading(result.finalIntegration);
        } catch (err) {
            console.error('YTE integration failed:', err);
            setError((t as any).ppfErrorReading || 'Failed to generate reading.');
        } finally {
            setFinalLoading(false);
        }
    };

    const saveReading = async (integration: string) => {
        const today = new Date().toISOString().split('T')[0];
        const latest = drawnCards;

        const mkCard = (c: DrawnCard): YTECardData => ({
            id: c.id,
            name: c.name,
            isReversed: c.isReversed,
            keywords: c.keywords,
            cardMeaning: c.cardMeaning,
            personalInterpretation: c.personalInterpretation,
        });

        const reading: YouThemEnergyReading = {
            id: `yte_${Date.now()}`,
            personName,
            relationship,
            youCard: mkCard(latest[0]),
            themCard: mkCard(latest[1]),
            energyCard: mkCard(latest[2]),
            finalIntegration: integration,
            date: today,
            locale: profile.locale,
            generatedAt: new Date().toISOString(),
        };

        await storage.saveYouThemEnergyReading(profile.uid, reading);
    };

    // ============================
    // SETUP STAGE
    // ============================
    const renderSetup = () => {
        const canAfford = coins >= 10 || profile.subscription?.isPremium;
        const relationships = [
            { id: 'Partner / Spouse', label: (t as any).ytePartner || 'Partner / Spouse' },
            { id: 'Crush', label: (t as any).yteCrush || 'Crush' },
            { id: 'Ex', label: (t as any).yteEx || 'Ex' },
            { id: 'Friend', label: (t as any).yteFriend || 'Friend' },
            { id: 'Family', label: (t as any).yteFamily || 'Family' },
            { id: 'Colleague / Boss', label: (t as any).yteColleague || 'Colleague / Boss' },
        ];
        const canProceed = personName.trim().length > 0 && !!relationship && canAfford;

        return (
            <ScrollView contentContainerStyle={styles.setupContainer} keyboardShouldPersistTaps="handled">
                <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
                    <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Text style={styles.screenTitle}>{(t as any).spreadYouThemEnergy || 'You – Them – Energy'}</Text>
                <Text style={styles.screenSubtitle}>{(t as any).yteSubtitle || 'Read the energy between two souls.'}</Text>

                <View style={styles.priceChip}>
                    <Text style={styles.priceChipText}>
                        {profile.subscription?.isPremium ? (t as any).freeForPremium : `10 ${t.coins}`}
                    </Text>
                </View>

                {/* Person name input */}
                <Text style={styles.fieldLabel}>{(t as any).ytePersonName || 'Their Name'}</Text>
                <TextInput
                    style={styles.nameInput}
                    placeholder={(t as any).ytePersonPlaceholder || 'Enter their name...'}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={personName}
                    onChangeText={setPersonName}
                    maxLength={30}
                    autoFocus
                />

                {/* Relationship options */}
                <Text style={styles.fieldLabel}>{(t as any).yteRelationship || 'Your Connection'}</Text>
                <View style={styles.categoryList}>
                    {relationships.map(rel => (
                        <Pressable
                            key={rel.id}
                            onPress={() => setRelationship(rel.id)}
                            style={[styles.categoryItem, relationship === rel.id && styles.categoryItemActive]}
                        >
                            <Text style={[styles.categoryItemText, relationship === rel.id && styles.categoryItemTextActive]}>
                                {rel.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                    onPress={handleRevealCards}
                    disabled={!canProceed}
                    style={[styles.revealBtn, !canProceed && styles.revealBtnDisabled]}
                >
                    <Text style={styles.revealBtnText}>{(t as any).yteRevealCards || 'Reveal the Energy'}</Text>
                </Pressable>
            </ScrollView>
        );
    };

    // ============================
    // READING STAGE
    // ============================
    const renderReading = () => {
        const positionLabels = [
            (t as any).yteYou || 'You',
            (t as any).yteThem || 'Them',
            (t as any).yteEnergy || 'Energy',
        ];

        return (
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.readingContainer}
                showsVerticalScrollIndicator={false}
            >
                <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
                    <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Text style={[styles.screenTitle, { marginBottom: 8 }]}>{(t as any).spreadYouThemEnergy || 'You – Them – Energy'}</Text>
                <Text style={styles.categoryLabel}>{personName} • {relationship}</Text>

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
                            outputRange: [0, 0.6, 0.6, 0],
                        });

                        return (
                            <View key={i} style={styles.cardColumn}>
                                <Text style={styles.positionLabel}>{positionLabels[i]}</Text>
                                <Pressable
                                    onPress={() => card.isRevealed ? openCardPreview(i) : handleCardFlip(i)}
                                    disabled={!canFlip && !card.isRevealed}
                                    style={[styles.cardTouchArea, !canFlip && !card.isRevealed && { opacity: 0.4 }]}
                                >
                                    <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />

                                    <Animated.View style={[styles.cardFace, { opacity: backOpacity }]}>
                                        <LinearGradient colors={['#140828', '#220e40', '#140828']} style={styles.cardBackGradient}>
                                            <Text style={styles.cardBackSymbol}>&#10023;</Text>
                                        </LinearGradient>
                                    </Animated.View>

                                    <Animated.View style={[styles.cardFace, styles.cardFront, { opacity: frontOpacity }]}>
                                        <Image
                                            source={TAROT_IMAGES[card.id]}
                                            style={[styles.cardImage, card.isReversed && { transform: [{ rotate: '180deg' }] }]}
                                        />
                                    </Animated.View>

                                    {/* Loading overlay on card */}
                                    {card.isRevealed && card.isLoading && <CardLoadingOverlay color="#8b5cf6" />}
                                </Pressable>
                                {card.isRevealed && (
                                    <Text style={styles.cardNameLabel} numberOfLines={2}>
                                        {getCardName(card, profile.locale) || card.name}
                                        {card.isReversed ? ` (${t.reversed})` : ''}
                                    </Text>
                                )}
                            </View>
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
                                <Text style={styles.dividerText}>{positionLabels[i]}</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {card.isLoading ? (
                                <InterpretingShimmer message={(t as any).yteCosmosInterpreting || 'Reading the energy between you two...'} color="#8b5cf6" />
                            ) : (
                                <>
                                    <Text style={styles.cardHeader}>
                                        {((t as any).yteYourCard || 'The {position} card is').replace('{position}', positionLabels[i])}: {getCardName(card, profile.locale) || card.name}
                                        {card.isReversed ? ` (${t.reversed})` : ` (${t.upright})`}
                                    </Text>

                                    {card.cardMeaning ? (
                                        <>
                                            <Text style={styles.sectionTitle}>{(t as any).yteCardMeaning || 'Card Meaning'}</Text>
                                            <Text style={styles.bodyText}>{card.cardMeaning}</Text>
                                        </>
                                    ) : null}

                                    {card.personalInterpretation ? (
                                        <>
                                            <Text style={styles.sectionTitle}>{(t as any).ytePersonalMeaning || 'What This Means For Your Connection'}</Text>
                                            <Text style={styles.bodyText}>{card.personalInterpretation}</Text>
                                        </>
                                    ) : null}
                                </>
                            )}
                        </Animated.View>
                    );
                })}

                {/* Final integration */}
                {finalLoading && (
                    <InterpretingShimmer message={(t as any).yteIntegrating || 'Weaving your connection together...'} color="#8b5cf6" lineCount={5} />
                )}

                {finalIntegration ? (
                    <Animated.View style={[styles.integrationBlock, { opacity: integrationFade }]}>
                        <View style={styles.interpretationDivider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>{(t as any).yteIntegrationInsight || 'Connection Insight'}</Text>
                            <View style={styles.dividerLine} />
                        </View>
                        <Text style={styles.integrationText}>{finalIntegration}</Text>
                    </Animated.View>
                ) : null}

                {error && <Text style={[styles.errorText, { marginTop: 16 }]}>{error}</Text>}

                {finalIntegration ? (
                    <View style={styles.exitBlock}>
                        <Text style={styles.closingText}>{(t as any).yteClosing || 'Every connection carries a message.'}</Text>
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
            (t as any).yteYou || 'You',
            (t as any).yteThem || 'Them',
            (t as any).yteEnergy || 'Energy',
        ];
        const { width: screenW } = Dimensions.get('window');
        const cardW = screenW * 0.7;
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
            <LinearGradient colors={['#070211', '#0e0320', '#070211']} style={StyleSheet.absoluteFill} />
            {stage === 'SETUP' && renderSetup()}
            {stage === 'READING' && renderReading()}
            {renderCardPreview()}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070211' },

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
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    priceChip: {
        alignSelf: 'center',
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.25)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 18,
        marginBottom: 32,
    },
    priceChipText: {
        color: colors.accentGold,
        fontSize: 14,
        fontWeight: '600',
    },
    fieldLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '600',
        marginBottom: 10,
    },
    nameInput: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        color: '#fff',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        fontSize: 16,
        marginBottom: 24,
    },
    categoryList: {
        width: '100%',
        marginBottom: 20,
    },
    categoryItem: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    categoryItemActive: {
        borderColor: 'rgba(255,215,0,0.4)',
        backgroundColor: 'rgba(255,215,0,0.04)',
    },
    categoryItemText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        textAlign: 'center',
    },
    categoryItemTextActive: {
        color: colors.accentGold,
        fontWeight: '500',
    },
    revealBtn: {
        backgroundColor: colors.accentGold,
        paddingVertical: 16,
        borderRadius: 28,
        width: '100%',
        alignItems: 'center',
        shadowColor: colors.accentGold,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        marginTop: 8,
    },
    revealBtnDisabled: {
        opacity: 0.4,
        shadowOpacity: 0,
    },
    revealBtnText: {
        color: '#000',
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
    categoryLabel: {
        fontSize: 13,
        color: 'rgba(255,215,0,0.5)',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 28,
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
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 10,
        fontWeight: '600',
    },
    cardTouchArea: {
        width: '100%',
        aspectRatio: 0.62,
        borderRadius: 10,
    },
    cardGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 10,
        backgroundColor: 'rgba(243,198,35,0.15)',
        shadowColor: colors.accentGold,
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
        borderColor: 'rgba(255,255,255,0.12)',
    },
    cardBackSymbol: {
        color: 'rgba(255,255,255,0.15)',
        fontSize: 28,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
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
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dividerText: {
        color: 'rgba(255,215,0,0.5)',
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
        color: 'rgba(255,215,0,0.6)',
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
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 12,
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
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 24,
    },
    exitBtn: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        width: '100%',
        alignItems: 'center',
    },
    exitBtnText: {
        color: 'rgba(255,255,255,0.6)',
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
        backgroundColor: 'rgba(0,0,0,0.92)',
    },
    previewCardWrap: {
        borderRadius: 16,
        overflow: 'visible',
        shadowColor: colors.accentGold,
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
        borderColor: 'rgba(255,215,0,0.35)',
    },
    previewCardName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        textAlign: 'center',
    },
    previewCardPosition: {
        color: 'rgba(255,215,0,0.5)',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 8,
    },
});

export default YouThemEnergyScreen;
