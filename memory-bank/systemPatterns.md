# System Patterns

## Architecture Overview (Expo/React Native — Feb 21, 2026)

### Application Structure
```
App.tsx (Root — SafeAreaProvider + StatusBar)
├── Screen Router (state-based navigation, no React Navigation)
├── Auth Observer (Firebase onAuthStateChanged)
├── Profile Manager (AsyncStorage — all async)
├── App Open Ad (shown on first Dashboard visit for free users)
└── Screen Components
    ├── Welcome/SignIn/LanguageSelect (entry flow)
    ├── Onboarding (data collection — Picker components)
    └── Dashboard/Calendar/Profile/Compare/Premium/Tarot (main app)
```

### Key Technical Decisions

#### 1. State Management
- **No external state library**: React hooks (useState, useEffect) sufficient
- **AsyncStorage as cache**: Primary data persistence (ALL methods async/Promise-based)
- **Firestore as source of truth**: For coins, rewards, and user profiles
- **Profile in memory**: UserProfile object kept in App.tsx state
- **Firebase Auth state**: Single observer in App.tsx useEffect
- **Real-time subscriptions**: Firestore onSnapshot for live coin balance updates

#### 2. Navigation System
- **Type-safe screen enum**: `Screen = 'WELCOME' | 'DASHBOARD' | ...`
- **Callback-based**: `navigate(screen: Screen)` passed down as prop
- **Centralized routing**: All navigation logic in App.tsx `renderScreen()`
- **No React Navigation**: Simple state-based routing for flat screen hierarchy

#### 3. Data Flow Pattern
```
User Action → Screen Component → Service Call (async) → Update State → Re-render
                                      ↓
                                 Cache to AsyncStorage (await)
```

#### 4. Insight Generation Flow
```
Dashboard Load
    ↓
Check AsyncStorage Cache (by uid + date + locale) — await
    ↓
Cache Hit? → Display Immediately
    ↓ No
Try AI Generation (OpenAI API)
    ↓
Success? → Cache (await) + Display
    ↓ No
Fallback to Deterministic Logic → Cache (await) + Display
```

## Component Patterns

### Screen Component Props
All screens follow consistent prop patterns:
- **Welcome**: `{ onContinue: () => void }`
- **SignIn**: `{ onBack: () => void }`
- **LanguageSelect**: `{ onSelect: (lang: Locale) => void }`
- **Onboarding**: `{ uid: string, initialName: string, onComplete: (profile: UserProfile) => void, onBack: () => void }`
- **Dashboard**: `{ profile: UserProfile, navigate: (screen: Screen) => void }`
- **Calendar**: `{ profile: UserProfile | null, navigate: (screen: Screen) => void }`
- **Tarot**: `{ profile: UserProfile, navigate: (screen: Screen) => void }`
- **Profile**: `{ profile: UserProfile, onLogout: () => void, navigate: (screen: Screen) => void, onProfileUpdate: (profile: UserProfile) => void }`
- **Premium**: `{ profile: UserProfile | null, onClose: () => void }`
- **Compare**: `{ profile: UserProfile, navigate: (screen: Screen) => void }`

### Component Props
- **CoinDisplay**: `{ coins: number, onClick?: () => void, size?: 'sm' | 'md' }`
- **Navigation**: `{ activeScreen: Screen, navigate: (screen: Screen) => void, isPremium?: boolean }`
- **RewardedAdModal**: `{ isOpen: boolean, onClose: () => void, onCoinUpdate: (balance: CoinBalance) => void, rewardCountToday: number }`
- **Icon**: `{ name: string, size?: number, color?: string }`

### Tarot Spread Pattern
All card-based tarot spreads follow the same architecture:
1. **2-stage flow**: SETUP (user input) → READING (cards + interpretations)
2. **Sequential card flip**: Each card flipped one at a time, per-card GPT call immediately after flip
3. **Animated flip**: `Animated.timing` for opacity crossfade (back→front), haptic feedback
4. **3D card preview**: Tapping revealed card opens fullscreen Modal with `Animated.spring` scale + `Animated.timing` rotateY
5. **Final integration**: After all 3 cards revealed, one closing GPT message tying everything together
6. **Same-day cache**: Reading saved to AsyncStorage with date key, restored on revisit
7. **Daily limit**: Each spread usable once per day, tracked via `getTodaySpreadStatus()`
8. **Coin gating**: 10 coins per spread (free for premium users)
9. **GPT tone**: Fortune-teller voice — warm, direct, sometimes blunt, natural speech

**Implemented spreads**: PPF (PastPresentFuture.tsx), YTE (YouThemEnergy.tsx)
**Remaining spreads**: Love Reading, Career & Money, Shadow Energy, Let Fate Choose

