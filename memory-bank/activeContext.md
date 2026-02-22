# Active Context

## Current State (Updated Feb 21, 2026 - Session 3)
The project has been **fully migrated from Vite+React web to Expo+React Native**. All 10 screens, 4 components, 6 services, and infrastructure converted. TypeScript compiles with **0 errors** (`npx tsc --noEmit`). Real Google AdMob integrated via `react-native-google-mobile-ads`.

## Recent Changes (Latest - Feb 21, 2026, Session 3)

### Full Expo/React Native Migration (Complete)
**Reason**: User requested Google AdMob integration using `react-native-google-mobile-ads`, which requires native builds. Chose full Expo/RN conversion over web-only approach.

#### Infrastructure Created
- **app.config.ts**: Expo config with `react-native-google-mobile-ads` plugin, env vars via `dotenv/config` → `extra` section
- **babel.config.js**: `babel-preset-expo` + `nativewind/babel` plugin
- **config/admob.ts**: Centralized AdMob IDs, falls back to `TestIds` in `__DEV__`
- **styles/theme.ts**: `colors` object, `glassPanel`, `sharedStyles` StyleSheet
- **nativewind-env.d.ts**: NativeWind TypeScript reference
- **components/Icon.tsx**: MaterialIcons wrapper with web→RN icon name mapping

#### Services Converted (all async with AsyncStorage)
- **storage.ts**: All methods now async (Promise-based) using `@react-native-async-storage/async-storage`
- **geminiService.ts**: Uses `Constants.expoConfig?.extra?.openaiApiKey`
- **coinService.ts**: Uses `Constants.expoConfig?.extra?.cloudFunctions`
- **firebase.ts**: Same Firebase config, auth exports
- **admobAppOpen.ts**: NEW — App open ad (10s interval, 5s timeout)
- **admobRewarded.ts**: NEW — Rewarded ad with earned_reward callback

#### All 10 Screens Created (RN components)
- Welcome, SignIn (expo-auth-session), LanguageSelect, Onboarding (Picker components), Dashboard (~300 lines), Calendar (monthly grid), Tarot (5-phase + Animated flip), Profile (edit mode + Picker), Premium ($1.99/month placeholder), Compare (harmony score)

#### Utils Converted
- **dailyState.ts**: AsyncStorage-based daily unlock state

#### Entry Points Rewritten
- **index.tsx**: `registerRootComponent(App)` (4 lines)
- **App.tsx**: SafeAreaProvider, StatusBar, showAppOpenAd on first Dashboard visit

#### Deleted Web-Only Files
- `vite.config.ts`, `postcss.config.js`, `index.html`, `index.css` — all removed

#### Key Fixes Applied
- `getZodiacData` → `getWesternZodiac` (Onboarding, Profile)
- `tarotDeck` → `TAROT_DECK`, `getCardName` → `getCardNameFromDeck` (Tarot)
- CoinDisplay: `onClick` (not `onPress`)
- RewardedAdModal: `isOpen` (not `visible`), `onCoinUpdate` expects `CoinBalance`
- Navigation: `activeScreen` (not `currentScreen`) — fixed in all 5 screens
- Onboarding: props updated to match App.tsx calling convention (uid, initialName, onBack)
- Premium: `onClose` (not `onBack`), profile allows null

### Previous Changes (Sessions 1-2)
- Tarot Reading feature fully implemented (78 cards, AI, animations)
- Coin economy rebalanced (DAILY_REWARD_LIMIT=3, LUCKY_LOCKED_COST=1, TAROT_READING_COST=6)
- Calendar & Compare premium-gated
- Navigation lock icons for free users

## Active Decisions

### Free vs Premium Model (UNCHANGED)
| Feature | Free User | Premium User |
|---------|-----------|-------------|
| Dashboard | ✅ Full access | ✅ Full access |
| Daily Insights | ✅ Full access | ✅ Full access |
| Lucky Number 1 | ✅ Free | ✅ Free |
| Lucky Numbers 2-3 | 🔒 1 coin each/day | ✅ Free |
| Tarot Reading | 🪙 6 coins | ✅ Free |
| Calendar | 🔒 Premium only | ✅ Full access |
| Compare | 🔒 Premium only | ✅ Full access |
| Ads | 📺 Real AdMob (earn coins) | ❌ No ads |
| Daily Coin Limit | 3 coins/day | N/A |

### Coin Economy
- Earn: Watch real AdMob rewarded ad → +1 coin (max 3/day)
- Spend: Lucky number unlock (1 coin), Tarot reading (6 coins)
- Storage: Firestore (server-side), AsyncStorage for daily unlock state

## Next Steps
1. **Configure Google OAuth client IDs** in `app.config.ts` extra section (required for SignIn)
2. **Run `npx expo prebuild`** to generate native `android/` and `ios/` directories
3. **Run `npx expo run:android`** for first native build and test
4. **Deploy Cloud Functions** with updated limit (`cd functions && npm run build && firebase deploy --only functions`)
5. **Implement real in-app purchases** in Premium screen (currently placeholder Alert)
6. **Push Notifications** for daily reminders
7. **App Store / Play Store** listing preparation
