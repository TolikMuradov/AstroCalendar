# Technical Context

## Technology Stack

### Core Technologies
- **React**: 19.2.4 (latest)
- **TypeScript**: 5.8.2 (strict typing with i18n support)
- **Vite**: 6.4.1 (build tool, dev server)
- **Node.js**: 20+ recommended for development

### External Services
- **Firebase**: 12.8.0
  - Authentication (Google OAuth)
  - Firestore for user profile persistence
  - Configuration in `services/firebase.ts`
- **OpenAI API**: GPT-4o-mini model
  - Used via fetch to `/v1/chat/completions`
  - JSON mode for structured responses
  - Supports three languages: English, Turkish, Thai
  - Configured in `services/geminiService.ts`

### Development Tools
- **@vitejs/plugin-react**: 5.0.0 (JSX transform)
- **@types/node**: 22.14.0 (TypeScript definitions)

## Project Structure
```
AstroCalendar/
├── index.html              # Entry HTML
├── index.tsx               # React root render
├── App.tsx                 # Main app component, routing
├── types.ts                # TypeScript interfaces/types
├── vite.config.ts          # Build configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
├── .env.local              # Environment variables (GEMINI_API_KEY)
├── components/
│   └── Navigation.tsx      # Bottom navigation bar
├── screens/
│   ├── Welcome.tsx         # Landing screen
│   ├── SignIn.tsx          # Google auth
│   ├── LanguageSelect.tsx  # Language picker
│   ├── Onboarding.tsx      # Birth data collection
│   ├── Dashboard.tsx       # Main hub with insights
│   ├── Calendar.tsx        # Date browser
│   ├── Profile.tsx         # User info, settings
│   ├── Premium.tsx         # Upgrade screen
│   └── Compare.tsx         # Compatibility checker
├── services/
│   ├── firebase.ts         # Auth config
│   ├── geminiService.ts    # AI API calls
│   └── storage.ts          # LocalStorage helpers
├── utils/
│   └── astrology.ts        # Zodiac calculations, fallbacks
└── i18n/
    └── translations.ts     # en/tr strings
```

## Development Setup

### Prerequisites
- Node.js installed
- npm package manager

### Environment Variables
Required in `.env.local`:
```
GEMINI_API_KEY=<OpenAI API key>
```
Note: Despite the name, this is actually the OpenAI API key

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (default: http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

## Technical Constraints

### API Limitations
- **OpenAI Rate Limits**: Must handle gracefully with fallbacks
- **Network Dependence**: AI features require internet
- **Cost**: Each insight generation costs API tokens

### Browser Requirements
- Modern ES6+ support (Vite transpiles)
- LocalStorage enabled
- Google sign-in compatible browser

### Performance Considerations
- **Bundle size**: Keep dependencies minimal
- **First load**: Critical path should be fast
- **Cache strategy**: Aggressive caching to minimize API calls
- **Mobile optimization**: Assume slower devices/networks

## Configuration Files

### vite.config.ts
- React plugin enabled
- Development server configuration
- Build output settings

### tsconfig.json
- Strict mode enabled
- Module resolution for imports
- JSX configuration

### Firebase Configuration
- Project: `astrocalendar-36921`
- Auth domain: `astrocalendar-36921.firebaseapp.com`
- Public API key embedded (expected for Firebase)

## Deployment Context
- Built as static site (Vite output)
- Can be deployed to: Vercel, Netlify, Firebase Hosting, AI Studio
- Environment variables must be configured in hosting platform
- Current deployment: AI Studio (https://ai.studio/apps/...)

## Dependencies Philosophy
- **Minimal external libs**: Avoid heavy state management, routing libraries
- **Use platform APIs**: LocalStorage, fetch, native browser features
- **Firebase only for auth**: Not using Firestore, Functions, etc.
- **Direct API calls**: Using fetch instead of SDK for OpenAI
