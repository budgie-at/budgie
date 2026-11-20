import { YieldBucketUnitEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartModeControl } from '../yield-chart-mode-control/yield-chart-mode-control';
import { YieldChartPlot } from '../yield-chart-plot/yield-chart-plot';
import { YieldLegendEstimatedRow } from '../yield-legend-estimated-row/yield-legend-estimated-row';
import { YieldLegendFootnote } from '../yield-legend-footnote/yield-legend-footnote';
import { YieldLegend } from '../yield-legend/yield-legend';

const HEADER_CLASSNAME = 'min-h-[32px] gap-y-[8px]';
const STACKED_CLASSNAME = 'items-start';
const INLINE_CLASSNAME = 'flex-row items-center justify-between';
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const BUCKET_TITLE = {
    [YieldBucketUnitEnum.DAY]: msg`Per day`,
    [YieldBucketUnitEnum.WEEK]: msg`Per week`,
    [YieldBucketUnitEnum.MONTH]: msg`Per month`,
    [YieldBucketUnitEnum.QUARTER]: msg`Per quarter`,
    [YieldBucketUnitEnum.YEAR]: msg`Per year`
} as const;

export const YieldChartCard = () => {
    const { t } = useLingui();
    const isAccessibilityText = useIsAccessibilityTextSize();
    const { mode } = use(YieldScreenContext);
    const summary = useYieldSummary();

    const bucketTitle = t(BUCKET_TITLE[summary?.bucketUnit ?? YieldBucketUnitEnum.MONTH]);
    const title = mode === YieldChartModeEnum.BARS ? bucketTitle : t`Running total`;

    const headerClassName = cn(HEADER_CLASSNAME, isAccessibilityText ? STACKED_CLASSNAME : INLINE_CLASSNAME);

    return (
        <View className="gap-y-[12px] rounded-3xl bg-surface-row p-[16px]" style={CONTINUOUS_CORNERS}>
            <View className={headerClassName}>
                <Text className="text-md font-semibold text-primary" testID={PassiveIncomeSelector.ChartTitle}>
                    {title}
                </Text>
                <YieldChartModeControl />
            </View>

            <YieldChartPlot />

            <YieldLegend />

            <YieldLegendEstimatedRow />

            <YieldLegendFootnote />
        </View>
    );
};
