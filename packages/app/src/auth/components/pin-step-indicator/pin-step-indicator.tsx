import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import React from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { PIN_STEP_FADE_DURATION_MS } from '../../constant/pin-motion.constant';

interface Props {
    readonly total: number;
    readonly current: number;
}

const segmentVariants = cva('h-[4px] rounded-full', {
    variants: {
        state: {
            done: 'w-[16px] bg-secondary-foreground',
            active: 'w-[28px] bg-primary',
            upcoming: 'w-[16px] bg-secondary-corner'
        }
    }
});

const getSegmentState = (index: number, current: number) => {
    if (index < current) {
        return 'done';
    }

    return index === current ? 'active' : 'upcoming';
};

export const PinStepIndicator = ({ total, current }: Props) => {
    const { t } = useLingui();
    const stepNumber = current + 1;
    const segments = Array.from({ length: total }, (_, index) => getSegmentState(index, current));

    return (
        <View className="flex-row items-center gap-x-sm" accessible accessibilityLabel={t`Step ${stepNumber} of ${total}`}>
            {segments.map((state, index) => (
                <Animated.View
                    key={index}
                    layout={LinearTransition.duration(PIN_STEP_FADE_DURATION_MS)}
                    className={segmentVariants({ state })}
                />
            ))}
        </View>
    );
};
