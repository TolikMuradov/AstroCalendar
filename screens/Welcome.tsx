import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icon';
import { colors, glassPanel } from '../styles/theme';

interface WelcomeProps {
  onContinue: () => void;
}

const features = [
  { icon: 'auto_awesome', title: 'Daily Insights', desc: 'Personalized guidance from the cosmos', color: colors.primary },
  { icon: 'calendar_month', title: 'Monthly Rituals', desc: 'Sacred practices for every day', color: colors.accentGold },
  { icon: 'psychology', title: 'Deep Analysis', desc: 'Your complete astrological profile', color: '#dc2626' },
];

const WelcomeScreen: React.FC<WelcomeProps> = ({ onContinue }) => {
  return (
    <LinearGradient colors={['#0a0202', '#1a0808', '#0a0202']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="flare" size={28} color={colors.primary} />
          <Text style={styles.headerTitle}>Astro</Text>
        </View>
        <View>
          <Text style={styles.poweredBy}>Powered by</Text>
          <Text style={styles.studioText}>916.studio</Text>
        </View>
      </View>

      {/* Main */}
      <View style={styles.main}>
        <View style={{ marginBottom: 48 }}>
          <Text style={styles.title}>Your cosmic{'\n'}journey begins.</Text>
          <Text style={styles.subtitle}>Experience daily energy alignments and rituals curated by the stars.</Text>
        </View>

        <View style={{ gap: 12, marginBottom: 40 }}>
          {features.map((feat, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Icon name={feat.icon} size={24} color={feat.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.accentGold }]}>12</Text>
            <Text style={styles.statLabel}>Zodiacs</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.primary }]}>∞</Text>
            <Text style={styles.statLabel}>Insights</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#dc2626' }]}>24/7</Text>
            <Text style={styles.statLabel}>Guidance</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={onContinue}>
          <LinearGradient colors={[colors.primary, '#991b1b', colors.accentGold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Begin Seeking</Text>
          </LinearGradient>
        </Pressable>
        <Text style={styles.copyright}>© 2024 916.studio • Cosmic Intelligence</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 32, paddingBottom: 0 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase', opacity: 0.7 },
  poweredBy: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'right' },
  studioText: { color: colors.accentGold, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, textAlign: 'right' },
  main: { flex: 1, justifyContent: 'center', paddingHorizontal: 40 },
  title: { color: '#fff', fontSize: 42, fontWeight: 'bold', fontStyle: 'italic', lineHeight: 46, marginBottom: 24, letterSpacing: -0.5 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '300', lineHeight: 24, maxWidth: 280 },
  featureCard: { ...glassPanel, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  featureDesc: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', fontStyle: 'italic', marginBottom: 4 },
  statLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  footer: { padding: 40 },
  ctaBtn: { height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  copyright: { color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', marginTop: 24, letterSpacing: 2, textTransform: 'uppercase' },
});

export default WelcomeScreen;
