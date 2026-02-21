# Project Brief: AstroCalendar

## Project Overview
AstroCalendar is a mystical astrology application that provides personalized daily and yearly insights based on Western and Chinese zodiac systems. Built as a **native mobile app with Expo and React Native**, it combines astrological calculations with AI-generated personalized guidance and monetizes via Google AdMob rewarded ads and premium subscriptions.

## Core Requirements

### Platform
- **Expo SDK 52** + React Native native app (Android + iOS)
- TypeScript for type safety
- NativeWind v2 for styling (Tailwind CSS on React Native)
- Google AdMob for ad monetization (react-native-google-mobile-ads)

### User Experience
- Mobile-native app optimized for phone screens
- Dark theme with cosmic/mystical aesthetic
- Trilingual support: English (en), Turkish (tr), and Thai (th)
- Smooth native animations (Animated API) and glassmorphic UI design

### Key Features
1. **User Authentication**
   - Firebase Google OAuth via expo-auth-session
   - Profile creation with birth date, time, and location
   - Persistent user sessions (AsyncStorage + Firestore)

2. **Astrological Calculations**
   - Western Zodiac (12 signs, 4 elements)
   - Chinese Zodiac (12 animals, 5 elements, Yin/Yang)
   - Computed profiles based on birth data

3. **AI-Powered Insights**
   - Daily personalized insights (energy score, lucky numbers, colors, rituals)
   - Yearly forecasts (themes, strengths, challenges, recommendations)
   - Partner compatibility analysis
   - Tarot card readings with AI interpretation
   - Powered by OpenAI GPT-4o-mini with fallback to deterministic insights

4. **Monetization**
   - Google AdMob rewarded ads (earn coins to unlock features)
   - App open ads for free users
   - Premium subscription ($1.99/month) for full access
   - Coin economy: earn via ads, spend on lucky number unlocks and tarot readings

5. **Core Screens**
   - Welcome/Sign-In/Language selection flow
   - Onboarding (birth data collection)
   - Dashboard (main hub with daily insights, coin system)
   - Calendar (monthly spiritual calendar — premium only)
   - Tarot (78-card readings — coin-gated for free users)
   - Profile management
   - Premium upgrade screen
   - Compatibility comparison (premium only)

## Goals
- Provide engaging, personalized cosmic guidance
- Maintain high reliability with fallback mechanisms
- Create an immersive mystical user experience
- Support both casual exploration and daily engagement
- Generate revenue via AdMob and premium subscriptions

## Constraints
- Must work offline with deterministic fallbacks
- API rate limits handled gracefully
- All storage async (AsyncStorage, no localStorage)
- Requires native build (`npx expo prebuild`) for AdMob
- Firebase Cloud Functions for server-side coin validation
