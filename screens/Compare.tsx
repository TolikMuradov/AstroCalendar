import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { UserProfile, ComparisonResult, Screen } from '../types';
import { storage } from '../services/storage';
import { getPartnerComparison } from '../services/geminiService';
import { translations } from '../i18n/translations';
import Icon from '../components/Icon';
import Navigation from '../components/Navigation';
import CosmicLoader from '../components/CosmicLoader';
import { colors, glassPanel } from '../styles/theme';

interface CompareProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CompareScreen: React.FC<CompareProps> = ({ profile, navigate }) => {
  const [locale, setLocale] = useState(profile.locale || 'en');
  const t = translations[locale];

  const [partnerName, setPartnerName] = useState('');
  const [partnerDate, setPartnerDate] = useState(new Date(1995, 5, 15));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setPartnerDate(selectedDate);
  };
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremium = profile.subscription?.isPremium;

  useEffect(() => {
    (async () => {
      const loc = await storage.getLocale();
      if (loc) setLocale(loc);
    })();
  }, []);



  const handleCompare = async () => {
    if (!partnerName.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const partnerBirthDate = `${partnerDate.getFullYear()}-${String(partnerDate.getMonth() + 1).padStart(2, '0')}-${String(partnerDate.getDate()).padStart(2, '0')}`;
    try {
      const comparison = await getPartnerComparison(profile, partnerName.trim(), partnerBirthDate);
      setResult(comparison);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(t.errorGeneral);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#4ade80';
    if (score >= 50) return colors.accentGold;
    return '#f87171';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0202', '#1a0808']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.harmony}</Text>
          <Text style={styles.subtitle}>{t.sync}</Text>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Partner's Name</Text>
          <TextInput
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder="Enter name..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Partner's Birth Date</Text>
          <Pressable onPress={() => setShowDatePicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>
                {partnerDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
              <Icon name="calendar_today" size={20} color="rgba(255,255,255,0.5)" />
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={partnerDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleDateChange}
              themeVariant="dark"
            />
          )}

          <Pressable onPress={handleCompare} disabled={loading || !partnerName.trim()}>
            <LinearGradient
              colors={[colors.primary, '#991b1b', colors.accentGold]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.compareBtn, (loading || !partnerName.trim()) && { opacity: 0.5 }]}
            >
              {loading ? (
                <CosmicLoader size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="favorite" size={20} color="#fff" />
                  <Text style={styles.compareBtnText}>{t.generate}</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={{ gap: 16, marginTop: 8 }}>
            {/* Harmony Score */}
            <View style={styles.scoreCard}>
              <View style={[styles.scoreCircle, { borderColor: getScoreColor(result.harmonyScore) }]}>
                <Text style={[styles.scoreNum, { color: getScoreColor(result.harmonyScore) }]}>{result.harmonyScore}</Text>
              </View>
              <Text style={styles.scoreLabel}>{t.harmony}</Text>
              <Text style={styles.pairText}>{profile.name} & {partnerName}</Text>
            </View>

            {/* Summary */}
            <View style={styles.resultCard}>
              <Text style={styles.resultText}>{result.summary}</Text>
            </View>

            {/* Strengths */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Icon name="favorite" size={18} color="#4ade80" />
                <Text style={[styles.resultTitle, { color: '#4ade80' }]}>Strengths</Text>
              </View>
              {result.strengths.map((s, i) => (
                <Text key={i} style={styles.listItem}>✦ {s}</Text>
              ))}
            </View>

            {/* Challenges */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Icon name="flash_on" size={18} color="#f59e0b" />
                <Text style={[styles.resultTitle, { color: '#f59e0b' }]}>Challenges</Text>
              </View>
              {result.challenges.map((s, i) => (
                <Text key={i} style={styles.listItem}>◈ {s}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navigation activeScreen="COMPARE" navigate={navigate} isPremium={!!isPremium} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 48 },
  header: { marginBottom: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', fontStyle: 'italic' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 },
  formCard: { ...glassPanel, borderRadius: 20, padding: 20, marginBottom: 16 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  input: { ...glassPanel, height: 50, borderRadius: 12, paddingHorizontal: 16, color: '#fff', fontSize: 16, marginBottom: 8 },

  compareBtn: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 8 },
  compareBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  errorBox: { ...glassPanel, backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 16, alignItems: 'center' },
  errorText: { color: '#f87171', fontSize: 13 },
  scoreCard: { ...glassPanel, borderRadius: 24, padding: 32, alignItems: 'center', gap: 12 },
  scoreCircle: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 36, fontWeight: 'bold', fontStyle: 'italic' },
  scoreLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 3 },
  pairText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontStyle: 'italic' },
  resultCard: { ...glassPanel, borderRadius: 16, padding: 20 },
  resultText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  listItem: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 22, marginLeft: 4 },
});

export default CompareScreen;
