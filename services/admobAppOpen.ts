import { AdMobIds } from '../config/admob';

let AppOpenAd: any = null;
let AdEventType: any = {};
try {
  const ads = require('react-native-google-mobile-ads');
  AppOpenAd = ads.AppOpenAd;
  AdEventType = ads.AdEventType;
} catch {}

let lastShown = 0;
const MIN_INTERVAL = 10_000; // 10 seconds between app open ads

export async function showAppOpenAd(isPremium: boolean): Promise<boolean> {
  if (isPremium) return false;
  if (!AppOpenAd) return false; // Native module not available (Expo Go)

  const now = Date.now();
  if (now - lastShown < MIN_INTERVAL) return false;

  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => resolve(false), 5000);

    try {
      const ad = AppOpenAd.createForAdRequest(AdMobIds.appOpen);

      ad.addAdEventListener(AdEventType.LOADED, () => {
        clearTimeout(timeout);
        ad.show();
        lastShown = Date.now();
        resolve(true);
      });

      ad.addAdEventListener(AdEventType.ERROR, () => {
        clearTimeout(timeout);
        resolve(false);
      });

      ad.load();
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}
