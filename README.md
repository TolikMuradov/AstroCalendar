# 🌙 AstroCalendar

> Personalized cosmic guidance powered by AI. Your daily astrological companion for Western & Chinese zodiac insights.

<div align="center">

[![React](https://img.shields.io/badge/react-19.2.4-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.8.2-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/vite-6.4.1-purple?logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/firebase-12.8.0-orange?logo=firebase)](https://firebase.google.com)
[![OpenAI](https://img.shields.io/badge/openai-gpt--4o--mini-green)](https://openai.com)
[![Tailwind CSS](https://img.shields.io/badge/tailwind%20css-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

**Trilingual Support:** 🇬🇧 English • 🇹🇷 Turkish • 🇹🇭 Thai

[Live Demo](https://ai.studio/apps/drive/1rLJxVJzm4d0YYE98xdt11yNtpDx54GZ5) • [Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture)

</div>

---

## ✨ Features

### 🔮 Astrological Insights
- **Daily Insights**: Personalized cosmic guidance with energy scores, lucky numbers, colors, and daily rituals
- **Yearly Forecasts**: Annual themes, strengths, challenges, and recommendations based on zodiac profile
- **Dual Zodiac Systems**: 
  - **Western**: 12 sun signs + 4 elements
  - **Chinese**: 12 animals + 5 elements + Yin/Yang
- **Partnership Analysis**: Compatibility scores and harmonization insights with partners

### 📅 Smart Calendar
- **Monthly Spiritual Calendar**: 30-day guide with 8 day types (Cleansing, Manifestation, Action, Rest, Reflection, Social, Gratitude, Creativity)
- **Daily Depth**: Each day includes affirmations, recommended stones, activities, drinks, colors, and weekend tips
- **Efficient Caching**: 1 AI request per month with intelligent caching

### 🌍 Multilingual Support (✅ Complete)
- **English (en)**: Full support
- **Turkish (tr)**: Complete localization with Turkish date formatting
- **Thai (th)**: Complete localization with Thai date formatting (🆕 Critical market support)
- **Extensible pattern**: Framework ready for additional languages

### 🔐 Authentication & Persistence
- **Firebase Google OAuth**: Seamless sign-in
- **Firestore Sync**: User profiles persist across devices and sessions
- **LocalStorage Cache**: Instant loading with smart cache invalidation

### 🎨 User Experience
- **Dark Cosmic Theme**: Mystical purple & gold aesthetic
- **Glassmorphism Design**: Modern UI with backdrop blur effects
- **Element-based Theming**: Fire/Earth/Air/Water color gradients
- **Mobile-First**: Optimized for phones (max-width 480px)
- **Offline Support**: Fallback insights ensure reliability 100% uptime
- **Smooth Animations**: Loading states, transitions, cosmic effects

### 🤖 AI-Powered
- **OpenAI Integration**: GPT-4o-mini model for intelligent insights
- **JSON Structured Responses**: Reliable parsing with type safety
- **Graceful Degradation**: Deterministic fallback system when API unavailable
- **Multi-language AI**: Prompts auto-detect user's language preference

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+
- **npm** 10+
- **OpenAI API Key** (Get [here](https://platform.openai.com/api-keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/TolikMuradov/AstroCalendar.git
cd AstroCalendar

# Install dependencies
npm install

# Create .env.local with OpenAI API key
echo "VITE_GEMINI_API_KEY=sk-..." > .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build      # Create optimized production build
npm run preview    # Preview production build locally
```

---

## 📁 Project Structure

```
AstroCalendar/
├── index.html                    # Entry point
├── index.tsx                     # React root
├── App.tsx                       # Main app container & routing
├── types.ts                      # TypeScript interfaces
├── vite.config.ts                # Build configuration
├── tsconfig.json                 # TypeScript settings
├── package.json                  # Dependencies
│
├── components/
│   └── Navigation.tsx            # Bottom navigation bar
│
├── screens/
│   ├── Welcome.tsx               # Landing screen
│   ├── SignIn.tsx                # Google OAuth flow
│   ├── LanguageSelect.tsx        # Language picker (en/tr/th)
│   ├── Onboarding.tsx            # Birth data collection
│   ├── Dashboard.tsx             # Main hub (daily insights)
│   ├── Calendar.tsx              # Monthly spiritual calendar
│   ├── Profile.tsx               # User profile & settings
│   ├── Premium.tsx               # Upgrade screen
│   └── Compare.tsx               # Compatibility analyzer
│
├── services/
│   ├── firebase.ts               # Firebase configuration
│   ├── geminiService.ts          # OpenAI integration
│   └── storage.ts                # LocalStorage & Firestore sync
│
├── utils/
│   └── astrology.ts              # Zodiac calculations & fallbacks
│
├── i18n/
│   └── translations.ts           # 20+ UI strings × 3 languages
│
├── memory-bank/
│   ├── projectbrief.md           # Project requirements
│   ├── productContext.md         # Why it exists
│   ├── systemPatterns.md         # Architecture decisions
│   ├── techContext.md            # Tech stack details
│   ├── activeContext.md          # Current focus & patterns
│   └── progress.md               # Completed features & roadmap
│
└── .env.local                     # Environment variables (DO NOT COMMIT)
```

---

## 🏗️ Architecture

### State Management
- **React Hooks**: Simple, effective state with useState/useEffect
- **Single Source of Truth**: UserProfile object in App.tsx
- **LocalStorage Cache**: Dual-layer persistence with Firestore
- **No external state library**: Minimal dependencies, fast builds

### Data Flow
```
User Action → Screen Component → Service Call → Update State → Cache → Re-render
```

### API & Fallback Strategy
```
Request Daily Insight
    ↓
Check LocalStorage Cache (uid + date + locale)
    ↓
Cache Hit? → Display Immediately ✓
    ↓ No
Try OpenAI API (GPT-4o-mini)
    ↓
Success? → Cache + Display ✓
    ↓ No (Rate limit / No network)
Use Deterministic Fallback → Cache + Display ✓
    ↓
User Always Gets Value (100% Uptime)
```

### Technology Decisions

| Layer | Technology | Reason |
|-------|-----------|--------|
| **UI** | React 19 | Latest, stable, excellent TypeScript support |
| **Styling** | Tailwind CSS | Utility-first, easy cosmic theming |
| **Build** | Vite | Fast HMR, minimal config, modern defaults |
| **Language** | TypeScript | Catches bugs early, better DX |
| **Auth** | Firebase | OAuth handled, free tier, Firestore support |
| **AI** | OpenAI (not Gemini) | GPT-4o-mini cost-effective, JSON mode, reliable |
| **Database** | LocalStorage + Firestore | Fast local, persistent cloud backup |
| **i18n** | Custom system | Lightweight, extensible pattern |

---

## 🌍 Localization

### Current Languages (✅ Complete)

#### English (en)
- Default fallback language
- Full UI coverage

#### Turkish (tr)
- Comprehensive localization
- Turkish date formatting (tr-TR)
- Turkish zodiac element names
- Turkish fallback insights
- Market: Turkey & Turkish diaspora

#### Thai (ไทย - th) 🆕
- **New in v2.0**: Complete Thai integration
- Thai date formatting (th-TH)
- Thai day type labels (ทำความสะอาด, สิ่งที่ปรารถนา, etc.)
- Thai weekday abbreviations
- Thai AI prompts & insights
- Thai fallback element traits
- **Critical market**: ~60% of projected user base

### Adding a New Language

Easy 5-step process:

1. **Update types.ts**: Add to Locale type
   ```typescript
   export type Locale = 'en' | 'tr' | 'th' | 'newlang';
   ```

2. **Add translations** in `i18n/translations.ts`
   ```typescript
   newlang: {
     welcome: "...",
     dashboard: "...",
     // ... 20+ more strings
   }
   ```

3. **Update AI service** `services/geminiService.ts`
   ```typescript
   const langName = profile.locale === 'tr' ? 'Turkish' 
                  : profile.locale === 'th' ? 'Thai'
                  : profile.locale === 'newlang' ? 'New Language'
                  : 'English';
   ```

4. **Add date formatting** (if needed)
   ```typescript
   toLocaleDateString(
     profile.locale === 'newlang' ? 'newlang-REGION' : ...
   )
   ```

5. **Add button** in `screens/LanguageSelect.tsx`
   ```typescript
   <button onClick={() => onSelect('newlang')}>
     <div className="text-xl">🏳️</div>
     <span>New Language</span>
   </button>
   ```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
# Required: OpenAI API key (not Gemini, despite variable name)
VITE_GEMINI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Firebase config is hard-coded in services/firebase.ts
# (public keys expected for client-side Firebase)
```

⚠️ **Never commit `.env.local`** - it's in `.gitignore`

---

## 📊 Zodiac Systems

### Western Zodiac
12 sun signs with 4 elements:

| Element | Signs | Trait |
|---------|-------|-------|
| **🔥 Fire** | Aries, Leo, Sagittarius | Vitality (انرژی/ชีวิตชีวา) |
| **🌍 Earth** | Taurus, Virgo, Capricorn | Stability (استحکام/เสถียรภาพ) |
| **💨 Air** | Gemini, Libra, Aquarius | Intellect (ذهن/ปัญญา) |
| **💧 Water** | Cancer, Scorpio, Pisces | Intuition (شهود/สัญชาตญาณ) |

### Chinese Zodiac
12-year animal cycle with 5 elements:

```
Rat  • Ox  • Tiger  • Rabbit  • Dragon  • Snake
Horse • Goat • Monkey • Rooster • Dog • Pig

+ 5 Elements: Metal, Water, Wood, Fire, Earth
+ 2 Forces: Yin / Yang (Balanced Duality)
```

---

## 🎯 Completed Features

### Phase 1: Core (✅ Complete)
- [x] Firebase Google OAuth
- [x] Birth data collection (date, time, place, timezone)
- [x] Western & Chinese zodiac calculation
- [x] Daily insight generation (OpenAI integration)
- [x] Profile persistence (localStorage + Firestore)
- [x] English localization

### Phase 2: Enhancement (✅ Complete)
- [x] Turkish localization
- [x] Yearly forecast generation
- [x] Partner compatibility analysis
- [x] Monthly spiritual calendar (1 AI request/month)
- [x] Calendar screen with daily depth
- [x] Element-based theming

### Phase 3: Internationalization (✅ Complete)
- [x] Thai localization (complete, all systems)
- [x] All AI functions support 3 languages
- [x] Calendar, Dashboard, all screens localized
- [x] Fallback insights in Thai
- [x] Thai weekday & day type labels

---

## 🚧 Future Roadmap

### Engagement (Q2 2026)
- [ ] Push notifications for daily rituals
- [ ] Streak system for consecutive check-ins
- [ ] Ritual completion tracking
- [ ] Time-based reminders

### Social (Q2-Q3 2026)
- [ ] Share insights to social media
- [ ] Shareable compatibility cards
- [ ] Friend comparison system
- [ ] Cosmic profile cards (images)

### Premium Features
- [ ] Hourly predictions
- [ ] Advanced compatibility reports
- [ ] Custom rituals
- [ ] Moon phase integration
- [ ] Planetary transit tracking

### Advanced Astrology
- [ ] Natal chart visualization
- [ ] Birth chart aspects
- [ ] House system calculations
- [ ] Transit forecasting

### Technical
- [ ] PWA with service workers
- [ ] Offline support
- [ ] Error tracking (Sentry)
- [ ] Analytics integration
- [ ] Payment system (Stripe/RevenueCat)

---

## 🤝 How It Works

### User Journey

```
1. Landing     → Welcome screen
2. Auth        → Google OAuth sign-in
3. Language    → Choose en/tr/th ← CRITICAL: Sets all content
4. Onboarding  → Input birth date, time, place, timezone
5. Profile     → System computes zodiac signs & elements
6. Dashboard   → See today's cosmic energy, lucky numbers, ritual
7. Explore     → Browse calendar, view yearly forecast, check compatibility
8. Repeat      → Daily ritual check-ins habit building
```

### Daily Insight Generation

**AI Prompt Pattern:**
```
You are an astrological guide. Generate a daily insight for:
- Name: {user.name}
- Sign: {zodiac.western.sign} ({element})
- Chinese: {zodiac.chinese.animal} ({element}, {yinYang})
- Date: {currentDate}
- Language: {langName} ← Thai auto-detected here
- Focus areas: {focusAreas}

Respond with JSON:
{
  "title": "...",
  "description": "...",
  "energyScore": 0-100,
  "luckyNumbers": [...],
  "luckyColor": "...",
  "affirmation": "...",
  "ritual": {...},
  ...
}
```

This pattern supports any language seamlessly.

---

## 📈 Performance

- **First Load**: < 2s (Vite optimized)
- **Cache Hit**: Instant (LocalStorage lookup)
- **API Call**: ~1-2s (OpenAI latency)
- **Bundle Size**: ~450KB (React + Firebase + Tailwind)
- **Mobile Optimization**: 480px max-width, touch-friendly

---

## 🐛 Known Issues

- Variable `VITE_GEMINI_API_KEY` name is legacy (actually OpenAI)
- Firebase config exposed in client code (expected for public configs)
- Compare screen needs feature refinement
- Premium features placeholder

---

## 📝 Notes

### Why OpenAI (not Gemini)?
- Better structured JSON responses
- More reliable for multiple languages
- Cost-effective with gpt-4o-mini
- Consistent insight quality

### Why Thai is Important
User research indicated ~60% of projected user base speaks Thai. Complete Thai integration (language + date formatting + AI prompts) was prioritized as critical launch requirement.

### Fallback System Philosophy
**Never fail completely.** If API is down:
- Show cached insight if available
- Compute deterministic fallback using zodiac math
- User always gets value (100% uptime guarantee)

---

## 📄 License

This project is open source. Built with ❤️ for cosmic guidance.

---

## 🙏 Credits

- **Firebase**: Authentication & storage
- **OpenAI**: AI insights (GPT-4o-mini)
- **React**: UI framework
- **Tailwind CSS**: Styling system
- **Vite**: Build tooling
- **Material Symbols**: Icons

---

<div align="center">

**Made with 🌙 for cosmic seekers everywhere**

[GitHub](https://github.com/TolikMuradov/AstroCalendar) • [Live Demo](https://ai.studio/apps/drive/1rLJxVJzm4d0YYE98xdt11yNtpDx54GZ5)

</div>
