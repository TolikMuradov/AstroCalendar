import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { coinService, CoinBalance } from '../services/coinService';
import { showRewardedAd } from '../services/admobRewarded';
import { DAILY_REWARD_LIMIT } from '../types';
import Icon from './Icon';
import { colors, glassPanel } from '../styles/theme';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinUpdate: (balance: CoinBalance) => void;
  rewardCountToday: number;
}

type AdState = 'idle' | 'loading' | 'rewarded' | 'error' | 'limit-reached';

const RewardedAdModal: React.FC<RewardedAdModalProps> = ({ isOpen, onClose, onCoinUpdate, rewardCountToday }) => {
  const [adState, setAdState] = useState<AdState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [earnedCoins, setEarnedCoins] = useState(0);

  const remaining = DAILY_REWARD_LIMIT - rewardCountToday;

  useEffect(() => {
    if (isOpen) {
      setAdState(remaining <= 0 ? 'limit-reached' : 'idle');
      setErrorMsg('');
      setEarnedCoins(0);
    }
  }, [isOpen, remaining]);

  const startWatchingAd = useCallback(() => {
    setAdState('loading');

    showRewardedAd({
      onSuccess: async () => {
        try {
          const result = await coinService.addRewardCoin();
          setEarnedCoins(1);
          setAdState('rewarded');
          onCoinUpdate(result);
        } catch (err: any) {
          if (err.message?.includes('limit')) {
            setAdState('limit-reached');
          } else {
            setErrorMsg(err.message || 'Something went wrong');
            setAdState('error');
          }
        }
      },
      onFail: (error) => {
        setErrorMsg(error || 'Failed to load ad');
        setAdState('error');
      },
    });
  }, [onCoinUpdate]);

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Earn Coins</Text>
            {adState !== 'loading' && (
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}
          </View>

          <View style={styles.body}>
            {/* IDLE */}
            {adState === 'idle' && (
              <>
                <View style={styles.centerContent}>
                  <View style={styles.coinCircle}>
                    <Text style={{ fontSize: 40 }}>🪙</Text>
                  </View>
                  <Text style={styles.subText}>Watch a short ad to earn</Text>
                  <Text style={styles.goldBigText}>+1 Coin</Text>
                  <View style={styles.remainingBadge}>
                    <Icon name="schedule" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.remainingText}>{remaining} / {DAILY_REWARD_LIMIT} remaining today</Text>
                  </View>
                </View>
                <Pressable onPress={startWatchingAd} style={styles.watchBtn}>
                  <Text style={styles.watchBtnText}>Watch Ad</Text>
                </Pressable>
              </>
            )}

            {/* LOADING */}
            {adState === 'loading' && (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={colors.accentGold} />
                <Text style={[styles.subText, { marginTop: 16 }]}>Loading ad...</Text>
              </View>
            )}

            {/* REWARDED */}
            {adState === 'rewarded' && (
              <View style={styles.centerContent}>
                <View style={[styles.coinCircle, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }]}>
                  <Text style={{ fontSize: 40 }}>🎉</Text>
                </View>
                <Text style={styles.successText}>+{earnedCoins} Coin Earned!</Text>
                <Text style={styles.subTextSmall}>
                  {remaining - 1 > 0 ? `You can watch ${remaining - 1} more ads today` : "You've reached today's limit"}
                </Text>
                <View style={styles.btnRow}>
                  {remaining - 1 > 0 && (
                    <Pressable onPress={() => { setAdState('idle'); }} style={styles.secondaryBtn}>
                      <Text style={styles.secondaryBtnText}>Watch Again</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={onClose} style={[styles.secondaryBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={[styles.secondaryBtnText, { color: '#fff' }]}>Done</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* LIMIT REACHED */}
            {adState === 'limit-reached' && (
              <View style={styles.centerContent}>
                <View style={[styles.coinCircle, { backgroundColor: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.2)' }]}>
                  <Icon name="block" size={40} color="#fb923c" />
                </View>
                <Text style={[styles.successText, { color: '#fb923c' }]}>Daily Limit Reached</Text>
                <Text style={styles.subTextSmall}>You've earned the maximum {DAILY_REWARD_LIMIT} coins today.{'\n'}Come back tomorrow for more!</Text>
                <Pressable onPress={onClose} style={[styles.watchBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={[styles.watchBtnText, { color: '#fff' }]}>Got it</Text>
                </Pressable>
              </View>
            )}

            {/* ERROR */}
            {adState === 'error' && (
              <View style={styles.centerContent}>
                <View style={[styles.coinCircle, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                  <Icon name="error" size={40} color="#f87171" />
                </View>
                <Text style={[styles.successText, { color: '#f87171' }]}>Oops!</Text>
                <Text style={styles.subTextSmall}>{errorMsg || 'Failed to load ad. Please try again.'}</Text>
                <View style={styles.btnRow}>
                  <Pressable onPress={() => { setAdState('idle'); setErrorMsg(''); }} style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>Retry</Text>
                  </Pressable>
                  <Pressable onPress={onClose} style={[styles.secondaryBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={[styles.secondaryBtnText, { color: '#fff' }]}>Close</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { ...glassPanel, borderRadius: 32, width: '100%', maxWidth: 360, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 0 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontStyle: 'italic' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 24, gap: 20 },
  centerContent: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  coinCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(243,198,35,0.1)', borderWidth: 1, borderColor: 'rgba(243,198,35,0.2)', alignItems: 'center', justifyContent: 'center' },
  subText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  subTextSmall: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' },
  goldBigText: { color: colors.accentGold, fontSize: 24, fontWeight: 'bold' },
  successText: { color: '#34d399', fontSize: 20, fontWeight: 'bold' },
  remainingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  remainingText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  watchBtn: { width: '100%', paddingVertical: 16, backgroundColor: colors.accentGold, borderRadius: 16, alignItems: 'center' },
  watchBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  secondaryBtn: { flex: 1, paddingVertical: 12, backgroundColor: 'rgba(243,198,35,0.1)', borderWidth: 1, borderColor: 'rgba(243,198,35,0.2)', borderRadius: 16, alignItems: 'center' },
  secondaryBtnText: { color: colors.accentGold, fontWeight: 'bold', fontSize: 14 },
});

export default RewardedAdModal;
