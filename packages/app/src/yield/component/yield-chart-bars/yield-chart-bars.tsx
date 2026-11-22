import { YieldGroupEnum } from '@budgie/market';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { YIELD_DIMMED_OPACITY } from '../../constant/yield-in-progress.constant';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YIELD_STACK_GROUPS } from '../../constant/yield-stack-groups.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldBarGeometry } from '../../hook/use-yield-bar-geometry.hook';
import { useYieldChartAxis } from '../../hook/use-yield-chart-axis.hook';
import { buildYieldBarLayers } from '../../utils/build-yield-bar-layers.util';
import { buildYieldBarLayout } from '../../utils/build-yield-bar-layout.util';
import { YieldChartBarLabel } from '../yield-chart-bar-label/yield-chart-bar-label';
import { YieldChartBarPath } from '../yield-chart-bar-path/yield-chart-bar-path';
import { YieldChartBarRule } from '../yield-chart-bar-rule/yield-chart-bar-rule';
import { YieldChartFrame } from '../yield-chart-frame/yield-chart-frame';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
}

const VALUES_PER_RECT = 2;
const SELECTED_TAX_FILL_OPACITY = 0.75;

export const YieldChartBars = ({ width, summary }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const isIncreaseContrast = useIsIncreaseContrast();
    const axis = useYieldChartAxis(summary);

    const { group } = screenKey.key;
    const layout = buildYieldBarLayout({
        buckets: summary.buckets,
        visibleGroups: isDefined(group) ? [group] : YIELD_STACK_GROUPS,
        width,
        height: YIELD_PLOT_HEIGHT,
        axis
    });
    const values = useYieldBarGeometry(layout);
    const layers = buildYieldBarLayers(layout, summary.buckets.length * VALUES_PER_RECT, isIncreaseContrast);
    const selectedMask = summary.buckets.map((_, index) => index === selectedIndex);
    const othersMask = selectedMask.map(isSelected => !isSelected);
    const passes = isDefined(selectedIndex)
        ? [
              { key: 'others', visibleBuckets: othersMask, opacityScale: YIELD_DIMMED_OPACITY },
              { key: 'selected', visibleBuckets: selectedMask, opacityScale: 1 }
          ]
        : [{ key: 'all', visibleBuckets: null, opacityScale: 1 }];
    const paths = passes.flatMap(({ key, visibleBuckets, opacityScale }) =>
        [false, true].flatMap(isInProgress =>
            layers.map(layer => ({
                key: `${key}-${isInProgress}-${layer.group}`,
                layer: {
                    ...layer,
                    opacityScale,
                    ...(key === 'selected' && layer.group === YieldGroupEnum.TAX && { fillOpacity: SELECTED_TAX_FILL_OPACITY })
                },
                isInProgress,
                visibleBuckets
            }))
        )
    );

    const label = isDefined(selectedIndex) ? <YieldChartBarLabel summary={summary} index={selectedIndex} width={width} /> : null;

    return (
        <YieldChartFrame axis={axis} width={width} label={label}>
            {isDefined(selectedIndex) ? <YieldChartBarRule index={selectedIndex} count={summary.buckets.length} width={width} /> : null}
            {paths.map(({ key, layer, isInProgress, visibleBuckets }) => (
                <YieldChartBarPath key={key} values={values} layer={layer} isInProgress={isInProgress} visibleBuckets={visibleBuckets} />
            ))}
        </YieldChartFrame>
    );
};
