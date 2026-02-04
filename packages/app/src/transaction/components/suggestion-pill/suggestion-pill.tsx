import { ReactNode } from 'react';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly index: number;
    readonly animationDuration: number;
    readonly staggerDelay: number;
    readonly maxWidth?: string;
    readonly children: ReactNode;
    readonly onPress: () => void;
}

export const SuggestionPill = (props: Props) => {
    const { index, animationDuration, staggerDelay, maxWidth = 'max-w-44', children, onPress } = props;

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration).delay(index * staggerDelay)}
            layout={LinearTransition.duration(animationDuration)}
        >
            <HapticPressable
                className={`flex-row items-center gap-xxs px-sm py-xs bg-ghost-background rounded-xl shadow-sm ${maxWidth}`}
                onPress={onPress}
            >
                {children}
            </HapticPressable>
        </Animated.View>
    );
};
