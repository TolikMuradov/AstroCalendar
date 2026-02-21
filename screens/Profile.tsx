import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal, Linking, Platform, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { UserProfile, Screen, Locale } from '../types';
import { storage } from '../services/storage';
import { coinService, CoinBalance } from '../services/coinService';
import { getWesternZodiac, getChineseZodiac, getZodiacIcon, getChineseAnimalIcon, getElementTrait } from '../utils/astrology';
import { WesternZodiacImages, ChineseZodiacImages } from '../utils/zodiacImages';
import { translations } from '../i18n/translations';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import Icon from '../components/Icon';
import Navigation from '../components/Navigation';
import { colors, glassPanel } from '../styles/theme';

interface ProfileProps {
  profile: UserProfile;
  onLogout: () => void;
  navigate: (screen: Screen) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}



const languages: { code: Locale; flag: string; name: string }[] = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'th', flag: '🇹🇭', name: 'ไทย' },
];

const ProfileScreen: React.FC<ProfileProps> = ({ profile, onLogout, navigate, onProfileUpdate }) => {
  const [locale, setLocale] = useState(profile.locale || 'en');
  const t = translations[locale];

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(profile.name);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };
  const [showLangModal, setShowLangModal] = useState(false);
  const [coinBalance, setCoinBalance] = useState<CoinBalance>({ coins: 0, rewardCountToday: 0, dailyLimit: 3, canWatchAd: true });
  const [saving, setSaving] = useState(false);

  const isPremium = profile.subscription?.isPremium;

  useEffect(() => {
    const parts = profile.birthDate.split('-');
    if (parts.length === 3) {
      setDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    }
    (async () => {
      const loc = await storage.getLocale();
      if (loc) setLocale(loc);
      try {
        const bal = await coinService.getBalance();
        setCoinBalance(bal);
      } catch { }
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const birthDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const western = getWesternZodiac(birthDate);
    const chinese = getChineseZodiac(date.getFullYear());

    const updated: UserProfile = {
      ...profile,
      name: name.trim(),
      birthDate,
      locale,
      computedProfile: {
        westernZodiac: { sign: western.sign, element: western.element },
        chineseZodiac: { animal: chinese.animal, element: chinese.element, yinYang: chinese.yinYang },
      },
    };

    await storage.setProfile(updated);
    onProfileUpdate(updated);
    setEditMode(false);
    setSaving(false);
  };

  const handleLanguageChange = async (newLocale: Locale) => {
    setLocale(newLocale);
    await storage.setLocale(newLocale);
    const updated = { ...profile, locale: newLocale };
    await storage.setProfile(updated);
    onProfileUpdate(updated);
    setShowLangModal(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch { }
    onLogout();
  };

  const zodiacIcon = getZodiacIcon(profile.computedProfile.westernZodiac.sign);
  const chineseIcon = getChineseAnimalIcon(profile.computedProfile.chineseZodiac.animal);
  const elementTrait = getElementTrait(profile.computedProfile.westernZodiac.element, locale);



  const currentLang = languages.find(l => l.code === locale) || languages[0];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0202', '#1a0808']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.profile}</Text>
          {!editMode && (
            <Pressable onPress={() => setEditMode(true)} style={styles.editBtn}>
              <Icon name="edit" size={20} color="rgba(255,255,255,0.5)" />
            </Pressable>
          )}
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarCircle, { overflow: 'hidden' }]}>
            <Image source={WesternZodiacImages[profile.computedProfile.westernZodiac.sign]} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
          </View>
          {editMode ? (
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.nameInput}
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          ) : (
            <Text style={styles.profileName}>{profile.name}</Text>
          )}
          <Text style={styles.profileEmail}>{profile.email}</Text>

          <View style={styles.zodiacRow}>
            <View style={styles.zodiacTag}>
              <Image source={WesternZodiacImages[profile.computedProfile.westernZodiac.sign]} style={{ width: 14, height: 14, resizeMode: 'contain' }} />
              <Text style={styles.tagText}>{profile.computedProfile.westernZodiac.sign}</Text>
            </View>
            <View style={styles.zodiacTag}>
              <Image source={ChineseZodiacImages[profile.computedProfile.chineseZodiac.animal]} style={{ width: 14, height: 14, resizeMode: 'contain' }} />
              <Text style={styles.tagText}>{profile.computedProfile.chineseZodiac.animal}</Text>
            </View>
            <View style={styles.zodiacTag}>
              <Text style={styles.tagText}>{profile.computedProfile.westernZodiac.element} • {elementTrait}</Text>
            </View>
          </View>
        </View>

        {/* Edit Mode: Birth Date */}
        {editMode && (
          <View style={styles.editSection}>
            <Text style={styles.sectionLabel}>Birth Date</Text>
            <Pressable onPress={() => setShowDatePicker(true)} style={[styles.nameInput, { marginBottom: 24, paddingBottom: 8, marginTop: 8 }]}>
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

            <View style={styles.editActions}>
              <Pressable onPress={handleSave} disabled={saving}>
                <LinearGradient colors={[colors.primary, '#991b1b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
                  <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => setEditMode(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Coin Balance */}
        <View style={styles.coinCard}>
          <Text style={{ fontSize: 28 }}>🪙</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.coinLabel}>{t.coins}</Text>
            <Text style={styles.coinValue}>{coinBalance.coins}</Text>
          </View>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Icon name="verified" size={16} color={colors.accentGold} />
              <Text style={styles.premiumText}>{t.premiumActive}</Text>
            </View>
          )}
        </View>

        {/* Language */}
        <Pressable onPress={() => setShowLangModal(true)} style={styles.menuItem}>
          <Icon name="language" size={20} color="rgba(255,255,255,0.5)" />
          <Text style={styles.menuText}>Language</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.menuValue}>{currentLang.flag} {currentLang.name}</Text>
          <Icon name="chevron_right" size={20} color="rgba(255,255,255,0.2)" />
        </Pressable>

        {/* Premium */}
        {!isPremium && (
          <Pressable onPress={() => navigate('PREMIUM')} style={[styles.menuItem, { borderColor: 'rgba(243,198,35,0.2)' }]}>
            <Icon name="auto_awesome" size={20} color={colors.accentGold} />
            <Text style={[styles.menuText, { color: colors.accentGold }]}>{t.premium}</Text>
            <View style={{ flex: 1 }} />
            <Icon name="chevron_right" size={20} color={colors.accentGold} />
          </Pressable>
        )}

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <Pressable onPress={() => Linking.openURL('https://916.studio/privacy')} style={styles.legalLink}>
            <Text style={styles.legalText}>Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://916.studio/terms')} style={styles.legalLink}>
            <Text style={styles.legalText}>Terms of Service</Text>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Icon name="logout" size={20} color={colors.primary} />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </Pressable>

        <Text style={styles.version}>AstroCalendar v1.0.0 • 916.studio</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navigation activeScreen="PROFILE" navigate={navigate} isPremium={!!isPremium} />

      {/* Language Modal */}
      <Modal visible={showLangModal} transparent animationType="fade" onRequestClose={() => setShowLangModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangModal(false)}>
          <View style={styles.langModal}>
            <Text style={styles.langModalTitle}>Language</Text>
            {languages.map((lang) => (
              <Pressable key={lang.code} onPress={() => handleLanguageChange(lang.code)} style={[styles.langOption, locale === lang.code && styles.langOptionActive]}>
                <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                <Text style={styles.langOptionText}>{lang.name}</Text>
                {locale === lang.code && <Icon name="check" size={20} color={colors.accentGold} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', fontStyle: 'italic' },
  editBtn: { width: 44, height: 44, borderRadius: 22, ...glassPanel, alignItems: 'center', justifyContent: 'center' },
  profileCard: { ...glassPanel, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, ...glassPanel, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  nameInput: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: colors.primary, paddingBottom: 4, marginBottom: 4, minWidth: 150 },
  profileName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  profileEmail: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 16 },
  zodiacRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  zodiacTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500' },
  editSection: { ...glassPanel, borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },

  editActions: { flexDirection: 'row', gap: 12 },
  saveBtn: { height: 44, borderRadius: 12, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  cancelBtn: { height: 44, borderRadius: 12, ...glassPanel, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  coinCard: { ...glassPanel, borderColor: 'rgba(243,198,35,0.2)', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  coinLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  coinValue: { color: colors.accentGold, fontSize: 24, fontWeight: 'bold' },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(243,198,35,0.1)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  premiumText: { color: colors.accentGold, fontSize: 10, fontWeight: 'bold' },
  menuItem: { ...glassPanel, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  menuText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  menuValue: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  legalSection: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 24, marginBottom: 16 },
  legalLink: { paddingVertical: 4 },
  legalText: { color: 'rgba(255,255,255,0.2)', fontSize: 11, textDecorationLine: 'underline' },
  logoutBtn: { ...glassPanel, borderColor: 'rgba(142,5,5,0.3)', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  logoutText: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  version: { color: 'rgba(255,255,255,0.1)', fontSize: 10, textAlign: 'center', letterSpacing: 2, marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  langModal: { ...glassPanel, borderRadius: 24, padding: 24, width: 280, gap: 8 },
  langModalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  langOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12 },
  langOptionActive: { backgroundColor: 'rgba(243,198,35,0.1)' },
  langOptionText: { color: '#fff', fontSize: 14, flex: 1 },
});

export default ProfileScreen;
