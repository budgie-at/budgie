import { ReactNode } from 'react';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly index: number;
    readonly animationDuration: number;
    readonly staggerDelay: number;
    readonly maxWidth?: string;
    readonly children: ReactNode;
    readonly onPress: () => void;
    readonly testID?: string;
}

const PILL_HIT_SLOP = 6;

export const SuggestionPill = (props: Props) => {
    const { index, animationDuration, staggerDelay, maxWidth = 'max-w-44', children, onPress, testID } = props;

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration).delay(index * staggerDelay)}
            layout={LinearTransition.duration(animationDuration)}
        >
            <HapticPressable
                className={cn('h-[32px] flex-row items-center gap-xs rounded-full bg-transaction-detail-row pl-xs pr-md', maxWidth)}
                hitSlop={PILL_HIT_SLOP}
                onPress={onPress}
                testID={testID}
            >
                {children}
            </HapticPressable>
        </Animated.View>
    );
};
