import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, Platform, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, Screen, DailyTarotReading } from '../types';
import { storage } from '../services/storage';
import { generateDailyTarotReading } from '../services/geminiService';
import { translations } from '../i18n/translations';
import { colors } from '../styles/theme';

import { TAROT_DECK } from '../utils/tarotDeck';
import { TAROT_IMAGES } from '../utils/tarotImages';

interface DailyCardProps {
    profile: UserProfile;
    navigate: (screen: Screen) => void;
}

const DailyCardScreen: React.FC<DailyCardProps> = ({ profile, navigate }) => {
    const [reading, setReading] = useState<DailyTarotReading | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        const fetchDailyTarot = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const existing = await storage.getDailyFreeTarot(profile.uid, today);

                if (existing) {
                    setReading(existing);
                    setIsFlipped(true); // Already revealed
                    flipAnim.setValue(1);
                    setLoading(false);
                    return;
                }

                // Generate new
                const randomCard = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
                const aiResponse = await generateDailyTarotReading(profile, randomCard.name, randomCard.keywords);

                const newReading: DailyTarotReading = {
                    id: `daily_${Date.now()}`,
                    cardId: randomCard.id,
                    cardName: randomCard.name,
                    isReversed: Math.random() > 0.7,
                    overallEnergy: aiResponse.overallEnergy,
                    emotionalTone: aiResponse.emotionalTone,
                    subtleAdvice: aiResponse.subtleAdvice,
                    date: today,
                    locale: profile.locale,
                    generatedAt: new Date().toISOString()
                };

                await storage.saveDailyFreeTarot(profile.uid, newReading);
                setReading(newReading);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch daily tarot:", err);
                setLoading(false);
            }
        };

        fetchDailyTarot();
    }, []);

    const handleReveal = () => {
        if (isFlipped) return;
        setIsFlipped(true);
        Animated.spring(flipAnim, {
            toValue: 1,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
    };

    const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

    const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
    const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#070211', '#12042b']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={colors.accentGold} />
                <Text style={styles.loadingText}>Drawing your card...</Text>
            </View>
        );
    }

    const alreadyUsedToday = reading && new Date(reading.generatedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (flipAnim as any)._value === 1;
    // Actually, if it loaded and flipAnim was set to 1 immediately in useEffect, we are returning visitors today.

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#070211', '#12042b']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.topSection}>
                    <Text style={styles.title}>Daily Tarot</Text>
                    <Text style={styles.subtitle}>Your energy for today</Text>
                </View>

                <View style={styles.cardSection}>
                    <Pressable onPress={handleReveal} disabled={isFlipped}>
                        <View style={{ width: 200, height: 320, position: 'relative' }}>
                            <Animated.View style={[styles.cardBase, styles.cardFront, frontAnimatedStyle, { position: 'absolute', top: 0, left: 0 }]}>
                                <View style={styles.cardInnerBack}>
                                    <Text style={{ fontSize: 40, color: 'rgba(255,255,255,0.1)' }}>✧</Text>
                                </View>
                            </Animated.View>

                            <Animated.View style={[styles.cardBase, styles.cardBack, backAnimatedStyle, { position: 'absolute', top: 0, left: 0, overflow: 'hidden' }]}>
                                {reading && reading.cardId !== undefined ? (
                                    <Image
                                        source={TAROT_IMAGES[reading.cardId]}
                                        style={[
                                            { width: '100%', height: '100%', resizeMode: 'cover' },
                                            reading.isReversed && { transform: [{ rotate: '180deg' }] }
                                        ]}
                                    />
                                ) : (
                                    <LinearGradient colors={['#1a082e', '#2a0a4a']} style={styles.cardInnerFace}>
                                        <Text style={{ fontSize: 50 }}>✨</Text>
                                    </LinearGradient>
                                )}
                            </Animated.View>
                        </View>
                    </Pressable>

                    {isFlipped && reading && (
                        <Animated.Text style={[styles.cardName, { opacity: flipAnim }]}>
                            {reading.cardName} {reading.isReversed ? '(Reversed)' : ''}
                        </Animated.Text>
                    )}
                </View>

                {isFlipped && reading && (
                    <Animated.View style={{ opacity: flipAnim, width: '100%' }}>
                        <View style={styles.divider} />

                        <View style={styles.interpretationSection}>
                            <Text style={styles.sectionHeader}>Overall Energy</Text>
                            <Text style={styles.bodyText}>{reading.overallEnergy}</Text>

                            <Text style={styles.sectionHeader}>Emotional Tone</Text>
                            <Text style={styles.bodyText}>{reading.emotionalTone}</Text>

                            <Text style={styles.sectionHeader}>Subtle Advice</Text>
                            <Text style={styles.bodyText}>{reading.subtleAdvice}</Text>
                        </View>

                        <View style={styles.bottomSection}>
                            {alreadyUsedToday && (
                                <Text style={styles.alreadyUsedText}>Your daily insight has already been revealed.</Text>
                            )}
                            <Pressable style={styles.actionButton} onPress={() => navigate('TAROT')}>
                                <Text style={styles.actionButtonText}>Explore Deeper Readings</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                )}

            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#070211',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    topSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        color: '#fff',
        fontWeight: '300',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 8,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    cardSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    cardBase: {
        width: 200,
        height: 320,
        borderRadius: 16,
        backfaceVisibility: 'hidden',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    cardFront: {
        backgroundColor: '#110622',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInnerBack: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        margin: 4,
    },
    cardBack: {
        position: 'absolute',
        top: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    cardInnerFace: {
        flex: 1,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardName: {
        color: '#fff',
        fontSize: 22,
        marginTop: 24,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        marginVertical: 24,
    },
    interpretationSection: {
        width: '100%',
    },
    sectionHeader: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 1,
    },
    bodyText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 24,
    },
    bottomSection: {
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    alreadyUsedText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 1,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginTop: 16,
        letterSpacing: 1,
    }
});

export default DailyCardScreen;
