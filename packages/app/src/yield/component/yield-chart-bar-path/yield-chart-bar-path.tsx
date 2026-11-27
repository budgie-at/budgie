import { useAnimatedProps } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { AnimatedStyledPath } from '../../../@generic/component/animated-styled-path/animated-styled-path';
import { buildYieldBarsPath } from '../../utils/build-yield-bars-path.util';

import type { YieldBarLayerInterface } from '../../interface/yield-bar-layer.interface';
import type { SharedValue } from 'react-native-reanimated';

const PATH_PROP = 'd';
const IN_PROGRESS_STROKE = 1.5;
const YIELD_IN_PROGRESS_FILL_OPACITY = 0.45;
const YIELD_IN_PROGRESS_DARK_FILL_OPACITY = 0.7;
const YIELD_IN_PROGRESS_DASH = '3 2';

interface Props {
    readonly values: SharedValue<number[]>;
    readonly layer: YieldBarLayerInterface;
    readonly isInProgress: boolean;
    readonly visibleBuckets: readonly boolean[] | null;
}

export const YieldChartBarPath = ({ values, layer, isInProgress, visibleBuckets }: Props) => {
    const { theme } = useUniwind();
    const animatedProps = useAnimatedProps(() => ({
        [PATH_PROP]: buildYieldBarsPath(values.get(), layer, isInProgress, visibleBuckets)
    }));

    const isDark = theme === 'dark';
    const inProgressFill = isDark ? YIELD_IN_PROGRESS_DARK_FILL_OPACITY : YIELD_IN_PROGRESS_FILL_OPACITY;
    const paint = isInProgress
        ? {
              fillOpacity: inProgressFill * layer.opacityScale,
              strokeClassName: layer.fillClassName,
              strokeOpacity: layer.opacityScale,
              strokeWidth: IN_PROGRESS_STROKE,
              strokeDasharray: YIELD_IN_PROGRESS_DASH
          }
        : {
              fillOpacity: layer.fillOpacity * layer.opacityScale,
              strokeWidth: 0
          };

    return <AnimatedStyledPath animatedProps={animatedProps} fillClassName={layer.fillClassName} {...paint} />;
};
