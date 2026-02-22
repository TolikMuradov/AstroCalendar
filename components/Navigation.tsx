import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../types';
import Icon from './Icon';
import { colors, glassPanel } from '../styles/theme';

interface NavigationProps {
  activeScreen: Screen;
  navigate: (screen: Screen) => void;
  isPremium?: boolean;
}

const premiumScreens = new Set<Screen>(['CALENDAR', 'COMPARE']);
const items = [
  { screen: 'DASHBOARD' as Screen, icon: 'home', label: 'Home' },
  { screen: 'CALENDAR' as Screen, icon: 'calendar_month', label: 'Moon' },
  { screen: 'TAROT' as Screen, icon: 'style', label: 'Tarot', isCenter: true },
  { screen: 'COMPARE' as Screen, icon: 'sync_alt', label: 'Sync' },
  { screen: 'PROFILE' as Screen, icon: 'person', label: 'Soul' },
];

const Navigation: React.FC<NavigationProps> = ({ activeScreen, navigate, isPremium = false }) => {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = activeScreen === item.screen;

        if (item.isCenter) {
          return (
            <Pressable key={item.screen} onPress={() => navigate(item.screen)} style={[styles.centerBtn, isActive ? styles.centerActive : styles.centerInactive]}>
              <Icon name={item.icon} size={28} color={isActive ? '#000' : '#fff'} />
            </Pressable>
          );
        }

        return (
          <Pressable key={item.screen} onPress={() => navigate(item.screen)} style={styles.navItem}>
            <Icon name={item.icon} size={24} color={isActive ? colors.primary : 'rgba(255,255,255,0.3)'} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            {!isPremium && premiumScreens.has(item.screen) && (
              <View style={styles.lockBadge}>
                <Icon name="lock" size={8} color="rgba(243,198,35,0.6)" />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...glassPanel,
    backgroundColor: 'rgba(10,1,24,0.85)',
    zIndex: 9999,
    elevation: 20,
  },
  navItem: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  labelActive: { color: colors.primary },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
    elevation: 8,
  },
  centerActive: {
    backgroundColor: colors.accentGold,
  },
  centerInactive: {
    backgroundColor: colors.primary,
  },
  lockBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
});

export default Navigation;
