// Mock module to prevent react-native-google-mobile-ads from crashing web builds

export enum BannerAdSize {
    BANNER = 'BANNER',
    LARGE_BANNER = 'LARGE_BANNER',
    MEDIUM_RECTANGLE = 'MEDIUM_RECTANGLE',
    FULL_BANNER = 'FULL_BANNER',
    LEADERBOARD = 'LEADERBOARD',
    ADAPTIVE_BANNER = 'ADAPTIVE_BANNER',
}

export enum TestIds {
    BANNER = 'ca-app-pub-3940256099942544/6300978111',
    REWARDED = 'ca-app-pub-3940256099942544/5224354917',
    APP_OPEN = 'ca-app-pub-3940256099942544/3419835294',
}

export const BannerAd = () => null;

export const AppOpenAd = {
    createForAdRequest: () => ({
        load: () => null,
        show: () => null,
        addAdEventListener: () => () => null,
    }),
};

export const RewardedAd = {
    createForAdRequest: () => ({
        load: () => null,
        show: () => null,
        addAdEventListener: () => () => null,
    }),
};

export const AdEventType = {
    LOADED: 'loaded',
    ERROR: 'error',
    CLOSED: 'closed',
    CLICKED: 'clicked',
};

export const RewardedAdEventType = {
    LOADED: 'loaded',
    EARNED_REWARD: 'earned_reward',
    ERROR: 'error',
    CLOSED: 'closed',
};

export default {
    setRequestConfiguration: () => Promise.resolve(),
    initialize: () => Promise.resolve(),
};
