import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { translations } from '../i18n/translations';
import { storage } from '../services/storage';
import { Locale, UserProfile } from '../types';
import Icon from '../components/Icon';
import { colors, glassPanel } from '../styles/theme';

interface PremiumProps {
  profile: UserProfile | null;
  onClose: () => void;
}

const features = [
  { key: 'premiumFeature1', icon: 'block' },
  { key: 'premiumFeature2', icon: 'casino' },
  { key: 'premiumFeature3', icon: 'style' },
  { key: 'premiumFeature4', icon: 'calendar_month' },
  { key: 'premiumFeature5', icon: 'psychology' },
] as const;

const PremiumScreen: React.FC<PremiumProps> = ({ profile, onClose }) => {
  const [locale, setLocale] = useState<Locale>('en');
  const isPremium = profile?.subscription?.isPremium;

  useEffect(() => {
    (async () => {
      const loc = await storage.getLocale();
      if (loc) setLocale(loc);
    })();
  }, []);

  const t = translations[locale];
  const storeName = Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play Store';

  const handleSubscribe = () => {
    // TODO: integrate with expo-in-app-purchases or react-native-purchases
    Alert.alert('Coming Soon', 'In-app purchases will be available soon.');
  };

  const handleRestore = () => {
    Alert.alert('Restore', 'Checking for existing purchases...');
  };

  return (
    <LinearGradient colors={['#0a0202', '#1a0808']} style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.backBtn}>
          <Icon name="arrow_back" size={24} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Icon name="auto_awesome" size={32} color={colors.accentGold} />
          </View>
          <Text style={styles.title}>{t.premiumTitle}</Text>
          <Text style={styles.subtitle}>{t.premiumSubtitle}</Text>
        </View>

        {isPremium ? (
          <View style={styles.activeCard}>
            <Icon name="verified" size={48} color={colors.accentGold} />
            <Text style={styles.activeTitle}>{t.premiumActive}</Text>
            <Text style={styles.activeDesc}>{t.premiumActiveDesc}</Text>
          </View>
        ) : (
          <>
            {/* Features */}
            <View style={styles.featuresCard}>
              {features.map((feat, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureCheck}>
                    <Icon name="check" size={16} color={colors.accentGold} />
                  </View>
                  <Text style={styles.featureText}>{t[feat.key]}</Text>
                </View>
              ))}
            </View>

            {/* Pricing card */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingLabel}>{t.premiumMonthly}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>{t.premiumPrice}</Text>
                <Text style={styles.priceUnit}>{t.premiumPerMonth}</Text>
              </View>
              <Text style={styles.cancellable}>{t.premiumCancellable}</Text>
            </View>

            {/* CTA */}
            <Pressable onPress={handleSubscribe}>
              <LinearGradient
                colors={[colors.accentGold, '#d4a017']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaText}>{t.premiumCta}</Text>
              </LinearGradient>
            </Pressable>

            {/* Restore */}
            <Pressable onPress={handleRestore} style={styles.restoreBtn}>
              <Text style={styles.restoreText}>{t.premiumRestore}</Text>
            </Pressable>

            {/* Footer notes */}
            <View style={styles.footerNotes}>
              <Text style={styles.noteText}>{t.premiumStoreNote} {storeName}</Text>
              <Text style={styles.noteText}>{t.premiumLocalPrice}</Text>
              <Text style={[styles.noteText, { marginTop: 8 }]}>{t.premiumRenewalNote}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { padding: 24 },
  backBtn: { width: 48, height: 48, borderRadius: 24, ...glassPanel, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 32, paddingBottom: 64 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, ...glassPanel, borderColor: 'rgba(243,198,35,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', fontStyle: 'italic', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' },
  activeCard: { ...glassPanel, borderColor: 'rgba(243,198,35,0.3)', borderRadius: 24, padding: 32, alignItems: 'center', gap: 12 },
  activeTitle: { color: colors.accentGold, fontSize: 20, fontWeight: 'bold' },
  activeDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  featuresCard: { ...glassPanel, borderRadius: 20, padding: 24, gap: 16, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureCheck: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(243,198,35,0.1)', alignItems: 'center', justifyContent: 'center' },
  featureText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, flex: 1 },
  pricingCard: { ...glassPanel, borderColor: 'rgba(243,198,35,0.2)', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  pricingLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  priceAmount: { color: colors.accentGold, fontSize: 36, fontWeight: 'bold', fontStyle: 'italic' },
  priceUnit: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  cancellable: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 },
  ctaBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8, marginBottom: 16 },
  ctaText: { color: '#0a0202', fontSize: 16, fontWeight: 'bold' },
  restoreBtn: { alignItems: 'center', paddingVertical: 12 },
  restoreText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecorationLine: 'underline' },
  footerNotes: { marginTop: 24, alignItems: 'center', gap: 4 },
  noteText: { color: 'rgba(255,255,255,0.2)', fontSize: 9, textAlign: 'center', letterSpacing: 1 },
});

export default PremiumScreen;
