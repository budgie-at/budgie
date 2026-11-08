import { useWindowDimensions } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { lockstepCrossfadeInterpolator } from '../utils/lockstep-crossfade-interpolator.util';

import type { StackNavigationOptions } from 'expo-router/js-stack';

const LOCKSTEP_SPRING = {
    animation: 'spring',
    config: {
        stiffness: 545,
        damping: 42,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.5,
        restSpeedThreshold: 0.5
    }
} as const;

export const useLockstepStackOptions = (): StackNavigationOptions => {
    const { width } = useWindowDimensions();
    const background = useCSSVariable('--color-primary-reverse');

    return {
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        gestureResponseDistance: width,
        transitionSpec: { open: LOCKSTEP_SPRING, close: LOCKSTEP_SPRING },
        cardStyleInterpolator: lockstepCrossfadeInterpolator,
        cardOverlayEnabled: false,
        cardShadowEnabled: false,
        detachPreviousScreen: false,
        cardStyle: { backgroundColor: String(background) }
    };
};
