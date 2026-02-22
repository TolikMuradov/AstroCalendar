import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { storage } from '../services/storage';
import { getWesternZodiac, getChineseZodiac } from '../utils/astrology';
import { translations } from '../i18n/translations';
import { Locale, UserProfile } from '../types';
import Icon from '../components/Icon';
import CosmicLoader from '../components/CosmicLoader';
import { colors, glassPanel } from '../styles/theme';

interface OnboardingProps {
  uid: string;
  initialName: string;
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
}



const OnboardingScreen: React.FC<OnboardingProps> = ({ uid, initialName, onComplete, onBack }) => {
  const [locale, setLocale] = useState<Locale>('en');
  const [name, setName] = useState(initialName || '');
  const [date, setDate] = useState(new Date(1990, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const t = translations[locale];

  useEffect(() => {
    (async () => {
      const loc = await storage.getLocale();
      if (loc) setLocale(loc);
    })();
  }, []);



  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setSaving(true);

    const birthDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const western = getWesternZodiac(birthDate);
    const chinese = getChineseZodiac(date.getFullYear());

    const profile: UserProfile = {
      uid,
      name: name.trim(),
      birthDate,
      birthTime: null,
      birthPlace: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      locale,
      focusAreas: [],
      computedProfile: {
        westernZodiac: { sign: western.sign, element: western.element },
        chineseZodiac: { animal: chinese.animal, element: chinese.element, yinYang: chinese.yinYang },
      },
      subscription: { isPremium: false },
    };

    try {
      const docRef = doc(db, 'users', uid);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        const data = existing.data();
        profile.subscription = data.subscription || { isPremium: false };
      }
      await setDoc(docRef, profile, { merge: true });
      await storage.setProfile(profile);
      onComplete(profile);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0202', '#1a0808']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back button */}
        <Pressable onPress={onBack} style={{ marginBottom: 8 }}>
          <Icon name="arrow_back" size={24} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Icon name="auto_awesome" size={48} color={colors.primary} />
          <Text style={styles.title}>{t.onboarding}</Text>
          <Text style={styles.subtitle}>Your celestial profile awaits</Text>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            style={styles.input}
          />
        </View>

        {/* Birth Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Birth Date / Doğum Tarihi</Text>
          <Pressable onPress={() => setShowDatePicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>
                {date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
              <Icon name="calendar_today" size={20} color="rgba(255,255,255,0.5)" />
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleDateChange}
              themeVariant="dark"
            />
          )}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable onPress={handleSubmit} disabled={saving}>
          <LinearGradient colors={[colors.primary, '#991b1b', colors.accentGold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.submitBtn, saving && { opacity: 0.5 }]}>
            {saving ? (
              <CosmicLoader size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.submitText}>Begin Your Journey</Text>
                <Icon name="arrow_forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 32, paddingBottom: 64 },
  header: { alignItems: 'center', marginBottom: 48, marginTop: 48 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', fontStyle: 'italic', marginTop: 24, marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  field: { marginBottom: 24 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  input: { ...glassPanel, height: 56, borderRadius: 16, paddingHorizontal: 20, color: '#fff', fontSize: 16 },

  errorBox: { ...glassPanel, backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center' },
  errorText: { color: '#f87171', fontSize: 12 },
  submitBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default OnboardingScreen; 
