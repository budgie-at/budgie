import { ReactNode } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { EASE_OUT, MOTION_BASE_DURATION, MOTION_LAYOUT } from '../../../@generic/constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly index: number;
    readonly maxWidth?: string;
    readonly children: ReactNode;
    readonly onPress: () => void;
    readonly testID?: string;
}

const PILL_HIT_SLOP = 6;
const STAGGER_STEP = 30;
const STAGGER_MAX_INDEX = 3;

export const SuggestionPill = (props: Props) => {
    const { index, maxWidth = 'max-w-44', children, onPress, testID } = props;

    return (
        <Animated.View
            entering={FadeIn.duration(MOTION_BASE_DURATION)
                .easing(EASE_OUT)
                .delay(Math.min(index, STAGGER_MAX_INDEX) * STAGGER_STEP)}
            layout={MOTION_LAYOUT}
        >
            <HapticPressable
                className={cn('h-[32px] flex-row items-center gap-xs rounded-full bg-transaction-detail-row pl-xs pr-md', maxWidth)}
                hitSlop={PILL_HIT_SLOP}
                onPress={onPress}
                pressFeedback={HapticPressFeedbackEnum.SELECTION}
                testID={testID}
            >
                {children}
            </HapticPressable>
        </Animated.View>
    );
};
