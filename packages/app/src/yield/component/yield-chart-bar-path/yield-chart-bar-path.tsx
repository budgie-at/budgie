import { useAnimatedProps } from 'react-native-reanimated';

import { AnimatedStyledPath } from '../../../@generic/component/animated-styled-path/animated-styled-path';
import { YIELD_IN_PROGRESS_DASH, YIELD_IN_PROGRESS_FILL_OPACITY } from '../../constant/yield-in-progress.constant';
import { buildYieldBarsPath } from '../../utils/build-yield-bars-path.util';

import type { YieldBarRectInterface } from '../../interface/yield-bar-rect.interface';
import type { SharedValue } from 'react-native-reanimated';

const PATH_PROP = 'd';

interface Props {
    readonly values: SharedValue<number[]>;
    readonly offset: number;
    readonly rects: readonly YieldBarRectInterface[];
    readonly fillClassName: string;
    readonly fillOpacity?: number;
    readonly isInProgress?: boolean;
    readonly strokeWidth?: number;
}

export const YieldChartBarPath = ({
    values,
    offset,
    rects,
    fillClassName,
    fillOpacity = 1,
    isInProgress = false,
    strokeWidth = 1
}: Props) => {
    const animatedProps = useAnimatedProps(() => ({ [PATH_PROP]: buildYieldBarsPath(values.get(), offset, rects, isInProgress) }));

    const paint = isInProgress
        ? {
              fillOpacity: YIELD_IN_PROGRESS_FILL_OPACITY * fillOpacity,
              strokeClassName: fillClassName,
              strokeWidth,
              strokeDasharray: YIELD_IN_PROGRESS_DASH
          }
        : { fillOpacity, strokeWidth: 0 };

    return <AnimatedStyledPath animatedProps={animatedProps} fillClassName={fillClassName} {...paint} />;
};
