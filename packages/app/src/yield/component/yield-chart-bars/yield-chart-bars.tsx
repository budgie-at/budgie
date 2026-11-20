import { YieldGroupEnum } from '@budgie/market';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YIELD_STACK_GROUPS } from '../../constant/yield-stack-groups.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldBarGeometry } from '../../hook/use-yield-bar-geometry.hook';
import { buildYieldAxis } from '../../utils/build-yield-axis.util';
import { buildYieldBarLayers } from '../../utils/build-yield-bar-layers.util';
import { buildYieldBarLayout } from '../../utils/build-yield-bar-layout.util';
import { YieldChartBarPath } from '../yield-chart-bar-path/yield-chart-bar-path';
import { YieldChartBarsScrubLabel } from '../yield-chart-bars-scrub-label/yield-chart-bars-scrub-label';
import { YieldChartDim } from '../yield-chart-dim/yield-chart-dim';
import { YieldChartFrame } from '../yield-chart-frame/yield-chart-frame';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
}

const VALUES_PER_RECT = 2;
const IN_PROGRESS_STROKE = 1;
const CONTRAST_IN_PROGRESS_STROKE = 1.5;

export const YieldChartBars = ({ width, summary }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const isIncreaseContrast = useIsIncreaseContrast();

    const { group } = screenKey.key;
    const visibleGroups = isDefined(group) ? [group] : [...YIELD_STACK_GROUPS];
    const totals = summary.buckets.map(bucket => visibleGroups.reduce((sum, visible) => sum + bucket.amounts[visible], 0));
    const taxDepth = Math.max(0, ...summary.buckets.map(bucket => bucket.amounts[YieldGroupEnum.TAX]));
    const axis = buildYieldAxis(Math.max(0, ...totals), taxDepth);
    const layout = buildYieldBarLayout({ buckets: summary.buckets, visibleGroups, width, height: YIELD_PLOT_HEIGHT, axis });
    const values = useYieldBarGeometry(layout);
    const pathSize = summary.buckets.length * VALUES_PER_RECT;
    const layers = buildYieldBarLayers(layout, pathSize, isIncreaseContrast);
    const inProgressStroke = isIncreaseContrast ? CONTRAST_IN_PROGRESS_STROKE : IN_PROGRESS_STROKE;

    return (
        <YieldChartFrame axis={axis} width={width} label={<YieldChartBarsScrubLabel summary={summary} totals={totals} layout={layout} />}>
            {layers.map(layer => (
                <YieldChartBarPath
                    key={layer.group}
                    values={values}
                    offset={layer.offset}
                    rects={layer.rects}
                    fillClassName={layer.fillClassName}
                    fillOpacity={layer.fillOpacity}
                />
            ))}
            {layers.map(layer => (
                <YieldChartBarPath
                    key={layer.group}
                    isInProgress
                    values={values}
                    offset={layer.offset}
                    rects={layer.rects}
                    fillClassName={layer.fillClassName}
                    fillOpacity={layer.fillOpacity}
                    strokeWidth={inProgressStroke}
                />
            ))}
            <YieldChartDim xs={layout.xs} slot={layout.slot} width={width} />
        </YieldChartFrame>
    );
};
