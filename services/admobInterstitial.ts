import { AdMobIds } from '../config/admob';

let InterstitialAd: any = null;
let AdEventType: any = {};
try {
  const ads = require('react-native-google-mobile-ads');
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
} catch {}

/**
 * Shows an interstitial ad after completing a tarot reading.
 * Always calls onDone() once — either after the ad closes, on error, or immediately if no native module.
 * onDone() should navigate the user (e.g. back to TAROT).
 */
export function showReadingExitAd(isPremium: boolean, onDone: () => void): void {
  // Premium users skip ads
  if (isPremium) {
    onDone();
    return;
  }

  // No native module (Expo Go dev) — skip ad
  if (!InterstitialAd) {
    onDone();
    return;
  }

  const timeout = setTimeout(() => {
    onDone();
  }, 6000); // Fallback: if ad takes too long, navigate anyway

  try {
    const interstitial = InterstitialAd.createForAdRequest(AdMobIds.interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Ad loaded — show it
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      clearTimeout(timeout);
      interstitial.show();
    });

    // Ad closed by user — navigate
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      onDone();
    });

    // Load failed — navigate anyway (never block UX)
    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      clearTimeout(timeout);
      onDone();
    });

    interstitial.load();
  } catch {
    clearTimeout(timeout);
    onDone();
  }
}
