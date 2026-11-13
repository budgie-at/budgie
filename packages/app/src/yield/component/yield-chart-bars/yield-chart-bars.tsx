import { YieldGroupEnum } from '@budgie/market';
import { use } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YIELD_STACK_GROUPS } from '../../constant/yield-stack-groups.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldBarGeometry } from '../../hook/use-yield-bar-geometry.hook';
import { buildYieldAxis } from '../../utils/build-yield-axis.util';
import { buildYieldBarLayout } from '../../utils/build-yield-bar-layout.util';
import { getYieldGroupAccent } from '../../utils/get-yield-group-accent.util';
import { YieldChartAxis } from '../yield-chart-axis/yield-chart-axis';
import { YieldChartBarPath } from '../yield-chart-bar-path/yield-chart-bar-path';
import { YieldChartDim } from '../yield-chart-dim/yield-chart-dim';
import { YieldChartEstimatedPaths } from '../yield-chart-estimated-paths/yield-chart-estimated-paths';
import { YieldChartPeakLabel } from '../yield-chart-peak-label/yield-chart-peak-label';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
}

const VALUES_PER_RECT = 2;
const TAX_OFFSET_START = YIELD_STACK_GROUPS.length * 2;

export const YieldChartBars = ({ width, summary }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const isIncreaseContrast = useIsIncreaseContrast();

    const { group } = screenKey.key;
    const visibleGroups = isDefined(group) ? [group] : [...YIELD_STACK_GROUPS];
    const totals = summary.buckets.map(bucket => visibleGroups.reduce((sum, visible) => sum + bucket.amounts[visible], 0));
    const taxDepth = Math.max(0, ...summary.buckets.map(bucket => bucket.amounts[YieldGroupEnum.TAX]));
    const axis = buildYieldAxis(Math.max(0, ...totals), -taxDepth);
    const layout = buildYieldBarLayout({ buckets: summary.buckets, visibleGroups, width, height: YIELD_PLOT_HEIGHT, axis });
    const values = useYieldBarGeometry(layout);
    const pathSize = summary.buckets.length * VALUES_PER_RECT;
    const colorOf = (colorGroup: YieldGroupEnum) => getYieldGroupAccent(colorGroup, isIncreaseContrast);
    const stackOffsets = YIELD_STACK_GROUPS.map((stackGroup, index) => ({ stackGroup, offset: index * pathSize }));
    const taxOffset = TAX_OFFSET_START * pathSize;

    return (
        <View className="h-[200px]">
            <Svg width={width} height={YIELD_PLOT_HEIGHT}>
                <YieldChartAxis axis={axis} width={width} height={YIELD_PLOT_HEIGHT} />
                {stackOffsets.map(({ stackGroup, offset }) => (
                    <YieldChartBarPath
                        key={stackGroup}
                        values={values}
                        offset={offset}
                        rects={layout.groups[stackGroup]}
                        fillClassName={colorOf(stackGroup)}
                    />
                ))}
                <YieldChartBarPath values={values} offset={taxOffset} rects={layout.tax} fillClassName={colorOf(YieldGroupEnum.TAX)} />
                <YieldChartDim xs={layout.xs} slot={layout.slot} width={width} />
                <YieldChartEstimatedPaths values={values} layout={layout} pathSize={pathSize} />
            </Svg>

            <YieldChartPeakLabel totals={totals} layout={layout} axis={axis} />
        </View>
    );
};
