# Project Brief: AstroCalendar

## Project Overview
AstroCalendar is a mystical astrology application that provides personalized daily and yearly insights based on Western and Chinese zodiac systems. Built as a modern web application with React and TypeScript, it combines astrological calculations with AI-generated personalized guidance.

## Core Requirements

### User Experience
- Mobile-first Progressive Web App (PWA) optimized for phone screens
- Maximum width: 480px (mobile-optimized viewport)
- Dark theme with cosmic/mystical aesthetic
- Trilingual support: English (en), Turkish (tr), and Thai (th)
- Smooth animations and glassmorphic UI design

### Key Features
1. **User Authentication**
   - Firebase Google Auth integration
   - Profile creation with birth date, time, and location
   - Persistent user sessions

2. **Astrological Calculations**
   - Western Zodiac (12 signs, 4 elements)
   - Chinese Zodiac (12 animals, 5 elements, Yin/Yang)
   - Computed profiles based on birth data

3. **AI-Powered Insights**
   - Daily personalized insights (energy score, lucky numbers, colors, rituals)
   - Yearly forecasts (themes, strengths, challenges, recommendations)
   - Partner compatibility analysis
   - Powered by OpenAI GPT-4o-mini with fallback to deterministic insights

4. **Core Screens**
   - Welcome/Sign-In flow
   - Language selection
   - Onboarding (birth data collection)
   - Dashboard (main hub with daily insights)
   - Calendar (browsing historical/future insights)
   - Profile management
   - Premium features
   - Compatibility comparison

## Goals
- Provide engaging, personalized cosmic guidance
- Maintain high reliability with fallback mechanisms
- Create an immersive mystical user experience
- Support both casual exploration and daily engagement

## Constraints
- Must work offline with deterministic fallbacks
- API rate limits handled gracefully
- Mobile-first, single-column layout
- LocalStorage for caching and persistence
