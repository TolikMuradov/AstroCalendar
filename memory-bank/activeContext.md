# Active Context

## Current State (Updated Feb 24, 2026 - Session 9)
The project is a fully migrated Expo/React Native app with native Android builds working. Latest work: **Love Reading (❤️)**, **Career & Money Reading (💼)**, **Shadow Energy (🌑)**, and **Deep Reflection (🕳️)** fully implemented, plus loading animations, interstitial ads on exit, lucky numbers 2+3 split, and RewardedAdModal bug fix.

## Recent Changes (Latest - Feb 24, 2026, Session 9)

### Deep Reflection System (Complete)
Premium AI-guided clarity session — NOT a tarot spread, NOT fortune-telling. Chat-style interface with the most premium animations in the app.
- **types.ts**: Added `DEEP_REFLECTION` to Screen type (now 18 values). Constants: `DEEP_REF_SESSION_COST = 25`, `DEEP_REF_ACTION_COST = 5`. New `DeepRefActionType` ('initial' | 'go_deeper' | 'reveal_card' | 'examine_role' | 'see_their_energy'), `DeepRefMessage`, `DeepRefSession` interfaces.
- **geminiService.ts**: New `callOpenAIChat()` function for multi-message conversations. 3 new functions: `generateDeepRefInitial()` (350-600 words, 4-part structure: Emotional Reflection + Pattern Observation + Hidden Assumption + Subtle Challenge), `generateDeepRefAction()` (handles go_deeper/examine_role/see_their_energy with full conversation history), `generateDeepRefCardReveal()` (weighted tarot card with 3-part grounded interpretation). System prompt enforces calm/intelligent/direct/grounded tone — no mysticism, no manipulation, no dependency creation.
- **storage.ts**: `saveDeepRefSession()` — saves closed session with full message history.
- **screens/DeepReflection.tsx**: ~700 lines. 4-stage flow (ENTRY → INPUT → CHAT → CLOSED).
  - ENTRY: Staggered reveal animations (title → line → subtitle → description → button), decorative ink lines (6 animated), ultra-dark premium design (#040408 bg)
  - INPUT: Large text area (max 1500 chars), sanitized input
  - CHAT: Chat bubble UI with TypewriterText effect (~83 chars/sec), sliding bubble entrance animations, thinking indicator with pulsating dots, horizontal action bar with 4 chips (Go Deeper / Reveal Card / Examine Role / See Their Energy — each 5 coins), CoinDeductBadge animation, auto-scroll, card badge on reveal messages, 3D card preview modal
  - CLOSED: Minimal stats display, clean exit
  - Session lifecycle: No resume, no daily limits, permanent close on end/back/60s background. AppState listener for background detection.
  - Soft limit: After 10 actions, AI suggests ending (user can continue).
  - Economy: 25 coins entry, 5 coins per action. Premium users free.
- **translations.ts**: ~18 deepRef keys added to all 7 locales
- **App.tsx**: Import + case for `DEEP_REFLECTION`
- **Tarot.tsx**: Added `deep_reflection` to tarotOptions (🕳️ icon), routes to `DEEP_REFLECTION`, cost 25 coins
- **Secret card logic update**: ShadowSession.tsx — secret card now appears face-down with pulse animation, user taps to reveal → flip → GPT interpretation → then integration
Full psychological shadow work tarot system — the most premium feature (18 coins, first session 12):
- **types.ts**: Added `SHADOW_READING` to Screen type (now 17 values). Constants: `SHADOW_FIRST_COST = 12`, `SHADOW_SESSION_COST = 18`, `SHADOW_REFLECTION_COST = 2`. New `ShadowCardData`, `ShadowSession`, `ShadowReflection` interfaces.
- **geminiService.ts**: 6 new functions — `generateShadowQuestion1()`, `generateShadowQuestion2()`, `generateShadowMainInterpretation()`, `generateShadowSecretInterpretation()`, `generateShadowIntegration()`, `generateShadowReflectionFollowup()`. Shadow mentor tone: calm, insightful, psychological. NO mysticism, NO fortune-telling.
- **storage.ts**: `getShadowSession()` / `saveShadowSession()`, `getYesterdayShadowSession()`, `getShadowReflection()` / `saveShadowReflection()`, `isShadowFirstUsed()` / `markShadowFirstUsed()`. Updated `getTodaySpreadStatus()` for shadow.
- **screens/ShadowSession.tsx**: Multi-stage flow (ENTRY → Q1 → Q2 → MAIN_CARD → INTERPRETATION → SECRET → INTEGRATION), plus reflection flow (REFLECTION_ENTRY → REFLECTION_RESULT).
  - ENTRY: Shadow moon icon, title, subtitle, dynamic pricing (first=12, subsequent=18), first-session-offer badge, yesterday reflection section
  - Q1/Q2: AI-generated psychologically probing questions (<20 words each), user answers (max 200 chars, sanitized)
  - MAIN_CARD: Weighted random draw (70% random, 30% keyword-influenced from answers), random orientation
  - INTERPRETATION: Slow card flip (900ms), GPT shadow interpretation (Shadow Archetype + Psychological Pattern + Personal Reflection, 250-320 words), intensity_score 1-10, intensity bar with color coding
  - SECRET CARD: Conditional on intensity (>=7 always, 5-6 30% chance), deeper shadow layer text (180-220 words)
  - INTEGRATION: Final shadow integration connecting answers + cards (180-220 words)
  - REFLECTION: Next-day only, 2 coins, user reflects on yesterday's pattern, GPT analyzes shifts/repetitions (180-240 words)
  - Dark minimal design (#050510 bg), floating shadow motes (15 particles), no glowing fantasy effects
  - CardLoadingOverlay + InterpretingShimmer for loading states
  - 3D card preview modal for tapping revealed cards
  - Interstitial ad on exit
  - Same-day session cache + restore
- **translations.ts**: ~35 shadow keys added to all 7 locales (en/tr/th/es/fr/de/ja)
- **App.tsx**: Import + case for `SHADOW_READING`
- **Tarot.tsx**: Routes `shadow_energy` to `SHADOW_READING`, cost 18 coins
### Love Reading Spread (Complete)
Full 3-card love tarot reading with romantic animations:
- **types.ts**: Added `LOVE_READING` to Screen type. New `LoveCardData` + `LoveReading` interfaces
- **geminiService.ts**: `generateLoveCardInterpretation()` + `generateLoveFinalIntegration()` with fortune-teller tone
- **storage.ts**: `getLoveReading()` / `saveLoveReading()`, updated `getTodaySpreadStatus()`
- **screens/LoveReading.tsx**: Floating hearts (15), sparkle burst (20 on flip), pulsing heart, love meter bar, pink/red theme, 3D preview modal
- **translations.ts**: 16 love keys added to all 7 locales
- **App.tsx + Tarot.tsx**: Wired up routing

### Career & Money Reading Spread (Complete)
Full 3-card career tarot reading with mentor tone (NOT fortune-teller):
- **types.ts**: Added `CAREER_READING` to Screen type (now 16 values). `CAREER_SPREAD_COST = 12`. New `CareerDiagnostic`, `CareerCardData`, `CareerReading` interfaces
- **geminiService.ts**: `generateCareerCardInterpretation()` + `generateCareerFinalSynthesis()` — mentor tone: calm, direct, insightful. "No exaggerated mysticism. No empty reassurance."
- **storage.ts**: `getCareerReading()` / `saveCareerReading()`, updated `getTodaySpreadStatus()` for career
- **screens/CareerReading.tsx**: 3-stage flow (SETUP → DIAGNOSTIC → READING):
  - SETUP: title, subtitle, 12-coin price chip, Start Analysis button
  - DIAGNOSTIC: 3 required tap-option questions (work situation, financial stress, internal obstacle) + 1 optional text input (worry, sanitized)
  - READING: 3 cards (Current Position 📍, Hidden Block 🔒, Opportunity Window 🚪), sequential flip with vibration, per-card GPT, progress bar, final synthesis
  - Professional blue theme (slate/blue palette), floating dots ambient, no sparkles
  - Input sanitization against prompt injection (strips tags, blocks "system", "ignore", etc.)
- **translations.ts**: ~30 career keys added to all 7 locales
- **Tarot.tsx**: Routes `career_money` to `CAREER_READING`, cost now per-spread (12 for career vs 10 for others)
- **App.tsx**: Import + case for `CAREER_READING`

### RewardedAdModal Bug Fix
- Fixed `Objects are not valid as a React child` crash — `onFail` error handling now extracts `.message` from error objects

### Zero TypeScript errors across all files
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
