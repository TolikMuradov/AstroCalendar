# Active Context

## Current State
The project is **functional and deployed**, with all core features implemented. The app is live and accessible through AI Studio.

## Recent Changes
Based on the codebase review:
- Switched from Gemini API to OpenAI GPT-4o-mini for better reliability
- Implemented comprehensive fallback system for offline/error scenarios
- Enhanced glassmorphic UI with cosmic theme elements
- Added navigation component with smooth transitions
- Implemented monthly calendar with 1 AI request/month paradigm
- Implemented caching strategy to minimize API calls
- Turkish localization completed
- **Thai language fully integrated** (trilingual support complete - critical for user base)
- **Profile editing system** added (name + birth date editing with validation)
- **Dashboard enhanced** with user age, complete zodiac information display
- **Dark mode improvements** for form inputs and dropdowns

## Current Focus
The project is in **user experience enhancement phase**. Thai language integration complete, now focusing on profile management features. Users can now edit their name and birth date with proper validation, and Dashboard displays comprehensive zodiac information including user age.

## Active Decisions & Considerations

### Profile Management
- **Editable fields**: Name, birth date (day/month/year separately)
- **Age constraints**: Users must be 13-110 years old (validated on input)
- **Year range**: Dynamically calculated based on current year (2026):
  - Min: 1916 (110 years old)
  - Max: 2013 (13 years old)
- **Date validation**: Days adjust based on selected month (e.g., Feb shows 28/29)
- **Persistence**: Changes saved to localStorage + Firestore immediately
- **Zodiac recalculation**: Profile recomputes Western/Chinese zodiac on date change

### API Strategy
- Using OpenAI's `gpt-4o-mini` model for cost-effectiveness
- JSON mode ensures structured, parseable responses
- Fallback to deterministic calculations maintains 100% uptime
- Variable name `GEMINI_API_KEY` is legacy but functional

### Caching Approach
- Daily insights cached by: `uid + date + locale`
- Yearly insights cached by: `uid + year + locale`
- Cache invalidation: Automatic at date transition
- No expiration within same day (intentional for cost savings)

### UI/UX Priorities
- Mobile-first: max-width 480px container
- Dark cosmic theme with purple/gold accents
- Glassmorphism: backdrop-blur + semi-transparent panels
- Smooth animations for engagement
- Element-based color theming (Fire/Earth/Air/Water)

### Authentication Flow
- Google OAuth via Firebase (simplest onboarding)
- Profile completion required after first sign-in
- Language selection before birth data collection
- Persistent sessions with auth state observer

## Next Steps (Potential Enhancements)

### Immediate Opportunities
1. **Premium Features**: Currently just a placeholder screen
2. **Push Notifications**: Daily ritual reminders
3. **Social Sharing**: Share insights or compatibility results
4. **Language Expansion**: System extensible - Thai currently supports ~60% of user base, system ready for additional languages

### Technical Debt
- Comment says "Gemini API" but uses OpenAI (rename for clarity)
- Firebase config exposed in code (consider env variables)
- No error tracking/analytics integration
- Could memoize Thai date/locale computations in Calendar for optimization

### Performance Optimizations
- Consider service worker for true PWA offline support
- Lazy load screens for faster initial load
- Optimize bundle size (currently using full React/Firebase)
- Image optimization for cosmic backgrounds

## Thai Language Implementation Details

### What Was Done
Thai (ไทย) is now fully integrated as the third language. Integration includes:

**Type System**: Updated `Locale` type to `'en' | 'tr' | 'th'` in types.ts

**UI Translations**: 20+ strings translated to Thai in i18n/translations.ts:
- Core labels: welcome, dashboard, dailyInsight, yearlyInsight, profile, etc.
- UI actions: generate, retry, logout, sync, harmony
- Error messages and fallback notices
- Format: Thai Unicode characters properly encoded

**AI Service**: All 4 insight generation functions support Thai:
- `generateDailyInsight()`: Detects Thai locale and sends "Thai" language to prompt
- `generateYearlyInsight()`: Thai theme, strengths, challenges, recommendations
- `getPartnerComparison()`: Thai language detection for compatibility analysis
- `generateMonthlyInsight()`: Uses `th-TH` date locale code + Thai prompts

**Calendar Screen**: Complete Thai localization:
- 8 day type labels in Thai (Cleansing = ทำความสะอาด, Manifestation = สิ่งที่ปรารถนา, etc.)
- Thai weekday abbreviations: [อา, จ, อ, พ, พฤ, ศ, ส]
- All UI labels: affirmation, stone, activity, drink, color, weekend tip

**Language Selection**: LanguageSelect.tsx shows 🇹🇭 ไทย (Thai) button that sets `profile.locale = 'th'`

**Fallback Insights**: getElementTrait() and getFallbackDailyInsight/Yearly support Thai

### Why Thai is Critical
User demographics: ~60% of projected user base speaks Thai. Thai integration was stated as essential by project stakeholder ("cok onemli" - very important). System is now ready for Thai user adoption at launch.

