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
    const { index, animationDuration, staggerDelay, maxWidth = 'max-w-40', children, onPress } = props;

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration).delay(index * staggerDelay)}
            layout={LinearTransition.duration(animationDuration)}
        >
            <HapticPressable
                className={`flex-row items-center gap-sm px-md py-xs bg-default-background border border-default-corner rounded-full ${maxWidth}`}
                onPress={onPress}
            >
                {children}
            </HapticPressable>
        </Animated.View>
    );
};
