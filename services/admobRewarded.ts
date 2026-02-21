import { AdMobIds } from '../config/admob';

let RewardedAd: any = null;
let RewardedAdEventType: any = {};
let AdEventType: any = {};
try {
  const ads = require('react-native-google-mobile-ads');
  RewardedAd = ads.RewardedAd;
  RewardedAdEventType = ads.RewardedAdEventType;
  AdEventType = ads.AdEventType;
} catch {}

interface RewardedAdCallbacks {
  onSuccess: (result: any) => void;
  onFail: (error: any) => void;
}

export function showRewardedAd({ onSuccess, onFail }: RewardedAdCallbacks): void {
  if (!RewardedAd) {
    // Native module not available (Expo Go) — simulate reward
    setTimeout(() => onSuccess({ earned: true, simulated: true }), 1500);
    return;
  }

  const timeout = setTimeout(() => {
    onFail({ error: true, message: 'Ad load timeout' });
  }, 5000);

  try {
    const rewarded = RewardedAd.createForAdRequest(AdMobIds.rewarded);

    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      clearTimeout(timeout);
      rewarded.show();
    });

    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onSuccess({ earned: true });
    });

    rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
      clearTimeout(timeout);
      onFail({ error: true, message: error.message });
    });

    rewarded.load();
  } catch (err: any) {
    clearTimeout(timeout);
    onFail({ error: true, message: err.message || 'Failed to create ad' });
  }
}
