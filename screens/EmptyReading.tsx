import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../types';
import Navigation from '../components/Navigation';
import { colors, glassPanel } from '../styles/theme';

interface EmptyReadingProps {
    route: { params: { readingType: string } };
    navigate: (screen: Screen) => void;
}

const EmptyReadingScreen: React.FC<EmptyReadingProps> = ({ route, navigate }) => {
    const readingType = route?.params?.readingType || 'Reading';
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#0a0118', '#000000']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
                    <Text style={{ color: colors.primary }}>← Back</Text>
                </Pressable>
                <Text style={styles.title}>{readingType.replace(/_/g, ' ').toUpperCase()}</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.placeholderCard}>
                    <Text style={styles.icon}>🔮</Text>
                    <Text style={styles.placeholderText}>Reading content coming soon...</Text>
                    <Text style={styles.subText}>The stars are aligning for this new feature.</Text>
                </View>
            </View>

            <Navigation activeScreen="TAROT" navigate={navigate} isPremium={false} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
    backBtn: { padding: 10 },
    title: { color: '#fff', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 40 },
    placeholderCard: { ...glassPanel, padding: 40, borderRadius: 32, alignItems: 'center' },
    icon: { fontSize: 48, marginBottom: 24 },
    placeholderText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    subText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' },
});

export default EmptyReadingScreen;
