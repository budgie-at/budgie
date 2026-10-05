import { AccountDebtTypeEnum } from '@budgie/contracts';
import { PropsWithChildren, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Svg } from 'react-native-svg';

import { AnimatedStyledCircle } from '../../../@generic/component/animated-styled-circle/animated-styled-circle';
import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly percentage: number;
}

const RING_SIZE = 46;
const STROKE_WIDTH = 3;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const FULL_PERCENT = 100;
const FILL_DURATION = 400;
const FILL_EASING_X1 = 0.77;
const FILL_EASING_Y1 = 0;
const FILL_EASING_X2 = 0.175;
const FILL_EASING_Y2 = 1;
const FILL_EASING = Easing.bezier(FILL_EASING_X1, FILL_EASING_Y1, FILL_EASING_X2, FILL_EASING_Y2);

export const DebtProgressRing = ({ debtType, percentage, children }: PropsWithChildren<Props>) => {
    const reducedMotion = useReducedMotion();
    const progress = useSharedValue(percentage);

    useEffect(() => {
        progress.set(reducedMotion ? percentage : withTiming(percentage, { duration: FILL_DURATION, easing: FILL_EASING }));
    }, [percentage, reducedMotion, progress]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.get() / FULL_PERCENT)
    }));

    const fillClassName = debtType === AccountDebtTypeEnum.BORROW ? 'accent-destructive-foreground' : 'accent-positive-foreground';

    return (
        <View className="h-[46px] w-[46px] shrink-0 items-center justify-center">
            <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
                <StyledCircle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    strokeClassName="accent-corner"
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                />
                <AnimatedStyledCircle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    strokeClassName={fillClassName}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeLinecap="round"
                    fill="none"
                    rotation={-90}
                    origin={`${RING_CENTER}, ${RING_CENTER}`}
                    animatedProps={animatedProps}
                />
            </Svg>
            {children}
        </View>
    );
};
