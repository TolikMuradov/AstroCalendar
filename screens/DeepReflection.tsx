import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput,
  Image, Platform, Vibration, Dimensions, Modal, Easing, KeyboardAvoidingView, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Screen, UserProfile, DeepRefMessage, DeepRefSession, DeepRefActionType,
  DEEP_REF_SESSION_COST, DEEP_REF_ACTION_COST,
} from '../types';
import { coinService } from '../services/coinService';
import { drawRandomCard, TarotCard, getCardName, TAROT_DECK } from '../utils/tarotDeck';
import { TAROT_IMAGES } from '../utils/tarotImages';
import {
  generateDeepRefInitial, generateDeepRefAction, generateDeepRefCardReveal,
} from '../services/geminiService';
import { storage } from '../services/storage';
import { translations } from '../i18n/translations';
import { colors, glassPanel } from '../styles/theme';
import Icon from '../components/Icon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sanitize user input
const sanitizeInput = (text: string): string => {
  return text
    .replace(/[<>{}[\]\\]/g, '')
    .replace(/\b(system|prompt|ignore|instruction|override|forget|pretend|act as|you are)\b/gi, '')
    .trim()
    .slice(0, 1500);
};

// Weighted card draw: 50% context-influenced for Deep Ref
const drawWeightedCardForSession = (sessionText: string): TarotCard => {
  if (Math.random() > 0.5) {
    return TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
  }
  const words = sessionText.toLowerCase().split(/\s+/);
  const scored = TAROT_DECK.map(card => {
    const matchCount = card.keywords.filter(kw =>
      words.some(w => w.includes(kw.toLowerCase()) || kw.toLowerCase().includes(w))
    ).length;
    return { card, score: matchCount };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(5, scored.length));
  return top[Math.floor(Math.random() * top.length)].card;
};

// ============================
// ANIMATED INK LINE COMPONENT — subtle flowing line
// ============================
const InkLine: React.FC<{ delay: number; width: number; top: number }> = ({ delay, width, top }) => {
  const scaleX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      scaleX.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleX, { toValue: 1, duration: 3000 + Math.random() * 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.06, duration: 1500, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.06, duration: 2000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => setTimeout(animate, 2000 + Math.random() * 4000));
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left: SCREEN_WIDTH * 0.1,
        width,
        height: 1,
        backgroundColor: 'rgba(180,160,200,1)',
        transform: [{ scaleX }],
        opacity,
      }}
      pointerEvents="none"
    />
  );
};

// ============================
// TYPEWRITER TEXT COMPONENT
// ============================
const TypewriterText: React.FC<{
  text: string;
  onComplete?: () => void;
  style?: any;
}> = ({ text, onComplete, style }) => {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');

    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 12); // ~83 chars/sec — smooth and fast

    return () => clearInterval(interval);
  }, [text]);

  return <Text style={style}>{displayed}</Text>;
};

// ============================
// COIN DEDUCTION ANIMATION
// ============================
const CoinDeductBadge: React.FC<{ amount: number; visible: boolean }> = ({ amount, visible }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.3);
      translateY.setValue(0);
      opacity.setValue(1);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -40, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.coinDeductBadge, { transform: [{ scale }, { translateY }], opacity }]}>
      <Text style={styles.coinDeductText}>-{amount} 🪙</Text>
    </Animated.View>
  );
};

