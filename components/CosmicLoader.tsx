import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { colors } from '../styles/theme';

interface CosmicLoaderProps {
    size?: 'small' | 'large';
    color?: string;
}

const CosmicLoader: React.FC<CosmicLoaderProps> = ({ size = 'large', color = colors.accentGold }) => {
    const rotation1 = useRef(new Animated.Value(0)).current;
    const rotation2 = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotation1, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.timing(rotation2, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, [rotation1, rotation2, scale]);

    const spin1 = rotation1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const spin2 = rotation2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

    const dims = size === 'large' ? 44 : 20;
    const ringWidth = size === 'large' ? 2 : 1.5;

    return (
        <View style={{ width: dims, height: dims, alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer Ring */}
            <Animated.View style={[
                StyleSheet.absoluteFill,
                {
                    borderRadius: dims / 2,
                    borderWidth: ringWidth,
                    borderColor: color,
                    borderStyle: 'dashed',
                    opacity: 0.4,
                    transform: [{ rotate: spin1 }]
                }
            ]} />

            {/* Inner Ring */}
            <Animated.View style={[
                {
                    position: 'absolute',
                    width: dims * 0.7,
                    height: dims * 0.7,
                    borderRadius: (dims * 0.7) / 2,
                    borderWidth: ringWidth,
                    borderColor: color,
                    borderTopColor: 'transparent',
                    borderBottomColor: 'transparent',
                    opacity: 0.8,
                    transform: [{ rotate: spin2 }]
                }
            ]} />

            {/* Pulsing Core */}
            <Animated.View style={[
                {
                    width: dims * 0.25,
                    height: dims * 0.25,
                    borderRadius: (dims * 0.25) / 2,
                    backgroundColor: color,
                    transform: [{ scale }],
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 8,
                    elevation: 5
                }
            ]} />
        </View>
    );
};

export default CosmicLoader;
