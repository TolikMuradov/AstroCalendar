# Technical Context

## Technology Stack

### Core Technologies (Migrated to Expo/React Native — Feb 21, 2026)
- **Expo SDK**: 54.0.33 (managed workflow)
- **React Native**: 0.81.5
- **React**: 19.1.0
- **TypeScript**: 5.8.2 (strict typing)
- **NativeWind**: v2 (Tailwind CSS for React Native via babel plugin)
- **Metro**: Bundler (replaces Vite)

### Native Modules
- **react-native-google-mobile-ads**: 14.5.0 (AdMob rewarded + app-open ads)
- **@react-native-async-storage/async-storage**: 2.1.2 (replaces localStorage)
- **@react-native-picker/picker**: 2.11.0 (dropdown selects)
- **expo-auth-session**: 6.0.4 + **expo-web-browser**: 14.0.2 (Google OAuth, replaces signInWithPopup)
- **expo-crypto**: 13.0.3 (secure random generation)
- **expo-linear-gradient**: 14.0.2 (replaces CSS gradients & Vanta.js)
- **expo-constants**: 17.0.8 (env var access via app.config.ts extra)
- **expo-status-bar**: 2.0.2
- **react-native-safe-area-context**: 5.4.0
- **react-native-screens**: 4.10.0
- **@expo/vector-icons**: 14.1.0 (MaterialIcons, replaces material-symbols-outlined)

### External Services
- **Firebase JS SDK**: 12.8.0
  - Authentication (Google OAuth via expo-auth-session + signInWithCredential)
  - Firestore for user profile persistence + coin system
  - Cloud Functions for coin reward validation (server-side)
  - Configuration in `services/firebase.ts`
- **Firebase Cloud Functions**: v5 (2nd gen)
  - `firebase-admin ^12.0.0`
  - `firebase-functions ^5.0.0`
  - Node 18 runtime
  - Code in `functions/src/index.ts`
- **OpenAI API**: GPT-4o-mini model
  - Used via fetch to `/v1/chat/completions`
  - JSON mode for structured responses
  - Supports three languages: English, Turkish, Thai
  - Configured in `services/geminiService.ts`

### AdMob Configuration
- **App ID**: `ca-app-pub-5521590521676349~4769244660`
- **App Open Ad**: `ca-app-pub-5521590521676349/4920599542`
- **Rewarded Ad**: `ca-app-pub-5521590521676349/9510435456`
- Falls back to `TestIds` when `__DEV__` is true

## Project Structure
```
AstroCalendar/
├── index.tsx               # registerRootComponent(App)
├── App.tsx                 # SafeAreaProvider, StatusBar, auth, screen routing
├── types.ts                # TypeScript interfaces/types (CoinData, RewardInfo, Screen)
├── app.config.ts           # Expo config (AdMob plugin, env vars via dotenv)
├── babel.config.js         # babel-preset-expo + nativewind/babel
├── tsconfig.json           # extends expo/tsconfig.base, strict mode
├── tailwind.config.js      # CommonJS for Metro, NativeWind content paths
├── nativewind-env.d.ts     # NativeWind TypeScript reference
├── package.json            # Expo/RN dependencies
├── .env.local              # GEMINI_API_KEY, CLOUD_FUNCTIONS_URL, GOOGLE_CLIENT_ID
├── firebase.json           # Firebase project config (functions + rules)
├── firestore.rules         # Firestore security rules (coin protection)
├── config/
│   └── admob.ts            # Centralized AdMob ID helper (TestIds in dev)
├── styles/
│   └── theme.ts            # colors, glassPanel, sharedStyles StyleSheet
├── components/
│   ├── Icon.tsx             # MaterialIcons wrapper (web→RN icon name mapping)
│   ├── Navigation.tsx       # Bottom tab bar (5 tabs + center Tarot)
│   ├── CoinDisplay.tsx      # Gold coin balance pill
│   └── RewardedAdModal.tsx  # Real AdMob rewarded ad modal
├── screens/
│   ├── Welcome.tsx          # LinearGradient bg, feature cards, CTA
│   ├── SignIn.tsx           # expo-auth-session Google OAuth
│   ├── LanguageSelect.tsx   # 3 language buttons (en/tr/th)
│   ├── Onboarding.tsx       # TextInput + Picker components
│   ├── Dashboard.tsx        # Main hub (~300 lines), energy, lucky locks, coins
│   ├── Calendar.tsx         # Monthly grid, day types, stone/activity details
│   ├── Tarot.tsx            # Spread selection hub, daily card, coin gating, done badges
│   ├── PastPresentFuture.tsx # PPF spread — 2-stage, per-card GPT, 3D preview
│   ├── YouThemEnergy.tsx    # YTE spread — relationship reading, name+type input, 3D preview
│   ├── DailyCard.tsx        # Daily free tarot card with AI interpretation
│   ├── EmptyReading.tsx     # Placeholder for unimplemented spreads
│   ├── Profile.tsx          # Edit mode, Picker, language, logout
│   ├── Premium.tsx          # Feature list, $1.99/month CTA
│   └── Compare.tsx          # Partner input, harmony score
├── services/
│   ├── firebase.ts          # Auth + Firestore config
│   ├── geminiService.ts     # AI API calls (uses Constants.expoConfig.extra)
│   ├── coinService.ts       # Coin system (Cloud Functions + Firestore fallback)
│   ├── storage.ts           # AsyncStorage CRUD + Firebase profile sync (ALL async)
│   ├── admobAppOpen.ts      # App open ad (10s interval, 5s timeout)
│   └── admobRewarded.ts     # Rewarded ad (earned_reward callback)
├── utils/
│   ├── astrology.ts         # Zodiac calculations, fallbacks (unchanged)
│   ├── tarotDeck.ts         # 78-card tarot deck data + helpers (unchanged)
│   └── dailyState.ts        # AsyncStorage-based daily unlock state
├── i18n/
│   └── translations.ts      # en/tr/th strings (unchanged)
├── functions/               # Firebase Cloud Functions (unchanged)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts         # addRewardCoin, spendCoins, getCoinBalance
└── memory-bank/             # Project documentation
```

