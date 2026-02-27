import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';

// ─── Pulsing glow overlay on the card while AI interprets ───
interface CardOverlayProps {
  color?: string;
}

export const CardLoadingOverlay: React.FC<CardOverlayProps> = ({ color = '#8b5cf6' }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const innerPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(innerPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(innerPulse, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const borderOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.9],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Pulsing border glow */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 10,
            borderWidth: 2,
            borderColor: color,
            opacity: borderOpacity,
            shadowColor: color,
            shadowOpacity: 0.8,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
            elevation: 10,
          },
        ]}
      />

      {/* Semi-transparent overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 10,
            backgroundColor: 'rgba(0,0,0,0.35)',
          },
        ]}
      />

      {/* Rotating symbol */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.Text
          style={{
            fontSize: 26,
            color,
            transform: [{ rotate: spin }],
            opacity: innerPulse,
            textShadowColor: color,
            textShadowRadius: 12,
            textShadowOffset: { width: 0, height: 0 },
          }}
        >
          ✦
        </Animated.Text>
      </View>
    </View>
  );
};

// ─── Shimmer skeleton lines for interpretation text area ───
interface ShimmerProps {
  message: string;
  color?: string;
  lineCount?: number;
}

export const InterpretingShimmer: React.FC<ShimmerProps> = ({ message, color = '#8b5cf6', lineCount = 4 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(dotsAnim, { toValue: 3, duration: 2000, easing: Easing.linear, useNativeDriver: false })
    ).start();
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.2],
  });

  const lines = Array.from({ length: lineCount }, (_, i) => {
    const widths = ['92%', '100%', '85%', '70%', '95%', '60%'];
    return widths[i % widths.length];
  });

  return (
    <View style={shimmerStyles.container}>
      {/* Animated message with dots */}
      <AnimatedDots message={message} color={color} dotsAnim={dotsAnim} />

      {/* Skeleton lines */}
      <View style={shimmerStyles.linesContainer}>
        {lines.map((w, i) => (
          <Animated.View
            key={i}
            style={[
              shimmerStyles.line,
              {
                width: w as any,
                backgroundColor: color,
                opacity: shimmerOpacity,
                marginTop: i === 0 ? 0 : 10,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Animated dots "Interpreting..." → "Interpreting.." → "Interpreting..." ───
const AnimatedDots: React.FC<{ message: string; color: string; dotsAnim: Animated.Value }> = ({ message, color, dotsAnim }) => {
  const [dots, setDots] = React.useState('');

  useEffect(() => {
    const id = dotsAnim.addListener(({ value }) => {
      const count = Math.floor(value) % 4;
      setDots('.'.repeat(count));
    });
    return () => dotsAnim.removeListener(id);
  }, []);

  return (
    <View style={shimmerStyles.messageRow}>
      <Text style={[shimmerStyles.messageText, { color }]}>
        {message.replace(/\.{2,}$/, '')}{dots}
      </Text>
    </View>
  );
};

const shimmerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  messageRow: {
    marginBottom: 18,
    minHeight: 20,
  },
  messageText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  linesContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
});
