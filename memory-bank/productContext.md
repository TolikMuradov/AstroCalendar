# Product Context

## Why This Exists
AstroCalendar bridges ancient astrological wisdom with modern AI technology, offering users a personalized cosmic companion for daily guidance and self-reflection. It democratizes access to astrological insights traditionally requiring expensive consultations.

## Problems It Solves

### For Users
- **Lack of Personalization**: Generic horoscopes don't account for individual birth charts
- **Access Barriers**: Professional astrological readings are expensive and time-consuming
- **Language Barriers**: Most astrology apps lack proper localization for Turkish and Thai speakers
- **Consistency**: Daily engagement with self-reflection practices
- **Relationship Insights**: Understanding compatibility with partners/friends
- **Tarot Access**: On-demand AI-interpreted tarot readings without visiting a reader

### For the Market
- Combines both Western and Chinese astrological traditions in one app
- AI-generated insights provide unique, personalized content daily
- Native mobile app with real AdMob integration for sustainable revenue
- Beautiful, modern UI makes astrology accessible to younger audiences
- Multilingual support (English, Turkish, Thai) serves diverse global markets
- Freemium model: ads + coin economy for free users, $1.99/month premium

## How It Should Work

### User Flow
1. **Entry**: User discovers app on Play Store / App Store → sees welcoming cosmic interface
2. **Authentication**: Quick Google sign-in (expo-auth-session)
3. **Language**: Choose preferred language (affects all content)
4. **Onboarding**: Input birth date (required), time, place (optional) via native Picker components
5. **Profile Creation**: System computes zodiac signs and elements
6. **Dashboard**: Daily insight generated/retrieved, energy score displayed, coin balance visible
7. **Earn Coins**: Watch real AdMob rewarded ads (max 3/day) to earn coins
8. **Lucky Numbers**: 1st free, 2nd/3rd cost 1 coin each (daily reset)
9. **Tarot Reading**: Spend 6 coins for AI-interpreted card reading (premium: free)
10. **Exploration**: Browse calendar (premium), view yearly forecast, check compatibility (premium)
11. **Retention**: Daily ritual reminders, coin incentives, new insights reinforce habit

### Key Interactions
- **Dashboard**: Central hub showing today's cosmic energy, lucky numbers (with locks), rituals, earn coins card
- **Tarot**: 5-phase flow — shuffle → reveal → AI interpretation, with coin gating
- **Calendar**: Monthly grid with day type classifications (stone, activity, color recommendations) — premium only
- **Comparison**: Enter partner's birth date for compatibility reading — premium only
- **Profile**: View cosmic identity, edit info, manage language, see coin balance

### Experience Goals
- **Mystical**: Dark cosmic theme, LinearGradient backgrounds, cosmic terminology
- **Personal**: Uses first name, speaks directly to user's astrological profile
- **Reliable**: Always shows something useful, even when AI unavailable
- **Delightful**: Smooth native animations, satisfying Animated card flips, beautiful typography
- **Informative**: Educational about zodiac systems while being entertaining
- **Fair**: Free users can access most features via coin economy; premium for power users

## Monetization Model
- **Free tier**: Dashboard, daily insights, earn coins via AdMob, spend on features
- **Premium ($1.99/month)**: No ads, free tarot, calendar access, comparison, all lucky numbers
- **Revenue sources**: AdMob (app open + rewarded ads), subscriptions (planned IAP)

## Success Metrics
- Daily active usage (users checking morning insights)
- Ad impression rate and rewarded ad completion
- Coin economy engagement (earn → spend cycle)
- Premium conversion rate
- Profile completion rate (adding birth time/location)
- Return visits within 24 hours
- Language preference distribution
