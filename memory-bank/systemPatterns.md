# System Patterns

## Architecture Overview

### Application Structure
```
App.tsx (Root)
├── Screen Router (state-based navigation)
├── Auth Observer (Firebase)
├── Profile Manager (localStorage)
└── Screen Components
    ├── Welcome/SignIn/LanguageSelect (entry flow)
    ├── Onboarding (data collection)
    └── Dashboard/Calendar/Profile/Compare/Premium (main app)
```

### Key Technical Decisions

#### 1. State Management
- **No external state library**: React hooks (useState, useEffect) sufficient for app size
- **LocalStorage as cache**: Primary data persistence layer
- **Profile in memory**: UserProfile object kept in App.tsx state
- **Firebase Auth state**: Single observer in App.tsx useEffect

#### 2. Navigation System
- **Type-safe screen enum**: `Screen = 'WELCOME' | 'DASHBOARD' | ...`
- **Callback-based**: `navigate(screen: Screen)` passed down as prop
- **Centralized routing**: All navigation logic in App.tsx `renderScreen()`
- **No React Router**: Simpler for single-page mobile app

#### 3. Data Flow Pattern
```
User Action → Screen Component → Service Call → Update State → Re-render
                                      ↓
                                 Cache to Storage
```

#### 4. Insight Generation Flow
```
Dashboard Load
    ↓
Check LocalStorage Cache (by uid + date + locale)
    ↓
Cache Hit? → Display Immediately
    ↓ No
Try AI Generation (OpenAI API)
    ↓
Success? → Cache + Display
    ↓ No
Fallback to Deterministic Logic → Cache + Display
```

## Component Patterns

### Screen Components
- Accept `profile`, `navigate`, and specific props
- Self-contained logic and state
- Use translations via `translations[locale]`
- Consistent glassmorphic design system

### Service Separation
- **geminiService.ts**: All AI interactions (OpenAI API)
- **firebase.ts**: Auth configuration only
- **storage.ts**: LocalStorage CRUD operations
- **astrology.ts**: Pure calculation functions

### Error Handling
- **Graceful degradation**: Always show something useful
- **Fallback insights**: Deterministic calculations when AI fails
- **Loading states**: Skeleton/spinner during async operations
- **Offline indicators**: Show "Omni Engine" vs "AI Active" status

## Critical Implementation Paths

### Authentication
1. User clicks "Continue with Google" → `signInWithPopup(googleProvider)`
2. Auth observer fires → checks existing profile
3. If no profile → navigate to language selection → onboarding
4. If profile exists → navigate to dashboard

### Insight Generation
1. Dashboard mounts → `fetchInsights()` called
2. Check cache: `storage.getDailyCache(uid, date, locale)`
3. If fresh → display immediately
4. If stale/missing → call `generateDailyInsight(profile, date)`
5. Parse JSON response with structured fields
6. Cache result → display

### Zodiac Calculation
- **Western**: Based on birth month/day (12 sun signs)
- **Chinese**: Based on birth year (12-year cycle, 10-year element cycle)
- Computed once during onboarding, stored in profile

## Design System

### Color Palette
- Background: `#0A0118` (deep space black)
- Primary: `#8A2BE2` (mystical purple)
- Accent Gold: `#F3C623` (celestial gold)
- Text: White with opacity variations

### Component Styles
- **Glass panels**: `backdrop-blur-md` + `bg-white/5` + subtle borders
- **Rounded corners**: Large radius (28-40px) for modern feel
- **Shadows**: Layered for depth (`shadow-2xl`, `ring-white/5`)
- **Animations**: `animate-fade-in`, `animate-float`, custom CSS

### Typography
- **Headers**: Serif, italic for mystical tone
- **Body**: Sans-serif, various weights
- **Labels**: Uppercase, ultra-wide tracking for tech feel

## State Persistence Strategy
- **UserProfile**: Full object in localStorage as JSON
- **Insights Cache**: Separate keys per uid/date/locale
- **Language**: Independent setting, survives logout
- **Cache expiration**: Based on date change, not time duration