// ============================
// CHAT BUBBLE COMPONENT
// ============================
const ChatBubble: React.FC<{
  message: DeepRefMessage;
  isNew: boolean;
  locale: string;
  onTypewriterComplete?: () => void;
  onCardPress?: () => void;
}> = ({ message, isNew, locale, onTypewriterComplete, onCardPress }) => {
  const slideAnim = useRef(new Animated.Value(message.role === 'user' ? 30 : -30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUser = message.role === 'user';

  return (
    <Animated.View style={[
      styles.bubbleWrap,
      isUser ? styles.bubbleWrapUser : styles.bubbleWrapAI,
      {
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        opacity: fadeAnim,
      },
    ]}>
      {/* Card badge if this message has a card */}
      {message.cardName && (
        <Pressable onPress={onCardPress} style={styles.cardBadge}>
          <Text style={styles.cardBadgeEmoji}>🃏</Text>
          <Text style={styles.cardBadgeText}>{message.cardName}{message.cardIsReversed ? ' ↻' : ''}</Text>
        </Pressable>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {isNew && !isUser ? (
          <TypewriterText
            text={message.text}
            style={[styles.bubbleText, styles.bubbleTextAI]}
            onComplete={onTypewriterComplete}
          />
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {message.text}
          </Text>
        )}
      </View>

      {/* Action type label */}
      {message.actionType && message.actionType !== 'initial' && !isUser && (
        <Text style={styles.actionLabel}>
          {message.actionType === 'go_deeper' ? '◈ Deeper' :
           message.actionType === 'reveal_card' ? '◈ Card Reveal' :
           message.actionType === 'examine_role' ? '◈ Your Role' :
           message.actionType === 'see_their_energy' ? '◈ Their Energy' : ''}
        </Text>
      )}
    </Animated.View>
  );
};

// ============================
// THINKING INDICATOR
// ============================
const ThinkingIndicator: React.FC<{ message?: string }> = ({ message }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const animateDots = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animateDots();
  }, []);

  return (
    <Animated.View style={[styles.thinkingWrap, { opacity: fadeIn }]}>
      <View style={styles.thinkingDots}>
        <Animated.View style={[styles.thinkingDot, { opacity: dot1 }]} />
        <Animated.View style={[styles.thinkingDot, { opacity: dot2 }]} />
        <Animated.View style={[styles.thinkingDot, { opacity: dot3 }]} />
      </View>
      {message && <Text style={styles.thinkingText}>{message}</Text>}
    </Animated.View>
  );
};

// ============================
// MAIN SCREEN COMPONENT
// ============================

interface DeepReflectionProps {
  profile: UserProfile;
  navigate: (screen: Screen) => void;
}

const DeepReflectionScreen: React.FC<DeepReflectionProps> = ({ profile, navigate }) => {
  const t = translations[profile.locale as keyof typeof translations] || translations.en;

  // Session state
  const [stage, setStage] = useState<'ENTRY' | 'INPUT' | 'CHAT' | 'CLOSED'>('ENTRY');
  const [coins, setCoins] = useState(0);
  const [messages, setMessages] = useState<DeepRefMessage[]>([]);
  const [initialText, setInitialText] = useState('');
  const [actionCount, setActionCount] = useState(0);
  const [coinsSpent, setCoinsSpent] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showCoinDeduct, setShowCoinDeduct] = useState(false);
  const [lastDeductAmount, setLastDeductAmount] = useState(0);
  const [newestMsgId, setNewestMsgId] = useState('');

  // Card preview
  const [previewCard, setPreviewCard] = useState<(TarotCard & { isReversed: boolean }) | null>(null);
  const previewScale = useRef(new Animated.Value(0)).current;
  const previewRotateY = useRef(new Animated.Value(0)).current;
  const previewBackdrop = useRef(new Animated.Value(0)).current;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const entryTitleY = useRef(new Animated.Value(40)).current;
  const entryTitleOpacity = useRef(new Animated.Value(0)).current;
  const entrySubY = useRef(new Animated.Value(30)).current;
  const entrySubOpacity = useRef(new Animated.Value(0)).current;
  const entryDescY = useRef(new Animated.Value(30)).current;
  const entryDescOpacity = useRef(new Animated.Value(0)).current;
  const entryBtnY = useRef(new Animated.Value(30)).current;
  const entryBtnOpacity = useRef(new Animated.Value(0)).current;
  const entryLineWidth = useRef(new Animated.Value(0)).current;
  const chatHeaderOpacity = useRef(new Animated.Value(0)).current;
  const actionBarSlideY = useRef(new Animated.Value(80)).current;
  const actionBarOpacity = useRef(new Animated.Value(0)).current;
  const inputFade = useRef(new Animated.Value(0)).current;
  const endModalScale = useRef(new Animated.Value(0.8)).current;
  const endModalOpacity = useRef(new Animated.Value(0)).current;

  const scrollRef = useRef<ScrollView>(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimerRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);

  // Ink line data
  const inkLines = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      delay: i * 1500 + Math.random() * 2000,
      width: SCREEN_WIDTH * (0.3 + Math.random() * 0.4),
      top: SCREEN_HEIGHT * (0.15 + (i / 6) * 0.7),
    }))
  ).current;

  // ============================
  // INITIALIZATION
  // ============================

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Staggered entry animation
    Animated.stagger(200, [
      Animated.parallel([
        Animated.spring(entryTitleY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(entryTitleOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(entryLineWidth, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(entrySubY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(entrySubOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(entryDescY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(entryDescOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(entryBtnY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.timing(entryBtnOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    let unsub: any = null;
    const init = async () => {
      try {
        const bal = await coinService.getBalance();
        setCoins(bal.coins);
      } catch { }
      unsub = coinService.subscribe(bal => setCoins(bal.coins));
    };
    init();

    return () => { if (unsub) unsub(); };
  }, []);

  // App background detection → close session after 60 seconds
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === 'active' && nextState.match(/inactive|background/) && sessionActiveRef.current) {
        backgroundTimerRef.current = Date.now();
      }
      if (nextState === 'active' && backgroundTimerRef.current && sessionActiveRef.current) {
        const elapsed = Date.now() - backgroundTimerRef.current;
        backgroundTimerRef.current = null;
        if (elapsed > 60000) {
          closeSession();
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // ============================
  // SESSION LIFECYCLE
  // ============================

  const handleBeginSession = async () => {
    const canAfford = coins >= DEEP_REF_SESSION_COST || profile.subscription?.isPremium;
    if (!canAfford) return;

    if (!profile.subscription?.isPremium) {
      try {
        await coinService.spendCoins(DEEP_REF_SESSION_COST);
        triggerCoinDeduct(DEEP_REF_SESSION_COST);
      } catch {
        setError((t as any).deepRefNotEnoughCoins || 'Not enough coins');
        return;
      }
    }

    const id = `deepref_${Date.now()}`;
    setSessionId(id);
    setCoinsSpent(DEEP_REF_SESSION_COST);
    sessionActiveRef.current = true;
    setStage('INPUT');

    Animated.timing(inputFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };

  const handleSendInitial = async () => {
    if (!initialText.trim()) return;
    const sanitized = sanitizeInput(initialText);
    setInitialText(sanitized);

    const userMsg: DeepRefMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: sanitized,
      actionType: 'initial',
      timestamp: new Date().toISOString(),
    };

    setMessages([userMsg]);
    setStage('CHAT');
    setIsLoading(true);

    // Animate chat header + scroll
    Animated.timing(chatHeaderOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    try {
      const result = await generateDeepRefInitial(profile, sanitized);
      const aiMsg: DeepRefMessage = {
        id: `msg_${Date.now()}`,
        role: 'ai',
        text: result.response,
        actionType: 'initial',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setNewestMsgId(aiMsg.id);
      setIsTyping(true);
      setActionCount(0);
    } catch (err) {
      console.error('Deep Ref initial failed:', err);
      setError('Failed to generate response.');
    } finally {
      setIsLoading(false);
      // Show action bar
      showActionBar();
    }
  };

  const showActionBar = () => {
    Animated.parallel([
      Animated.spring(actionBarSlideY, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.timing(actionBarOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const hideActionBar = () => {
    actionBarSlideY.setValue(80);
    actionBarOpacity.setValue(0);
  };

  // ============================
  // ACTION HANDLERS
  // ============================

  const handleAction = async (actionType: DeepRefActionType) => {
    if (isLoading || isTyping) return;

    const canAfford = coins >= DEEP_REF_ACTION_COST || profile.subscription?.isPremium;
    if (!canAfford) {
      setError((t as any).deepRefNotEnoughCoins || 'Not enough coins');
      return;
    }

    if (!profile.subscription?.isPremium) {
      try {
        await coinService.spendCoins(DEEP_REF_ACTION_COST);
        triggerCoinDeduct(DEEP_REF_ACTION_COST);
      } catch {
        setError((t as any).deepRefNotEnoughCoins || 'Not enough coins');
        return;
      }
    }

    setCoinsSpent(prev => prev + DEEP_REF_ACTION_COST);
    setActionCount(prev => prev + 1);
    setIsLoading(true);
    hideActionBar();
    setError(null);

    const conversationHistory = messages.map(m => ({ role: m.role, text: m.text }));

    try {
      if (actionType === 'reveal_card') {
        // Draw weighted card
        const allText = messages.map(m => m.text).join(' ');
        const card = drawWeightedCardForSession(allText);
        const isReversed = Math.random() > 0.5;

        const result = await generateDeepRefCardReveal(
          profile, conversationHistory, card.name, isReversed, actionCount + 1
        );

        const aiMsg: DeepRefMessage = {
          id: `msg_${Date.now()}`,
          role: 'ai',
          text: result.response,
          actionType: 'reveal_card',
          cardName: getCardName(card, profile.locale) || card.name,
          cardIsReversed: isReversed,
          timestamp: new Date().toISOString(),
        };

        // Store card for preview
        setPreviewCard({ ...card, isReversed });
        setMessages(prev => [...prev, aiMsg]);
        setNewestMsgId(aiMsg.id);
        setIsTyping(true);
      } else {
        const result = await generateDeepRefAction(
          profile, conversationHistory, actionType as 'go_deeper' | 'examine_role' | 'see_their_energy', actionCount + 1
        );

        const aiMsg: DeepRefMessage = {
          id: `msg_${Date.now()}`,
          role: 'ai',
          text: result.response,
          actionType,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMsg]);
        setNewestMsgId(aiMsg.id);
        setIsTyping(true);
      }
    } catch (err) {
      console.error('Deep Ref action failed:', err);
      setError('Failed to generate response.');
      showActionBar();
    } finally {
      setIsLoading(false);
    }
  };

  const onTypewriterDone = useCallback(() => {
    setIsTyping(false);
    showActionBar();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }, []);

  const triggerCoinDeduct = (amount: number) => {
    setLastDeductAmount(amount);
    setShowCoinDeduct(false);
    setTimeout(() => setShowCoinDeduct(true), 50);
    setTimeout(() => setShowCoinDeduct(false), 2500);
  };

  // ============================
  // SESSION CLOSE
  // ============================

  const promptEndSession = () => {
    setShowEndModal(true);
    endModalScale.setValue(0.8);
    endModalOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(endModalScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(endModalOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSession = async () => {
    sessionActiveRef.current = false;
    setShowEndModal(false);
    setStage('CLOSED');

    // Save session
    const session: DeepRefSession = {
      id: sessionId,
      userId: profile.uid,
      date: new Date().toISOString().split('T')[0],
      initialText: messages.find(m => m.actionType === 'initial' && m.role === 'user')?.text || '',
      messages,
      coinsSpentTotal: coinsSpent,
      actionCount,
      status: 'closed',
      locale: profile.locale,
      createdAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
    };

    try {
      await storage.saveDeepRefSession(session);
    } catch (e) {
      console.error('Failed to save Deep Ref session:', e);
    }

    try { Vibration.vibrate(50); } catch { }
  };

  const dismissEndModal = () => {
    Animated.parallel([
      Animated.timing(endModalScale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(endModalOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowEndModal(false));
  };

  // Navigate back = close session
  const handleBack = () => {
    if (sessionActiveRef.current) {
      promptEndSession();
    } else {
      navigate('TAROT');
    }
  };

  // ============================
  // CARD PREVIEW
  // ============================

  const openCardPreview = (card: TarotCard & { isReversed: boolean }) => {
    setPreviewCard(card);
    previewScale.setValue(0.3);
    previewRotateY.setValue(-90);
    previewBackdrop.setValue(0);
    Animated.parallel([
      Animated.spring(previewScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(previewRotateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(previewBackdrop, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeCardPreview = () => {
    Animated.parallel([
      Animated.timing(previewScale, { toValue: 0.3, duration: 250, useNativeDriver: true }),
      Animated.timing(previewRotateY, { toValue: 90, duration: 300, useNativeDriver: true }),
      Animated.timing(previewBackdrop, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setPreviewCard(null));
  };

  // ============================
  // RENDER: ENTRY SCREEN
  // ============================

  const renderEntry = () => {
    const canAfford = coins >= DEEP_REF_SESSION_COST || profile.subscription?.isPremium;

    return (
      <View style={styles.entryContainer}>
        <Pressable onPress={() => navigate('TAROT')} style={styles.backBtn}>
          <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.3)" />
        </Pressable>

        {/* Title */}
        <Animated.View style={{ transform: [{ translateY: entryTitleY }], opacity: entryTitleOpacity }}>
          <Text style={styles.entryTitle}>Deep Reflection</Text>
        </Animated.View>

        {/* Decorative line */}
        <Animated.View style={[styles.entryLine, { transform: [{ scaleX: entryLineWidth }] }]} />

        {/* Subtitle */}
        <Animated.View style={{ transform: [{ translateY: entrySubY }], opacity: entrySubOpacity }}>
          <Text style={styles.entrySubtitle}>{(t as any).deepRefSubtitle || 'Say what you can\'t say anywhere else.'}</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View style={{ transform: [{ translateY: entryDescY }], opacity: entryDescOpacity }}>
          <Text style={styles.entryDesc}>{(t as any).deepRefDesc || 'This is a live reflective session.\nSpeak freely. We\'ll untangle it together.'}</Text>
        </Animated.View>

        {/* Price + Button */}
        <Animated.View style={[styles.entryBtnWrap, { transform: [{ translateY: entryBtnY }], opacity: entryBtnOpacity }]}>
          <View style={styles.priceChip}>
            <Text style={styles.priceText}>
              {profile.subscription?.isPremium
                ? ((t as any).freeForPremium || 'Free for Premium')
                : `🪙 ${DEEP_REF_SESSION_COST} ${t.coins}`}
            </Text>
          </View>

          {!canAfford && (
            <Text style={styles.warningText}>{(t as any).deepRefNotEnoughCoins || 'Not enough coins'}</Text>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            onPress={handleBeginSession}
            disabled={!canAfford}
            style={[styles.entryBtn, !canAfford && styles.entryBtnDisabled]}
          >
            <LinearGradient
              colors={['#0a0a14', '#161625', '#0a0a14']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.entryBtnGradient}
            >
              <Text style={styles.entryBtnText}>{(t as any).deepRefBegin || 'Begin Session'}</Text>
              <Text style={styles.entryBtnPrice}>{profile.subscription?.isPremium ? '' : `${DEEP_REF_SESSION_COST} 🪙`}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  // ============================
  // RENDER: INPUT SCREEN (initial expression)
  // ============================

  const renderInput = () => (
    <Animated.View style={[styles.inputContainer, { opacity: inputFade }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={20}
      >
        <ScrollView contentContainerStyle={styles.inputScroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Icon name="arrow_back" size={22} color="rgba(255,255,255,0.3)" />
          </Pressable>

          <Text style={styles.inputPrompt}>{(t as any).deepRefPrompt || 'What do you need clarity about?'}</Text>

          <TextInput
            style={styles.inputField}
            placeholder="..."
            placeholderTextColor="rgba(120,110,140,0.25)"
            value={initialText}
            onChangeText={setInitialText}
            maxLength={1500}
            multiline
            numberOfLines={8}
            autoFocus
          />

          <Text style={styles.charCount}>{initialText.length}/1500</Text>

          <Pressable
            onPress={handleSendInitial}
            disabled={!initialText.trim()}
            style={[styles.sendBtn, !initialText.trim() && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendBtnText}>{(t as any).deepRefSend || 'Send'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );

  // ============================
  // RENDER: CHAT SCREEN
  // ============================

  const renderChat = () => (
    <View style={styles.chatContainer}>
      {/* Header */}
      <Animated.View style={[styles.chatHeader, { opacity: chatHeaderOpacity }]}>
        <Pressable onPress={handleBack} style={styles.backBtnSmall}>
          <Icon name="arrow_back" size={20} color="rgba(255,255,255,0.35)" />
        </Pressable>
        <View style={styles.chatHeaderCenter}>
          <Text style={styles.chatHeaderTitle}>Deep Reflection</Text>
          <Text style={styles.chatHeaderCoins}>🪙 {coins}</Text>
        </View>
        <Pressable onPress={promptEndSession} style={styles.endBtn}>
          <Text style={styles.endBtnText}>{(t as any).deepRefEndSession || 'End Session'}</Text>
        </Pressable>
      </Animated.View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isNew={msg.id === newestMsgId}
            locale={profile.locale}
            onTypewriterComplete={msg.id === newestMsgId ? onTypewriterDone : undefined}
            onCardPress={msg.cardName && previewCard ? () => openCardPreview(previewCard) : undefined}
          />
        ))}

        {isLoading && <ThinkingIndicator message={(t as any).deepRefThinking || 'Reflecting...'} />}
      </ScrollView>

      {/* Action Bar */}
      <Animated.View style={[
        styles.actionBar,
        { transform: [{ translateY: actionBarSlideY }], opacity: actionBarOpacity },
      ]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionBarScroll}>
          <Pressable
            onPress={() => handleAction('go_deeper')}
            disabled={isLoading || isTyping}
            style={[styles.actionChip, (isLoading || isTyping) && styles.actionChipDisabled]}
          >
            <Text style={styles.actionChipText}>🪙 {(t as any).deepRefGoDeeper || 'Go Deeper'}</Text>
          </Pressable>
          <Pressable
            onPress={() => handleAction('reveal_card')}
            disabled={isLoading || isTyping}
            style={[styles.actionChip, (isLoading || isTyping) && styles.actionChipDisabled]}
          >
            <Text style={styles.actionChipText}>🪙 {(t as any).deepRefRevealCard || 'Reveal a Card'}</Text>
          </Pressable>
          <Pressable
            onPress={() => handleAction('examine_role')}
            disabled={isLoading || isTyping}
            style={[styles.actionChip, (isLoading || isTyping) && styles.actionChipDisabled]}
          >
            <Text style={styles.actionChipText}>🪙 {(t as any).deepRefExamineRole || 'Examine Your Role'}</Text>
          </Pressable>
          <Pressable
            onPress={() => handleAction('see_their_energy')}
            disabled={isLoading || isTyping}
            style={[styles.actionChip, (isLoading || isTyping) && styles.actionChipDisabled]}
          >
            <Text style={styles.actionChipText}>🪙 {(t as any).deepRefSeeEnergy || 'See Their Energy'}</Text>
          </Pressable>
        </ScrollView>
        <Text style={styles.actionCostHint}>{DEEP_REF_ACTION_COST} {t.coins} {(t as any).deepRefPerAction || 'per action'}</Text>
      </Animated.View>

      {/* Coin deduction badge */}
      <CoinDeductBadge amount={lastDeductAmount} visible={showCoinDeduct} />
    </View>
  );

  // ============================
  // RENDER: CLOSED SESSION
  // ============================

  const renderClosed = () => (
    <View style={styles.closedContainer}>
      <Text style={styles.closedTitle}>{(t as any).deepRefClosed || 'Session Closed'}</Text>
      <View style={styles.closedLine} />
      <Text style={styles.closedStats}>
        {actionCount} {actionCount === 1 ? 'reflection' : 'reflections'} • {coinsSpent} 🪙
      </Text>
      <Pressable onPress={() => navigate('TAROT')} style={styles.closedBtn}>
        <Text style={styles.closedBtnText}>{(t as any).ppfBackToTarot || 'Back to Tarot'}</Text>
      </Pressable>
    </View>
  );

  // ============================
  // RENDER: END SESSION MODAL
  // ============================

  const renderEndModal = () => (
    <Modal transparent visible={showEndModal} animationType="none" onRequestClose={dismissEndModal}>
      <Pressable style={styles.modalBackdrop} onPress={dismissEndModal}>
        <Animated.View style={[
          styles.modalCard,
          { transform: [{ scale: endModalScale }], opacity: endModalOpacity },
        ]}>
          <Text style={styles.modalText}>{(t as any).deepRefEndConfirm || 'Are you ready to close this reflection?'}</Text>
          <View style={styles.modalBtnRow}>
            <Pressable onPress={dismissEndModal} style={styles.modalBtnSecondary}>
              <Text style={styles.modalBtnSecondaryText}>{(t as any).deepRefEndNo || 'Continue'}</Text>
            </Pressable>
            <Pressable onPress={closeSession} style={styles.modalBtnPrimary}>
              <Text style={styles.modalBtnPrimaryText}>{(t as any).deepRefEndYes || 'Close Session'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );

  // ============================
  // RENDER: CARD PREVIEW MODAL
  // ============================

  const renderCardPreview = () => {
    if (!previewCard) return null;
    const cardW = SCREEN_WIDTH * 0.7;
    const cardH = cardW / 0.62;
    const rotateInterp = previewRotateY.interpolate({
      inputRange: [-90, 0, 90],
      outputRange: ['-90deg', '0deg', '90deg'],
    });

    return (
      <Modal transparent visible animationType="none" onRequestClose={closeCardPreview}>
        <Pressable style={styles.previewBackdropPress} onPress={closeCardPreview}>
          <Animated.View style={[styles.previewBackdrop, { opacity: previewBackdrop }]} />
          <Animated.View style={[
            styles.previewCardWrap,
            { width: cardW, height: cardH, transform: [{ scale: previewScale }, { perspective: 1000 }, { rotateY: rotateInterp }] },
          ]}>
            <Image
              source={TAROT_IMAGES[previewCard.id]}
              style={[styles.previewCardImage, previewCard.isReversed && { transform: [{ rotate: '180deg' }] }]}
            />
          </Animated.View>
          <Animated.View style={{ opacity: previewBackdrop, marginTop: 20, alignItems: 'center' }}>
            <Text style={styles.previewName}>{getCardName(previewCard, profile.locale) || previewCard.name}</Text>
            <Text style={styles.previewPosition}>{previewCard.isReversed ? t.reversed : t.upright}</Text>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };

  // ============================
  // MAIN RENDER
  // ============================

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={['#040408', '#0a0a14', '#060610']} style={StyleSheet.absoluteFill} />

      {/* Subtle ink lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {inkLines.map((l, i) => (
          <InkLine key={i} delay={l.delay} width={l.width} top={l.top} />
        ))}
      </View>

      {stage === 'ENTRY' && renderEntry()}
      {stage === 'INPUT' && renderInput()}
      {stage === 'CHAT' && renderChat()}
      {stage === 'CLOSED' && renderClosed()}
      {renderEndModal()}
      {renderCardPreview()}
    </Animated.View>
  );
};

// ============================
// STYLES
// ============================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040408' },

  backBtn: {
    alignSelf: 'flex-start',
    width: 44, height: 44, borderRadius: 22,
    ...glassPanel,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
    borderColor: 'rgba(120,110,140,0.06)',
  },

  // Entry
  entryContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 64 : 52,
    justifyContent: 'flex-start',
  },
  entryTitle: {
    fontSize: 36,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '200',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 16,
  },
  entryLine: {
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.35,
    height: 0.5,
    backgroundColor: 'rgba(160,140,180,0.2)',
    marginBottom: 28,
  },
  entrySubtitle: {
    fontSize: 17,
    color: 'rgba(180,165,200,0.55)',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  entryDesc: {
    fontSize: 14,
    color: 'rgba(148,140,165,0.35)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  entryBtnWrap: {
    alignItems: 'center',
  },
  priceChip: {
    backgroundColor: 'rgba(120,110,140,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(120,110,140,0.12)',
    borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 20,
    marginBottom: 24,
  },
  priceText: {
    color: 'rgba(180,165,200,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  entryBtn: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: 'rgba(120,110,140,0.4)',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  entryBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  entryBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 1,
  },
  entryBtnPrice: {
    color: 'rgba(180,165,200,0.4)',
    fontSize: 13,
    fontWeight: '600',
  },
  entryBtnDisabled: { opacity: 0.3 },

  // Input screen
  inputContainer: { flex: 1 },
  inputScroll: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 64 : 52,
    paddingBottom: 40,
  },
  inputPrompt: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 36,
    letterSpacing: 0.5,
  },
  inputField: {
    width: '100%',
    backgroundColor: 'rgba(120,110,140,0.03)',
    color: 'rgba(255,255,255,0.85)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.08)',
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 26,
  },
  charCount: {
    color: 'rgba(120,110,140,0.2)',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  sendBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(120,110,140,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.15)',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 28,
  },
  sendBtnText: {
    color: 'rgba(200,185,220,0.7)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sendBtnDisabled: { opacity: 0.3 },

  // Chat
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(120,110,140,0.06)',
  },
  backBtnSmall: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  chatHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  chatHeaderTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 1.5,
  },
  chatHeaderCoins: {
    color: 'rgba(180,165,200,0.35)',
    fontSize: 11,
    marginTop: 2,
  },
  endBtn: {
    backgroundColor: 'rgba(120,110,140,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.1)',
    borderRadius: 16,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  endBtnText: {
    color: 'rgba(200,185,220,0.4)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  chatScroll: { flex: 1 },
  chatScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 140,
  },

  // Chat Bubbles
  bubbleWrap: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  bubbleWrapUser: {
    alignSelf: 'flex-end',
  },
  bubbleWrapAI: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bubbleUser: {
    backgroundColor: 'rgba(120,110,140,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.1)',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: 'rgba(100,90,130,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(100,90,130,0.06)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 25,
    letterSpacing: 0.2,
  },
  bubbleTextUser: {
    color: 'rgba(255,255,255,0.75)',
  },
  bubbleTextAI: {
    color: 'rgba(220,210,235,0.72)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  actionLabel: {
    color: 'rgba(120,110,140,0.3)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 4,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120,110,140,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.12)',
    borderRadius: 12,
    paddingVertical: 6, paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  cardBadgeEmoji: { fontSize: 16 },
  cardBadgeText: {
    color: 'rgba(200,185,220,0.6)',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Thinking indicator
  thinkingWrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  thinkingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(160,145,180,0.5)',
  },
  thinkingText: {
    color: 'rgba(160,145,180,0.35)',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    backgroundColor: 'rgba(4,4,8,0.95)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(120,110,140,0.06)',
  },
  actionBarScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  actionChip: {
    backgroundColor: 'rgba(120,110,140,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.12)',
    borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 18,
  },
  actionChipDisabled: { opacity: 0.3 },
  actionChipText: {
    color: 'rgba(200,185,220,0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
  actionCostHint: {
    color: 'rgba(120,110,140,0.2)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },

  // Coin deduct badge
  coinDeductBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 64,
    alignSelf: 'center',
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
    borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 16,
  },
  coinDeductText: {
    color: 'rgba(248,113,113,0.9)',
    fontSize: 14,
    fontWeight: '700',
  },

  // Closed screen
  closedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  closedTitle: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '200',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 2,
    marginBottom: 16,
  },
  closedLine: {
    width: 60, height: 0.5,
    backgroundColor: 'rgba(160,140,180,0.15)',
    marginBottom: 20,
  },
  closedStats: {
    color: 'rgba(148,140,165,0.35)',
    fontSize: 13,
    marginBottom: 40,
    letterSpacing: 1,
  },
  closedBtn: {
    backgroundColor: 'rgba(120,110,140,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.12)',
    borderRadius: 24,
    paddingVertical: 14, paddingHorizontal: 36,
  },
  closedBtnText: {
    color: 'rgba(200,185,220,0.5)',
    fontSize: 15,
    fontWeight: '600',
  },

  // End session modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,4,8,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'rgba(16,16,28,0.98)',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.1)',
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  modalText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 28,
    fontWeight: '300',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(120,110,140,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(120,110,140,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    color: 'rgba(200,185,220,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    color: 'rgba(248,113,113,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },

  // Card preview
  previewBackdropPress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,4,8,0.94)',
  },
  previewCardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(120,110,140,0.4)',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  previewCardImage: {
    width: '100%', height: '100%',
    resizeMode: 'cover',
    borderRadius: 16,
  },
  previewName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  previewPosition: {
    color: 'rgba(180,165,200,0.45)',
    fontSize: 13,
    marginTop: 4,
  },
});

export default DeepReflectionScreen;
