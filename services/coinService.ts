import { db, auth } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { DAILY_REWARD_LIMIT, COINS_PER_AD } from '../types';
import Constants from 'expo-constants';

const functions = getFunctions();
const addRewardCoinFn = httpsCallable<void, { coins: number; rewardCountToday: number; dailyLimit: number }>(functions, 'addRewardCoin');
const spendCoinsFn = httpsCallable<{ amount: number }, { coins: number }>(functions, 'spendCoins');
const getCoinBalanceFn = httpsCallable<void, { coins: number; rewardCountToday: number; dailyLimit: number }>(functions, 'getCoinBalance');

let _useFirestoreFallback = Constants.expoConfig?.extra?.cloudFunctions !== 'true';

function isDeploymentError(err: any): boolean {
  const code = err?.code || '';
  const msg = err?.message || '';
  return code === 'functions/not-found' || code === 'functions/unavailable' || code === 'functions/internal' ||
    msg.includes('CORS') || msg.includes('Failed to fetch') || msg.includes('internal') || msg.includes('404');
}

function getTodayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export interface CoinBalance {
  coins: number;
  rewardCountToday: number;
  dailyLimit: number;
  canWatchAd: boolean;
}

export const coinService = {
  async getBalance(): Promise<CoinBalance> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    if (_useFirestoreFallback) return this._getBalanceFromFirestore(user.uid);
    try {
      const result = await getCoinBalanceFn();
      return { ...result.data, canWatchAd: result.data.rewardCountToday < result.data.dailyLimit };
    } catch (err: any) {
      if (isDeploymentError(err)) { _useFirestoreFallback = true; return this._getBalanceFromFirestore(user.uid); }
      throw err;
    }
  },

  async addRewardCoin(): Promise<CoinBalance> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    if (_useFirestoreFallback) return this._addRewardCoinFirestore(user.uid);
    try {
      const result = await addRewardCoinFn();
      return { ...result.data, canWatchAd: result.data.rewardCountToday < result.data.dailyLimit };
    } catch (err: any) {
      if (isDeploymentError(err)) { _useFirestoreFallback = true; return this._addRewardCoinFirestore(user.uid); }
      throw err;
    }
  },

  async spendCoins(amount: number): Promise<CoinBalance> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    if (_useFirestoreFallback) return this._spendCoinsFirestore(user.uid, amount);
    try {
      const result = await spendCoinsFn({ amount });
      return { coins: result.data.coins, rewardCountToday: 0, dailyLimit: DAILY_REWARD_LIMIT, canWatchAd: true };
    } catch (err: any) {
      if (isDeploymentError(err)) { _useFirestoreFallback = true; return this._spendCoinsFirestore(user.uid, amount); }
      throw err;
    }
  },

  subscribe(callback: (balance: CoinBalance) => void): Unsubscribe {
    const user = auth.currentUser;
    if (!user) return () => {};
    const userRef = doc(db, 'users', user.uid);
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const today = getTodayLocal();
        const reward = data.reward || { lastRewardDate: '', rewardCountToday: 0 };
        const rewardCountToday = reward.lastRewardDate === today ? reward.rewardCountToday : 0;
        callback({ coins: data.coins ?? 0, rewardCountToday, dailyLimit: DAILY_REWARD_LIMIT, canWatchAd: rewardCountToday < DAILY_REWARD_LIMIT });
      } else {
        callback({ coins: 0, rewardCountToday: 0, dailyLimit: DAILY_REWARD_LIMIT, canWatchAd: true });
      }
    }, (err) => { console.warn('Coin snapshot error:', err.message); });
  },

  async _getBalanceFromFirestore(uid: string): Promise<CoinBalance> {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const today = getTodayLocal();
    if (!snap.exists()) return { coins: 0, rewardCountToday: 0, dailyLimit: DAILY_REWARD_LIMIT, canWatchAd: true };
    const data = snap.data();
    const reward = data.reward || { lastRewardDate: '', rewardCountToday: 0 };
    const rewardCountToday = reward.lastRewardDate === today ? reward.rewardCountToday : 0;
    return { coins: data.coins ?? 0, rewardCountToday, dailyLimit: DAILY_REWARD_LIMIT, canWatchAd: rewardCountToday < DAILY_REWARD_LIMIT };
  },

  async _addRewardCoinFirestore(uid: string): Promise<CoinBalance> {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const today = getTodayLocal();
    let coins = 0;
    let reward = { lastRewardDate: '', rewardCountToday: 0 };
    if (snap.exists()) { const data = snap.data(); coins = data.coins ?? 0; reward = data.reward ?? { lastRewardDate: '', rewardCountToday: 0 }; }
    if (reward.lastRewardDate !== today) { reward.lastRewardDate = today; reward.rewardCountToday = 0; }
    if (reward.rewardCountToday >= DAILY_REWARD_LIMIT) throw new Error('Daily reward limit reached');
    reward.rewardCountToday += 1;
    const newCoins = coins + COINS_PER_AD;
    await setDoc(userRef, { coins: newCoins, reward, updatedAt: new Date().toISOString() }, { merge: true });
    return { coins: newCoins, rewardCountToday: reward.rewardCountToday, dailyLimit: DAILY_REWARD_LIMIT, canWatchAd: reward.rewardCountToday < DAILY_REWARD_LIMIT };
  },

  async _spendCoinsFirestore(uid: string, amount: number): Promise<CoinBalance> {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error('User not found');
    const data = snap.data();
    const coins = data.coins ?? 0;
    if (coins < amount) throw new Error(`Not enough coins. Have ${coins}, need ${amount}`);
    const newCoins = coins - amount;
    await setDoc(userRef, { coins: newCoins, updatedAt: new Date().toISOString() }, { merge: true });
    return { coins: newCoins, rewardCountToday: 0, dailyLimit: DAILY_REWARD_LIMIT, canWatchAd: true };
  },
};
