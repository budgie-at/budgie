import { useAnimatedProps } from 'react-native-reanimated';

import { AnimatedStyledPath } from '../../../@generic/component/animated-styled-path/animated-styled-path';
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
    readonly strokeClassName?: string;
    readonly strokeWidth?: number;
}

export const YieldChartBarPath = ({ values, offset, rects, fillClassName, fillOpacity = 1, strokeClassName, strokeWidth = 0 }: Props) => {
    const animatedProps = useAnimatedProps(() => ({ [PATH_PROP]: buildYieldBarsPath(values.get(), offset, rects) }));

    return (
        <AnimatedStyledPath
            animatedProps={animatedProps}
            fillClassName={fillClassName}
            fillOpacity={fillOpacity}
            strokeClassName={strokeClassName}
            strokeWidth={strokeWidth}
        />
    );
};