## Profile Editing Implementation Details

### What Was Added
Complete profile editing system in Profile screen with toggle between view/edit modes.

**Editable Fields:**
- **Name**: Text input with real-time validation (cannot be empty)
- **Birth Date**: Separate dropdowns for Day/Month/Year (GÜN AY YIL format)

**Day Selector:**
- Dynamically adjusts based on selected month
- February shows 28 or 29 days (leap year aware)
- Months with 31 days show all 31 options
- Prevents invalid dates (e.g., Feb 31)

**Month Selector:**
- 12 months (01-12)
- Zero-padded display (01, 02, ... 12)

**Year Selector:**
- Range: Current year - 110 to Current year - 13
- Example (2026): Shows years 1916 through 2013
- Scrollable dropdown with all valid years
- Default: User's current birth year

**Validation:**
- Name cannot be empty (alert shown)
- Date cannot be in future (alert shown)
- Age must be 13-110 years (alert shown)
- Invalid dates rejected (e.g., 2023-02-30)

**Dark Mode Styling:**
- Dropdowns use `colorScheme: 'dark'` for native browser controls
- Option elements styled with `bg-background-dark` and `text-white`
- Select boxes use `bg-white/10` with white text
- Fixes contrast issue where white-on-white was unreadable

**Save Flow:**
1. User clicks Edit button (toggle to edit mode)
2. Modifies name/date fields
3. Clicks Check button (save icon)
4. Validates all fields
5. Calls `computeProfile(newBirthDate)` to recalculate zodiac
6. Saves to `storage.saveProfile()` + `storage.saveProfileToFirebase()`
7. Triggers `onProfileUpdate()` callback in App.tsx
8. Returns to profile view mode

**Cancel Flow:**
- Cancel button reverts all fields to original values
- No save triggered
- Returns to profile view mode

### Dashboard Enhancements

**User Age Display:**
- Calculated dynamically from birth date
- Formula: `currentYear - birthYear` with month/day adjustment
- Displayed as badge at top: "Age 25"
- Gold accent styling (`bg-accent-gold/20`)

**Western Zodiac Section:**
- Shows zodiac symbol (♈, ♉, etc.)
- Sign name (Aries, Taurus, etc.)
- Element (Fire, Earth, Air, Water)
- Element trait in user's language (Vitality/Denge/ชีวิตชีวา)

**Chinese Zodiac Section:**
- Shows animal emoji (🐉, 🐀, etc.)
- Animal name (Dragon, Rat, etc.)
- Element (Metal, Water, Wood, Fire, Earth)
- Yin/Yang indicator (balanced duality)

**Layout Changes:**
- Side-by-side grid layout (Western on left, Chinese on right)
- Age badge above zodiac sections
- Element trait shown below Western/Chinese grid
- Energy score circle positioned below zodiac info

**Why This Matters:**
- Users can correct onboarding mistakes without re-registering
- Name changes for users who prefer nicknames
- Birth date corrections recalculate entire astrological profile
- Dashboard provides complete identity overview at a glance

### Pattern: Language Extensibility
Adding future languages follows proven pattern:
1. Update Locale type union: `'en' | 'tr' | 'th' | 'newlang'`
2. Add translations object with all ~20 UI strings
3. Update langName ternaries: `profile.locale === 'newlang' ? 'Language' : ...`
4. (Optional) Update date locale codes if needed: `newlang-REGION` format
5. Add language button to LanguageSelect.tsx

## Important Patterns

### Error Handling Philosophy
**Never fail completely** - Always provide value to the user:
- API error? → Use deterministic fallback
- No network? → Show cached data or computed insights
- Invalid data? → Use sensible defaults

### State Management Pattern
Single source of truth in `App.tsx`:
- `currentScreen`: Which view to render
- `userProfile`: Complete user data
- `tempUser`: Firebase auth state before onboarding complete
- `initialized`: Prevent flicker during auth check

### Translation Pattern
```typescript
const t = translations[locale] || translations.en;
// Use: t.welcome, t.dashboard, etc.
```
Fallback to English ensures no missing strings.

## Key Learnings

### What Works Well
1. **Fallback system**: Users never see errors, just different "modes"
2. **Minimal dependencies**: Faster builds, fewer breaking changes
3. **Type safety**: TypeScript interfaces catch bugs early
4. **Caching**: Dramatically reduces API costs
5. **Trilingual**: Proper i18n opens Turkish and Thai markets

### Design Insights
- Mystical terminology ("Soul Sync", "Celestial Core") increases engagement
- Visual status indicators ("AI Active" vs "Omni Engine") build trust
- Large touch targets and rounded corners feel premium on mobile
- Element-based theming creates personalization without complexity

### Project Philosophy
This app prioritizes **reliability and user experience** over technical complexity. Simple architectures, graceful degradation, and thoughtful caching create a smooth, professional product without requiring elaborate infrastructure.
