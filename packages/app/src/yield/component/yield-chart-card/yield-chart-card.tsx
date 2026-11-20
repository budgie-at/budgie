import { YieldBucketUnitEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartModeControl } from '../yield-chart-mode-control/yield-chart-mode-control';
import { YieldChartPlot } from '../yield-chart-plot/yield-chart-plot';
import { YieldLegendEstimatedRow } from '../yield-legend-estimated-row/yield-legend-estimated-row';
import { YieldLegendFootnote } from '../yield-legend-footnote/yield-legend-footnote';
import { YieldLegendRunning } from '../yield-legend-running/yield-legend-running';
import { YieldLegend } from '../yield-legend/yield-legend';

const TITLE_MAX_FONT_SIZE_MULTIPLIER = 1.4;
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
    const { mode } = use(YieldScreenContext);
    const summary = useYieldSummary();

    const bucketTitle = t(BUCKET_TITLE[summary?.bucketUnit ?? YieldBucketUnitEnum.MONTH]);
    const title = mode === YieldChartModeEnum.BARS ? bucketTitle : t`Running total`;

    return (
        <View
            className="gap-y-[12px] rounded-3xl bg-surface-row p-[16px] dark:border-[0.5px] dark:border-surface-separator"
            style={CONTINUOUS_CORNERS}
        >
            <View className="min-h-[44px] flex-row items-center justify-between gap-x-sm">
                <Text
                    className="shrink text-md font-semibold text-primary"
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    testID={PassiveIncomeSelector.ChartTitle}
                >
                    {title}
                </Text>
                <YieldChartModeControl />
            </View>

            <YieldChartPlot />

            {mode === YieldChartModeEnum.BARS ? <YieldLegend /> : <YieldLegendRunning />}

            <YieldLegendFootnote />

            <YieldLegendEstimatedRow />
        </View>
    );
};