### RN Component Mapping (from Web)
| Web | React Native |
|-----|-------------|
| `div` | `View` |
| `p`, `span`, `h1` | `Text` |
| `button` | `Pressable` |
| `input` | `TextInput` |
| `select` | `Picker` (@react-native-picker/picker) |
| `img` | `Image` |
| `onClick` | `onPress` |
| `className` | `style` (StyleSheet) or `className` (NativeWind) |

### Service Separation
- **geminiService.ts**: All AI interactions (OpenAI API via Constants.expoConfig.extra)
- **firebase.ts**: Auth + Firestore configuration
- **storage.ts**: AsyncStorage CRUD operations + Firebase profile sync (ALL async)
- **coinService.ts**: Coin balance management (Cloud Functions + Firestore fallback + real-time subscription)
- **admobAppOpen.ts**: App open ad with 10s min interval, 5s load timeout
- **admobRewarded.ts**: Rewarded ad with earned_reward callback
- **astrology.ts**: Pure calculation functions (no async)

### Error Handling
- **Graceful degradation**: Always show something useful
- **Fallback insights**: Deterministic calculations when AI fails
- **Cloud Function fallback**: Direct Firestore writes when functions not deployed
- **Loading states**: ActivityIndicator / custom animations during async operations
- **AdMob fallback**: TestIds in `__DEV__` mode

## Critical Implementation Paths

### Authentication (Expo)
1. User taps "Continue with Google" → `expo-auth-session` Google prompt
2. Receives `id_token` → `signInWithCredential(auth, GoogleAuthProvider.credential(id_token))`
3. Auth observer fires → checks existing profile (AsyncStorage + Firestore)
4. If no profile → navigate to language selection → onboarding
5. If profile exists → navigate to dashboard
6. **Requires**: Google OAuth client ID in `app.config.ts` extra section

### Insight Generation
1. Dashboard mounts → `fetchInsights()` called
2. Check cache: `await storage.getDailyCache(uid, date, locale)` (AsyncStorage)
3. If fresh → display immediately
4. If stale/missing → call `generateDailyInsight(profile, date)`
5. Parse JSON response with structured fields
6. `await` cache result → display

### AdMob Flow
```
App Open Ad:
  App.tsx → first Dashboard visit (free user) → showAppOpenAd(isPremium)
    → AppOpenAd.createForAdRequest(adUnitId) → load → show
    → 10s min interval between shows, 5s load timeout

Rewarded Ad:
  RewardedAdModal → user taps "Watch Ad"
    → showRewardedAd({onSuccess, onFail})
    → RewardedAd.createForAdRequest(adUnitId) → load → show
    → earned_reward event → onSuccess() → coinService.addRewardCoin()
```

### Zodiac Calculation
- **Western**: Based on birth month/day (12 sun signs)
- **Chinese**: Based on birth year (12-year cycle, 10-year element cycle)
- Computed once during onboarding, stored in profile

## Design System

### Color Palette (styles/theme.ts)
- Background: `#0a0202` (deep space black)
- Primary: `#8e0505` (deep red)
- Accent Gold: `#f3c623` (celestial gold)
- Text: White with opacity variations
- Glass: `rgba(255,255,255,0.05)` background + border

### Component Styles
- **Glass panels**: `glassPanel` style in theme.ts (backgroundColor, borderWidth, borderRadius)
- **Rounded corners**: Large radius (16-24px)
- **LinearGradient**: expo-linear-gradient for cosmic backgrounds
- **Animated API**: Card flips (Tarot), simple fade/scale transitions

### Typography
- System fonts (no custom font loading)
- Bold/semibold for headers
- Regular for body text

## State Persistence Strategy
- **UserProfile**: Full object in AsyncStorage as JSON + Firestore sync
- **Insights Cache**: Separate AsyncStorage keys per uid/date/locale
- **Coin Balance**: Firestore is source of truth, real-time onSnapshot subscription
- **Language**: Independent AsyncStorage setting, survives logout
- **Daily Unlock State**: AsyncStorage with date-keyed auto-reset
- **Tarot History**: Last 50 readings in AsyncStorage
- **Cache expiration**: Based on date change, not time duration

## Coin System Architecture
```
User taps "Watch Ad" → RewardedAdModal
  → showRewardedAd() [REAL AdMob via react-native-google-mobile-ads]
    → earned_reward event fires
  → coinService.addRewardCoin(uid)
    → httpsCallable('addRewardCoin') [Cloud Function]
      → Firestore transaction: validate limit + credit coin
    → OR fallback: direct Firestore write (dev mode)
  → onSnapshot fires → CoinBalance state updated → UI re-renders
```
- Daily limit: 3 coins/day, enforced server-side using UTC date
- Firestore security rules block direct client writes to coins/reward fields
- Three Cloud Functions: addRewardCoin, spendCoins, getCoinBalance
- Ad IDs centralized in `config/admob.ts` with dev/prod separation