## Development Setup

### Prerequisites
- Node.js 20+
- npm package manager
- Android SDK (for Android builds) or Xcode (for iOS builds)
- Expo CLI (`npx expo`)

### Environment Variables
Required in `.env.local`:
```
GEMINI_API_KEY=<OpenAI API key>
CLOUD_FUNCTIONS_URL=<Firebase Cloud Functions base URL>
GOOGLE_CLIENT_ID=<Google OAuth client ID for expo-auth-session>
```
Loaded via `dotenv/config` in `app.config.ts`, accessible as `Constants.expoConfig?.extra.*`

### Commands
```bash
npm install              # Install dependencies
npx expo start           # Start Expo dev server (Metro bundler)
npx expo run:android     # Run on Android device/emulator
npx expo run:ios         # Run on iOS simulator
npx expo prebuild        # Generate native android/ and ios/ directories
npx tsc --noEmit         # TypeScript type-check (verified: 0 errors)
```

## Technical Constraints

### Platform Requirements
- **Android**: minSdkVersion 21+ (Expo default)
- **iOS**: iOS 13+ (Expo default)
- **No web support**: Project migrated away from web to native for AdMob

### API Limitations
- **OpenAI Rate Limits**: Must handle gracefully with fallbacks
- **Network Dependence**: AI features require internet
- **Cost**: Each insight generation costs API tokens
- **AdMob**: Requires `npx expo prebuild` for native modules

### Storage
- **All storage is async**: Every storage method returns Promise (AsyncStorage)
- **No localStorage**: Replaced entirely with `@react-native-async-storage/async-storage`
- **Firestore**: Source of truth for coins, profiles

### Key Migration Patterns (Web → React Native)
- `div` → `View`, `p/span/h1` → `Text`, `button` → `Pressable`
- `input` → `TextInput`, `select` → `Picker` (@react-native-picker/picker)
- `img` → `Image`, `onClick` → `onPress`
- `localStorage` → `AsyncStorage` (all async/await)
- `import.meta.env` → `Constants.expoConfig?.extra`
- `signInWithPopup` → `expo-auth-session` + `signInWithCredential`
- CSS gradients / Vanta.js → `expo-linear-gradient`
- CSS animations → `Animated` API (simplified)
- `material-symbols-outlined` font → `@expo/vector-icons` MaterialIcons

### Performance Considerations
- **Bundle size**: Kept lean, no heavy navigation libraries
- **Startup**: App open ad shown on first Dashboard visit (free users only)
- **Cache strategy**: Aggressive caching via AsyncStorage to minimize API calls
- **Mobile native**: Direct device performance, no browser overhead

## Configuration Files

### app.config.ts
- Expo managed config with `dotenv/config` for env vars
- `react-native-google-mobile-ads` plugin with AdMob app ID
- `extra` section exposes env vars to runtime via Constants

### babel.config.js
- `babel-preset-expo` + `nativewind/babel` plugin

### tsconfig.json
- Extends `expo/tsconfig.base`
- Strict mode enabled, jsx: react-jsx

### tailwind.config.js
- CommonJS format (required by Metro/NativeWind)
- Simplified content paths for RN files
- Custom colors only (no complex theme extensions)

### Firebase Configuration
- Project: `astrocalendar-36921`
- Auth domain: `astrocalendar-36921.firebaseapp.com`
- Public API key embedded (expected for Firebase)

## Deployment Context
- **Platform**: Native mobile app (Android + iOS) via Expo
- **Build**: `npx expo prebuild` → native projects → `npx expo run:android/ios`
- **Distribution**: Google Play Store and Apple App Store
- **EAS Build**: Can use Expo Application Services for cloud builds
- **Previous deployment** (web): AI Studio — no longer applicable after RN migration

## Dependencies Philosophy
- **Expo managed**: Use Expo SDK modules where possible
- **Minimal navigation**: State-based routing in App.tsx (no React Navigation)
- **Firebase for auth + data**: Auth, Firestore, Cloud Functions
- **Direct API calls**: Using fetch for OpenAI
- **Real-time where needed**: onSnapshot for coin balance sync
- **Real AdMob**: react-native-google-mobile-ads for actual ad revenue
