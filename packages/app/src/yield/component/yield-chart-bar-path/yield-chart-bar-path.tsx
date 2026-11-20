import { YieldGroupEnum } from '@budgie/market';
import { useAnimatedProps } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { AnimatedStyledPath } from '../../../@generic/component/animated-styled-path/animated-styled-path';
import {
    YIELD_IN_PROGRESS_DASH,
    YIELD_IN_PROGRESS_FILL_OPACITY,
    YIELD_TAX_DARK_FILL_OPACITY
} from '../../constant/yield-in-progress.constant';
import { buildYieldBarsPath } from '../../utils/build-yield-bars-path.util';

import type { YieldBarLayerInterface } from '../../interface/yield-bar-layer.interface';
import type { SharedValue } from 'react-native-reanimated';

const PATH_PROP = 'd';
const IN_PROGRESS_STROKE = 1.5;
const TAX_STROKE = 1;

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
    const isTax = layer.group === YieldGroupEnum.TAX;
    const baseFill = isDark && isTax ? YIELD_TAX_DARK_FILL_OPACITY : layer.fillOpacity;
    const inProgressScale = isTax ? 1 : YIELD_IN_PROGRESS_FILL_OPACITY;
    const paint = isInProgress
        ? {
              fillOpacity: inProgressScale * baseFill * layer.opacityScale,
              strokeClassName: layer.fillClassName,
              strokeOpacity: layer.opacityScale,
              strokeWidth: IN_PROGRESS_STROKE,
              strokeDasharray: YIELD_IN_PROGRESS_DASH
          }
        : {
              fillOpacity: baseFill * layer.opacityScale,
              strokeClassName: layer.fillClassName,
              strokeOpacity: layer.opacityScale,
              strokeWidth: isTax ? TAX_STROKE : 0
          };

    return <AnimatedStyledPath animatedProps={animatedProps} fillClassName={layer.fillClassName} {...paint} />;
};
