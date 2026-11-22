import { YieldGroupEnum } from '@budgie/market';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YIELD_STACK_GROUPS } from '../../constant/yield-stack-groups.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldBarGeometry } from '../../hook/use-yield-bar-geometry.hook';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { buildYieldBarLayers } from '../../utils/build-yield-bar-layers.util';
import { buildYieldBarLayout } from '../../utils/build-yield-bar-layout.util';
import { getYieldBarCenterX } from '../../utils/get-yield-bar-center-x.util';
import { YieldChartBarPath } from '../yield-chart-bar-path/yield-chart-bar-path';
import { YieldChartFloatingLabel } from '../yield-chart-floating-label/yield-chart-floating-label';
import { YieldChartFrame } from '../yield-chart-frame/yield-chart-frame';
import { YieldChartScrubRule } from '../yield-chart-scrub-rule/yield-chart-scrub-rule';

import type { YieldAxisInterface } from '../../interface/yield-axis.interface';
import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
    readonly axis: YieldAxisInterface;
}

const VALUES_PER_RECT = 2;
const YIELD_DIMMED_OPACITY = 0.55;
const SELECTED_TAX_FILL_OPACITY = 0.75;

export const YieldChartBars = ({ width, summary, axis }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const isIncreaseContrast = useIsIncreaseContrast();
    const { formatPeriod } = useYieldDateLabels();

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
    const passes = isDefined(selectedIndex)
        ? [
              { key: 'others', visibleBuckets: selectedMask.map(isSelected => !isSelected), opacityScale: YIELD_DIMMED_OPACITY },
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

    const selectedBucket = isDefined(selectedIndex) ? summary.buckets.at(selectedIndex) : null;
    const selectedX = isDefined(selectedIndex) ? getYieldBarCenterX(selectedIndex, summary.buckets.length, width) : null;
    const label =
        isDefined(selectedBucket) && isDefined(selectedX) ? (
            <YieldChartFloatingLabel text={formatPeriod(selectedBucket, summary.bucketUnit)} centre={selectedX} plotWidth={width} />
        ) : null;

    return (
        <YieldChartFrame axis={axis} width={width} label={label}>
            {isDefined(selectedX) ? (
                <YieldChartScrubRule x={selectedX} height={YIELD_PLOT_HEIGHT} strokeClassName="accent-secondary-foreground" />
            ) : null}
            {paths.map(({ key, layer, isInProgress, visibleBuckets }) => (
                <YieldChartBarPath key={key} values={values} layer={layer} isInProgress={isInProgress} visibleBuckets={visibleBuckets} />
            ))}
        </YieldChartFrame>
    );
};
