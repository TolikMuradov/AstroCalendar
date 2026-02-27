import Constants from 'expo-constants';

let TestIds: any = { APP_OPEN: 'ca-app-pub-3940256099942544/9257395921', REWARDED: 'ca-app-pub-3940256099942544/5224354917', INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712' };
try {
  TestIds = require('react-native-google-mobile-ads').TestIds;
} catch {}

const extra = Constants.expoConfig?.extra ?? {};

function getAdId(envValue: string | undefined, testId: string): string {
  if (__DEV__) return testId;
  if (!envValue) {
    console.warn('[AdMob] Missing ad unit ID — falling back to test ID');
    return testId;
  }
  return envValue;
}

export const AdMobIds = {
  appOpen: getAdId(extra.admobAppOpenId, TestIds.APP_OPEN),
  rewarded: getAdId(extra.admobRewardedId, TestIds.REWARDED),
  interstitial: getAdId(extra.admobInterstitialId, TestIds.INTERSTITIAL),
};
