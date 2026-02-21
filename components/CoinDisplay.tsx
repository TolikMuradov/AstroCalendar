import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/theme';

interface CoinDisplayProps {
  coins: number;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const CoinDisplay: React.FC<CoinDisplayProps> = ({ coins, onClick, size = 'sm' }) => {
  const isMd = size === 'md';

  return (
    <Pressable onPress={onClick} style={[styles.container, isMd ? styles.md : styles.sm]}>
      <Text style={isMd ? styles.emojiMd : styles.emojiSm}>🪙</Text>
      <Text style={[styles.text, isMd ? styles.textMd : styles.textSm]}>{coins.toLocaleString()}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(243,198,35,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243,198,35,0.2)',
    borderRadius: 999,
  },
  sm: { paddingHorizontal: 12, paddingVertical: 6 },
  md: { paddingHorizontal: 16, paddingVertical: 8 },
  emojiSm: { fontSize: 14 },
  emojiMd: { fontSize: 18 },
  text: { color: colors.accentGold, fontWeight: 'bold' },
  textSm: { fontSize: 12 },
  textMd: { fontSize: 16 },
});

export default CoinDisplay;
