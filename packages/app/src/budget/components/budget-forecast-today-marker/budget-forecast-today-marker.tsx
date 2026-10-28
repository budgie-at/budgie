import { useEffect } from 'react';
import { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedStyledCircle } from '../../../@generic/component/animated-styled-circle/animated-styled-circle';
import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';

import type { BudgetForecastPointInterface } from '../../interface/budget-forecast-point.interface';

interface Props {
    readonly point: BudgetForecastPointInterface;
    readonly accentClassName: string;
}

const HALO_RADIUS = 8;
const HALO_PEAK_SCALE = 1.8;
const HALO_OPACITY = 0.18;
const HALO_DURATION = 600;
const DOT_RADIUS = 3.5;

export const BudgetForecastTodayMarker = ({ point, accentClassName }: Props) => {
    const reducedMotion = useReducedMotion();
    const pulse = useSharedValue(0);
    const haloProps = useAnimatedProps(() => ({
        r: HALO_RADIUS * (1 + (HALO_PEAK_SCALE - 1) * pulse.get()),
        opacity: HALO_OPACITY * (1 - pulse.get())
    }));

    useEffect(() => {
        if (!reducedMotion) {
            pulse.set(withTiming(1, { duration: HALO_DURATION, easing: Easing.out(Easing.cubic) }));
        }
    }, [pulse, reducedMotion]);

    return (
        <>
            <AnimatedStyledCircle cx={point.x} cy={point.y} fillClassName={accentClassName} animatedProps={haloProps} />
            <StyledCircle cx={point.x} cy={point.y} r={DOT_RADIUS} fillClassName={accentClassName} />
        </>
    );
};
