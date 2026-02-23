import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Locale } from '../types';
import Icon from '../components/Icon';
import { colors, glassPanel } from '../styles/theme';

interface LanguageSelectProps {
  onSelect: (lang: Locale) => void;
}

const languages = [
  { code: 'en' as Locale, flag: '🇺🇸', name: 'English' },
  { code: 'tr' as Locale, flag: '🇹🇷', name: 'Türkçe' },
  { code: 'th' as Locale, flag: '🇹🇭', name: 'ไทย (Thai)' },
  { code: 'es' as Locale, flag: '🇪🇸', name: 'Español' },
  { code: 'fr' as Locale, flag: '🇫🇷', name: 'Français' },
  { code: 'de' as Locale, flag: '🇩🇪', name: 'Deutsch' },
  { code: 'ja' as Locale, flag: '🇯🇵', name: '日本語' },
];

const LanguageSelectScreen: React.FC<LanguageSelectProps> = ({ onSelect }) => {
  return (
    <LinearGradient colors={['#0a0202', '#1a0808']} style={styles.container}>
      <View style={styles.center}>
        <Icon name="language" size={48} color={colors.accentGold} />
        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.subtitle}>Dilinizi seçin ve kozmik yolculuğa başlayın.</Text>
      </View>

      <View style={styles.list}>
        {languages.map((lang) => (
          <Pressable key={lang.code} onPress={() => onSelect(lang.code)} style={styles.langBtn}>
            <View style={styles.flagCircle}>
              <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
            </View>
            <Text style={styles.langName}>{lang.name}</Text>
            <Icon name="arrow_forward" size={20} color="rgba(255,255,255,0.2)" />
          </Pressable>
        ))}
      </View>

      <Text style={styles.bottomText}>Cosmic Localization</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  center: { alignItems: 'center', marginBottom: 48 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', fontStyle: 'italic', marginTop: 24, marginBottom: 16 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  list: { gap: 16 },
  langBtn: { ...glassPanel, height: 64, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  flagCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  langName: { color: '#fff', fontWeight: 'bold', flex: 1 },
  bottomText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center', position: 'absolute', bottom: 48, left: 0, right: 0 },
});

export default LanguageSelectScreen;
