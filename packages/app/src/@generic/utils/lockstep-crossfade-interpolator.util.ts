import { Animated } from 'react-native';

import type { StackCardStyleInterpolator } from 'expo-router/js-stack';

export const lockstepCrossfadeInterpolator: StackCardStyleInterpolator = ({ current, next, layouts: { screen } }) => {
    const translateIn = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screen.width, 0],
        extrapolate: 'clamp'
    });
    const opacityIn = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    if (!next) {
        return { cardStyle: { opacity: opacityIn, transform: [{ translateX: translateIn }] } };
    }

    const translateOut = next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -screen.width],
        extrapolate: 'clamp'
    });
    const opacityOut = next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    return {
        cardStyle: {
            opacity: Animated.multiply(opacityIn, opacityOut),
            transform: [{ translateX: Animated.add(translateIn, translateOut) }]
        }
    };
};
