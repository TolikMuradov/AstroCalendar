# Active Context

## Current State (Updated Feb 23, 2026 - Session 8)
The project is a fully migrated Expo/React Native app with native Android builds working. Latest work: **"You – Them – Energy" (☯️) tarot spread** fully implemented, plus AI tone fix, daily limit system, and 3D card preview modal.

## Recent Changes (Latest - Feb 23, 2026, Session 8)

### You – Them – Energy Spread (Complete)
Full 3-card relationship tarot reading — mirrors PPF architecture:
- **types.ts**: Added `YOU_THEM_ENERGY` to Screen type (now 14 values). New `YTECardData` + `YouThemEnergyReading` interfaces (personName, relationship, youCard/themCard/energyCard)
- **geminiService.ts**: Added `generateYTECardInterpretation()` (relationship-focused fortune-teller prompts, position-aware: You/Them/Energy Between) + `generateYTEFinalIntegration()` (closing reflection on connection)
- **storage.ts**: Added `getYouThemEnergyReading()` / `saveYouThemEnergyReading()`. Updated `getTodaySpreadStatus()` to check YTE specifically
- **screens/YouThemEnergy.tsx**: New screen — 2-stage flow (SETUP → READING). Stage 1: name input + relationship type (Partner/Crush/Ex/Friend/Family/Colleague). Stage 2: 3 cards with sequential flip, per-card GPT, final integration, 3D preview modal, same-day cache, 10-coin cost
- **translations.ts**: 22 new YTE keys added to all 7 locales (en/tr/th/es/fr/de/ja)
- **App.tsx**: Import + case for `YOU_THEM_ENERGY`
- **Tarot.tsx**: Routes `you_them_energy` to new screen instead of `EMPTY_READING`
- **Zero TypeScript errors** across all files

### AI Tone Fix (Session 7)
- GPT prompts rewritten from "calm, refined tarot reader" / "Educational, neutral tone" to "experienced fortune teller who reads tarot for a living" — warm, direct, sometimes blunt, honest. Uses phrases like "Look...", "Here's the thing...", "I won't sugarcoat this..."

### Daily Limit System (Session 7)
- All tarot readings (free + paid) limited to 1x/day per spread type
- `storage.ts`: `getSpreadReading()`, `saveSpreadReading()`, `getTodaySpreadStatus()` — generic spread caching
- `Tarot.tsx`: `spreadStatus` state tracks done spreads. Done spreads show ✓ badge + 50% opacity, still tappable to view cached result

### 3D Card Preview Modal (Session 7)
- In PPF + YTE screens: tapping a revealed card opens fullscreen 3D preview
- `Animated.spring` scale (0.3→1) + `Animated.timing` rotateY (-90°→0°) + backdrop fade
- Golden glow border, card name + position label below
- Tap backdrop to close (reverse animation)

### Previous Changes (Feb 21-23, Sessions 3-6)

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
1. **Build remaining spreads**: Love Reading (❤️), Career & Money (💼), Shadow Energy (🌑), Let Fate Choose (✨) — currently route to EMPTY_READING
2. **Test YTE + PPF flows end-to-end** on Android emulator — verify card flips, GPT calls, daily caching, 3D preview
3. **Configure Google OAuth client IDs** in `app.config.ts` extra section (required for SignIn)
4. **Deploy Cloud Functions** with updated limit (`cd functions && npm run build && firebase deploy --only functions`)
5. **Implement real in-app purchases** in Premium screen (currently placeholder Alert)
6. **Push Notifications** for daily reminders
7. **App Store / Play Store** listing preparation
